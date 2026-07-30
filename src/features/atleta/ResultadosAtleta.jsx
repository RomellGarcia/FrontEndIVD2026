import { resultadosAPI, atletasAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, IconButton, Alert, CircularProgress, Chip, Avatar, Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon, PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon, Person as PersonIcon,
  CalendarToday as CalendarIcon,
  SportsScore as SportsIcon,
  BarChart as BarChartIcon, Event as EventIcon,
  LocationOn as LocationIcon, ArrowBack as ArrowBackIcon,
  TableChart as ExcelIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
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
  line: '#8000202E',
  lineSoft: '#80002014',
};

const estilosCabeceraTabla = {
  fontWeight: 700,
  color: '#fff',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  py: 2,
};

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

// Obtiene el nombre completo de un atleta
const nombreAtleta = (registro) => [registro?.nombre, registro?.apellido_paterno, registro?.apellido_materno].filter(Boolean).join(' ');

// Disciplinas de campo (salto/lanzamiento) vs tiempo
const DISCIPLINAS_DISTANCIA = new Set([
  'Salto de longitud', 'Salto de altura',
  'Lanzamiento de bala', 'Lanzamiento de disco', 'Lanzamiento de jabalina',
]);
const esDisciplinaDeDistancia = (disciplina) => DISCIPLINAS_DISTANCIA.has((disciplina || '').trim());

// Genera un slug para nombres de archivo
const generarSlug = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');

// Formatea fecha en formato largo
const formatearFechaLarga = (fecha) => {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return '—'; }
};

// Formatea fecha en formato corto
const formatearFechaCorta = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ResultadosAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoRatio, setLogoRatio] = useState(3);
  const [pagina, setPagina] = useState(1);
  const porPagina = 8;

  const [vista, setVista] = useState('eventos');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  useEffect(() => {
    if (!user) navigate('/login');
    else { cargarResultados(); cargarLogo(); }
  }, [user, navigate]);

  // Obtiene los resultados del atleta
  const cargarResultados = async () => {
    try {
      setCargando(true);
      const perfilResponse = await atletasAPI.getPerfil();
      const atletaId = perfilResponse.data.atleta?.id;
      if (!atletaId) { setMensajeError('No se encontró tu perfil de atleta.'); return; }

      const response = await resultadosAPI.getByAtleta(atletaId);
      const data = response.data.resultados || [];
      setResultados(data.sort((a, b) => new Date(b.evento_fecha || 0) - new Date(a.evento_fecha || 0)));
    } catch { setMensajeError('Error al cargar los resultados.'); }
    finally { setCargando(false); }
  };

  // Carga el logo institucional para el PDF
  const cargarLogo = async () => {
    const LOGO_URL = 'https://res.cloudinary.com/dtnxbeqox/image/upload/v1782881553/IVD_TITULO_th3ydc.png';
    try {
      const response = await fetch(LOGO_URL);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const dims = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = base64;
      });
      setLogoUrl(base64);
      if (dims?.w && dims?.h) setLogoRatio(dims.w / dims.h);
    } catch { /* sin logo, el PDF se genera igual solo sin la imagen */ }
  };

  // Obtiene la marca principal de un resultado (Marca, ChipTime o GunTime)
  const obtenerMarca = (pruebas) => {
    if (!pruebas?.length) return '—';
    const marca = pruebas.find((p) => p.nombre === 'Marca');
    if (marca) return `${marca.marca || '0'} ${marca.unidad || ''}`.trim();
    const chip = pruebas.find((p) => p.nombre === 'ChipTime');
    if (chip) return chip.marca || '—';
    return `${pruebas[0]?.marca || '0'} ${pruebas[0]?.unidad || ''}`.trim();
  };

  const manejarVerDetalle = (resultado) => { setSeleccionado(resultado); setVista('detalle'); };
  const manejarVolverAResultados = () => { setVista('evento'); setSeleccionado(null); };

  const totalPruebas = resultados.reduce((acc, r) => acc + (r.pruebas?.length || 0), 0);
  const disciplinasDistintas = new Set(resultados.map((r) => r.disciplina).filter(Boolean)).size;

  // Agrupa resultados por evento
  const eventos = React.useMemo(() => {
    const mapa = new Map();
    for (const r of resultados) {
      if (!mapa.has(r.evento_id)) {
        mapa.set(r.evento_id, {
          evento_id: r.evento_id,
          evento_titulo: r.evento_titulo,
          evento_fecha: r.evento_fecha,
          evento_lugar: r.evento_lugar,
          evento_imagen_url: r.evento_imagen_url,
          resultados: [],
        });
      }
      mapa.get(r.evento_id).resultados.push(r);
    }
    return [...mapa.values()].sort((a, b) => new Date(b.evento_fecha || 0) - new Date(a.evento_fecha || 0));
  }, [resultados]);

  const manejarEntrarEvento = (ev) => {
    setEventoSeleccionado(ev);
    setVista('evento');
    setPagina(1);
  };

  const manejarVolverAEventos = () => {
    setVista('eventos');
    setEventoSeleccionado(null);
  };

  const resultadosDelEvento = eventoSeleccionado?.resultados || [];
  const mejorPosicionEvento = resultadosDelEvento.reduce((mejor, r) => {
    if (!r.posicion) return mejor;
    return mejor === null ? r.posicion : Math.min(mejor, r.posicion);
  }, null);

  // Genera un certificado PDF para un resultado individual
  const manejarDescargarPDF = async (resultado) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 12;

      const burgundy = [128, 0, 32];
      const gold = [184, 134, 11];
      const ink = [43, 30, 30];
      const grayText = [110, 100, 100];

      const centerText = (text, y, { size = 12, font = 'helvetica', style = 'normal', color = ink } = {}) => {
        doc.setFont(font, style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.text(text, pageWidth / 2, y, { align: 'center' });
      };

      // Marco decorativo
      doc.setDrawColor(...burgundy);
      doc.setLineWidth(1.1);
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.35);
      doc.rect(margin + 3, margin + 3, pageWidth - 2 * (margin + 3), pageHeight - 2 * (margin + 3));

      let y = margin + 18;

      // Logo
      if (logoUrl) {
        try {
          const logoW = 85;
          const logoH = logoW / (logoRatio || 3);
          doc.addImage(logoUrl, 'PNG', (pageWidth - logoW) / 2, y - logoH + 6, logoW, logoH);
          y += 10;
        } catch { /* sin logo */ }
      }

      y += 12;
      centerText('CONSTANCIA DE RESULTADOS', y, { size: 20, font: 'times', style: 'bolditalic', color: burgundy });
      y += 10;

      doc.setDrawColor(...gold);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 35, y, pageWidth / 2 + 35, y);
      y += 14;

      centerText('El Instituto Veracruzano del Deporte otorga la presente constancia a', y, { size: 11, style: 'italic', color: grayText });
      y += 13;

      centerText(nombreAtleta(resultado) || 'Atleta', y, { size: 26, font: 'times', style: 'bold', color: ink });
      y += 12;

      centerText(
        `por su participación en "${resultado.evento_titulo || 'el evento'}", disciplina de ${resultado.disciplina || '—'}`,
        y, { size: 11.5, style: 'italic', color: grayText }
      );
      y += 6;
      centerText(`categoría ${resultado.categoria || '—'}, celebrado el ${formatearFechaLarga(resultado.evento_fecha)} en ${resultado.evento_lugar || '—'}.`,
        y, { size: 11.5, style: 'italic', color: grayText });
      y += 16;

      // Insignia de medalla si está en podio
      if (resultado.posicion && resultado.posicion <= 3) {
        const medalColors = { 1: [184, 134, 11], 2: [138, 138, 138], 3: [161, 92, 46] };
        const cx = pageWidth / 2;
        doc.setFillColor(...medalColors[resultado.posicion]);
        doc.circle(cx, y + 9, 11, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${resultado.posicion}°`, cx, y + 12, { align: 'center' });
        y += 26;
      }

      // Franja de datos clave
      const stats = [
        ['BIB', resultado.bib ? String(resultado.bib).padStart(3, '0') : '—'],
        ['LUGAR OBTENIDO', resultado.posicion ? `${resultado.posicion}°` : '—'],
        ['MARCA', obtenerMarca(resultado.pruebas)],
        ['AÑO', String(resultado.ano_competitivo || '—')],
      ];
      const stripW = pageWidth - 2 * (margin + 14);
      const stripX = margin + 14;
      const colW = stripW / stats.length;
      doc.setDrawColor(...burgundy);
      doc.setLineWidth(0.3);
      doc.line(stripX, y, stripX + stripW, y);
      stats.forEach(([label, value], i) => {
        const cx = stripX + colW * i + colW / 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...grayText);
        doc.text(label, cx, y + 7, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...burgundy);
        doc.text(value, cx, y + 14, { align: 'center' });
        if (i > 0) {
          doc.setDrawColor(230, 220, 220);
          doc.line(stripX + colW * i, y + 2, stripX + colW * i, y + 16);
        }
      });
      y += 20;
      doc.setDrawColor(...burgundy);
      doc.line(stripX, y, stripX + stripW, y);

      // Pie: fecha y firma institucional
      const footerY = pageHeight - margin - 14;
      const fechaActual = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...grayText);
      doc.text(`Veracruz, Ver. a ${fechaActual}`, margin + 14, footerY);

      const firmaX = pageWidth - margin - 70;
      doc.setDrawColor(...ink);
      doc.setLineWidth(0.3);
      doc.line(firmaX, footerY, firmaX + 60, footerY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...ink);
      doc.text('Instituto Veracruzano del Deporte', firmaX + 30, footerY + 5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...grayText);
      doc.text('Documento generado automáticamente por el sistema del IVD — no requiere firma autógrafa.', pageWidth / 2, pageHeight - margin - 3, { align: 'center' });

      doc.save(`Constancia_${nombreAtleta(resultado) || 'atleta'}_${resultado.evento_titulo || 'evento'}.pdf`);
      Swal.fire({ icon: 'success', title: 'PDF generado', text: 'La constancia se descargó exitosamente', confirmButtonColor: COLORS.burgundy });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Error al generar el PDF: ${error.message}`, confirmButtonColor: COLORS.burgundy });
    }
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
        const base = [r.posicion ? `${r.posicion}°` : '—', r.bib ? String(r.bib).padStart(3, '0') : '—', nombreAtleta(r), r.club_nombre || 'Libre'];
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
  const manejarDescargarExcelCategoria = async (resultado) => {
    if (!resultado?.convocatoria_id) {
      Swal.fire({
        icon: 'error', title: 'No disponible',
        text: 'Falta el identificador de la convocatoria en este resultado. Pide al equipo de backend que incluya "convocatoria_id" en la respuesta de resultadosAPI.getByAtleta.',
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
          Nombre: nombreAtleta(r),
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
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          {(vista === 'evento' || vista === 'detalle') && (
            <Box sx={{ textAlign: 'left', mb: 1 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={vista === 'detalle' ? manejarVolverAResultados : manejarVolverAEventos}
                sx={{ color: '#fff', textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: '#FFFFFF1A' } }}
              >
                {vista === 'detalle' ? 'Volver a resultados' : 'Volver a mis eventos'}
              </Button>
            </Box>
          )}
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Atleta
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.4rem', md: '2.125rem' } }}>
            {vista === 'eventos'
              ? 'Mis Resultados'
              : vista === 'detalle'
                ? (seleccionado?.disciplina || 'Detalle del resultado')
                : (eventoSeleccionado?.evento_titulo || 'Resultados del evento')}
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            {vista === 'eventos'
              ? 'Eventos en los que has participado'
              : vista === 'detalle'
                ? (seleccionado?.categoria || eventoSeleccionado?.evento_titulo || '')
                : `${resultadosDelEvento.length} disciplina${resultadosDelEvento.length !== 1 ? 's' : ''} registrada${resultadosDelEvento.length !== 1 ? 's' : ''}`}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {/* Tarjeta de estadísticas (flotante) */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: { xs: 3, md: 4 },
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px #00000024',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            overflow: 'hidden',
          }}
        >
          {vista === 'eventos' ? (
            [
              { icon: <EventIcon sx={{ fontSize: 24 }} />, value: eventos.length, label: 'Eventos', accent: COLORS.burgundy },
              { icon: <SportsIcon sx={{ fontSize: 24 }} />, value: disciplinasDistintas, label: 'Disciplinas', accent: COLORS.purple },
              { icon: <BarChartIcon sx={{ fontSize: 24 }} />, value: resultados.length, label: 'Resultados', accent: COLORS.burgundy },
            ].map((s, i) => (
              <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.line}` : 'none' }}>
                <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
              </Box>
            ))
          ) : vista === 'detalle' ? (
            [
              { icon: <CalendarIcon sx={{ fontSize: 24 }} />, value: formatearFechaCorta(seleccionado?.evento_fecha), label: 'Fecha', accent: COLORS.burgundy },
              { icon: <LocationIcon sx={{ fontSize: 24 }} />, value: seleccionado?.evento_lugar || '—', label: 'Lugar', accent: COLORS.purple, small: true },
              { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: seleccionado?.posicion ? `${seleccionado.posicion}°` : '—', label: 'Lugar obtenido', accent: COLORS.burgundy },
            ].map((s, i) => (
              <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.line}` : 'none' }}>
                <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: s.small ? '0.95rem' : { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
              </Box>
            ))
          ) : (
            [
              { icon: <CalendarIcon sx={{ fontSize: 24 }} />, value: formatearFechaCorta(eventoSeleccionado?.evento_fecha), label: 'Fecha', accent: COLORS.burgundy },
              { icon: <LocationIcon sx={{ fontSize: 24 }} />, value: eventoSeleccionado?.evento_lugar || '—', label: 'Lugar', accent: COLORS.purple, small: true },
              { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: mejorPosicionEvento ? `${mejorPosicionEvento}°` : '—', label: 'Mejor lugar', accent: COLORS.burgundy },
            ].map((s, i) => (
              <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.line}` : 'none' }}>
                <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: s.small ? '0.95rem' : { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
              </Box>
            ))
          )}
        </Box>

        {mensajeError && (
          <Alert severity="error" onClose={() => setMensajeError('')} sx={{ mb: 3, borderRadius: '8px' }}>
            {mensajeError}
          </Alert>
        )}

        {/* Contenido principal */}
        {resultados.length === 0 ? (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px #80002012', textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>Sin resultados registrados</Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5 }}>
              Los resultados aparecerán aquí una vez que participes en eventos.
            </Typography>
          </Box>
        ) : vista === 'eventos' ? (
          /* Lista de eventos */
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
            {eventos.map((ev) => {
              const mejorPos = ev.resultados.reduce((m, r) => (r.posicion ? (m === null ? r.posicion : Math.min(m, r.posicion)) : m), null);
              return (
                <Box
                  key={ev.evento_id}
                  onClick={() => manejarEntrarEvento(ev)}
                  sx={{
                    bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px #80002012',
                    overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px #0000001F' },
                  }}
                >
                  {ev.evento_imagen_url ? (
                    <Box component="img" src={ev.evento_imagen_url} alt={ev.evento_titulo}
                      sx={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: COLORS.lineSoft }}>
                      <EventIcon sx={{ fontSize: 36, color: COLORS.purple }} />
                    </Box>
                  )}
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: COLORS.burgundy, mb: 0.5 }}>{ev.evento_titulo}</Typography>
                      {mejorPos && <ChipPosicion posicion={mejorPos} />}
                    </Box>
                    <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 13 }} /> {formatearFechaCorta(ev.evento_fecha)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                      <LocationIcon sx={{ fontSize: 13 }} /> {ev.evento_lugar || '—'}
                    </Typography>
                    <Chip
                      icon={<SportsIcon sx={{ fontSize: 14 }} />}
                      label={`${ev.resultados.length} disciplina${ev.resultados.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ mt: 1.5, bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : vista === 'evento' ? (
          /* Detalle de un evento: disciplinas/resultados */
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px #80002012' }}>
            <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                  {['Disciplina', 'Bib', 'Lugar', 'Marca', 'Categoría', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={{ ...estilosCabeceraTabla, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {resultadosDelEvento.map((r) => (
                  <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: .5, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap' }}>
                        <SportsIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                        {r.disciplina || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip
                        label={r.bib ? String(r.bib).padStart(3, '0') : '—'}
                        size="small"
                        sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 800, fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <ChipPosicion posicion={r.posicion} />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip
                        label={obtenerMarca(r.pruebas)}
                        size="small"
                        sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip
                        label={r.categoria || '—'}
                        size="small"
                        sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Box sx={{ display: 'flex', gap: .5 }}>
                        <IconButton
                          size="small"
                          onClick={() => manejarVerDetalle(r)}
                          sx={{ color: COLORS.burgundy, '&:hover': { bgcolor: COLORS.lineSoft } }}
                          title="Ver detalles"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => manejarDescargarPDF(r)}
                          sx={{ color: COLORS.purple, '&:hover': { bgcolor: COLORS.lineSoft } }}
                          title="Descargar PDF"
                        >
                          <PdfIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => manejarVerResultadosPDF(r)}
                          sx={{ color: COLORS.burgundy, '&:hover': { bgcolor: COLORS.lineSoft } }}
                          title="Ver resultados de la categoría (se abre en una pestaña nueva)"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => manejarDescargarExcelCategoria(r)}
                          sx={{ color: '#1D6F42', '&:hover': { bgcolor: COLORS.lineSoft } }}
                          title="Descargar Excel de resultados de la categoría"
                        >
                          <ExcelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          </Box>
        ) : (
          /* Detalle de un resultado individual (vista === 'detalle') */
          seleccionado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px #80002012', p: { xs: 2.5, md: 3.5 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Evento */}
                  <Box>
                    {seleccionado.evento_imagen_url && (
                      <Box component="img" src={seleccionado.evento_imagen_url} alt={seleccionado.evento_titulo}
                        sx={{ width: '100%', height: { xs: 200, md: 260 }, objectFit: 'cover', borderRadius: '8px', mb: 2 }} />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 32, height: 32 }}>
                        <CalendarIcon sx={{ fontSize: 18, color: COLORS.burgundy }} />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ color: COLORS.burgundy, fontWeight: 700 }}>
                        Información del Evento
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pl: { sm: 5.5 } }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Evento</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                          {seleccionado.evento_titulo || '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                          {formatearFechaLarga(seleccionado.evento_fecha)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar del evento</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{seleccionado.evento_lugar || '—'}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{seleccionado.categoria || '—'}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Año competitivo</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                          {seleccionado.ano_competitivo || '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Bib</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                          {seleccionado.bib ? String(seleccionado.bib).padStart(3, '0') : '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar obtenido</Typography>
                        <Box sx={{ mt: .3 }}><ChipPosicion posicion={seleccionado.posicion} /></Box>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: COLORS.line }} />

                  {/* Pruebas */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 32, height: 32 }}>
                        <TrophyIcon sx={{ fontSize: 18, color: COLORS.burgundy }} />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ color: COLORS.burgundy, fontWeight: 700 }}>
                        Pruebas y Marcas
                      </Typography>
                    </Box>
                    {seleccionado.pruebas?.length > 0 ? (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, pl: { sm: 5.5 } }}>
                        {seleccionado.pruebas.map((p, i) => (
                          <Box key={i} sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}`, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>{p.nombre || `Prueba ${i + 1}`}</Typography>
                            <Typography variant="h5" sx={{ color: COLORS.burgundy, fontWeight: 800, mt: .5 }}>
                              {p.marca || '0'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.purple }}>{p.unidad || ''}</Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: COLORS.purple, pl: { sm: 5.5 } }}>Sin pruebas registradas</Typography>
                    )}
                  </Box>

                  <Divider sx={{ borderColor: COLORS.line }} />

                  {/* Información adicional */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 32, height: 32 }}>
                        <PersonIcon sx={{ fontSize: 18, color: COLORS.purple }} />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ color: COLORS.purple, fontWeight: 700 }}>
                        Información Adicional
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pl: { sm: 5.5 } }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Municipio</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                          {seleccionado.municipio || '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Club</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                          {seleccionado.club_nombre || 'Libre'}
                        </Typography>
                      </Box>
                      <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar de entrenamiento</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                          {seleccionado.lugar_entrenamiento || '—'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Acciones — mismos botones que antes tenía el modal */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Button
                  onClick={() => manejarVerResultadosPDF(seleccionado)}
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: COLORS.lineSoft } }}
                >
                  Ver resultados
                </Button>
                <Button
                  onClick={() => manejarDescargarExcelCategoria(seleccionado)}
                  variant="outlined"
                  startIcon={<ExcelIcon />}
                  sx={{ color: '#1D6F42', borderColor: '#1D6F42', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#1D6F4214' } }}
                >
                  Excel de la categoría
                </Button>
                <Button
                  onClick={() => manejarDescargarPDF(seleccionado)}
                  variant="contained"
                  startIcon={<PdfIcon />}
                  sx={{ bgcolor: COLORS.burgundy, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: COLORS.burgundyDark } }}
                >
                  Descargar PDF
                </Button>
              </Box>
            </Box>
          )
        )}
      </Container>
    </Box>
  );
};

export default ResultadosAtleta;