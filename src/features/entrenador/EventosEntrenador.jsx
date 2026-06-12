import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { 
  CircularProgress, 
  Typography, 
  Button, 
  Box, 
  Card, 
  CardContent, 
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Container
} from '@mui/material';
import { CalendarToday as CalendarIcon, LocationOn as LocationIcon, Sports as SportsIcon } from '@mui/icons-material';

const EventosEntrenador = () => {
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [modalParticipantesOpen, setModalParticipantesOpen] = useState(false);
  const [modalEventoOpen, setModalEventoOpen] = useState(false);
  const [modalConvocatoriasOpen, setModalConvocatoriasOpen] = useState(false);
  const [participantes, setParticipantes] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [eventoConvocatorias, setEventoConvocatorias] = useState(null);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);

  // Cargar eventos al montar el componente
  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setLoadingEventos(true);
      const response = await axios.get('http://localhost:5000/api/eventos');
      setEventos(response.data || []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los eventos'
      });
    } finally {
      setLoadingEventos(false);
    }
  };

  const handleVerConvocatorias = (evento) => {
    setEventoConvocatorias(evento);
    setModalConvocatoriasOpen(true);
  };

  const handleVerParticipantesConvocatoria = async (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalParticipantesOpen(true);
    setLoadingParticipantes(true);
    try {
              const response = await axios.get(`http://localhost:5000/api/eventos/${evento.id}/participantes&convocatoriaIndex=${index}`);
      setParticipantes(response.data);
    } catch (error) {
      setParticipantes([]);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  const handleVerEventoConvocatoria = (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalEventoOpen(true);
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

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'activo': return 'success';
      case 'cerrado': return 'error';
      case 'finalizado': return 'default';
      default: return 'primary';
    }
  };

  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'cerrado': return 'Cerrado';
      case 'finalizado': return 'Finalizado';
      default: return 'Desconocido';
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
          }
        `}
      </style>
      <Container maxWidth="xl" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#800020', fontWeight: 'bold', mb: 2 }}>
            Eventos Disponibles
          </Typography>
          <Typography variant="h6" sx={{ color: '#7A4069', mb: 3 }}>
            Revisa los eventos disponibles y sus participantes
          </Typography>
        </Box>

        {/* Lista de eventos */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
            📋 Eventos Disponibles
          </Typography>
          
          {loadingEventos ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={60} sx={{ color: '#800020' }} />
            </Box>
          ) : eventos.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: '#7A4069' }}>
              No hay eventos disponibles en este momento.
            </Typography>
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
                            title="Ver participantes de esta convocatoria"
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

        {/* Modal de Participantes */}
        <Dialog open={modalParticipantesOpen} onClose={handleCerrarParticipantes} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: '#800020', fontWeight: 'bold' }}>
            👥 Participantes de "{eventoSeleccionado?.titulo}"
            {eventoSeleccionado?.convocatoriaSeleccionada && (
              <Typography variant="subtitle2" sx={{ color: '#800020', mt: 1 }}>
                Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {loadingParticipantes ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={40} sx={{ color: '#800020' }} />
              </Box>
            ) : participantes.length === 0 ? (
              <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: '#7A4069' }}>
                No hay participantes inscritos en esta convocatoria.
              </Typography>
            ) : (
              <List>
                {participantes.map((p, idx) => (
                  <ListItem key={idx} divider>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ color: '#800020', fontWeight: 'bold' }}>
                          {p.datosAtleta?.nombreCompleto || 'Nombre no disponible'}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ color: '#7A4069' }}>
                            <strong>Edad:</strong> {p.datosAtleta?.edad || 'N/A'} años
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#7A4069' }}>
                            <strong>Género:</strong> {p.datosAtleta?.genero || 'N/A'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#7A4069' }}>
                            <strong>Fecha de Inscripción:</strong> {formatearFecha(p.fechaInscripcion)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#7A4069' }}>
                            <strong>Estado:</strong> 
                            <Chip 
                              label={p.validado ? 'Validado' : 'Pendiente'} 
                              color={p.validado ? 'success' : 'warning'}
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
                    <Card variant="outlined" sx={{ borderColor: '#800020' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#800020' }}>
                          📅 Información General
                        </Typography>
                        <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                          <strong>Fecha:</strong> {formatearFecha(eventoSeleccionado.fecha || eventoSeleccionado.createdAt)}
                        </Typography>
                        <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                          <strong>Hora:</strong> {eventoSeleccionado.hora}
                        </Typography>
                        <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                          <strong>Lugar:</strong> {eventoSeleccionado.lugar}
                        </Typography>
                        <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
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
                    <Card variant="outlined" sx={{ borderColor: '#800020' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#800020' }}>
                          🏃 Información Deportiva
                        </Typography>
                        {eventoSeleccionado.convocatoriaSeleccionada ? (
                          <>
                            <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                              <strong>Disciplina:</strong> {eventoSeleccionado.convocatoriaSeleccionada.disciplina}
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                              <strong>Categoría:</strong> {eventoSeleccionado.convocatoriaSeleccionada.categoria}
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                              <strong>Rango de Edad:</strong> {eventoSeleccionado.convocatoriaSeleccionada.edadMin} - {eventoSeleccionado.convocatoriaSeleccionada.edadMax} años
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                              <strong>Género:</strong> {eventoSeleccionado.convocatoriaSeleccionada.genero === 'mixto' ? 'Mixto' : 
                                                        eventoSeleccionado.convocatoriaSeleccionada.genero === 'masculino' ? 'Masculino' : 'Femenino'}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                              <strong>Disciplina:</strong> {eventoSeleccionado.disciplina || 'No especificada'}
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                              <strong>Categoría:</strong> {eventoSeleccionado.categoria || 'No especificada'}
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                              <strong>Rango de Edad:</strong> {eventoSeleccionado.edadMin || 'N/A'} - {eventoSeleccionado.edadMax || 'N/A'} años
                            </Typography>
                            <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                              <strong>Género:</strong> {eventoSeleccionado.genero || 'No especificado'}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {eventoSeleccionado.descripcion && (
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ borderColor: '#800020' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ color: '#800020' }}>
                            📝 Descripción
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#7A4069' }}>
                            {eventoSeleccionado.descripcion}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ borderColor: '#800020' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#800020' }}>
                          📊 Información Técnica
                        </Typography>
                        <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                          <strong>ID del Evento:</strong> {eventoSeleccionado._id}
                        </Typography>
                        {eventoSeleccionado.convocatoriaSeleccionada && (
                          <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                            <strong>Índice de la Convocatoria:</strong> {eventoSeleccionado.convocatoriaIndex !== undefined ? eventoSeleccionado.convocatoriaIndex + 1 : 'N/A'}
                          </Typography>
                        )}
                        <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
                          <strong>Fecha de Creación:</strong> {formatearFecha(eventoSeleccionado.createdAt)}
                        </Typography>
                        {eventoSeleccionado.fechaCierre && (
                          <Typography variant="body2" paragraph sx={{ color: '#7A4069' }}>
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
    </>
  );
};

export default EventosEntrenador;
