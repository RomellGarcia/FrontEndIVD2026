import React, { useState, useEffect } from 'react';
import { eventosAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
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
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

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

const tableHeadSx = {
  fontWeight: 700,
  color: '#fff',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  py: 2,
};

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

const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

const textoGenero = (g) => {
  const v = (g || '').toLowerCase();
  if (v === 'masculino') return 'Masculino';
  if (v === 'femenino') return 'Femenino';
  if (v === 'mixto') return 'Mixto';
  return g || 'N/A';
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date(), nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const EventosAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [vista, setVista] = useState('lista');
  const [tabLista, setTabLista] = useState('disponibles');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [convocatoriasDelEvento, setConvocatoriasDelEvento] = useState([]);
  const [yaInscritos, setYaInscritos] = useState([]);
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(false);

  const [pageDisponibles, setPageDisponibles] = useState(1);
  const [pageTerminados, setPageTerminados] = useState(1);
  const porPagina = 6;

  const [modalDetalleConvOpen, setModalDetalleConvOpen] = useState(false);
  const [convocatoriaDetalle, setConvocatoriaDetalle] = useState(null);
  const [modalInscripcionOpen, setModalInscripcionOpen] = useState(false);
  const [convocatoriaParaInscribir, setConvocatoriaParaInscribir] = useState(null);
  const [aceptaRiesgos, setAceptaRiesgos] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchEventos();
  }, [user, navigate]);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const response = await eventosAPI.getAll();
      setEventos(response.data.eventos || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fmt = (fecha) => {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
  };

  const fmtCorta = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtHora = (hora) => hora ? String(hora).slice(0, 5) : '';

  const inscripcionAbierta = (evento) => {
    if (!evento.fecha_cierre) return true;
    return new Date(evento.fecha_cierre) > new Date();
  };

  const yaTermino = (evento) => new Date(evento.fecha) < new Date();

  const eventosDisponibles = eventos.filter((e) => !yaTermino(e));
  const eventosTerminados = eventos.filter((e) => yaTermino(e));

  const disponiblesPaginados = eventosDisponibles.slice((pageDisponibles - 1) * porPagina, pageDisponibles * porPagina);
  const terminadosPaginados = eventosTerminados.slice((pageTerminados - 1) * porPagina, pageTerminados * porPagina);
  const totalAbiertos = eventosDisponibles.filter(inscripcionAbierta).length;

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

  const motivoNoElegible = (conv) => {
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

  const handleVerDetalle = async (evento) => {
    setEventoSeleccionado(evento);
    setVista('detalle');
    setConvocatoriasDelEvento([]);
    setYaInscritos([]);
    setFiltroDisciplina('');
    setFiltroCategoria('');

    setCargandoConvocatorias(true);
    try {
      const promesas = [eventosAPI.getConvocatoriasByEvento(evento.id)];
      if (!yaTermino(evento)) promesas.push(eventosAPI.getMisInscripciones());

      const resultados = await Promise.all(promesas);
      const convRes = resultados[0];
      const inscRes = resultados[1];
      setConvocatoriasDelEvento(convRes.data.convocatorias || []);

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

  const handleVolver = () => {
    setVista('lista');
    setEventoSeleccionado(null);
    setConvocatoriasDelEvento([]);
    setYaInscritos([]);
    setFiltroDisciplina('');
    setFiltroCategoria('');
  };

  const handleVerDetalleConvocatoria = (conv) => {
    setConvocatoriaDetalle(conv);
    setModalDetalleConvOpen(true);
  };

  const handleAbrirInscripcion = (conv) => {
    if (!user.nombre || !user.curp) {
      Swal.fire({ icon: 'warning', title: 'Perfil incompleto', text: 'Completa tu perfil antes de inscribirte.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    if (!puedeInscribirse(conv)) {
      Swal.fire({ icon: 'warning', title: 'No disponible', text: motivoNoElegible(conv), confirmButtonColor: COLORS.burgundy });
      return;
    }
    setModalDetalleConvOpen(false);
    setConvocatoriaParaInscribir(conv);
    setAceptaRiesgos(false);
    setModalInscripcionOpen(true);
  };

  const handleConfirmarInscripcion = async () => {
    if (!aceptaRiesgos || !convocatoriaParaInscribir) return;
    setInscribiendo(true);
    try {
      await eventosAPI.inscribir({ convocatoria_id: Number(convocatoriaParaInscribir.id) });
      setYaInscritos((prev) => (prev.includes(String(convocatoriaParaInscribir.id)) ? prev : [...prev, String(convocatoriaParaInscribir.id)]));
      setModalInscripcionOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Inscripción exitosa',
        text: 'Puedes consultarla en "Mis Convocatorias".',
        confirmButtonColor: COLORS.burgundy,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error) {
      const mensaje = error.response?.data?.error || 'No se pudo completar la inscripción.';
      Swal.fire({ icon: 'error', title: 'Error', text: mensaje, confirmButtonColor: COLORS.burgundy });
    } finally {
      setInscribiendo(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  if (vista === 'detalle' && eventoSeleccionado) {
    const terminado = yaTermino(eventoSeleccionado);
    const abierta = inscripcionAbierta(eventoSeleccionado);

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
              onClick={handleVolver}
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
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{fmt(eventoSeleccionado.fecha)}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <TimeIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Hora</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{fmtHora(eventoSeleccionado.hora) || '—'}</Typography>
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
              </Box>
            </Box>

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
                                  {motivoNoElegible(conv)}
                                </Typography>
                              )}
                            </Box>

                            {terminado ? (
                              conv.documentoResultado ? (
                                <Button
                                  size="small" variant="contained" startIcon={<TrophyIcon />}
                                  onClick={() => abrirDocumentoParaVer(conv.documentoResultado)}
                                  sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                                >
                                  Ver resultados
                                </Button>
                              ) : (
                                <Chip icon={<PendingIcon sx={{ fontSize: 16 }} />} label="Resultados aún no publicados" size="small" sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                              )
                            ) : inscrito ? (
                              <Chip icon={<CheckIcon sx={{ fontSize: 16 }} />} label="Ya estás inscrito" size="small" sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }} />
                            ) : (
                              <Button
                                size="small" variant="outlined" startIcon={<InfoIcon />}
                                onClick={() => handleVerDetalleConvocatoria(conv)}
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

        {/* ── Modal de detalle de convocatoria ── */}
        <Dialog open={modalDetalleConvOpen} onClose={() => setModalDetalleConvOpen(false)} maxWidth="sm" fullWidth>
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
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{eventoSeleccionado.lugar} - {fmt(eventoSeleccionado.fecha)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Cierre de Inscripciones</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{fmt(eventoSeleccionado.fecha_cierre)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: COLORS.line, mb: 2.5 }} />

                {(() => {
                  const inscritoDetalle = yaInscritos.includes(String(convocatoriaDetalle.id));
                  const elegibleDetalle = puedeInscribirse(convocatoriaDetalle);
                  const abiertaDetalle = eventoSeleccionado && inscripcionAbierta(eventoSeleccionado);

                  return (
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
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
                          onClick={() => handleAbrirInscripcion(convocatoriaDetalle)}
                          sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700, flexGrow: 1, minWidth: 220 }}
                        >
                          Inscribirme a esta convocatoria
                        </Button>
                      ) : (
                        <Chip
                          icon={<WarningIcon sx={{ fontSize: 16 }} />}
                          label={motivoNoElegible(convocatoriaDetalle)}
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
            <Button onClick={() => setModalDetalleConvOpen(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Modal de confirmación de inscripción ── */}
        <Dialog open={modalInscripcionOpen} onClose={() => setModalInscripcionOpen(false)} maxWidth="sm" fullWidth>
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
                sx={{ display: 'flex', alignItems: 'flex-start', ml: 0 }}
                control={
                  <Checkbox
                    checked={aceptaRiesgos}
                    onChange={(e) => setAceptaRiesgos(e.target.checked)}
                    sx={{ color: '#E65100', '&.Mui-checked': { color: '#E65100' } }}
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#E65100', mt: 1 }}>He leído y acepto los riesgos del evento.</Typography>}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setModalInscripcionOpen(false)} variant="outlined" sx={{ color: COLORS.purple, borderColor: COLORS.purple, fontWeight: 600 }}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarInscripcion}
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

        <Box sx={{ mb: 3, borderBottom: `1px solid ${COLORS.line}` }}>
          <Tabs
            value={tabLista}
            onChange={(e, v) => setTabLista(v)}
            sx={{ '& .MuiTabs-indicator': { backgroundColor: COLORS.burgundy, height: 3 } }}
          >
            <Tab icon={<EventIcon />} iconPosition="start" label="Eventos Disponibles" value="disponibles"
              sx={{ fontWeight: 700, color: COLORS.purple, textTransform: 'none', '&.Mui-selected': { color: COLORS.burgundy } }} />
            <Tab icon={<DoneAllIcon />} iconPosition="start" label="Eventos Finalizados" value="terminados"
              sx={{ fontWeight: 700, color: COLORS.purple, textTransform: 'none', '&.Mui-selected': { color: COLORS.burgundy } }} />
          </Tabs>
        </Box>

        {tabLista === 'disponibles' && (
          eventosDisponibles.length === 0 ? (
            <Box sx={{ ...cardSx, textAlign: 'center', py: 5 }}>
              <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
                <EventIcon sx={{ fontSize: 28, color: COLORS.purple }} />
              </Avatar>
              <Typography sx={{ color: COLORS.purple, fontWeight: 700 }}>No hay eventos próximos por ahora</Typography>
            </Box>
          ) : (
            <Box sx={{ ...cardSx, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                    {['Imagen', 'Fecha', 'Título', 'Lugar', 'Estado', 'Detalles'].map((h) => (
                      <TableCell key={h} sx={tableHeadSx}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disponiblesPaginados.map((evento) => {
                    const abierta = inscripcionAbierta(evento);
                    return (
                      <TableRow key={evento.id} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                        <TableCell sx={{ py: 1.5, borderColor: COLORS.line }}>
                          <Avatar src={evento.imagen_url} variant="rounded" sx={{ width: 100, height: 100, bgcolor: COLORS.lineSoft, border: `1px solid ${COLORS.line}` }}>
                            <EventIcon sx={{ color: COLORS.purple, fontSize: 36 }} />
                          </Avatar>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{fmtCorta(evento.fecha)}</Typography>
                          {evento.hora && <Typography variant="caption" sx={{ color: COLORS.purple }}>{fmtHora(evento.hora)} hrs</Typography>}
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{evento.titulo}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ color: COLORS.ink, display: 'flex', alignItems: 'center', gap: .5 }}>
                            <LocationIcon sx={{ fontSize: 14, color: COLORS.burgundy }} />
                            {evento.lugar}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <EstadoChip label={abierta ? 'Abierto' : 'Cerrado'} positivo={abierta} />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Button
                            variant="outlined" size="small" startIcon={<InfoIcon />}
                            onClick={() => handleVerDetalle(evento)}
                            sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
                          >
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {eventosDisponibles.length > porPagina && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${COLORS.line}` }}>
                  <Pagination count={Math.ceil(eventosDisponibles.length / porPagina)} page={pageDisponibles} onChange={(e, v) => setPageDisponibles(v)}
                    sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: COLORS.burgundy, color: '#fff' } }} />
                </Box>
              )}
            </Box>
          )
        )}

        {tabLista === 'terminados' && (
          eventosTerminados.length === 0 ? (
            <Box sx={{ ...cardSx, textAlign: 'center', py: 5 }}>
              <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
                <DoneAllIcon sx={{ fontSize: 28, color: COLORS.purple }} />
              </Avatar>
              <Typography sx={{ color: COLORS.purple, fontWeight: 700 }}>Todavía no hay eventos finalizados</Typography>
            </Box>
          ) : (
            <Box sx={{ ...cardSx, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                    {['Imagen', 'Fecha', 'Título', 'Lugar', 'Convocatorias y Resultados'].map((h) => (
                      <TableCell key={h} sx={tableHeadSx}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {terminadosPaginados.map((evento) => (
                    <TableRow key={evento.id} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                      <TableCell sx={{ py: 1.5, borderColor: COLORS.line }}>
                        <Avatar src={evento.imagen_url} variant="rounded" sx={{ width: 100, height: 100, bgcolor: COLORS.lineSoft, border: `1px solid ${COLORS.line}`, filter: 'grayscale(60%)', opacity: 0.85 }}>
                          <EventIcon sx={{ color: COLORS.purple, fontSize: 36 }} />
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a8a8a' }}>{fmtCorta(evento.fecha)}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a8a8a' }}>{evento.titulo}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ color: '#8a8a8a', display: 'flex', alignItems: 'center', gap: .5 }}>
                          <LocationIcon sx={{ fontSize: 14 }} />
                          {evento.lugar}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Button
                          variant="outlined" size="small" startIcon={<VisibilityIcon />}
                          onClick={() => handleVerDetalle(evento)}
                          sx={{ color: COLORS.purple, borderColor: COLORS.purple, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }}
                        >
                          Ver convocatorias y resultados
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {eventosTerminados.length > porPagina && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${COLORS.line}` }}>
                  <Pagination count={Math.ceil(eventosTerminados.length / porPagina)} page={pageTerminados} onChange={(e, v) => setPageTerminados(v)}
                    sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: COLORS.burgundy, color: '#fff' } }} />
                </Box>
              )}
            </Box>
          )
        )}
      </Container>
    </Box>
  );
};

export default EventosAtleta;