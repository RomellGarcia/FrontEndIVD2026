import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
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
  TableRow
} from '@mui/material';
import {
  Event as EventIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const Eventos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      const response = await axios.get('http://localhost:5000/api/eventos');
      // Filtrar solo eventos futuros o próximos
      const eventosFuturos = response.data.filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        const fechaActual = new Date();
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
      // Obtener participantes del club en esta convocatoria específica
              const response = await axios.get(`http://localhost:5000/api/eventos/${evento.id}/participantes&convocatoriaIndex=${index}&clubId=${user.id}`);
      setParticipantesClub(response.data);
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
      if (isNaN(fechaObj.getTime())) {
        return 'N/A';
      }
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'cancelado': return 'Cancelado';
      case 'finalizado': return 'Finalizado';
      case 'pendiente': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'activo': return 'success';
      case 'cancelado': return 'error';
      case 'finalizado': return 'default';
      case 'pendiente': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        Eventos Próximos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, borderRadius: '12px', background: '#FFFFFF', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon sx={{ color: '#800020' }} />
            <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
              Todos los Eventos Disponibles
            </Typography>
            {eventos.length > 0 && (
              <Chip 
                label={eventos.length} 
                color="primary" 
                size="small"
              />
            )}
          </Box>
        </Box>

        {eventos.length === 0 ? (
          <Alert severity="info">
            No hay eventos próximos disponibles en este momento.
          </Alert>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Evento</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Lugar</strong></TableCell>
                <TableCell><strong>Convocatorias</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eventos.map((evento) => (
                <TableRow key={evento._id}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#800020' }}>
                      {evento.titulo}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatearFecha(evento.fecha || evento.createdAt)}</TableCell>
                  <TableCell>{evento.lugar}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      onClick={() => handleVerConvocatorias(evento)}
                      startIcon={<PeopleIcon />}
                      size="small"
                      sx={{
                        color: '#800020',
                        borderColor: '#800020',
                        '&:hover': {
                          borderColor: '#800020',
                          backgroundColor: 'rgba(128, 0, 32, 0.04)'
                        }
                      }}
                    >
                      Ver Convocatorias ({evento.convocatorias ? evento.convocatorias.length : 0})
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Modal de Convocatorias */}
      <Dialog open={modalConvocatoriasOpen} onClose={handleCerrarConvocatorias} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            🎯 Convocatorias del Evento: {eventoConvocatorias?.titulo}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {eventoConvocatorias && eventoConvocatorias.convocatorias ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Disciplina</strong></TableCell>
                  <TableCell><strong>Categoría</strong></TableCell>
                  <TableCell><strong>Rango de Edad</strong></TableCell>
                  <TableCell><strong>Género</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eventoConvocatorias.convocatorias.map((convocatoria, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {convocatoria.disciplina}
                      </Typography>
                    </TableCell>
                    <TableCell>{convocatoria.categoria}</TableCell>
                    <TableCell>{convocatoria.edadMin} - {convocatoria.edadMax} años</TableCell>
                    <TableCell>
                      <Chip 
                        label={convocatoria.genero === 'mixto' ? 'Mixto' : 
                               convocatoria.genero === 'masculino' ? 'Masculino' : 'Femenino'} 
                        color={convocatoria.genero === 'mixto' ? 'default' : 
                               convocatoria.genero === 'masculino' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={obtenerTextoEstado(eventoConvocatorias.estado)} 
                        color={obtenerColorEstado(eventoConvocatorias.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVerEventoConvocatoria(eventoConvocatorias, convocatoria, index)}
                          color="primary"
                          title="Ver detalles de la convocatoria"
                          sx={{ color: '#800020' }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVerParticipantesConvocatoria(eventoConvocatorias, convocatoria, index)}
                          color="secondary"
                          title="Ver participantes del club en esta convocatoria"
                          sx={{ color: '#7A4069' }}
                        >
                          <PeopleIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              No hay convocatorias para este evento.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarConvocatorias} sx={{ color: '#7A4069' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Participantes del Club */}
      <Dialog open={modalParticipantesOpen} onClose={handleCerrarParticipantes} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            👥 Participantes del Club en "{eventoSeleccionado?.titulo}"
            {eventoSeleccionado?.convocatoriaSeleccionada && (
              <Typography variant="subtitle2" sx={{ color: '#800020', mt: 1 }}>
                Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingParticipantes ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={40} sx={{ color: '#800020' }} />
            </Box>
          ) : participantesClub.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: '#7A4069' }}>
              No hay atletas de tu club inscritos en esta convocatoria.
            </Typography>
          ) : (
            <List>
              {participantesClub.map((participante, idx) => (
                <ListItem key={idx} divider>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ color: '#800020', fontWeight: 'bold' }}>
                        {participante.datosAtleta?.nombreCompleto || 'Nombre no disponible'}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#7A4069' }}>
                          <strong>Edad:</strong> {participante.datosAtleta?.edad || 'N/A'} años
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#7A4069' }}>
                          <strong>Género:</strong> {participante.datosAtleta?.genero || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#7A4069' }}>
                          <strong>Fecha de Inscripción:</strong> {formatearFecha(participante.fechaInscripcion)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#7A4069' }}>
                          <strong>Estado:</strong> 
                          <Chip 
                            label={participante.validado ? 'Validado' : 'Pendiente'} 
                            color={participante.validado ? 'success' : 'warning'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarParticipantes} sx={{ color: '#7A4069' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalles del Evento */}
      <Dialog open={modalEventoOpen} onClose={handleCerrarEvento} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            📋 Detalles del Evento
            {eventoSeleccionado?.convocatoriaSeleccionada && (
              <Typography variant="subtitle2" sx={{ color: '#800020', mt: 1 }}>
                Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {eventoSeleccionado && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ color: '#800020' }}>
                    {eventoSeleccionado.titulo}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>📅 Información General</Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Fecha:</strong> {formatearFecha(eventoSeleccionado.fecha || eventoSeleccionado.createdAt)}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Hora:</strong> {eventoSeleccionado.hora}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Lugar:</strong> {eventoSeleccionado.lugar}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Estado:</strong> 
                        <Chip 
                          label={obtenerTextoEstado(eventoSeleccionado.estado)} 
                          color={obtenerColorEstado(eventoSeleccionado.estado)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>🏃 Información Deportiva</Typography>
                      {eventoSeleccionado.convocatoriaSeleccionada ? (
                        <>
                          <Typography variant="body2" paragraph>
                            <strong>Disciplina:</strong> {eventoSeleccionado.convocatoriaSeleccionada.disciplina}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Categoría:</strong> {eventoSeleccionado.convocatoriaSeleccionada.categoria}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Rango de Edad:</strong> {eventoSeleccionado.convocatoriaSeleccionada.edadMin} - {eventoSeleccionado.convocatoriaSeleccionada.edadMax} años
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Género:</strong> {eventoSeleccionado.convocatoriaSeleccionada.genero === 'mixto' ? 'Mixto' : 
                                                      eventoSeleccionado.convocatoriaSeleccionada.genero === 'masculino' ? 'Masculino' : 'Femenino'}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" paragraph>
                            <strong>Disciplina:</strong> {eventoSeleccionado.disciplina || 'No especificada'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Categoría:</strong> {eventoSeleccionado.categoria || 'No especificada'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Rango de Edad:</strong> {eventoSeleccionado.edadMin || 'N/A'} - {eventoSeleccionado.edadMax || 'N/A'} años
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Género:</strong> {eventoSeleccionado.genero || 'No especificado'}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {eventoSeleccionado.descripcion && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>📝 Descripción</Typography>
                        <Typography variant="body2">
                          {eventoSeleccionado.descripcion}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>📊 Información Técnica</Typography>
                      <Typography variant="body2" paragraph>
                        <strong>ID del Evento:</strong> {eventoSeleccionado._id}
                      </Typography>
                      {eventoSeleccionado.convocatoriaSeleccionada && (
                        <Typography variant="body2" paragraph>
                          <strong>Índice de la Convocatoria:</strong> {eventoSeleccionado.convocatoriaIndex !== undefined ? eventoSeleccionado.convocatoriaIndex + 1 : 'N/A'}
                        </Typography>
                      )}
                      <Typography variant="body2" paragraph>
                        <strong>Fecha de Creación:</strong> {formatearFecha(eventoSeleccionado.createdAt)}
                      </Typography>
                      {eventoSeleccionado.fechaCierre && (
                        <Typography variant="body2" paragraph>
                          <strong>Fecha de Cierre:</strong> {formatearFecha(eventoSeleccionado.fechaCierre)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarEvento} sx={{ color: '#7A4069' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Eventos;