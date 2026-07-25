import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Groups as GroupIcon,
  Phone as PhoneIcon,
  SportsScore as SportsIcon,
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { atletasAPI, clubesAPI, eventosAPI, resultadosAPI, notificacionesAPI } from '../api/index.js';
import { useAuth } from '../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

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

// Componente base para las secciones del panel
const SectionCard = ({ icon, eyebrow, title, action, children }) => (
  <Box
    sx={{
      bgcolor: COLORS.paper,
      borderRadius: '10px',
      border: `1px solid ${COLORS.line}`,
      boxShadow: '0 2px 12px rgba(128,0,32,0.07)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}
  >
    <Box sx={{ p: 3, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography
            sx={{
              color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5,
            }}
          >
            {icon}
            {eyebrow}
          </Typography>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800 }}>
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
    </Box>
    <Divider sx={{ borderColor: COLORS.line }} />
    <Box sx={{ p: 3, pt: 2.5, flex: 1 }}>{children}</Box>
  </Box>
);

// Banner de notificaciones no leídas
const BannerNotificaciones = ({ notificaciones, onDescartar, onDescartarTodas }) => {
  if (!notificaciones.length) return null;
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          onClick={onDescartarTodas}
          sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700, fontSize: '.75rem' }}
        >
          Marcar todas como leídas
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {notificaciones.map((n) => (
          <Box
            key={n.id}
            sx={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5,
              bgcolor: '#faf2f4', border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${COLORS.burgundy}`,
              borderRadius: '6px', p: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <NotificationsActiveIcon sx={{ color: COLORS.burgundy, fontSize: 18, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: '0.85rem', color: COLORS.ink }}>{n.mensaje}</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: COLORS.purple, mt: 0.2 }}>
                  {n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => onDescartar(n.id)} sx={{ color: COLORS.purple, flexShrink: 0 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Chip de estado
const EstadoChip = ({ label, positivo = true, sx = {} }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      height: 20,
      fontSize: '0.68rem',
      fontWeight: 700,
      bgcolor: 'transparent',
      border: `1px solid ${positivo ? COLORS.purple : COLORS.line}`,
      color: positivo ? COLORS.purple : COLORS.ink,
      ...sx,
    }}
  />
);

const PaginaPrincipalClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [club, setClub] = useState(null);
  const [idClub, setIdClub] = useState(null);
  const [atletasRecientes, setAtletasRecientes] = useState([]);
  const [eventosRecientes, setEventosRecientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [modalEventoAbierto, setModalEventoAbierto] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    if (!user || user.rol !== 'club') {
      navigate('/login');
      return;
    }
    cargarDatosClub();
    cargarNotificaciones();
  }, [user, navigate]);

  // Carga las notificaciones del club
  const cargarNotificaciones = async () => {
    try {
      const res = await notificacionesAPI.getMiasClub();
      setNotificaciones(res.data.notificaciones || []);
    } catch (err) {
      console.error('Error al cargar notificaciones del club:', err.response?.status, err.response?.data || err.message);
      setNotificaciones([]);
    }
  };

  // Marca una notificación como leída
  const manejarDescartarNotificacion = async (id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificacionesAPI.marcarLeidasClub([id]);
    } catch { /* silencioso */ }
  };

  // Marca todas las notificaciones como leídas
  const manejarDescartarTodasNotificaciones = async () => {
    const idsPrevios = notificaciones.map((n) => n.id);
    setNotificaciones([]);
    try {
      await notificacionesAPI.marcarLeidasClub(idsPrevios);
    } catch { /* silencioso */ }
  };

  // Carga los datos del club: perfil, atletas, eventos y estadísticas
  const cargarDatosClub = async () => {
    try {
      setCargando(true);
      setError('');

      const clubesRes = await clubesAPI.getAll();
      let clubes = clubesRes.data.clubes || clubesRes.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const clubData = clubes.find(c => c.email === user.email);
      if (!clubData) {
        setError('No se encontró un club asociado a este usuario.');
        setCargando(false);
        return;
      }
      setClub(clubData);
      const idClubObtenido = clubData.id || clubData._id;
      setIdClub(idClubObtenido);

      const atletasRes = await atletasAPI.getAll({ club_id: idClubObtenido });
      let atletas = atletasRes.data.atletas || atletasRes.data || [];
      if (!Array.isArray(atletas)) atletas = [];
      setAtletasRecientes(atletas);

      const eventosRes = await eventosAPI.getAll({ limit: 5 });
      let eventos = eventosRes.data.eventos || eventosRes.data || [];
      if (!Array.isArray(eventos)) eventos = [];
      setEventosRecientes(eventos);

      const statsRes = await resultadosAPI.getByClub(idClubObtenido);
      const resultados = statsRes.data.resultados || statsRes.data || [];
      calcularEstadisticas(atletas, Array.isArray(resultados) ? resultados : []);
    } catch (err) {
      console.error('Error al cargar datos del club:', err);
      setError('Error al cargar los datos del club');
    } finally {
      setCargando(false);
    }
  };

  // Calcula estadísticas a partir de atletas y resultados
  const calcularEstadisticas = (atletasData, resultadosData) => {
    const totalAtletas = atletasData.length;
    const atletasActivos = atletasData.filter(a => a.estado !== 'inactivo').length;
    const totalResultados = resultadosData.length;
    const podios = resultadosData.filter(r => r.posicion && r.posicion <= 3).length;
    setEstadisticas({ totalAtletas, atletasActivos, totalResultados, podios });
  };

  // Calcula la edad a partir de la fecha de nacimiento
  const obtenerEdad = (fecha) => {
    if (!fecha) return 'N/A';
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  // Formatea fecha en formato corto
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return 'Fecha inválida'; }
  };

  // Obtiene texto legible para el estado
  const obtenerTextoEstado = (estado) => {
    if (estado === true || estado === 'activo') return 'Activo';
    if (estado === false || estado === 'inactivo') return 'Inactivo';
    return 'Desconocido';
  };

  // Abre el modal de detalle de un evento
  const manejarVerEvento = (evento) => {
    setEventoSeleccionado(evento);
    setModalEventoAbierto(true);
  };

  const manejarVerAtletas = () => navigate('/club/gestionAtletas');
  const manejarVerEventos = () => navigate('/club/eventos');

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={cargarDatosClub}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
            >
              Intentar de Nuevo
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
      {/* Cabecera de bienvenida */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Club
          </Typography>
          <Avatar
            sx={{
              width: 72, height: 72, mx: 'auto', mt: 1.5, mb: 1.5,
              bgcolor: 'rgba(255,255,255,0.14)', border: '2px solid rgba(255,255,255,0.35)',
            }}
          >
            <GroupIcon sx={{ fontSize: 34 }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {club?.nombre || 'Club Deportivo'}
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            {club?.direccion || 'Sin dirección'}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        <Box sx={{ mt: { xs: -5, md: -6 } }}>
          <BannerNotificaciones
            notificaciones={notificaciones}
            onDescartar={manejarDescartarNotificacion}
            onDescartarTodas={manejarDescartarTodasNotificaciones}
          />
        </Box>

        {/* Tarjeta de estadísticas (flotante) */}
        <Box
          sx={{
            mt: notificaciones.length ? 0 : { xs: -5, md: -6 }, mb: 5,
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <PeopleIcon sx={{ fontSize: 24 }} />, value: estadisticas.totalAtletas || 0, label: 'Total Atletas' },
            { icon: <TrendingUpIcon sx={{ fontSize: 24 }} />, value: estadisticas.atletasActivos || 0, label: 'Atletas Activos' },
            { icon: <SpeedIcon sx={{ fontSize: 24 }} />, value: estadisticas.totalResultados || 0, label: 'Resultados' },
            { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: estadisticas.podios || 0, label: 'Podios' },
          ].map((s, i) => (
            <Box
              key={i}
              sx={{
                p: { xs: 2, md: 2.75 }, textAlign: 'center',
                borderRight: { sm: i < 3 ? `1px solid ${COLORS.line}` : 'none' },
                borderBottom: { xs: i < 2 ? `1px solid ${COLORS.line}` : 'none', sm: 'none' },
              }}
            >
              <Box sx={{ color: i % 2 === 0 ? COLORS.burgundy : COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
                {s.icon}
              </Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Contenido principal */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {/* Atletas recientes */}
          <SectionCard
            icon={<PeopleIcon sx={{ fontSize: 16 }} />}
            eyebrow="Plantilla"
            title="Nuevos Atletas"
            action={atletasRecientes.length > 0 && (
              <Button size="small" onClick={manejarVerAtletas} sx={{ color: COLORS.burgundy, textTransform: 'none', fontWeight: 700, fontSize: '.8rem' }}>
                Ver todos
              </Button>
            )}
          >
            {atletasRecientes.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay atletas registrados.</Typography>
            ) : (
              <List disablePadding>
                {atletasRecientes.slice(0, 3).map((atleta, i) => {
                  const nombre = atleta.nombre || '';
                  const apPaterno = atleta.apellido_paterno || '';
                  const apMaterno = atleta.apellido_materno || '';
                  const telefono = atleta.telefono || 'Sin teléfono';
                  const fechaNac = atleta.fecha_nacimiento || null;
                  const estado = atleta.estado || 'activo';
                  const key = atleta.id || `atleta-${i}`;
                  return (
                    <React.Fragment key={key}>
                      <ListItem disableGutters sx={{ py: 1.2, alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: COLORS.purple, width: 38, height: 38, fontSize: '0.85rem' }}>
                            {nombre.charAt(0) || 'A'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{nombre} {apPaterno} {apMaterno}</Typography>}
                          secondary={
                            <Box>
                              <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5 }}>
                                <CalendarIcon sx={{ fontSize: 12 }} /> Edad: {obtenerEdad(fechaNac)} años
                              </Typography>
                              <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5, mt: 0.2 }}>
                                <PhoneIcon sx={{ fontSize: 12 }} /> {telefono}
                              </Typography>
                              <EstadoChip label={estado === 'activo' ? 'Activo' : 'Inactivo'} positivo={estado === 'activo'} sx={{ mt: .5 }} />
                            </Box>
                          }
                        />
                      </ListItem>
                      {i < atletasRecientes.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </SectionCard>

          {/* Eventos recientes */}
          <SectionCard
            icon={<EventIcon sx={{ fontSize: 16 }} />}
            eyebrow="Agenda"
            title="Eventos Recientes"
            action={eventosRecientes.length > 0 && (
              <Button size="small" onClick={manejarVerEventos} sx={{ color: COLORS.burgundy, textTransform: 'none', fontWeight: 700, fontSize: '.8rem' }}>
                Ver todos
              </Button>
            )}
          >
            {eventosRecientes.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay eventos disponibles.</Typography>
            ) : (
              <List disablePadding>
                {eventosRecientes.slice(0, 4).map((evento, i) => {
                  const key = evento.id || `evento-${i}`;
                  return (
                    <React.Fragment key={key}>
                      <ListItem disableGutters sx={{ py: 1.2, alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: COLORS.burgundy, width: 38, height: 38 }}>
                            <EventIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{evento.titulo || 'Evento'}</Typography>}
                          secondary={
                            <Box>
                              <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5, mt: .3 }}>
                                <CalendarIcon sx={{ fontSize: 12 }} /> {formatearFecha(evento.fecha)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5 }}>
                                <LocationIcon sx={{ fontSize: 12 }} /> {evento.lugar || 'Lugar no especificado'}
                              </Typography>
                              {evento.disciplina && (
                                <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5 }}>
                                  <SportsIcon sx={{ fontSize: 12 }} /> {typeof evento.disciplina === 'string' ? evento.disciplina : evento.disciplina?.nombre || 'N/A'} — {evento.categoria || ''}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                                <EstadoChip label={obtenerTextoEstado(evento.estado)} positivo={evento.estado === true || evento.estado === 'activo'} />
                                <IconButton size="small" onClick={() => manejarVerEvento(evento)} sx={{ color: COLORS.burgundy, p: 0.25 }}>
                                  <ViewIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {i < eventosRecientes.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </SectionCard>

          {/* Resumen del club */}
          <SectionCard icon={<GroupIcon sx={{ fontSize: 16 }} />} eyebrow="Ficha" title="Resumen del Club">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Teléfono</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: COLORS.ink }}>{club?.telefono || 'N/A'}</Typography>
              </Box>
              <Divider sx={{ borderColor: COLORS.line }} />
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Correo</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: COLORS.ink }}>{club?.email || 'N/A'}</Typography>
              </Box>
              <Divider sx={{ borderColor: COLORS.line }} />
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Dirección</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: COLORS.ink }}>{club?.direccion || 'Sin dirección'}</Typography>
              </Box>
              <Divider sx={{ borderColor: COLORS.line }} />
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Descripción</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: COLORS.ink }}>{club?.descripcion || 'Sin descripción'}</Typography>
              </Box>
            </Box>
          </SectionCard>
        </Box>
      </Container>

      {/* Modal de detalles del evento */}
      <Dialog open={modalEventoAbierto} onClose={() => setModalEventoAbierto(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Detalles del Evento</Typography>
            <IconButton onClick={() => setModalEventoAbierto(false)} size="small" sx={{ color: '#fff' }}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {eventoSeleccionado && (
            <Box>
              <Typography variant="h5" gutterBottom sx={{ color: COLORS.burgundy, fontWeight: 700 }}>{eventoSeleccionado.titulo}</Typography>
              <Divider sx={{ my: 2, borderColor: COLORS.line }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.burgundy }}>Información General</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Fecha:</strong> {formatearFecha(eventoSeleccionado.fecha)}</Typography>
                  <Typography variant="body2"><strong>Hora:</strong> {eventoSeleccionado.hora || 'No especificada'}</Typography>
                  <Typography variant="body2"><strong>Lugar:</strong> {eventoSeleccionado.lugar}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="body2"><strong>Estado:</strong></Typography>
                    <EstadoChip label={obtenerTextoEstado(eventoSeleccionado.estado)} positivo={eventoSeleccionado.estado === true || eventoSeleccionado.estado === 'activo'} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.burgundy }}>Información Deportiva</Typography>
                  {eventoSeleccionado.convocatorias && eventoSeleccionado.convocatorias.length > 0 ? (
                    <>
                      <Typography variant="body2" sx={{ mt: 1 }}><strong>Disciplina:</strong> {eventoSeleccionado.convocatorias[0].disciplina}</Typography>
                      <Typography variant="body2"><strong>Categoría:</strong> {eventoSeleccionado.convocatorias[0].categoria}</Typography>
                      <Typography variant="body2"><strong>Edad:</strong> {eventoSeleccionado.convocatorias[0].edadMin} - {eventoSeleccionado.convocatorias[0].edadMax} años</Typography>
                      <Typography variant="body2"><strong>Género:</strong> {eventoSeleccionado.convocatorias[0].genero || 'Mixto'}</Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ mt: 1 }}><strong>Disciplina:</strong> {eventoSeleccionado.disciplina || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Categoría:</strong> {eventoSeleccionado.categoria || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Edad:</strong> {eventoSeleccionado.edadMin || 'N/A'} - {eventoSeleccionado.edadMax || 'N/A'} años</Typography>
                      <Typography variant="body2"><strong>Género:</strong> {eventoSeleccionado.genero || 'N/A'}</Typography>
                    </>
                  )}
                </Box>
              </Box>
              {eventoSeleccionado.descripcion && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.burgundy }}>Descripción</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>{eventoSeleccionado.descripcion}</Typography>
                </Box>
              )}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.burgundy }}>Información Técnica</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>ID:</strong> {eventoSeleccionado.id}</Typography>
                <Typography variant="body2"><strong>Fecha de creación:</strong> {formatearFecha(eventoSeleccionado.createdAt)}</Typography>
                <Typography variant="body2"><strong>Fecha de cierre:</strong> {formatearFecha(eventoSeleccionado.fechaCierre)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEventoAbierto(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaginaPrincipalClub;