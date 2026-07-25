import React, { useState, useEffect } from 'react';
import {
  Box, Typography,
  Container, Button, CircularProgress, Avatar, Pagination, Chip,
  Tabs, Tab, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemAvatar, ListItemText,
  FormControl, InputLabel, Select, MenuItem,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon, LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Event as EventIcon, Info as InfoIcon,
  ArrowBack as ArrowBackIcon, EmojiEvents as TrophyIcon,
  DoneAll as DoneAllIcon, Visibility as VisibilityIcon,
  HourglassEmpty as PendingIcon, Clear as ClearIcon,
  People as PeopleIcon, PersonAdd as PersonAddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { eventosAPI, clubesAPI, resultadosAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
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

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

// Chip de estado (abierto/cerrado/finalizado)
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

// Obtiene el nombre de forma segura (puede ser string o objeto)
const obtenerNombre = (valor) => {
  if (!valor) return 'N/A';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'object' && valor.nombre) return valor.nombre;
  return 'N/A';
};

// Devuelve el texto legible para el género
const textoGenero = (genero) => {
  const v = (genero || '').toLowerCase().trim();
  if (v === 'masculino') return 'Masculino';
  if (v === 'femenino') return 'Femenino';
  if (v === 'mixto') return 'Mixto';
  return obtenerNombre(genero);
};

// Disciplinas de campo (salto/lanzamiento) vs tiempo
const DISCIPLINAS_DISTANCIA = new Set([
  'Salto de longitud', 'Salto de altura',
  'Lanzamiento de bala', 'Lanzamiento de disco', 'Lanzamiento de jabalina',
]);
const esDisciplinaDeDistancia = (disciplina) => DISCIPLINAS_DISTANCIA.has((disciplina || '').trim());

// Genera un slug para nombres de archivo
const generarSlug = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');

// Obtiene el nombre completo de un registro
const nombreCompleto = (registro) => [registro?.nombre, registro?.apellido_paterno, registro?.apellido_materno].filter(Boolean).join(' ');

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
const formatearHora = (hora) => (hora ? String(hora).slice(0, 5) : '');

// Abre un documento en el visor correspondiente
const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

const EventosClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [eventos, setEventos] = useState([]);
  const [idClub, setIdClub] = useState(null);

  const [vista, setVista] = useState('lista');
  const [pestaniaLista, setPestaniaLista] = useState('disponibles');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [convocatoriasDelEvento, setConvocatoriasDelEvento] = useState([]);
  const [resultadosPorConvocatoria, setResultadosPorConvocatoria] = useState({});
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(false);

  const [paginaDisponibles, setPaginaDisponibles] = useState(1);
  const [paginaTerminados, setPaginaTerminados] = useState(1);
  const registrosPorPagina = 6;

  const [modalParticipantesAbierto, setModalParticipantesAbierto] = useState(false);
  const [convocatoriaParticipantes, setConvocatoriaParticipantes] = useState(null);
  const [participantesClub, setParticipantesClub] = useState([]);
  const [cargandoParticipantes, setCargandoParticipantes] = useState(false);

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    cargarEventos();
    cargarIdClub();
  }, [user, navigate]);

  // Obtiene el ID del club del usuario
  const cargarIdClub = async () => {
    try {
      const clubRes = await clubesAPI.getAll();
      let clubes = clubRes.data.clubes || clubRes.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const club = clubes.find((c) => c.email === user.email);
      setIdClub(club?.id || club?._id || null);
    } catch {
      setIdClub(null);
    }
  };

  // Carga todos los eventos desde el backend
  const cargarEventos = async () => {
    try {
      setCargando(true);
      const response = await eventosAPI.getAll();
      let eventosData = response.data.eventos || response.data || [];
      if (!Array.isArray(eventosData)) eventosData = [eventosData];
      setEventos(eventosData);
      setError('');
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setError('Error al cargar los eventos. Intente de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Verifica si la inscripción al evento está abierta
  const inscripcionAbierta = (evento) => {
    if (!evento.fecha_cierre) return true;
    return new Date(evento.fecha_cierre) > new Date();
  };

  // Verifica si el evento ya finalizó (manual o por fecha)
  const yaTermino = (evento) => !!evento?.finalizado || new Date(evento.fecha) < new Date();

  const eventosDisponibles = eventos.filter((e) => !yaTermino(e));
  const eventosTerminados = eventos.filter((e) => yaTermino(e));

  const disponiblesPaginados = eventosDisponibles.slice((paginaDisponibles - 1) * registrosPorPagina, paginaDisponibles * registrosPorPagina);
  const terminadosPaginados = eventosTerminados.slice((paginaTerminados - 1) * registrosPorPagina, paginaTerminados * registrosPorPagina);
  const totalAbiertos = eventosDisponibles.filter(inscripcionAbierta).length;

  // Navega al detalle de un evento y carga sus convocatorias/resultados
  const manejarVerDetalle = async (evento) => {
    setEventoSeleccionado(evento);
    setVista('detalle');
    setConvocatoriasDelEvento([]);
    setResultadosPorConvocatoria({});
    setFiltroDisciplina('');
    setFiltroCategoria('');

    setCargandoConvocatorias(true);
    try {
      const res = await eventosAPI.getConvocatoriasByEvento(evento.id || evento._id);
      const lista = res.data.convocatorias || [];
      setConvocatoriasDelEvento(lista);

      if (yaTermino(evento) && lista.length > 0) {
        const entradas = await Promise.all(
          lista.map(async (c) => {
            try {
              const r = await resultadosAPI.getByConvocatoria(c.id);
              return [c.id, r.data.resultados || []];
            } catch { return [c.id, []]; }
          })
        );
        setResultadosPorConvocatoria(Object.fromEntries(entradas));
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
    setFiltroDisciplina('');
    setFiltroCategoria('');
  };

  // Navega a la página de inscripción de atletas para una convocatoria
  const manejarInscribirAtletas = (convocatoria) => {
    navigate(`/club/convocatoria?eventoId=${eventoSeleccionado.id || eventoSeleccionado._id}&convocatoriaId=${convocatoria.id}`);
  };

  // Abre el modal para ver los participantes del club en una convocatoria
  const manejarVerParticipantesClub = async (convocatoria) => {
    setConvocatoriaParticipantes(convocatoria);
    setModalParticipantesAbierto(true);
    setCargandoParticipantes(true);
    try {
      if (!idClub) { setParticipantesClub([]); return; }
      const response = await eventosAPI.getParticipantesPorConvocatoria(convocatoria.id);
      let participantes = response.data.participantes || response.data || [];
      if (!Array.isArray(participantes)) participantes = [];
      setParticipantesClub(participantes.filter((p) => p.club_id === idClub));
    } catch (error) {
      console.error('Error al cargar participantes:', error);
      setParticipantesClub([]);
    } finally {
      setCargandoParticipantes(false);
    }
  };

  const manejarCerrarParticipantes = () => {
    setModalParticipantesAbierto(false);
    setConvocatoriaParticipantes(null);
    setParticipantesClub([]);
  };

  // Descarga un Excel con los resultados de una convocatoria
  const manejarDescargarExcelResultados = (convocatoria) => {
    const resultadosCategoria = resultadosPorConvocatoria[convocatoria.id] || [];
    if (resultadosCategoria.length === 0) return;

    const disciplinaNombre = obtenerNombre(convocatoria.disciplina);
    const categoriaNombre = obtenerNombre(convocatoria.categoria);
    const esDistancia = esDisciplinaDeDistancia(disciplinaNombre);
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
        Nombre: nombreCompleto(r),
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
    const nombreHoja = `${disciplinaNombre} ${categoriaNombre}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja || 'Resultados');
    XLSX.writeFile(wb, `Resultados_${generarSlug(disciplinaNombre)}_${generarSlug(categoriaNombre)}.xlsx`);
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
    const terminado = yaTermino(eventoSeleccionado);
    const abierta = inscripcionAbierta(eventoSeleccionado);

    const disciplinasUnicas = [...new Set(convocatoriasDelEvento.map((c) => obtenerNombre(c.disciplina)).filter(Boolean))].sort();
    const categoriasUnicas = [...new Set(convocatoriasDelEvento.map((c) => obtenerNombre(c.categoria)).filter(Boolean))].sort();
    const convocatoriasFiltradas = convocatoriasDelEvento.filter((c) =>
      (!filtroDisciplina || obtenerNombre(c.disciplina) === filtroDisciplina) &&
      (!filtroCategoria || obtenerNombre(c.categoria) === filtroCategoria)
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
              IVD · Panel de Club
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
                      <FormControl size="small" fullWidth>
                        <InputLabel>Disciplina</InputLabel>
                        <Select
                          value={filtroDisciplina}
                          label="Disciplina"
                          onChange={(e) => setFiltroDisciplina(e.target.value)}
                        >
                          <MenuItem value="">Todas</MenuItem>
                          {disciplinasUnicas.map((d) => (
                            <MenuItem key={d} value={d}>{d}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                          value={filtroCategoria}
                          label="Categoría"
                          onChange={(e) => setFiltroCategoria(e.target.value)}
                        >
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
                        Limpiar filtros
                      </Button>
                    </Box>
                  )}

                  {convocatoriasFiltradas.length === 0 ? (
                    <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 3 }}>
                      Ninguna convocatoria coincide con el filtro.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {convocatoriasFiltradas.map((conv) => (
                        <Box
                          key={conv.id}
                          sx={{
                            p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}`,
                            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{obtenerNombre(conv.disciplina)}</Typography>
                            <Box sx={{ display: 'flex', gap: .75, mt: .5, flexWrap: 'wrap' }}>
                              <Chip label={obtenerNombre(conv.categoria)} size="small" sx={{ border: `1px solid ${COLORS.purple}`, bgcolor: 'transparent', color: COLORS.purple }} />
                              <Chip label={textoGenero(conv.genero)} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                              {(conv.edad_min ?? conv.edadMin) != null && (
                                <Chip label={`${conv.edad_min ?? conv.edadMin}-${conv.edad_max ?? conv.edadMax} años`} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {terminado ? (
                              (resultadosPorConvocatoria[conv.id] || []).length > 0 ? (
                                <Button
                                  size="small" variant="contained" startIcon={<TrophyIcon />}
                                  onClick={() => manejarDescargarExcelResultados(conv)}
                                  sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                                >
                                  Ver Excel
                                </Button>
                              ) : (
                                <Chip icon={<PendingIcon sx={{ fontSize: 16 }} />} label="Excel de resultados pendiente" size="small" sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                              )
                            ) : (
                              <Button
                                size="small" variant="contained" startIcon={<PersonAddIcon />}
                                onClick={() => manejarInscribirAtletas(conv)}
                                sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                              >
                                Inscribir atletas
                              </Button>
                            )}
                            <Button
                              size="small" variant="outlined" startIcon={<PeopleIcon />}
                              onClick={() => manejarVerParticipantesClub(conv)}
                              sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
                            >
                              Mis atletas
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Container>

        {/* Modal de participantes del club en una convocatoria */}
        <Dialog open={modalParticipantesAbierto} onClose={manejarCerrarParticipantes} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Atletas de mi Club Inscritos</Typography>
              <IconButton onClick={manejarCerrarParticipantes} sx={{ color: '#fff' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            {convocatoriaParticipantes && (
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                {obtenerNombre(convocatoriaParticipantes.disciplina)} - {obtenerNombre(convocatoriaParticipantes.categoria)}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers>
            {cargandoParticipantes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={40} sx={{ color: COLORS.burgundy }} />
              </Box>
            ) : participantesClub.length === 0 ? (
              <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: COLORS.purple }}>
                No hay atletas de tu club inscritos en esta convocatoria.
              </Typography>
            ) : (
              <List disablePadding>
                {participantesClub.map((p, idx) => (
                  <ListItem key={idx} divider sx={{ py: 1.5, borderColor: COLORS.line }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: COLORS.purple }}>
                        {(p.atleta?.nombre || p.nombre || 'A').charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.burgundy }}>
                          {p.atleta?.nombreCompleto || p.atleta?.nombre || p.nombre || 'Atleta'}
                        </Typography>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="caption" component="span" display="block" sx={{ color: COLORS.ink }}>
                            <strong>Edad:</strong> {p.atleta?.edad || p.edad || 'N/A'} años
                          </Typography>
                          <Typography variant="caption" component="span" display="block" sx={{ color: COLORS.ink }}>
                            <strong>Género:</strong> {textoGenero(p.atleta?.genero || p.genero)}
                          </Typography>
                          <Typography variant="caption" component="span" display="block" sx={{ color: COLORS.ink }}>
                            <strong>Inscripción:</strong> {formatearFechaCorta(p.fechaInscripcion || p.fecha_inscripcion)}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <EstadoChip label={p.validado ? 'Validado' : 'Pendiente'} positivo={p.validado} />
                          </Box>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={manejarCerrarParticipantes} sx={{ color: COLORS.purple, fontWeight: 600 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Vista de lista de eventos
  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 6 }, pb: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Club
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Eventos
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Consulta eventos, convocatorias y participantes de tu club
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, mt: { xs: -5, md: -6 }, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {/* Tarjeta de estadísticas (flotante) */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 5,
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
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
                  const abierta = inscripcionAbierta(evento);
                  return (
                    <Box
                      key={evento.id || evento._id}
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
              {eventosDisponibles.length > registrosPorPagina && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <Pagination count={Math.ceil(eventosDisponibles.length / registrosPorPagina)} page={paginaDisponibles} onChange={(e, v) => setPaginaDisponibles(v)}
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
                    key={evento.id || evento._id}
                    sx={{
                      ...cardSx, overflow: 'hidden', cursor: 'pointer',
                      transition: 'transform .15s, box-shadow .15s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)' },
                    }}
                    onClick={() => manejarVerDetalle(evento)}
                  >
                    {evento.imagen_url ? (
                      <Box component="img" src={evento.imagen_url} alt={evento.titulo}
                        sx={{ width: '100%', height: 520, objectFit: 'cover', display: 'block', filter: 'grayscale(55%)', opacity: 0.9 }} />
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
              {eventosTerminados.length > registrosPorPagina && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <Pagination count={Math.ceil(eventosTerminados.length / registrosPorPagina)} page={paginaTerminados} onChange={(e, v) => setPaginaTerminados(v)}
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

export default EventosClub;