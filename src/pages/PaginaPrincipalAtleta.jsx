import React, { useState, useEffect } from 'react';
import { atletasAPI, clubesAPI, eventosAPI } from '../api/index.js';
import { useAuth } from '../components/common/AuthContext.jsx';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Event as EventIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  DirectionsRun as RunIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#F5E8C7';

const StatCard = ({ icon, value, label, bgcolor }) => (
  <Card
    sx={{
      bgcolor,
      color: 'white',
      borderRadius: 3,
      height: '100%',
      minHeight: { xs: 130, sm: 150, md: 160 },
    }}
  >
    <CardContent
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        py: { xs: 2, md: 3 },
        px: 2,
        gap: 0.5,
        '&:last-child': { pb: { xs: 2, md: 3 } },
      }}
    >
      <Box sx={{ fontSize: { xs: 32, md: 40 }, lineHeight: 1, mb: 0.5, display: 'flex' }}>
        {icon}
      </Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'bold',
          fontSize: { xs: '1.4rem', md: '2rem' },
          lineHeight: 1.1,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          opacity: 0.9,
          textAlign: 'center',
          fontSize: { xs: '0.7rem', md: '0.8rem' },
        }}
      >
        {label}
      </Typography>
    </CardContent>
  </Card>
);

const PaginaPrincipalAtleta = () => {
  const { user } = useAuth();
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
    totalEventos: 0,
    eventosGanados: 0,
    sesionesCompletadas: 0,
    clubActual: null,
  });

  useEffect(() => {
    if (user) cargarDatosAtleta();
  }, [user]);

  useEffect(() => {
    if (atletaData) calcularEstadisticas(atletaData, eventosParticipacion);
  }, [atletaData, eventosParticipacion]);

  const cargarDatosAtleta = async () => {
    try {
      setLoading(true);
      setError('');

      const atletaResponse = await atletasAPI.getPerfil();
      const atleta = atletaResponse.data.atleta;
      setAtletaData(atleta);

      try {
        const clubesResponse = await clubesAPI.getAll();
        setClubesDisponibles((clubesResponse.data.clubes || []).slice(0, 6));
      } catch {
        setClubesDisponibles([]);
      }

      try {
        const edad = calcularEdad(atleta.fecha_nacimiento);
        const genero = atleta.genero?.toLowerCase();
        if (edad && genero) {
          const eventosResponse = await eventosAPI.getMisConvocatorias();
          setEventosProximos((eventosResponse.data.convocatorias || []).slice(0, 4));
        } else {
          setEventosProximos([]);
        }
      } catch {
        setEventosProximos([]);
      }

      try {
        const participacionResponse = await eventosAPI.getMisInscripciones();
        setEventosParticipacion((participacionResponse.data.inscripciones || []).slice(0, 3));
      } catch {
        setEventosParticipacion([]);
      }
    } catch (err) {
      setError(`Error al cargar los datos del atleta: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const calcularEstadisticas = (atleta, participaciones = []) => {
    setEstadisticas({
      totalEventos: participaciones.length,
      eventosGanados: participaciones.filter((p) => p.resultado === 'ganador').length,
      sesionesCompletadas: 0,
      clubActual: atleta.club_nombre || 'Sin Club',
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: CREAM,
        }}
      >
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: CREAM, minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={cargarDatosAtleta}
              sx={{ bgcolor: BURGUNDY, '&:hover': { bgcolor: '#600018' } }}
            >
              Intentar de Nuevo
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  const statCards = [
    {
      icon: <EventIcon fontSize="inherit" />,
      value: estadisticas.totalEventos,
      label: 'Eventos Participados',
      bgcolor: BURGUNDY,
    },
    {
      icon: <TrophyIcon fontSize="inherit" />,
      value: estadisticas.eventosGanados,
      label: 'Victorias',
      bgcolor: PURPLE,
    },
    {
      icon: <RunIcon fontSize="inherit" />,
      value: estadisticas.sesionesCompletadas,
      label: 'Sesiones Completadas',
      bgcolor: '#2E7D32',
    },
    {
      icon: <GroupIcon fontSize="inherit" />,
      value: estadisticas.clubActual,
      label: 'Club Actual',
      bgcolor: '#1565C0',
    },
  ];

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Avatar
            sx={{
              width: { xs: 64, md: 80 },
              height: { xs: 64, md: 80 },
              mx: 'auto',
              mb: 1.5,
              bgcolor: BURGUNDY,
            }}
          >
            <PersonIcon sx={{ fontSize: { xs: 32, md: 40 } }} />
          </Avatar>
          <Typography
            variant="h4"
            sx={{
              color: BURGUNDY,
              fontWeight: 'bold',
              mb: 0.5,
              fontSize: { xs: '1.5rem', md: '2.125rem' },
            }}
          >
            ¡Bienvenido, {atletaData?.nombre}!
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: PURPLE, fontSize: { xs: '0.95rem', md: '1.25rem' } }}
          >
            Tu centro de control deportivo personal
          </Typography>
        </Box>

        {/* Stat cards */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: { xs: 3, md: 4 },
          }}
        >
          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            sx={{ maxWidth: { xs: '100%', sm: 600, md: 900 } }}
          >
            {statCards.map((stat, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <StatCard {...stat} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Main content */}
        <Grid container spacing={{ xs: 2, md: 3 }}>

          {/* Clubes Disponibles */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: BURGUNDY, mr: 1.5, width: 36, height: 36 }}>
                    <GroupIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>
                    Clubes Disponibles
                  </Typography>
                </Box>

                {clubesDisponibles.length === 0 ? (
                  <Typography variant="body2" sx={{ textAlign: 'center', color: PURPLE, py: 3 }}>
                    No hay clubes disponibles en este momento.
                  </Typography>
                ) : (
                  <>
                    <List disablePadding>
                      {clubesDisponibles.slice(0, 3).map((club, index) => (
                        <React.Fragment key={club.id}>
                          <ListItem disableGutters alignItems="flex-start" sx={{ py: 1.5 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: PURPLE, width: 38, height: 38 }}>
                                <SchoolIcon fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: BURGUNDY }}>
                                  {club.nombre}
                                </Typography>
                              }
                              secondaryTypographyProps={{ component: 'div' }}
                              secondary={
                                <Box>
                                  {club.direccion && (
                                    <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                                      📍 {club.direccion}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                                    📞 {club.telefono}
                                  </Typography>
                                  {club.descripcion && (
                                    <Typography variant="caption" sx={{ color: PURPLE, display: 'block', mt: 0.5 }}>
                                      {club.descripcion.substring(0, 80)}…
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < 2 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setModalClubesOpen(true)}
                        startIcon={<ViewIcon />}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{
                          borderColor: BURGUNDY,
                          color: BURGUNDY,
                          '&:hover': { borderColor: '#600018', backgroundColor: CREAM },
                        }}
                      >
                        Ver Todos los Clubes
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Próximos Eventos */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: BURGUNDY, mr: 1.5, width: 36, height: 36 }}>
                    <CalendarIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>
                    Próximos Eventos
                  </Typography>
                </Box>

                {eventosProximos.length === 0 ? (
                  <Typography variant="body2" sx={{ textAlign: 'center', color: PURPLE, py: 3 }}>
                    No hay eventos próximos disponibles para tu categoría.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {eventosProximos.map((evento, index) => (
                      <React.Fragment key={evento.id}>
                        <ListItem disableGutters alignItems="flex-start" sx={{ py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: PURPLE, width: 38, height: 38 }}>
                              <EventIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: BURGUNDY }}>
                                {evento.titulo}
                              </Typography>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              <Box>
                                <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                                  📅 {formatearFecha(evento.fecha)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                                  📍 {evento.lugar}
                                </Typography>
                                <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                                  🏃 {evento.disciplina} — {evento.categoria}
                                </Typography>
                                <Chip
                                  label={evento.estado ? 'Abierto' : 'Cerrado'}
                                  color={evento.estado ? 'success' : 'error'}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < eventosProximos.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Mis Participaciones */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: BURGUNDY, mr: 1.5, width: 36, height: 36 }}>
                    <CheckIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>
                    Mis Participaciones
                  </Typography>
                </Box>

                {eventosParticipacion.length === 0 ? (
                  <Typography variant="body2" sx={{ textAlign: 'center', color: PURPLE, py: 3 }}>
                    No estás participando en ningún evento actualmente.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {eventosParticipacion.map((participacion, index) => (
                      <React.Fragment key={participacion.id}>
                        <ListItem disableGutters alignItems="flex-start" sx={{ py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#2E7D32', width: 38, height: 38 }}>
                              <TrophyIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: BURGUNDY }}>
                                {participacion.evento?.titulo || 'Evento'}
                              </Typography>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              <Box>
                                <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                                  📅 {formatearFecha(participacion.fechaInscripcion)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                                  🏃 {participacion.evento?.disciplina || 'N/A'}
                                </Typography>
                                <Chip
                                  label={participacion.validado ? 'Validado' : 'Pendiente'}
                                  color={participacion.validado ? 'success' : 'warning'}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            sx={{
                              borderColor: '#2E7D32',
                              color: '#2E7D32',
                              alignSelf: 'center',
                              ml: 1,
                              flexShrink: 0,
                              '&:hover': { borderColor: '#1B5E20', backgroundColor: CREAM },
                            }}
                          >
                            Ver
                          </Button>
                        </ListItem>
                        {index < eventosParticipacion.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Modal Clubes */}
      <Dialog
        open={modalClubesOpen}
        onClose={() => setModalClubesOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>
              Clubes Disponibles
            </Typography>
            <IconButton onClick={() => setModalClubesOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {clubesDisponibles.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 3, color: PURPLE }}>
              No hay clubes disponibles en este momento.
            </Typography>
          ) : isMobile ? (
            <List disablePadding>
              {clubesDisponibles.map((club, index) => (
                <React.Fragment key={club.id}>
                  <ListItem disableGutters sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: PURPLE }}>
                        <SchoolIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: BURGUNDY }}>
                          {club.nombre}
                        </Typography>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                            {club.estadoNacimiento} · {club.telefono}
                          </Typography>
                          <Typography variant="caption" sx={{ color: PURPLE, display: 'block' }}>
                            {club.descripcion || 'Sin descripción disponible'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < clubesDisponibles.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Club</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Teléfono</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clubesDisponibles.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: PURPLE, width: 32, height: 32 }}>
                          <SchoolIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: BURGUNDY }}>
                          {club.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{club.estadoNacimiento}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{club.telefono}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 280 }}>
                        {club.descripcion || 'Sin descripción disponible'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalClubesOpen(false)} sx={{ color: PURPLE }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaginaPrincipalAtleta;