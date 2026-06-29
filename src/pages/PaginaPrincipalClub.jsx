import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
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
  Group as GroupIcon,
  Phone as PhoneIcon,
  SportsScore as SportsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e4e4e5';
const GREEN = '#2E7D32';

const StatCard = ({ icon, value, label, bgcolor }) => (
  <Card sx={{
    bgcolor,
    color: '#fff',
    borderRadius: 3,
    transition: 'transform .2s, box-shadow .2s',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,.15)' },
  }}>
    <CardContent sx={{ py: 3, px: 2, textAlign: 'center' }}>
      <Box sx={{ fontSize: 36, lineHeight: 1, mb: .5, display: 'flex', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Typography variant="h4" sx={{
        fontWeight: 800, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.8rem' },
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ opacity: .9, fontSize: { xs: '.7rem', md: '.8rem' } }}>
        {label}
      </Typography>
    </CardContent>
  </Card>
);

const SectionCard = ({ icon, title, color, action, children }) => (
  <Card sx={{
    borderRadius: 3, height: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    display: 'flex', flexDirection: 'column',
  }}>
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: color, width: 36, height: 36 }}>{icon}</Avatar>
          <Typography variant="h6" sx={{ color, fontWeight: 'bold' }}>{title}</Typography>
        </Box>
        {action}
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ flex: 1 }}>{children}</Box>
    </CardContent>
  </Card>
);

const PaginaPrincipalClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [club, setClub] = useState(null);
  const [clubId, setClubId] = useState(null);
  const [atletasRecientes, setAtletasRecientes] = useState([]);
  const [eventosRecientes, setEventosRecientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [modalEventoOpen, setModalEventoOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  const getAuthHeaders = () => {
    const token = user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (!user || user.rol !== 'club') {
      navigate('/login');
      return;
    }
    cargarDatosClub();
  }, [user, navigate]);

  const cargarDatosClub = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Obtener club por email
      const clubesRes = await axios.get('http://localhost:5000/api/clubes', { headers: getAuthHeaders() });
      let clubes = clubesRes.data.clubes || clubesRes.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const clubData = clubes.find(c => c.email === user.email);
      if (!clubData) {
        setError('No se encontró un club asociado a este usuario.');
        setLoading(false);
        return;
      }
      setClub(clubData);
      const idClub = clubData.id || clubData._id;
      setClubId(idClub);

      // 2. Atletas del club
      const atletasRes = await axios.get(`http://localhost:5000/api/atletas?club_id=${idClub}&limit=5`, {
        headers: getAuthHeaders()
      });
      let atletas = atletasRes.data.atletas || atletasRes.data || [];
      if (!Array.isArray(atletas)) atletas = [];
      setAtletasRecientes(atletas);

      // 3. Eventos recientes
      const eventosRes = await axios.get('http://localhost:5000/api/eventos?limit=5', {
        headers: getAuthHeaders()
      });
      let eventos = eventosRes.data.eventos || eventosRes.data || [];
      if (!Array.isArray(eventos)) eventos = [];
      setEventosRecientes(eventos);

      // 4. Estadísticas
      const statsRes = await axios.get(`http://localhost:5000/api/resultados?clubId=${idClub}`, {
        headers: getAuthHeaders()
      });
      const resultados = statsRes.data.resultados || statsRes.data || [];
      calcularEstadisticas(atletas, Array.isArray(resultados) ? resultados : []);
    } catch (error) {
      console.error('Error al cargar datos del club:', error);
      setError('Error al cargar los datos del club');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (atletasData, resultadosData) => {
    const totalAtletas = atletasData.length;
    const atletasActivos = atletasData.filter(a => a.estado !== 'inactivo').length;
    const totalResultados = resultadosData.length;
    const podios = resultadosData.filter(r => r.posicion && r.posicion <= 3).length;
    setEstadisticas({ totalAtletas, atletasActivos, totalResultados, podios });
  };

  const obtenerEdad = (fecha) => {
    if (!fecha) return 'N/A';
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const fmt = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return 'Fecha inválida'; }
  };

  const obtenerTextoEstado = (estado) => {
    if (estado === true || estado === 'activo') return 'Activo';
    if (estado === false || estado === 'inactivo') return 'Inactivo';
    return 'Desconocido';
  };

  const obtenerColorEstado = (estado) => {
    if (estado === true || estado === 'activo') return 'success';
    if (estado === false || estado === 'inactivo') return 'error';
    return 'default';
  };

  const handleVerEvento = (evento) => {
    setEventoSeleccionado(evento);
    setModalEventoOpen(true);
  };

  const handleVerAtletas = () => navigate('/club/gestionAtletas');
  const handleVerEventos = () => navigate('/club/eventos');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: CREAM }}>
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: CREAM, minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" onClick={cargarDatosClub}
              sx={{ bgcolor: BURGUNDY, '&:hover': { bgcolor: '#600018' } }}>
              Intentar de Nuevo
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Avatar sx={{ width: 88, height: 88, mx: 'auto', mb: 2, bgcolor: BURGUNDY }}>
            <GroupIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" sx={{ color: BURGUNDY, fontWeight: 800, mb: .5 }}>
            {club?.nombre || 'Club Deportivo'}
          </Typography>
          <Typography variant="body1" sx={{ color: PURPLE, opacity: .8 }}>
            Panel de control del club · {club?.direccion || 'Sin dirección'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate('/club/perfil')}
            sx={{ mt: 2, color: BURGUNDY, borderColor: BURGUNDY, borderRadius: 3, textTransform: 'none' }}
          >
            Editar Perfil
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 3, mb: 5, maxWidth: 800, mx: 'auto' }}>
          <StatCard icon={<PeopleIcon fontSize="inherit" />} value={estadisticas.totalAtletas || 0} label="Total Atletas" bgcolor={BURGUNDY} />
          <StatCard icon={<TrendingUpIcon fontSize="inherit" />} value={estadisticas.atletasActivos || 0} label="Atletas Activos" bgcolor={PURPLE} />
          <StatCard icon={<SpeedIcon fontSize="inherit" />} value={estadisticas.totalResultados || 0} label="Resultados" bgcolor={GREEN} />
          <StatCard icon={<TrophyIcon fontSize="inherit" />} value={estadisticas.podios || 0} label="Podios" bgcolor="#1565C0" />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {/* Atletas recientes */}
          <SectionCard
            icon={<PeopleIcon sx={{ fontSize: 20 }} />}
            title="Nuevos Atletas"
            color={BURGUNDY}
            action={atletasRecientes.length > 0 && <Button size="small" onClick={handleVerAtletas} sx={{ color: BURGUNDY, textTransform: 'none', fontWeight: 600, fontSize: '.8rem' }}>Ver todos</Button>}
          >
            {atletasRecientes.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>No hay atletas registrados</Typography>
            ) : (
              <List disablePadding>
                {atletasRecientes.slice(0, 3).map((atleta, i) => {
                  // Extraer datos de forma segura
                  const nombre = atleta.nombre || atleta.usuario?.nombre || '';
                  const apPaterno = atleta.apellidopa || atleta.usuario?.apellido_paterno || '';
                  const apMaterno = atleta.apellidoma || atleta.usuario?.apellido_materno || '';
                  const telefono = atleta.telefono || atleta.usuario?.telefono || 'Sin teléfono';
                  const fechaNac = atleta.fecha_nacimiento || atleta.usuario?.fecha_nacimiento || null;
                  const estado = atleta.estado || 'activo';
                  const key = atleta.id || atleta._id || `atleta-${i}`;
                  return (
                    <React.Fragment key={key}>
                      <ListItem disableGutters sx={{ py: 1.2, alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: PURPLE, width: 38, height: 38 }}>
                            {nombre.charAt(0) || 'A'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${nombre} ${apPaterno} ${apMaterno}`}
                          secondary={
                            <Box component="span" sx={{ display: 'block' }}>
                              <Typography variant="caption" component="span" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                                <CalendarIcon sx={{ fontSize: 12 }} /> Edad: {obtenerEdad(fechaNac)} años
                              </Typography>
                              <Typography variant="caption" component="span" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5, mt: 0.2 }}>
                                <PhoneIcon sx={{ fontSize: 12 }} /> {telefono}
                              </Typography>
                              <Chip
                                component="span"
                                label={estado === 'activo' ? 'Activo' : 'Inactivo'}
                                color={estado === 'activo' ? 'success' : 'error'}
                                size="small"
                                sx={{ mt: .5, display: 'inline-flex', height: 20, fontSize: '.7rem' }}
                              />
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'span' }}
                        />
                      </ListItem>
                      {i < atletasRecientes.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </SectionCard>

          {/* Eventos recientes */}
          <SectionCard
            icon={<EventIcon sx={{ fontSize: 20 }} />}
            title="Eventos Recientes"
            color={GREEN}
            action={eventosRecientes.length > 0 && <Button size="small" onClick={handleVerEventos} sx={{ color: GREEN, textTransform: 'none', fontWeight: 600, fontSize: '.8rem' }}>Ver todos</Button>}
          >
            {eventosRecientes.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>No hay eventos disponibles</Typography>
            ) : (
              <List disablePadding>
                {eventosRecientes.slice(0, 4).map((evento, i) => {
                  const key = evento._id || `evento-${i}`;
                  return (
                    <React.Fragment key={key}>
                      <ListItem disableGutters sx={{ py: 1.2, alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: GREEN, width: 38, height: 38 }}>
                            <EventIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={evento.titulo || 'Evento'}
                          secondary={
                            <Box component="span" sx={{ display: 'block' }}>
                              <Typography variant="caption" component="span" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5, mt: .3 }}>
                                <CalendarIcon sx={{ fontSize: 12 }} /> {fmt(evento.fecha)}
                              </Typography>
                              <Typography variant="caption" component="span" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                                <LocationIcon sx={{ fontSize: 12 }} /> {evento.lugar || 'Lugar no especificado'}
                              </Typography>
                              {evento.disciplina && (
                                <Typography variant="caption" component="span" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                                  <SportsIcon sx={{ fontSize: 12 }} /> {typeof evento.disciplina === 'string' ? evento.disciplina : evento.disciplina?.nombre || 'N/A'} — {evento.categoria || ''}
                                </Typography>
                              )}
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Chip
                                  component="span"
                                  label={obtenerTextoEstado(evento.estado)}
                                  color={obtenerColorEstado(evento.estado)}
                                  size="small"
                                  sx={{ height: 20, fontSize: '.7rem', display: 'inline-flex' }}
                                />
                                <IconButton size="small" onClick={() => handleVerEvento(evento)} sx={{ ml: 1, color: BURGUNDY, p: 0 }}>
                                  <ViewIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'span' }}
                        />
                      </ListItem>
                      {i < eventosRecientes.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </SectionCard>

          {/* Resumen del Club */}
          <SectionCard icon={<GroupIcon sx={{ fontSize: 20 }} />} title="Resumen del Club" color={PURPLE}>
            <List disablePadding>
              <ListItem disableGutters sx={{ py: 1 }}>
                <ListItemText primary="Teléfono" secondary={club?.telefono || 'N/A'} />
              </ListItem>
              <Divider />
              <ListItem disableGutters sx={{ py: 1 }}>
                <ListItemText primary="Correo" secondary={club?.email || 'N/A'} />
              </ListItem>
              <Divider />
              <ListItem disableGutters sx={{ py: 1 }}>
                <ListItemText primary="Dirección" secondary={club?.direccion || 'Sin dirección'} />
              </ListItem>
              <Divider />
              <ListItem disableGutters sx={{ py: 1 }}>
                <ListItemText primary="Descripción" secondary={club?.descripcion || 'Sin descripción'} />
              </ListItem>
            </List>
          </SectionCard>
        </Box>
      </Container>

      {/* Modal de Detalles del Evento */}
      <Dialog open={modalEventoOpen} onClose={() => setModalEventoOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>Detalles del Evento</Typography>
            <IconButton onClick={() => setModalEventoOpen(false)} size="small"><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {eventoSeleccionado && (
            <Box>
              <Typography variant="h5" gutterBottom sx={{ color: BURGUNDY, fontWeight: 700 }}>{eventoSeleccionado.titulo}</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BURGUNDY }}>📅 Información General</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Fecha:</strong> {fmt(eventoSeleccionado.fecha)}</Typography>
                  <Typography variant="body2"><strong>Hora:</strong> {eventoSeleccionado.hora || 'No especificada'}</Typography>
                  <Typography variant="body2"><strong>Lugar:</strong> {eventoSeleccionado.lugar}</Typography>
                  <Typography variant="body2"><strong>Estado:</strong> <Chip label={obtenerTextoEstado(eventoSeleccionado.estado)} color={obtenerColorEstado(eventoSeleccionado.estado)} size="small" sx={{ ml: 1 }} /></Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BURGUNDY }}>Información Deportiva</Typography>
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BURGUNDY }}>Descripción</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>{eventoSeleccionado.descripcion}</Typography>
                </Box>
              )}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BURGUNDY }}>Información Técnica</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>ID:</strong> {eventoSeleccionado._id}</Typography>
                <Typography variant="body2"><strong>Fecha de creación:</strong> {fmt(eventoSeleccionado.createdAt)}</Typography>
                <Typography variant="body2"><strong>Fecha de cierre:</strong> {fmt(eventoSeleccionado.fechaCierre)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEventoOpen(false)} sx={{ color: PURPLE, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaginaPrincipalClub;