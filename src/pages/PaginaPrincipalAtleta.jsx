import React, { useState, useEffect } from 'react';
import { atletasAPI, clubesAPI, eventosAPI } from '../api/index.js';
import { useAuth } from '../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Card, CardContent, Button, Chip, Avatar,
  List, ListItem, ListItemText, ListItemAvatar, Divider, CircularProgress,
  Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableHead, TableRow, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Person as PersonIcon, Event as EventIcon, Group as GroupIcon,
  CalendarToday as CalendarIcon, EmojiEvents as TrophyIcon,
  DirectionsRun as RunIcon, Visibility as ViewIcon,
  CheckCircle as CheckIcon, Close as CloseIcon,
  LocationOn as LocationIcon, Phone as PhoneIcon,
  SportsScore as SportsIcon,
} from '@mui/icons-material';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e4e4e5';
const GREEN = '#2E7D32';

/* ── Tarjeta de estadística — color sólido ── */
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

/* ── Sección con título ── */
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

const PaginaPrincipalAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [atletaData, setAtletaData] = useState(null);
  const [clubesDisponibles, setClubesDisponibles] = useState([]);
  const [eventosProximos, setEventosProximos] = useState([]);
  const [eventosParticipacion, setEventosParticipacion] = useState([]);
  const [modalClubesOpen, setModalClubesOpen] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalEventos: 0, eventosGanados: 0, sesionesCompletadas: 0, clubActual: null,
  });

  useEffect(() => { if (user) cargarDatosAtleta(); }, [user]);
  useEffect(() => { if (atletaData) calcularEstadisticas(atletaData, eventosParticipacion); }, [atletaData, eventosParticipacion]);

  const cargarDatosAtleta = async () => {
    try {
      setLoading(true); setError('');
      const atletaResponse = await atletasAPI.getPerfil();
      const atleta = atletaResponse.data.atleta;
      setAtletaData(atleta);

      try {
        const clubesRes = await clubesAPI.getAll();
        setClubesDisponibles((clubesRes.data.clubes || []).slice(0, 6));
      } catch { setClubesDisponibles([]); }

      try {
        const edad = calcularEdad(atleta.fecha_nacimiento);
        const genero = atleta.genero?.toLowerCase();
        if (edad && genero) {
          const eventosRes = await eventosAPI.getMisConvocatorias();
          const convocatorias = eventosRes.data.convocatorias || [];
          // Solo eventos futuros
          const soloFuturos = convocatorias.filter(e => new Date(e.fecha) >= new Date());
          setEventosProximos(soloFuturos.slice(0, 5));
        } else { setEventosProximos([]); }
      } catch { setEventosProximos([]); }

      try {
        const partRes = await eventosAPI.getMisInscripciones();
        setEventosParticipacion((partRes.data.inscripciones || []).slice(0, 5));
      } catch { setEventosParticipacion([]); }
    } catch (err) {
      setError(`Error al cargar los datos: ${err.response?.data?.error || err.message}`);
    } finally { setLoading(false); }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date(); const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const calcularEstadisticas = (atleta, participaciones = []) => {
    setEstadisticas({
      totalEventos: participaciones.length,
      eventosGanados: participaciones.filter(p => p.resultado === 'ganador').length,
      sesionesCompletadas: 0,
      clubActual: atleta.club_nombre || 'Sin Club',
    });
  };

  const fmt = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return 'Fecha inválida'; }
  };

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
            <Button variant="contained" onClick={cargarDatosAtleta}
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

        {/* ── Header ── */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Avatar sx={{
            width: 88, height: 88, mx: 'auto', mb: 2,
            bgcolor: BURGUNDY, fontSize: '2rem', fontWeight: 'bold',
          }}>
            {atletaData?.nombre?.[0]}{atletaData?.apellido_paterno?.[0] || ''}
          </Avatar>
          <Typography variant="h4" sx={{ color: BURGUNDY, fontWeight: 800, mb: .5 }}>
            ¡Bienvenido, {atletaData?.nombre}!
          </Typography>
          <Typography variant="body1" sx={{ color: PURPLE, opacity: .8 }}>
            Tu centro de control deportivo personal
          </Typography>
        </Box>

        {/* ── Estadísticas — colores sólidos ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: 3, mb: 5, maxWidth: 800, mx: 'auto',
        }}>
          <StatCard icon={<EventIcon fontSize="inherit" />}
            value={estadisticas.totalEventos} label="Eventos Participados"
            bgcolor={BURGUNDY} />
          <StatCard icon={<TrophyIcon fontSize="inherit" />}
            value={estadisticas.eventosGanados} label="Victorias"
            bgcolor={PURPLE} />
          <StatCard icon={<RunIcon fontSize="inherit" />}
            value={estadisticas.sesionesCompletadas} label="Sesiones Completadas"
            bgcolor={GREEN} />
          <StatCard icon={<GroupIcon fontSize="inherit" />}
            value={estadisticas.clubActual} label="Club Actual"
            bgcolor="#1565C0" />
        </Box>

        {/* ── Contenido principal — 3 columnas ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}>

          {/* ── Clubes Disponibles ── */}
          <SectionCard
            icon={<GroupIcon sx={{ fontSize: 20 }} />}
            title="Clubes Disponibles"
            color={BURGUNDY}
            action={
              clubesDisponibles.length > 0 && (
                <Button size="small" onClick={() => setModalClubesOpen(true)}
                  sx={{ color: BURGUNDY, textTransform: 'none', fontWeight: 600, fontSize: '.8rem' }}>
                  Ver todos
                </Button>
              )
            }
          >
            {clubesDisponibles.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                No hay clubes disponibles
              </Typography>
            ) : (
              <List disablePadding>
                {clubesDisponibles.slice(0, 3).map((club, i) => (
                  <React.Fragment key={club.id}>
                    <ListItem disableGutters sx={{ py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: PURPLE, width: 38, height: 38, fontSize: '.85rem' }}>
                          {club.nombre?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {club.nombre}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            {club.telefono && (
                              <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                                <PhoneIcon sx={{ fontSize: 12 }} /> {club.telefono}
                              </Typography>
                            )}
                            {club.direccion && (
                              <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                                <LocationIcon sx={{ fontSize: 12 }} /> {club.direccion.substring(0, 40)}...
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < 2 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* ── Próximos Eventos (solo futuros) ── */}
          <SectionCard
            icon={<CalendarIcon sx={{ fontSize: 20 }} />}
            title="Próximos Eventos"
            color={GREEN}
          >
            {eventosProximos.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                No hay eventos próximos para tu categoría
              </Typography>
            ) : (
              <List disablePadding>
                {eventosProximos.slice(0, 4).map((evento, i) => (
                  <React.Fragment key={evento.id || i}>
                    <ListItem disableGutters sx={{ py: 1.2, alignItems: 'flex-start' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: GREEN, width: 38, height: 38 }}>
                          <EventIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {evento.titulo}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5, mt: .3 }}>
                              <CalendarIcon sx={{ fontSize: 12 }} /> {fmt(evento.fecha)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                              <LocationIcon sx={{ fontSize: 12 }} /> {evento.lugar}
                            </Typography>
                            {(evento.disciplina || evento.categoria) && (
                              <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                                <SportsIcon sx={{ fontSize: 12 }} /> {evento.disciplina} — {evento.categoria}
                              </Typography>
                            )}
                            <Chip
                              label={evento.fecha_cierre && new Date(evento.fecha_cierre) < new Date() ? 'Inscripción cerrada' : 'Inscripción abierta'}
                              color={evento.fecha_cierre && new Date(evento.fecha_cierre) < new Date() ? 'error' : 'success'}
                              size="small"
                              sx={{ mt: .5, height: 20, fontSize: '.7rem' }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < eventosProximos.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* ── Mis Participaciones con botón Ver ── */}
          <SectionCard
            icon={<CheckIcon sx={{ fontSize: 20 }} />}
            title="Mis Participaciones"
            color={PURPLE}
          >
            {eventosParticipacion.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                No estás inscrito en ningún evento
              </Typography>
            ) : (
              <List disablePadding>
                {eventosParticipacion.map((p, i) => (
                  <React.Fragment key={p.id || i}>
                    <ListItem disableGutters sx={{ py: 1.2, alignItems: 'flex-start' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: PURPLE, width: 38, height: 38 }}>
                          <TrophyIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {p.evento?.titulo || p.titulo || 'Evento'}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5, mt: .3 }}>
                              <CalendarIcon sx={{ fontSize: 12 }} /> {fmt(p.fecha || p.fechaInscripcion)}
                            </Typography>
                            {(p.evento?.disciplina || p.disciplina) && (
                              <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                                <SportsIcon sx={{ fontSize: 12 }} /> {p.evento?.disciplina || p.disciplina}
                              </Typography>
                            )}
                            <Chip
                              label={p.validado ? 'Validado' : 'Pendiente'}
                              color={p.validado ? 'success' : 'warning'}
                              size="small"
                              sx={{ mt: .5, height: 20, fontSize: '.7rem' }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < eventosParticipacion.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>
        </Box>
      </Container>

      {/* ── Modal Clubes ── */}
      <Dialog open={modalClubesOpen} onClose={() => setModalClubesOpen(false)}
        maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: BURGUNDY, width: 32, height: 32 }}>
                <GroupIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>
                Clubes Disponibles
              </Typography>
            </Box>
            <IconButton onClick={() => setModalClubesOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {clubesDisponibles.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 3, color: '#999' }}>
              No hay clubes disponibles
            </Typography>
          ) : isMobile ? (
            <List disablePadding>
              {clubesDisponibles.map((club, i) => (
                <React.Fragment key={club.id}>
                  <ListItem disableGutters sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: PURPLE }}>{club.nombre?.[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="subtitle2" sx={{ fontWeight: 600, color: BURGUNDY }}>{club.nombre}</Typography>}
                      secondary={
                        <Box>
                          {club.telefono && (
                            <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                              <PhoneIcon sx={{ fontSize: 12 }} /> {club.telefono}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {club.descripcion || 'Sin descripción'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {i < clubesDisponibles.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Club</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Teléfono</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Dirección</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clubesDisponibles.map((club) => (
                  <TableRow key={club.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: PURPLE, width: 30, height: 30, fontSize: '.8rem' }}>
                          {club.nombre?.[0]}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{club.nombre}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{club.telefono || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{club.direccion || '—'}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 250 }}>
                        {club.descripcion ? club.descripcion.substring(0, 80) + '...' : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalClubesOpen(false)} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaginaPrincipalAtleta;