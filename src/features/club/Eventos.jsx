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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Event as EventIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  SportsScore as SportsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e4e4e5';
const GREEN = '#2E7D32';

// ── Componente reutilizable de sección ──
const SectionCard = ({ icon, title, color, action, children }) => (
  <Card sx={{
    borderRadius: 3,
    height: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    display: 'flex',
    flexDirection: 'column',
    bgcolor: '#fff',
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

const Eventos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventos, setEventos] = useState([]);
  const [modalEventoOpen, setModalEventoOpen] = useState(false);
  const [modalConvocatoriasOpen, setModalConvocatoriasOpen] = useState(false);
  const [modalParticipantesOpen, setModalParticipantesOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [eventoConvocatorias, setEventoConvocatorias] = useState(null);
  const [participantesClub, setParticipantesClub] = useState([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);

  // Obtener headers con token
  const getAuthHeaders = () => {
    const token = user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    cargarEventos();
  }, [user, navigate]);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/eventos', {
        headers: getAuthHeaders(),
      });
      // Normalizar: puede ser array o objeto con propiedad eventos
      let eventosData = response.data.eventos || response.data || [];
      if (!Array.isArray(eventosData)) eventosData = [eventosData];
      // Filtrar solo eventos futuros o del día
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);
      const eventosFuturos = eventosData.filter((evento) => {
        if (!evento.fecha) return false;
        const fechaEvento = new Date(evento.fecha);
        fechaEvento.setHours(0, 0, 0, 0);
        return fechaEvento >= fechaActual;
      });
      setEventos(eventosFuturos);
      setError('');
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setError('Error al cargar los eventos. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerConvocatorias = (evento) => {
    setEventoConvocatorias(evento);
    setModalConvocatoriasOpen(true);
  };

  const handleVerEventoConvocatoria = (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalEventoOpen(true);
  };

  const handleVerParticipantesConvocatoria = async (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalParticipantesOpen(true);
    setLoadingParticipantes(true);
    try {
      // Obtener ID del club (numérico)
      const clubRes = await axios.get('http://localhost:5000/api/clubes', { headers: getAuthHeaders() });
      let clubes = clubRes.data.clubes || clubRes.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const club = clubes.find(c => c.email === user.email);
      const clubId = club?.id || club?._id;
      if (!clubId) {
        setParticipantesClub([]);
        setLoadingParticipantes(false);
        return;
      }
      // Llamar al endpoint con los parámetros correctos
      const response = await axios.get(
        `http://localhost:5000/api/eventos/${evento.id || evento._id}/participantes`,
        {
          params: {
            convocatoriaIndex: index,
            clubId: clubId,
          },
          headers: getAuthHeaders(),
        }
      );
      let participantes = response.data.participantes || response.data || [];
      if (!Array.isArray(participantes)) participantes = [];
      setParticipantesClub(participantes);
    } catch (error) {
      console.error('Error al cargar participantes:', error);
      setParticipantesClub([]);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  const handleCerrarParticipantes = () => {
    setModalParticipantesOpen(false);
    setEventoSeleccionado(null);
  };

  const handleCerrarEvento = () => {
    setModalEventoOpen(false);
    setEventoSeleccionado(null);
  };

  const handleCerrarConvocatorias = () => {
    setModalConvocatoriasOpen(false);
    setEventoConvocatorias(null);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 'N/A';
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const obtenerTextoEstado = (estado) => {
    if (estado === true || estado === 'activo') return 'Activo';
    if (estado === false || estado === 'inactivo') return 'Inactivo';
    if (estado === 'cancelado') return 'Cancelado';
    if (estado === 'finalizado') return 'Finalizado';
    if (estado === 'pendiente') return 'Pendiente';
    return 'Desconocido';
  };

  const obtenerColorEstado = (estado) => {
    if (estado === true || estado === 'activo') return 'success';
    if (estado === false || estado === 'inactivo') return 'error';
    if (estado === 'cancelado') return 'error';
    if (estado === 'finalizado') return 'default';
    if (estado === 'pendiente') return 'warning';
    return 'default';
  };

  // Función para obtener nombre de disciplina (puede ser objeto o string)
  const obtenerNombreDisciplina = (disciplina) => {
    if (!disciplina) return 'N/A';
    if (typeof disciplina === 'string') return disciplina;
    if (typeof disciplina === 'object' && disciplina.nombre) return disciplina.nombre;
    return 'N/A';
  };

  const obtenerNombreCategoria = (categoria) => {
    if (!categoria) return 'N/A';
    if (typeof categoria === 'string') return categoria;
    if (typeof categoria === 'object' && categoria.nombre) return categoria.nombre;
    return 'N/A';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: CREAM }}>
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', width: '100%', py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>

        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ color: BURGUNDY, fontWeight: 800, mb: 4 }}
        >
          Eventos Próximos
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Lista de eventos */}
        <SectionCard
          icon={<EventIcon sx={{ fontSize: 20 }} />}
          title="Todos los Eventos"
          color={BURGUNDY}
          action={
            eventos.length > 0 && (
              <Chip
                label={`${eventos.length} eventos`}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )
          }
        >
          {eventos.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
              No hay eventos próximos disponibles.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Evento</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Lugar</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }} align="center">Convocatorias</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eventos.map((evento) => {
                    const convocatorias = evento.convocatorias || [];
                    return (
                      <TableRow key={evento._id || evento.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: BURGUNDY }}>
                            {evento.titulo || 'Evento'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatearFecha(evento.fecha)}</TableCell>
                        <TableCell>{evento.lugar || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            onClick={() => handleVerConvocatorias(evento)}
                            startIcon={<PeopleIcon />}
                            size="small"
                            sx={{
                              color: BURGUNDY,
                              borderColor: BURGUNDY,
                              borderRadius: 2,
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: BURGUNDY,
                                backgroundColor: 'rgba(128,0,32,0.04)',
                              },
                            }}
                          >
                            Ver ({convocatorias.length})
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>
      </Container>

      {/* ── Modal de Convocatorias ── */}
      <Dialog open={modalConvocatoriasOpen} onClose={handleCerrarConvocatorias} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: BURGUNDY, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              🎯 Convocatorias del Evento: {eventoConvocatorias?.titulo}
            </Typography>
            <IconButton onClick={handleCerrarConvocatorias} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {eventoConvocatorias && eventoConvocatorias.convocatorias?.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Disciplina</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Categoría</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Edad</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Género</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: BURGUNDY }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eventoConvocatorias.convocatorias.map((convocatoria, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {obtenerNombreDisciplina(convocatoria.disciplina)}
                        </Typography>
                      </TableCell>
                      <TableCell>{obtenerNombreCategoria(convocatoria.categoria)}</TableCell>
                      <TableCell>
                        {convocatoria.edadMin || '?'} - {convocatoria.edadMax || '?'} años
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={convocatoria.genero === 'mixto' ? 'Mixto' :
                                 convocatoria.genero === 'masculino' ? 'Masculino' :
                                 convocatoria.genero === 'femenino' ? 'Femenino' : 'N/A'}
                          size="small"
                          color={convocatoria.genero === 'masculino' ? 'primary' :
                                 convocatoria.genero === 'femenino' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={obtenerTextoEstado(eventoConvocatorias.estado)}
                          color={obtenerColorEstado(eventoConvocatorias.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleVerEventoConvocatoria(eventoConvocatorias, convocatoria, index)}
                            color="primary"
                            title="Ver detalles"
                            sx={{ color: BURGUNDY }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleVerParticipantesConvocatoria(eventoConvocatorias, convocatoria, index)}
                            color="secondary"
                            title="Ver participantes del club"
                            sx={{ color: PURPLE }}
                          >
                            <PeopleIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: '#999' }}>
              No hay convocatorias para este evento.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarConvocatorias} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal de Participantes del Club ── */}
      <Dialog open={modalParticipantesOpen} onClose={handleCerrarParticipantes} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: BURGUNDY, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              👥 Participantes del Club
            </Typography>
            <IconButton onClick={handleCerrarParticipantes} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          {eventoSeleccionado?.convocatoriaSeleccionada && (
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
              {obtenerNombreDisciplina(eventoSeleccionado.convocatoriaSeleccionada.disciplina)} - {obtenerNombreCategoria(eventoSeleccionado.convocatoriaSeleccionada.categoria)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loadingParticipantes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={40} sx={{ color: BURGUNDY }} />
            </Box>
          ) : participantesClub.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: '#999' }}>
              No hay atletas de tu club inscritos en esta convocatoria.
            </Typography>
          ) : (
            <List disablePadding>
              {participantesClub.map((p, idx) => (
                <ListItem key={idx} divider sx={{ py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: PURPLE }}>
                      {p.atleta?.nombre?.charAt(0) || 'A'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: BURGUNDY }}>
                        {p.atleta?.nombreCompleto || p.atleta?.nombre || 'Atleta'}
                      </Typography>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="caption" component="span" display="block" sx={{ color: '#555' }}>
                          <strong>Edad:</strong> {p.atleta?.edad || 'N/A'} años
                        </Typography>
                        <Typography variant="caption" component="span" display="block" sx={{ color: '#555' }}>
                          <strong>Género:</strong> {p.atleta?.genero || 'N/A'}
                        </Typography>
                        <Typography variant="caption" component="span" display="block" sx={{ color: '#555' }}>
                          <strong>Inscripción:</strong> {formatearFecha(p.fechaInscripcion)}
                        </Typography>
                        <Chip
                          label={p.validado ? 'Validado' : 'Pendiente'}
                          color={p.validado ? 'success' : 'warning'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
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
          <Button onClick={handleCerrarParticipantes} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal de Detalles del Evento ── */}
      <Dialog open={modalEventoOpen} onClose={handleCerrarEvento} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: BURGUNDY, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              📋 Detalles del Evento
            </Typography>
            <IconButton onClick={handleCerrarEvento} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          {eventoSeleccionado?.convocatoriaSeleccionada && (
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
              {obtenerNombreDisciplina(eventoSeleccionado.convocatoriaSeleccionada.disciplina)} - {obtenerNombreCategoria(eventoSeleccionado.convocatoriaSeleccionada.categoria)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {eventoSeleccionado && (
            <Box>
              <Typography variant="h5" sx={{ color: BURGUNDY, fontWeight: 700, mb: 2 }}>
                {eventoSeleccionado.titulo}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BURGUNDY }}>📅 Información General</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Fecha:</strong> {formatearFecha(eventoSeleccionado.fecha)}</Typography>
                  <Typography variant="body2"><strong>Hora:</strong> {eventoSeleccionado.hora || 'No especificada'}</Typography>
                  <Typography variant="body2"><strong>Lugar:</strong> {eventoSeleccionado.lugar}</Typography>
                  <Typography variant="body2">
                    <strong>Estado:</strong>{' '}
                    <Chip
                      label={obtenerTextoEstado(eventoSeleccionado.estado)}
                      color={obtenerColorEstado(eventoSeleccionado.estado)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BURGUNDY }}>🏃 Información Deportiva</Typography>
                  {eventoSeleccionado.convocatoriaSeleccionada ? (
                    <>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Disciplina:</strong> {obtenerNombreDisciplina(eventoSeleccionado.convocatoriaSeleccionada.disciplina)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Categoría:</strong> {obtenerNombreCategoria(eventoSeleccionado.convocatoriaSeleccionada.categoria)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Edad:</strong> {eventoSeleccionado.convocatoriaSeleccionada.edadMin || '?'} - {eventoSeleccionado.convocatoriaSeleccionada.edadMax || '?'} años
                      </Typography>
                      <Typography variant="body2">
                        <strong>Género:</strong> {eventoSeleccionado.convocatoriaSeleccionada.genero === 'mixto' ? 'Mixto' :
                                                     eventoSeleccionado.convocatoriaSeleccionada.genero === 'masculino' ? 'Masculino' :
                                                     eventoSeleccionado.convocatoriaSeleccionada.genero === 'femenino' ? 'Femenino' : 'N/A'}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ mt: 1 }}><strong>Disciplina:</strong> {obtenerNombreDisciplina(eventoSeleccionado.disciplina)}</Typography>
                      <Typography variant="body2"><strong>Categoría:</strong> {obtenerNombreCategoria(eventoSeleccionado.categoria)}</Typography>
                      <Typography variant="body2"><strong>Edad:</strong> {eventoSeleccionado.edadMin || 'N/A'} - {eventoSeleccionado.edadMax || 'N/A'} años</Typography>
                      <Typography variant="body2"><strong>Género:</strong> {eventoSeleccionado.genero || 'N/A'}</Typography>
                    </>
                  )}
                </Box>
              </Box>

              {eventoSeleccionado.descripcion && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BURGUNDY }}>📝 Descripción</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>{eventoSeleccionado.descripcion}</Typography>
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BURGUNDY }}>📊 Información Técnica</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>ID:</strong> {eventoSeleccionado._id || eventoSeleccionado.id}</Typography>
                <Typography variant="body2"><strong>Creación:</strong> {formatearFecha(eventoSeleccionado.createdAt)}</Typography>
                {eventoSeleccionado.fechaCierre && (
                  <Typography variant="body2"><strong>Cierre:</strong> {formatearFecha(eventoSeleccionado.fechaCierre)}</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarEvento} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Eventos;