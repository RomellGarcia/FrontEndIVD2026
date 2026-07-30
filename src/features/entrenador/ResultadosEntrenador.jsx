import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  SportsScore as SportsIcon,
  BarChart as BarChartIcon,
  TableChart as ExcelIcon,
  OpenInNew as OpenInNewIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { resultadosAPI, clubesAPI, entrenadorAPI, perfilEmpresaAPI, catalogosAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)',
  lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = {
  bgcolor: COLORS.paper,
  borderRadius: '10px',
  boxShadow: '0 2px 12px rgba(128,0,32,0.07)',
};

const estilosCabeceraTabla = {
  fontWeight: 700,
  color: '#fff',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  py: 2,
};

// Obtiene el nombre completo de un atleta
const obtenerNombreAtleta = (registro) =>
  [registro?.nombre, registro?.apellido_paterno, registro?.apellido_materno].filter(Boolean).join(' ');

// Disciplinas de campo (salto/lanzamiento) vs tiempo
const DISCIPLINAS_DISTANCIA = new Set([
  'Salto de longitud', 'Salto de altura',
  'Lanzamiento de bala', 'Lanzamiento de disco', 'Lanzamiento de jabalina',
]);
const esDisciplinaDeDistancia = (disciplina) => DISCIPLINAS_DISTANCIA.has((disciplina || '').trim());

// Genera un slug para nombres de archivo
const generarSlug = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');

// Chip que muestra la posición con colores según medalla
const ChipPosicion = ({ posicion }) => {
  if (!posicion) return <Typography variant="body2" sx={{ color: COLORS.purple }}>—</Typography>;
  const estilos = {
    1: { bgcolor: '#B8860B', color: '#fff' },
    2: { bgcolor: '#8a8a8a', color: '#fff' },
    3: { bgcolor: '#A15C2E', color: '#fff' },
  };
  const sx = estilos[posicion] || { bgcolor: COLORS.lineSoft, color: COLORS.ink };
  return (
    <Chip
      icon={posicion <= 3 ? <TrophyIcon sx={{ fontSize: 15, color: 'inherit !important' }} /> : undefined}
      label={`${posicion}°`}
      size="small"
      sx={{ ...sx, fontWeight: 800, minWidth: 46 }}
    />
  );
};

const ResultadosEntrenador = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);
  const [urlLogo, setUrlLogo] = useState('');
  const [filtroAtleta, setFiltroAtleta] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [atletasClub, setAtletasClub] = useState([]);
  const [disciplinasCatalogo, setDisciplinasCatalogo] = useState([]);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState([]);
  const [sinClub, setSinClub] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    cargarResultados();
    cargarLogo();
  }, [user, navigate]);

  // Carga los resultados del club del entrenador
  const cargarResultados = async () => {
    try {
      setCargando(true);
      setError('');
      setSinClub(false);

      const perfilRes = await entrenadorAPI.getPerfil();
      const idClub = perfilRes.data.entrenador?.club_id;
      if (!idClub) {
        setSinClub(true);
        setCargando(false);
        return;
      }

      const [resultadosRes, atletasRes, discRes, catRes] = await Promise.all([
        resultadosAPI.getByClub(idClub),
        clubesAPI.getAtletas(idClub).catch(() => ({ data: { atletas: [] } })),
        catalogosAPI.getDisciplinas().catch(() => ({ data: { disciplinas: [] } })),
        catalogosAPI.getCategorias().catch(() => ({ data: { categorias: [] } })),
      ]);

      let data = resultadosRes.data.resultados || resultadosRes.data || [];
      if (!Array.isArray(data)) data = [data];
      const ordenados = data.sort((a, b) => new Date(b.evento_fecha || 0) - new Date(a.evento_fecha || 0));
      setResultados(ordenados);

      let atletas = atletasRes.data.atletas || atletasRes.data || [];
      if (!Array.isArray(atletas)) atletas = [];
      setAtletasClub(atletas);

      setDisciplinasCatalogo(discRes.data.disciplinas || []);
      setCategoriasCatalogo(catRes.data.categorias || []);
    } catch (error) {
      console.error('Error al obtener resultados:', error);
      if (error.response?.status === 404) {
        setError('Club no encontrado. Verifique su información.');
      } else if (error.response?.status === 500) {
        setError('Error del servidor. Intente de nuevo más tarde.');
      } else {
        setError(`Error al cargar los resultados: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setCargando(false);
    }
  };

  // Carga el logo de la empresa para el PDF
  const cargarLogo = async () => {
    try {
      const response = await perfilEmpresaAPI.get();
      setUrlLogo(response.data.perfil?.logo || '');
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error.message);
    }
  };

  const manejarVerDetalles = (resultado) => {
    setResultadoSeleccionado(resultado);
    setModalDetallesAbierto(true);
  };

  const manejarCerrarModal = () => {
    setModalDetallesAbierto(false);
    setResultadoSeleccionado(null);
  };

  // Descarga un PDF con el reporte de un resultado individual
  const manejarDescargarPDF = async (resultado) => {
    try {
      const doc = new jsPDF();
      let y = 15;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - 2 * margin;

      const agregarTexto = (text, x, y, maxWidth) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * 5;
      };

      const agregarTituloCentrado = (text, y, fontSize = 16) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        return y + 8;
      };

      const agregarSubtitulo = (text, y, fontSize = 12) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(128, 0, 32);
        doc.text(text, margin, y);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        return y + 6;
      };

      if (urlLogo) {
        try {
          doc.addImage(urlLogo, 'JPEG', margin, y, 20, 20);
          y += 25;
        } catch (e) { /* continuar sin logo */ }
      }

      y = agregarTituloCentrado('INSTITUTO VERACRUZANO DEL DEPORTE', y, 16);
      y = agregarTituloCentrado('Gobierno del Estado de Veracruz', y, 10);
      y = agregarTituloCentrado('REPORTE DE RESULTADOS DEL CLUB', y, 14);
      y += 10;

      doc.setDrawColor(128, 0, 32);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      const fechaActual = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFontSize(9);
      doc.text(`Veracruz, Ver. a ${fechaActual}`, pageWidth - margin - doc.getTextWidth(`Veracruz, Ver. a ${fechaActual}`), y);
      doc.setFontSize(10);
      y += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      const tituloEvento = resultado.evento_titulo || 'Evento Deportivo';
      const anchoTitulo = doc.getTextWidth(tituloEvento);
      doc.text(tituloEvento, (pageWidth - anchoTitulo) / 2, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 10;

      y = agregarSubtitulo('INFORMACIÓN DEL ATLETA:', y, 12);
      const infoAtleta = [
        { label: 'Nombre:', value: obtenerNombreAtleta(resultado) || 'No especificado' },
        { label: 'Categoría:', value: resultado.categoria || 'No especificada' },
        { label: 'Género:', value: resultado.genero || 'No especificado' },
        { label: 'Municipio:', value: resultado.municipio || 'No especificado' },
        { label: 'Club:', value: resultado.club_nombre || 'No especificado' },
        { label: 'Año Competitivo:', value: resultado.ano_competitivo || 'No especificado' },
      ];
      infoAtleta.forEach((detalle) => {
        const textoLabel = `• ${detalle.label}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(textoLabel, margin, y);
        doc.setFont('helvetica', 'normal');
        const anchoLabel = doc.getTextWidth(textoLabel);
        const valorX = margin + anchoLabel + 3;
        y = agregarTexto(String(detalle.value), valorX, y, contentWidth - anchoLabel - 3);
        y += 3;
      });

      y += 5;
      y = agregarSubtitulo('INFORMACIÓN DEL EVENTO:', y, 12);
      const infoEvento = [
        { label: 'Disciplina:', value: resultado.disciplina || 'No especificada' },
        { label: 'Fecha:', value: resultado.evento_fecha ? new Date(resultado.evento_fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No especificada' },
        { label: 'Lugar del evento:', value: resultado.evento_lugar || 'No especificado' },
        { label: 'Bib:', value: resultado.bib ? String(resultado.bib).padStart(3, '0') : 'No asignado' },
        { label: 'Lugar obtenido:', value: resultado.posicion ? `${resultado.posicion}°` : 'No disponible' },
      ];
      infoEvento.forEach((detalle) => {
        const textoLabel = `• ${detalle.label}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(textoLabel, margin, y);
        doc.setFont('helvetica', 'normal');
        const anchoLabel = doc.getTextWidth(textoLabel);
        const valorX = margin + anchoLabel + 3;
        y = agregarTexto(String(detalle.value), valorX, y, contentWidth - anchoLabel - 3);
        y += 3;
      });

      y += 5;
      y = agregarSubtitulo('PRUEBAS Y MARCAS:', y, 12);
      if (resultado.pruebas && resultado.pruebas.length > 0) {
        resultado.pruebas.forEach((prueba) => {
          if (prueba.nombre && prueba.marca) {
            const textoPrueba = `• ${prueba.nombre}: ${prueba.marca} ${prueba.unidad || ''}`;
            y = agregarTexto(textoPrueba, margin, y, contentWidth);
            y += 3;
          }
        });
      } else {
        y = agregarTexto('No hay pruebas registradas', margin, y, contentWidth);
      }

      y += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Este reporte es oficial y ha sido emitido por el Instituto Veracruzano del Deporte.', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text(`Documento generado el ${fechaActual}`, pageWidth / 2, y, { align: 'center' });

      const nombreArchivo = `Resultado_${obtenerNombreAtleta(resultado) || 'atleta'}_${resultado.evento_titulo || 'evento'}.pdf`;
      doc.save(nombreArchivo);

      Swal.fire({
        icon: 'success',
        title: 'PDF Generado',
        text: 'El reporte de resultados se ha descargado exitosamente',
        confirmButtonColor: COLORS.burgundy,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al generar el PDF: ${error.message}`,
        confirmButtonColor: COLORS.burgundy,
      });
    }
  };

  // Formatea fecha en formato largo
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Obtiene la mejor marca de un resultado (Marca, ChipTime o GunTime)
  const obtenerMejorMarca = (pruebas) => {
    if (!pruebas || pruebas.length === 0) return 'Sin marca';
    const marca = pruebas.find((p) => p.nombre === 'Marca');
    if (marca) return `${marca.marca || '0'} ${marca.unidad || ''}`.trim();
    const chip = pruebas.find((p) => p.nombre === 'ChipTime');
    if (chip) return chip.marca || 'Sin marca';
    return `${pruebas[0]?.marca || '0'} ${pruebas[0]?.unidad || ''}`.trim();
  };

  const disciplinasDistintas = new Set(resultados.map((r) => r.disciplina).filter(Boolean)).size;
  const atletasDistintos = new Set(resultados.map((r) => r.atleta_id)).size;

  // Listas completas para los combobox de filtro
  const atletasUnicos = [...new Map(atletasClub.map((a) => [a.id ?? a._id, obtenerNombreAtleta(a)])).entries()]
    .filter(([, nombre]) => nombre)
    .sort((a, b) => a[1].localeCompare(b[1]));
  const disciplinasUnicas = [...new Set(disciplinasCatalogo.map((d) => d.nombre).filter(Boolean))].sort();
  const categoriasUnicas = [...new Set(categoriasCatalogo.map((c) => c.nombre).filter(Boolean))].sort();
  const hayFiltrosActivos = !!(filtroAtleta || filtroDisciplina || filtroCategoria);

  const resultadosFiltrados = resultados.filter((r) =>
    (!filtroAtleta || String(r.atleta_id) === String(filtroAtleta)) &&
    (!filtroDisciplina || r.disciplina === filtroDisciplina) &&
    (!filtroCategoria || r.categoria === filtroCategoria)
  );

  const manejarLimpiarFiltros = () => {
    setFiltroAtleta('');
    setFiltroDisciplina('');
    setFiltroCategoria('');
  };

  // Muestra los resultados de la categoría en formato PDF (abre en nueva pestaña)
  const manejarVerResultadosPDF = async (resultado) => {
    if (!resultado?.convocatoria_id) {
      Swal.fire({
        icon: 'error', title: 'No disponible',
        text: 'Falta el identificador de la convocatoria en este resultado.',
        confirmButtonColor: COLORS.burgundy,
      });
      return;
    }
    try {
      const response = await resultadosAPI.getByConvocatoria(resultado.convocatoria_id);
      const resultadosCategoria = response.data.resultados || [];
      if (resultadosCategoria.length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin resultados', text: 'Esta categoría todavía no tiene resultados registrados.', confirmButtonColor: COLORS.burgundy });
        return;
      }

      const esDistancia = esDisciplinaDeDistancia(resultado.disciplina);
      const ordenados = [...resultadosCategoria].sort((a, b) => {
        if (a.posicion === null) return 1;
        if (b.posicion === null) return -1;
        return (a.posicion ?? 999) - (b.posicion ?? 999);
      });

      const columnas = esDistancia
        ? [['Pl.', 20], ['Bib', 20], ['Nombre', 70], ['Club', 55], ['Marca', 30]]
        : [['Pl.', 20], ['Bib', 20], ['Nombre', 60], ['Club', 50], ['ChipTime', 27], ['GunTime', 27]];

      const filas = ordenados.map((r) => {
        const marca = r.pruebas?.find((p) => p.nombre === 'Marca')?.marca;
        const chip = r.pruebas?.find((p) => p.nombre === 'ChipTime')?.marca;
        const gun = r.pruebas?.find((p) => p.nombre === 'GunTime')?.marca;
        const base = [r.posicion ? `${r.posicion}°` : '—', r.bib ? String(r.bib).padStart(3, '0') : '—', obtenerNombreAtleta(r), r.club_nombre || 'Libre'];
        return esDistancia ? [...base, marca || '—'] : [...base, chip || '—', gun || '—'];
      });

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      let y = 18;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(128, 0, 32);
      doc.text(`${resultado.disciplina || ''} — ${resultado.categoria || ''}`, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(resultado.evento_titulo || '', margin, y);
      y += 10;

      // Encabezado de la tabla
      let x = margin;
      doc.setFillColor(128, 0, 32);
      doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      columnas.forEach(([label, w]) => { doc.text(label, x + 2, y + 5.5); x += w; });
      y += 8;

      // Filas
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(43, 30, 30);
      filas.forEach((fila, i) => {
        if (y > 190) { doc.addPage(); y = 18; }
        if (i % 2 === 0) {
          doc.setFillColor(245, 240, 242);
          doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
        }
        x = margin;
        fila.forEach((valor, ci) => {
          doc.text(String(valor), x + 2, y + 5, { maxWidth: columnas[ci][1] - 3 });
          x += columnas[ci][1];
        });
        y += 7;
      });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron abrir los resultados.', confirmButtonColor: COLORS.burgundy });
    }
  };

  // Descarga un Excel con los resultados de la categoría
  const manejarDescargarExcel = async (resultado) => {
    if (!resultado?.convocatoria_id) {
      Swal.fire({
        icon: 'error', title: 'No disponible',
        text: 'Falta el identificador de la convocatoria en este resultado. Pide al equipo de backend que incluya "convocatoria_id" en la respuesta de resultadosAPI.getByClub.',
        confirmButtonColor: COLORS.burgundy,
      });
      return;
    }
    try {
      const response = await resultadosAPI.getByConvocatoria(resultado.convocatoria_id);
      const resultadosCategoria = response.data.resultados || [];
      if (resultadosCategoria.length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin resultados', text: 'Esta categoría todavía no tiene resultados registrados.', confirmButtonColor: COLORS.burgundy });
        return;
      }

      const esDistancia = esDisciplinaDeDistancia(resultado.disciplina);
      const ordenados = [...resultadosCategoria].sort((a, b) => {
        if (a.posicion === null) return 1;
        if (b.posicion === null) return -1;
        return (a.posicion ?? 999) - (b.posicion ?? 999);
      });

      const filas = ordenados.map((r) => {
        const marca = r.pruebas?.find((p) => p.nombre === 'Marca')?.marca;
        const chip = r.pruebas?.find((p) => p.nombre === 'ChipTime')?.marca;
        const gun = r.pruebas?.find((p) => p.nombre === 'GunTime')?.marca;
        const base = {
          'Pl.': r.posicion ? `${r.posicion}°` : '—',
          Bib: r.bib ? String(r.bib).padStart(3, '0') : '—',
          Nombre: obtenerNombreAtleta(r),
          Club: r.club_nombre || 'Libre',
        };
        return esDistancia ? { ...base, Marca: marca || '—' } : { ...base, ChipTime: chip || '—', GunTime: gun || '—' };
      });

      const headers = esDistancia
        ? ['Pl.', 'Bib', 'Nombre', 'Club', 'Marca']
        : ['Pl.', 'Bib', 'Nombre', 'Club', 'ChipTime', 'GunTime'];

      const ws = XLSX.utils.json_to_sheet(filas, { header: headers });
      ws['!cols'] = esDistancia
        ? [{ wch: 6 }, { wch: 8 }, { wch: 30 }, { wch: 22 }, { wch: 14 }]
        : [{ wch: 6 }, { wch: 8 }, { wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 12 }];

      const wb = XLSX.utils.book_new();
      const nombreHoja = `${resultado.disciplina || ''} ${resultado.categoria || ''}`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, nombreHoja || 'Resultados');
      XLSX.writeFile(wb, `Resultados_${generarSlug(resultado.disciplina)}_${generarSlug(resultado.categoria)}.xlsx`);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo descargar el Excel de la categoría.', confirmButtonColor: COLORS.burgundy });
    }
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      {/* Cabecera superior */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="xl" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Entrenador
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Resultados del Club
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Historial de marcas, lugares y participaciones de los atletas de tu club
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {sinClub ? (
          <Box sx={{ ...cardSx, mt: { xs: -5, md: -6 }, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700, mb: 1 }}>
              Todavía no perteneces a ningún club
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.ink, opacity: 0.75, mb: 3 }}>
              Únete a un club para poder ver los resultados de sus atletas.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/entrenador/buscar-clubes')}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
            >
              Buscar un club
            </Button>
          </Box>
        ) : (
        <>
        {/* Tarjeta de estadísticas (flotante) */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 4,
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: resultados.length, label: 'Resultados', accent: COLORS.burgundy },
            { icon: <PersonIcon sx={{ fontSize: 24 }} />, value: atletasDistintos, label: 'Atletas', accent: COLORS.purple },
            { icon: <SportsIcon sx={{ fontSize: 24 }} />, value: disciplinasDistintas, label: 'Disciplinas', accent: COLORS.burgundy },
          ].map((s, i) => (
            <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.line}` : 'none' }}>
              <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {resultados.length === 0 ? (
          <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>No hay resultados registrados aún</Typography>
          </Box>
        ) : (
          <>
            {/* Filtros */}
            <Box sx={{ ...cardSx, p: 2, mb: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Atleta</InputLabel>
                <Select label="Atleta" value={filtroAtleta} onChange={(e) => setFiltroAtleta(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {atletasUnicos.map(([id, nombre]) => (
                    <MenuItem key={id} value={id}>{nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Disciplina</InputLabel>
                <Select label="Disciplina" value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {disciplinasUnicas.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Categoría</InputLabel>
                <Select label="Categoría" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {categoriasUnicas.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                onClick={manejarLimpiarFiltros}
                disabled={!hayFiltrosActivos}
                startIcon={<ClearIcon fontSize="small" />}
                sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700, height: 40, ml: 'auto' }}
              >
                Limpiar filtros
              </Button>
            </Box>

            {resultadosFiltrados.length === 0 ? (
              <Box sx={{ ...cardSx, textAlign: 'center', py: 5 }}>
                <Typography variant="body2" sx={{ color: COLORS.purple, fontWeight: 700 }}>
                  Ningún resultado coincide con el filtro.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ ...cardSx, overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                        <TableCell sx={estilosCabeceraTabla}>Fecha</TableCell>
                        <TableCell sx={estilosCabeceraTabla}>Evento</TableCell>
                        <TableCell sx={estilosCabeceraTabla}>Atleta</TableCell>
                        <TableCell sx={estilosCabeceraTabla}>Disciplina</TableCell>
                        <TableCell sx={estilosCabeceraTabla}>Categoría</TableCell>
                        <TableCell sx={estilosCabeceraTabla}>Bib</TableCell>
                        <TableCell sx={estilosCabeceraTabla}>Marca</TableCell>
                        <TableCell sx={estilosCabeceraTabla}>Lugar</TableCell>
                        <TableCell sx={estilosCabeceraTabla} align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultadosFiltrados.map((r) => (
                        <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                          <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{formatearFecha(r.evento_fecha)}</TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                              {r.evento_titulo || 'Sin nombre'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{obtenerNombreAtleta(r) || 'Sin nombre'}</TableCell>
                          <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{r.disciplina || '—'}</TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }}>
                            <Chip
                              label={r.categoria || '—'}
                              size="small"
                              sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }}>
                            <Chip
                              label={r.bib ? String(r.bib).padStart(3, '0') : '—'}
                              size="small"
                              sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 800, fontFamily: 'monospace' }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }}>
                            <Chip
                              label={obtenerMejorMarca(r.pruebas)}
                              size="small"
                              sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }}>
                            <ChipPosicion posicion={r.posicion} />
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }} align="center">
                            <IconButton
                              onClick={() => manejarVerDetalles(r)}
                              sx={{ color: COLORS.burgundy }}
                              title="Ver detalles"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => manejarVerResultadosPDF(r)}
                              sx={{ color: COLORS.burgundy }}
                              title="Ver resultados de la categoría (se abre en una pestaña nueva)"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => manejarDescargarExcel(r)}
                              sx={{ color: '#1D6F42' }}
                              title="Descargar Excel de resultados de la categoría"
                            >
                              <ExcelIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </>
        )}
        </>
        )}
      </Container>

      {/* Modal de detalles */}
      <Dialog open={modalDetallesAbierto} onClose={manejarCerrarModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Detalles del Resultado</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {resultadoSeleccionado && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Información del Atleta */}
              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" /> Información del Atleta
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Nombre</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{obtenerNombreAtleta(resultadoSeleccionado)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.categoria || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Género</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.genero || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Municipio</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.municipio || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Bib</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.bib ? String(resultadoSeleccionado.bib).padStart(3, '0') : 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar obtenido</Typography>
                    <Box sx={{ mt: .3 }}><ChipPosicion posicion={resultadoSeleccionado.posicion} /></Box>
                  </Box>
                </Box>
              </Box>

              {/* Información del Evento */}
              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon fontSize="small" /> Información del Evento
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Evento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.evento_titulo}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFecha(resultadoSeleccionado.evento_fecha)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar del evento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.evento_lugar || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Año Competitivo</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.ano_competitivo || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Pruebas y Marcas */}
              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon fontSize="small" /> Pruebas y Marcas
                </Typography>
                {resultadoSeleccionado.pruebas && resultadoSeleccionado.pruebas.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                    {resultadoSeleccionado.pruebas.map((p, idx) => (
                      <Box key={idx} sx={{ p: 1.5, borderRadius: '8px', border: `1px solid ${COLORS.line}`, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>{p.nombre}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.burgundy }}>
                          {p.marca || '0'} {p.unidad || ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: COLORS.purple }}>No hay pruebas registradas</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={manejarCerrarModal} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
          <Button
            onClick={() => manejarDescargarPDF(resultadoSeleccionado)}
            variant="contained"
            startIcon={<PdfIcon />}
            sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
          >
            Descargar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultadosEntrenador;