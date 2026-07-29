import React, { useState, useEffect } from 'react';
import { eventosAPI, resultadosAPI } from '../../api/index.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Box, Typography,
  Container, Button, CircularProgress, Avatar, Pagination, Chip, Divider,
  Tabs, Tab, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon, LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Event as EventIcon, Info as InfoIcon, LockOpen as LockOpenIcon,
  ArrowBack as ArrowBackIcon, EmojiEvents as TrophyIcon,
  DoneAll as DoneAllIcon, Visibility as VisibilityIcon,
  HourglassEmpty as PendingIcon, Clear as ClearIcon,
  HowToReg as RegisterIcon, Warning as WarningIcon, CheckCircle as CheckIcon,
  Download as DownloadIcon, PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

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

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

// Chip para mostrar estado de inscripción
const EstadoChip = ({ label, positivo = true }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      fontWeight: 700, fontSize: '.72rem',
      bgcolor: 'transparent',
      border: `1px solid ${positivo ? COLORS.purple : COLORS.line}`,
      color: positivo ? COLORS.purple : COLORS.ink,
    }}
  />
);

// Abre un documento en el navegador o en visor de Google
const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

// Devuelve el texto legible para el género
const textoGenero = (g) => {
  const v = (g || '').toLowerCase();
  if (v === 'masculino') return 'Masculino';
  if (v === 'femenino') return 'Femenino';
  if (v === 'mixto') return 'Mixto';
  return g || 'N/A';
};

// Calcula la edad a partir de la fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date(), nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

// Disciplinas de campo (salto/lanzamiento) vs tiempo
const DISCIPLINAS_DISTANCIA = new Set([
  'Salto de longitud', 'Salto de altura',
  'Lanzamiento de bala', 'Lanzamiento de disco', 'Lanzamiento de jabalina',
]);
const esDisciplinaDeDistancia = (disciplina) => DISCIPLINAS_DISTANCIA.has((disciplina || '').trim());

// Obtiene el nombre completo de un registro
const nombreCompleto = (r) => [r?.nombre, r?.apellido_paterno, r?.apellido_materno].filter(Boolean).join(' ');

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

// Extrae la hora (HH:MM)
const formatearHora = (hora) => hora ? String(hora).slice(0, 5) : '';

// Verifica si la inscripción al evento está abierta
const estaInscripcionAbierta = (evento) => {
  if (!evento.fecha_cierre) return true;
  return new Date(evento.fecha_cierre) > new Date();
};

// Verifica si el evento ya finalizó (manual o por fecha)
const estaFinalizado = (evento) => !!evento?.finalizado || new Date(evento.fecha) < new Date();

const EventosAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [vista, setVista] = useState('lista');
  const [pestaniaLista, setPestaniaLista] = useState('disponibles');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [convocatoriasDelEvento, setConvocatoriasDelEvento] = useState([]);
  const [resultadosPorConvocatoria, setResultadosPorConvocatoria] = useState({});
  const [yaInscritos, setYaInscritos] = useState([]);
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(false);

  const [paginaDisponibles, setPaginaDisponibles] = useState(1);
  const [paginaTerminados, setPaginaTerminados] = useState(1);
  const porPagina = 6;

  const [modalDetalleConvocatoriaAbierto, setModalDetalleConvocatoriaAbierto] = useState(false);
  const [convocatoriaDetalle, setConvocatoriaDetalle] = useState(null);
  const [modalInscripcionAbierto, setModalInscripcionAbierto] = useState(false);
  const [convocatoriaParaInscribir, setConvocatoriaParaInscribir] = useState(null);
  const [aceptaRiesgos, setAceptaRiesgos] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    else cargarEventos();
  }, [user, navigate]);

  // Carga la lista de eventos desde el backend
  const cargarEventos = async () => {
    try {
      setCargando(true);
      const response = await eventosAPI.getAll();
      setEventos(response.data.eventos || []);
    } catch (error) { console.error(error); }
    finally { setCargando(false); }
  };

  // Navega al detalle de un evento y carga sus convocatorias/resultados
  const manejarVerDetalle = async (evento) => {
    setEventoSeleccionado(evento);
    setVista('detalle');
    setConvocatoriasDelEvento([]);
    setResultadosPorConvocatoria({});
    setYaInscritos([]);
    setFiltroDisciplina('');
    setFiltroCategoria('');

    setCargandoConvocatorias(true);
    try {
      const terminado = estaFinalizado(evento);
      const promesas = [eventosAPI.getConvocatoriasByEvento(evento.id)];
      if (!terminado) promesas.push(eventosAPI.getMisInscripciones());

      const resultados = await Promise.all(promesas);
      const convRes = resultados[0];
      const inscRes = resultados[1];
      const listaConvocatorias = convRes.data.convocatorias || [];
      setConvocatoriasDelEvento(listaConvocatorias);

      if (terminado && listaConvocatorias.length > 0) {
        const entradas = await Promise.all(
          listaConvocatorias.map(async (c) => {
            try {
              const r = await resultadosAPI.getByConvocatoria(c.id);
              return [c.id, r.data.resultados || []];
            } catch { return [c.id, []]; }
          })
        );
        setResultadosPorConvocatoria(Object.fromEntries(entradas));
      }

      if (inscRes) {
        const inscripciones = inscRes.data.inscripciones || [];
        const ids = inscripciones
          .map((i) => i.convocatoria_id ?? i.convocatoriaId ?? i.id)
          .filter((v) => v !== undefined && v !== null)
          .map(String);
        setYaInscritos(ids);
      }
    } catch (error) {
      console.error('Error al cargar convocatorias del evento:', error);
    } finally {
      setCargandoConvocatorias(false);
    }
  };

  // Vuelve a la lista de eventos
  const manejarVolver = () => {
    setVista('lista');
    setEventoSeleccionado(null);
    setConvocatoriasDelEvento([]);
    setYaInscritos([]);
    setFiltroDisciplina('');
    setFiltroCategoria('');
  };

  // Abre el modal de detalle de una convocatoria
  const manejarVerDetalleConvocatoria = (conv) => {
    setConvocatoriaDetalle(conv);
    setModalDetalleConvocatoriaAbierto(true);
  };

  // Verifica si el atleta puede inscribirse (por género y edad)
  const puedeInscribirse = (conv) => {
    if (!conv) return false;
    const generoConv = (conv.genero || '').toLowerCase();
    const generoAtleta = (user?.genero || '').toLowerCase();
    const generoOk = !generoConv || generoConv === 'mixto' || generoConv === generoAtleta;

    const edadAtleta = calcularEdad(user?.fecha_nacimiento);
    const min = conv.edad_min ?? conv.edadMin;
    const max = conv.edad_max ?? conv.edadMax;
    const edadOk = edadAtleta == null || min == null || max == null
      ? true
      : edadAtleta >= min && edadAtleta <= max;

    return generoOk && edadOk;
  };

  // Devuelve el motivo por el cual no es elegible
  const obtenerMotivoNoElegible = (conv) => {
    if (!conv) return '';
    const generoConv = (conv.genero || '').toLowerCase();
    const generoAtleta = (user?.genero || '').toLowerCase();
    const generoOk = !generoConv || generoConv === 'mixto' || generoConv === generoAtleta;

    const edadAtleta = calcularEdad(user?.fecha_nacimiento);
    const min = conv.edad_min ?? conv.edadMin;
    const max = conv.edad_max ?? conv.edadMax;
    const edadOk = edadAtleta == null || min == null || max == null
      ? true
      : edadAtleta >= min && edadAtleta <= max;

    if (!generoOk && !edadOk) return `Convocatoria solo para ${textoGenero(conv.genero)}, edad ${min}-${max} años`;
    if (!generoOk) return `Convocatoria solo para ${textoGenero(conv.genero)}`;
    if (!edadOk) return `Convocatoria para edades ${min}-${max} años`;
    return '';
  };

  // Abre el modal de inscripción
  const manejarAbrirInscripcion = (conv) => {
    if (!user.nombre || !user.curp) {
      Swal.fire({ icon: 'warning', title: 'Perfil incompleto', text: 'Completa tu perfil antes de inscribirte.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    if (!puedeInscribirse(conv)) {
      Swal.fire({ icon: 'warning', title: 'No disponible', text: obtenerMotivoNoElegible(conv), confirmButtonColor: COLORS.burgundy });
      return;
    }
    setModalDetalleConvocatoriaAbierto(false);
    setConvocatoriaParaInscribir(conv);
    setAceptaRiesgos(false);
    setModalInscripcionAbierto(true);
  };

  // Confirma la inscripción
  const manejarConfirmarInscripcion = async () => {
    if (!aceptaRiesgos || !convocatoriaParaInscribir) return;
    setInscribiendo(true);
    try {
      const response = await eventosAPI.inscribir({ convocatoria_id: Number(convocatoriaParaInscribir.id) });
      const bib = response.data?.inscripcion?.bib;

      setYaInscritos((prev) => (prev.includes(String(convocatoriaParaInscribir.id)) ? prev : [...prev, String(convocatoriaParaInscribir.id)]));
      setModalInscripcionAbierto(false);
      Swal.fire({
        icon: 'success',
        title: 'Inscripción exitosa',
        text: bib
          ? `Tu número de corredor es ${String(bib).padStart(3, '0')}. Puedes consultarlo en "Mis Convocatorias".`
          : 'Puedes consultarla en "Mis Convocatorias".',
        confirmButtonColor: COLORS.burgundy,
      });
    } catch (error) {
      const mensaje = error.response?.data?.error || 'No se pudo completar la inscripción.';
      Swal.fire({ icon: 'error', title: 'Error', text: mensaje, confirmButtonColor: COLORS.burgundy });
    } finally {
      setInscribiendo(false);
    }
  };

  // Genera un PDF con los resultados de una convocatoria y lo abre en una
  // pestaña nueva — no se descarga, se ve directo con el visor de PDF
  // que ya trae el navegador, así cualquiera puede verlo sin instalar nada.
  const manejarVerPdfResultados = (conv) => {
    const resultadosCategoria = resultadosPorConvocatoria[conv.id] || [];
    if (resultadosCategoria.length === 0) return;

    const esDistancia = esDisciplinaDeDistancia(conv.disciplina);
    const ordenados = [...resultadosCategoria].sort((a, b) => {
      if (a.posicion === null) return 1;
      if (b.posicion === null) return -1;
      return (a.posicion ?? 999) - (b.posicion ?? 999);
    });

    const filas = ordenados.map((r) => {
      const marca = r.pruebas?.find((p) => p.nombre === 'Marca')?.marca;
      const chip = r.pruebas?.find((p) => p.nombre === 'ChipTime')?.marca;
      const gun = r.pruebas?.find((p) => p.nombre === 'GunTime')?.marca;
      const base = [
        r.posicion ? `${r.posicion}°` : '—',
        r.bib ? String(r.bib).padStart(3, '0') : '—',
        nombreCompleto(r),
        r.club_nombre || 'Libre',
      ];
      return esDistancia ? [...base, marca || '—'] : [...base, chip || '—', gun || '—'];
    });

    const headers = esDistancia
      ? ['Pl.', 'Bib', 'Nombre', 'Club', 'Marca']
      : ['Pl.', 'Bib', 'Nombre', 'Club', 'ChipTime', 'GunTime'];

    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.setTextColor(COLORS.burgundy);
    doc.text(`${conv.disciplina || ''} — ${conv.categoria || ''}`, 14, 16);

    doc.setFontSize(10);
    doc.setTextColor('#666666');
    doc.text(eventoSeleccionado?.titulo || '', 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: filas,
      headStyles: { fillColor: [128, 0, 32] },
      styles: { fontSize: 10 },
    });

    // bloburl abre el PDF directo en una pestaña nueva del navegador,
    // en vez de guardarlo en el dispositivo como hacía XLSX.writeFile.
    window.open(doc.output('bloburl'), '_blank');
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  // Vista de detalle de un evento
  if (vista === 'detalle' && eventoSeleccionado) {
    const terminado = estaFinalizado(eventoSeleccionado);
    const abierta = estaInscripcionAbierta(eventoSeleccionado);

    const disciplinasUnicas = [...new Set(convocatoriasDelEvento.map((c) => c.disciplina).filter(Boolean))].sort();
    const categoriasUnicas = [...new Set(convocatoriasDelEvento.map((c) => c.categoria).filter(Boolean))].sort();
    const convocatoriasFiltradas = convocatoriasDelEvento.filter((c) =>
      (!filtroDisciplina || c.disciplina === filtroDisciplina) &&
      (!filtroCategoria || c.categoria === filtroCategoria)
    );
    const hayFiltrosActivos = !!(filtroDisciplina || filtroCategoria);

    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
        <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={manejarVolver}
              sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Volver a Eventos
            </Button>
            <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              IVD · Panel de Atleta
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
              {eventoSeleccionado.titulo}
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
          <Box sx={{ mt: { xs: -4, md: -5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '400px 1fr' }, gap: 3, alignItems: 'flex-start' }}>
            {/* Columna izquierda: imagen y datos del evento */}
            <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3 }, position: { md: 'sticky' }, top: { md: 24 } }}>
              {eventoSeleccionado.imagen_url && (
                <Box component="img" src={eventoSeleccionado.imagen_url} alt={eventoSeleccionado.titulo}
                  sx={{ width: '100%', height: { xs: 380, md: 460 }, objectFit: 'cover', borderRadius: '8px', mb: 2.5 }} />
              )}

              <EstadoChip
                label={terminado ? 'Finalizado' : (abierta ? 'Inscripción abierta' : 'Inscripción cerrada')}
                positivo={!terminado}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaLarga(eventoSeleccionado.fecha)}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <TimeIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Hora</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearHora(eventoSeleccionado.hora) || '—'}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <LocationIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{eventoSeleccionado.lugar}</Typography>
                </Box>
                {eventoSeleccionado.descripcion && (
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ mt: .3, lineHeight: 1.6, color: COLORS.ink, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {eventoSeleccionado.descripcion}
                    </Typography>
                  </Box>
                )}
                {(eventoSeleccionado.documentoConvocatoria || eventoSeleccionado.documentoDeslinde) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
                    {eventoSeleccionado.documentoConvocatoria && (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => abrirDocumentoParaVer(eventoSeleccionado.documentoConvocatoria)}
                        sx={{ borderColor: COLORS.burgundy, color: COLORS.burgundy, fontWeight: 700, textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Ver documento de convocatoria
                      </Button>
                    )}
                    {eventoSeleccionado.documentoDeslinde && (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<WarningIcon />}
                        onClick={() => abrirDocumentoParaVer(eventoSeleccionado.documentoDeslinde)}
                        sx={{ borderColor: COLORS.purple, color: COLORS.purple, fontWeight: 700, textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Ver deslinde de responsabilidad
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Columna derecha: convocatorias */}
            <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
              <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
                {terminado ? 'Convocatorias y Resultados' : 'Convocatorias de este Evento'}
              </Typography>

              {cargandoConvocatorias ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: COLORS.burgundy }} />
                </Box>
              ) : convocatoriasDelEvento.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 3 }}>
                  Este evento no tiene convocatorias registradas.
                </Typography>
              ) : (
                <>
                  {(disciplinasUnicas.length > 1 || categoriasUnicas.length > 1) && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' }, gap: 1.5, mb: 2.5, alignItems: 'end' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Disciplina</InputLabel>
                        <Select label="Disciplina" value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)}>
                          <MenuItem value="">Todas</MenuItem>
                          {disciplinasUnicas.map((d) => (
                            <MenuItem key={d} value={d}>{d}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel>Categoría</InputLabel>
                        <Select label="Categoría" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                          <MenuItem value="">Todas</MenuItem>
                          {categoriasUnicas.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        onClick={() => { setFiltroDisciplina(''); setFiltroCategoria(''); }}
                        disabled={!hayFiltrosActivos}
                        startIcon={<ClearIcon fontSize="small" />}
                        sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700, height: 40 }}
                      >
                        Limpiar
                      </Button>
                    </Box>
                  )}

                  {convocatoriasFiltradas.length === 0 ? (
                    <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 3 }}>
                      Ninguna convocatoria coincide con el filtro.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {convocatoriasFiltradas.map((conv) => {
                        const inscrito = yaInscritos.includes(String(conv.id));
                        const elegible = puedeInscribirse(conv);
                        return (
                          <Box
                            key={conv.id}
                            sx={{
                              p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}`,
                              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
                              opacity: !terminado && !elegible ? 0.75 : 1,
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{conv.disciplina}</Typography>
                              <Box sx={{ display: 'flex', gap: .75, mt: .5, flexWrap: 'wrap' }}>
                                <Chip label={conv.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, bgcolor: 'transparent', color: COLORS.purple }} />
                                <Chip label={textoGenero(conv.genero)} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                                {(conv.edad_min ?? conv.edadMin) != null && (
                                  <Chip label={`${conv.edad_min ?? conv.edadMin}-${conv.edad_max ?? conv.edadMax} años`} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                                )}
                              </Box>
                              {!terminado && !elegible && (
                                <Typography variant="caption" sx={{ display: 'block', color: COLORS.ink, opacity: .7, mt: .5 }}>
                                  {obtenerMotivoNoElegible(conv)}
                                </Typography>
                              )}
                            </Box>

                            {terminado ? (
                              (resultadosPorConvocatoria[conv.id] || []).length > 0 ? (
                                <Button
                                  size="small" variant="contained" startIcon={<PdfIcon />}
                                  onClick={() => manejarVerPdfResultados(conv)}
                                  sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                                >
                                  Ver PDF
                                </Button>
                              ) : (
                                <Chip icon={<PendingIcon sx={{ fontSize: 16 }} />} label="Resultados pendientes" size="small" sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                              )
                            ) : inscrito ? (
                              <Chip icon={<CheckIcon sx={{ fontSize: 16 }} />} label="Ya estás inscrito" size="small" sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }} />
                            ) : (
                              <Button
                                size="small" variant="outlined" startIcon={<InfoIcon />}
                                onClick={() => manejarVerDetalleConvocatoria(conv)}
                                sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
                              >
                                Ver detalles
                              </Button>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Container>

        {/* Modal de detalle de convocatoria */}
        <Dialog open={modalDetalleConvocatoriaAbierto} onClose={() => setModalDetalleConvocatoriaAbierto(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
            Detalle de la Convocatoria
          </DialogTitle>
          <DialogContent dividers>
            {convocatoriaDetalle && (
              <Box>
                <Typography variant="h5" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: .5 }}>
                  {convocatoriaDetalle.disciplina}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: COLORS.purple, mb: 3 }}>
                  Información Oficial de la Convocatoria
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Disciplina</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{convocatoriaDetalle.disciplina}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría y Género</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {convocatoriaDetalle.categoria} ({textoGenero(convocatoriaDetalle.genero)})
                      {(convocatoriaDetalle.edad_min ?? convocatoriaDetalle.edadMin) != null && ` · ${convocatoriaDetalle.edad_min ?? convocatoriaDetalle.edadMin}-${convocatoriaDetalle.edad_max ?? convocatoriaDetalle.edadMax} años`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar y Fecha del Evento</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{eventoSeleccionado.lugar} - {formatearFechaLarga(eventoSeleccionado.fecha)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Cierre de Inscripciones</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaLarga(eventoSeleccionado.fecha_cierre)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: COLORS.line, mb: 2.5 }} />

                {(() => {
                  const inscritoDetalle = yaInscritos.includes(String(convocatoriaDetalle.id));
                  const elegibleDetalle = puedeInscribirse(convocatoriaDetalle);
                  const abiertaDetalle = eventoSeleccionado && estaInscripcionAbierta(eventoSeleccionado);

                  return (
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      {eventoSeleccionado.documentoConvocatoria && (
                        <Button
                          variant="outlined" startIcon={<DownloadIcon />}
                          onClick={() => abrirDocumentoParaVer(eventoSeleccionado.documentoConvocatoria)}
                          sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
                        >
                          Descargar Documento Oficial
                        </Button>
                      )}

                      {inscritoDetalle ? (
                        <Chip icon={<CheckIcon sx={{ fontSize: 16 }} />} label="Ya estás inscrito en esta convocatoria" sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }} />
                      ) : !abiertaDetalle ? (
                        <Chip label="La inscripción a este evento ya está cerrada" sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                      ) : elegibleDetalle ? (
                        <Button
                          variant="contained" startIcon={<RegisterIcon />}
                          onClick={() => manejarAbrirInscripcion(convocatoriaDetalle)}
                          sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700, flexGrow: 1, minWidth: 220 }}
                        >
                          Inscribirme a esta convocatoria
                        </Button>
                      ) : (
                        <Chip
                          icon={<WarningIcon sx={{ fontSize: 16 }} />}
                          label={obtenerMotivoNoElegible(convocatoriaDetalle)}
                          sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink, fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  );
                })()}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalDetalleConvocatoriaAbierto(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de confirmación de inscripción */}
        <Dialog open={modalInscripcionAbierto} onClose={() => setModalInscripcionAbierto(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
            Confirmar Inscripción
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
              Estás a punto de inscribirte a <span style={{ color: COLORS.burgundy }}>{convocatoriaParaInscribir?.disciplina} - {convocatoriaParaInscribir?.categoria}</span>, del evento <strong>{eventoSeleccionado.titulo}</strong>.
            </Typography>

            <Box sx={{ p: 2, bgcolor: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#E65100', mb: 1 }}>
                <WarningIcon fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Documento de Riesgos y Responsabilidades</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#E65100', mb: 2 }}>
                Es obligatorio leer el documento de riesgos proporcionado por el administrador antes de confirmar tu participación.
              </Typography>

              {eventoSeleccionado.documentoDeslinde && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    onClick={() => abrirDocumentoParaVer(eventoSeleccionado.documentoDeslinde)}
                    variant="contained"
                    size="small"
                    sx={{ bgcolor: '#E65100', color: '#fff', textTransform: 'none', '&:hover': { bgcolor: '#BF360C' } }}
                  >
                    Ver Documento de Riesgos
                  </Button>
                </Box>
              )}

              <FormControlLabel
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ml: 0,
                  mr: 0
                }}
                control={
                  <Checkbox
                    checked={aceptaRiesgos}
                    onChange={(e) => setAceptaRiesgos(e.target.checked)}
                    sx={{color: '#E65100','&.Mui-checked': { color: '#E65100' },p: 0,pr: 1}}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#E65100' }}>
                    He leído y acepto los riesgos del evento.
                  </Typography>
                }
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setModalInscripcionAbierto(false)} variant="outlined" sx={{ color: COLORS.purple, borderColor: COLORS.purple, fontWeight: 600 }}>
              Cancelar
            </Button>
            <Button
              onClick={manejarConfirmarInscripcion}
              variant="contained"
              disabled={!aceptaRiesgos || inscribiendo}
              sx={{ bgcolor: COLORS.burgundy, fontWeight: 700, '&:hover': { bgcolor: COLORS.burgundyDark } }}
            >
              {inscribiendo ? 'Procesando...' : 'Confirmar Inscripción'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Vista de lista de eventos
  const eventosDisponibles = eventos.filter((e) => !estaFinalizado(e));
  const eventosTerminados = eventos.filter((e) => estaFinalizado(e));

  const disponiblesPaginados = eventosDisponibles.slice((paginaDisponibles - 1) * porPagina, paginaDisponibles * porPagina);
  const terminadosPaginados = eventosTerminados.slice((paginaTerminados - 1) * porPagina, paginaTerminados * porPagina);
  const totalAbiertos = eventosDisponibles.filter(estaInscripcionAbierta).length;

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Atleta
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Eventos
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Consulta los eventos disponibles, inscríbete, y revisa los resultados de los que ya pasaron
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {/* Tarjeta de estadísticas */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 4,
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{eventosDisponibles.length}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>Disponibles</Typography>
          </Box>
          <Box sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><LockOpenIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{totalAbiertos}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>Con Inscripción Abierta</Typography>
          </Box>
          <Box sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center' }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><DoneAllIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{eventosTerminados.length}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>Finalizados</Typography>
          </Box>
        </Box>

        {/* Pestañas */}
        <Box sx={{ mb: 3, borderBottom: `1px solid ${COLORS.line}` }}>
          <Tabs
            value={pestaniaLista}
            onChange={(e, v) => setPestaniaLista(v)}
            sx={{ '& .MuiTabs-indicator': { backgroundColor: COLORS.burgundy, height: 3 } }}
          >
            <Tab icon={<EventIcon />} iconPosition="start" label="Eventos Disponibles" value="disponibles"
              sx={{ fontWeight: 700, color: COLORS.purple, textTransform: 'none', '&.Mui-selected': { color: COLORS.burgundy } }} />
            <Tab icon={<DoneAllIcon />} iconPosition="start" label="Eventos Finalizados" value="terminados"
              sx={{ fontWeight: 700, color: COLORS.purple, textTransform: 'none', '&.Mui-selected': { color: COLORS.burgundy } }} />
          </Tabs>
        </Box>

        {/* Lista de disponibles */}
        {pestaniaLista === 'disponibles' && (
          eventosDisponibles.length === 0 ? (
            <Box sx={{ ...cardSx, textAlign: 'center', py: 5 }}>
              <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
                <EventIcon sx={{ fontSize: 28, color: COLORS.purple }} />
              </Avatar>
              <Typography sx={{ color: COLORS.purple, fontWeight: 700 }}>No hay eventos próximos por ahora</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                {disponiblesPaginados.map((evento) => {
                  const abierta = estaInscripcionAbierta(evento);
                  return (
                    <Box
                      key={evento.id}
                      sx={{
                        ...cardSx, overflow: 'hidden', cursor: 'pointer',
                        transition: 'transform .15s, box-shadow .15s',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)' },
                      }}
                      onClick={() => manejarVerDetalle(evento)}
                    >
                      {evento.imagen_url ? (
                        <Box component="img" src={evento.imagen_url} alt={evento.titulo}
                          sx={{ width: '100%', height: 520, objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <Box sx={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: COLORS.lineSoft }}>
                          <EventIcon sx={{ fontSize: 40, color: COLORS.purple }} />
                        </Box>
                      )}
                      <Box sx={{ p: 2.25 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                          <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.25 }}>{evento.titulo}</Typography>
                          <EstadoChip label={abierta ? 'Abierto' : 'Cerrado'} positivo={abierta} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .5 }}>
                          <CalendarIcon sx={{ fontSize: 14, color: COLORS.burgundy }} />
                          <Typography variant="body2" sx={{ color: COLORS.ink, fontWeight: 600 }}>
                            {formatearFechaCorta(evento.fecha)}{evento.hora && ` · ${formatearHora(evento.hora)} hrs`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: 1.75 }}>
                          <LocationIcon sx={{ fontSize: 14, color: COLORS.burgundy }} />
                          <Typography variant="body2" sx={{ color: COLORS.ink }}>{evento.lugar}</Typography>
                        </Box>
                        <Button
                          fullWidth variant="outlined" size="small" startIcon={<InfoIcon />}
                          onClick={(e) => { e.stopPropagation(); manejarVerDetalle(evento); }}
                          sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
                        >
                          Ver detalles
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              {eventosDisponibles.length > porPagina && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <Pagination count={Math.ceil(eventosDisponibles.length / porPagina)} page={paginaDisponibles} onChange={(e, v) => setPaginaDisponibles(v)}
                    sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: COLORS.burgundy, color: '#fff' } }} />
                </Box>
              )}
            </>
          )
        )}

        {/* Lista de terminados */}
        {pestaniaLista === 'terminados' && (
          eventosTerminados.length === 0 ? (
            <Box sx={{ ...cardSx, textAlign: 'center', py: 5 }}>
              <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
                <DoneAllIcon sx={{ fontSize: 28, color: COLORS.purple }} />
              </Avatar>
              <Typography sx={{ color: COLORS.purple, fontWeight: 700 }}>Todavía no hay eventos finalizados</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                {terminadosPaginados.map((evento) => (
                  <Box
                    key={evento.id}
                    sx={{
                      ...cardSx, overflow: 'hidden', cursor: 'pointer',
                      transition: 'transform .15s, box-shadow .15s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)' },
                    }}
                    onClick={() => manejarVerDetalle(evento)}
                  >
                    {evento.imagen_url ? (
                      <Box component="img" src={evento.imagen_url} alt={evento.titulo}
                        sx={{ width: '100%',height: 520, objectFit: 'cover', display: 'block', filter: 'grayscale(55%)', opacity: 0.9 }} />
                    ) : (
                      <Box sx={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: COLORS.lineSoft }}>
                        <EventIcon sx={{ fontSize: 40, color: COLORS.purple }} />
                      </Box>
                    )}
                    <Box sx={{ p: 2.25 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <Typography sx={{ fontWeight: 800, color: '#6a6a6a', lineHeight: 1.25 }}>{evento.titulo}</Typography>
                        <Chip icon={<DoneAllIcon sx={{ fontSize: 14 }} />} label="Finalizado" size="small" sx={{ fontWeight: 700, fontSize: '.68rem', bgcolor: COLORS.lineSoft, color: COLORS.burgundy, flexShrink: 0 }} />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .5 }}>
                        <CalendarIcon sx={{ fontSize: 14, color: '#8a8a8a' }} />
                        <Typography variant="body2" sx={{ color: '#8a8a8a', fontWeight: 600 }}>{formatearFechaCorta(evento.fecha)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: 1.75 }}>
                        <LocationIcon sx={{ fontSize: 14, color: '#8a8a8a' }} />
                        <Typography variant="body2" sx={{ color: '#8a8a8a' }}>{evento.lugar}</Typography>
                      </Box>
                      <Button
                        fullWidth variant="outlined" size="small" startIcon={<VisibilityIcon />}
                        onClick={(e) => { e.stopPropagation(); manejarVerDetalle(evento); }}
                        sx={{ color: COLORS.purple, borderColor: COLORS.purple, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }}
                      >
                        Ver resultados
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
              {eventosTerminados.length > porPagina && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <Pagination count={Math.ceil(eventosTerminados.length / porPagina)} page={paginaTerminados} onChange={(e, v) => setPaginaTerminados(v)}
                    sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: COLORS.burgundy, color: '#fff' } }} />
                </Box>
              )}
            </>
          )
        )}
      </Container>
    </Box>
  );
};

export default EventosAtleta;