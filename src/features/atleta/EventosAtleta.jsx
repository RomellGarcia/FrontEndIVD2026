import { eventosAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const EventosAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalEventoOpen, setModalEventoOpen] = useState(false);
  const [modalConvocatoriasOpen, setModalConvocatoriasOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [eventoConvocatorias, setEventoConvocatorias] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar eventos al montar el componente
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchEventos();
      fetchInscripciones();
    }
  }, [user, navigate]);

  const fetchEventos = async () => {
    try {
      setLoading(true)
      const response = await eventosAPI.getAll()
      const fechaActual = new Date()
      const todos = response.data.eventos || []
      setEventos(todos.filter(e => new Date(e.fecha) > fechaActual))
    } catch (error) {
      setErrorMessage('Error al cargar los eventos.')
    } finally {
      setLoading(false)
    }
  }

  const fetchInscripciones = async () => {
    try {
      const response = await eventosAPI.getMisInscripciones()
      setInscripciones(response.data.inscripciones || [])
    } catch (error) {
      console.error('Error al obtener inscripciones:', error)
    }
  }


  const handleVerConvocatorias = (evento) => {
    setEventoConvocatorias(evento);
    setModalConvocatoriasOpen(true);
  };

  const handleVerEventoConvocatoria = (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalEventoOpen(true);
  };

  const handleCloseModalEvento = () => {
    setModalEventoOpen(false);
    setTimeout(() => {
      setEventoSeleccionado(null);
    }, 100);
  };

  const handleCerrarConvocatorias = () => {
    setModalConvocatoriasOpen(false);
    setEventoConvocatorias(null);
  };

  const handleInscribirse = async (convocatoriaId) => {
    try {
      setInscribiendo(true)
      await eventosAPI.inscribir({ convocatoria_id: convocatoriaId })
      setSnackbar({ open: true, message: '¡Inscripción exitosa!', severity: 'success' })
      await fetchInscripciones()
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error al inscribirse.', severity: 'error' })
    } finally {
      setInscribiendo(false)
    }
  }

  const isInscrito = (convocatoriaId) => {
    return inscripciones.some(i => i.convocatoria_id === convocatoriaId)
  }

  const isConvocatoriaCerrada = (evento) => {
    const fechaActual = new Date();
    const fechaCierre = new Date(evento.fechaCierre);
    return fechaActual > fechaCierre;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  if (loading) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#F5E8C7', width: '100%' }}>
      <CircularProgress size={60} sx={{ color: '#800020' }} />
    </Box>
  );
}

  return (
    // DESPUÉS:
    <Box sx={{ bgcolor: '#F5E8C7', minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
          Próximos Eventos
        </Typography>

        {errorMessage && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          </Box>
        )}

        <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}>
          <Table sx={{ minWidth: 650 }} aria-label="eventos atleta table">
            <TableHead>
              <TableRow>
                {['Fecha', 'Título', 'Lugar', 'Convocatorias'].map((head) => (
                  <TableCell
                    key={head}
                    sx={{ fontWeight: 'bold', color: '#800020', fontSize: '1rem', padding: '16px' }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {eventos.map((evento) => {
                const inscrito = isInscrito(evento._id);
                const convocatoriaCerrada = isConvocatoriaCerrada(evento);

                return (
                  <TableRow
                    key={evento._id || evento.id}
                    sx={{ '&:hover': { backgroundColor: '#FAFAFF' }, transition: 'background-color 0.3s' }}
                  >
                    <TableCell sx={{ color: '#333333' }}>
                      {evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </TableCell>
                    <TableCell sx={{ color: '#333333', fontWeight: 'bold' }}>{evento.titulo || 'Sin título'}</TableCell>
                    <TableCell sx={{ color: '#333333' }}>{evento.lugar || 'Sin lugar'}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </Paper>

        {eventos.length === 0 && !errorMessage && (
          <Typography variant="body1" align="center" sx={{ mt: 2, color: '#7A4069' }}>
            No hay eventos disponibles.
          </Typography>
        )}

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
                  {eventoConvocatorias.convocatorias.map((convocatoria, index) => {
                    const inscrito = isInscrito(eventoConvocatorias._id);
                    const convocatoriaCerrada = isConvocatoriaCerrada(eventoConvocatorias);

                    return (
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
                          {inscrito ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Inscrito"
                              color="success"
                              size="small"
                            />
                          ) : convocatoriaCerrada ? (
                            <Chip
                              label="Cerrada"
                              color="error"
                              size="small"
                            />
                          ) : (
                            <Chip
                              label="Abierta"
                              color="primary"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              color="primary"
                              onClick={() => handleVerEventoConvocatoria(eventoConvocatorias, convocatoria, index)}
                              sx={{ '&:hover': { backgroundColor: 'rgba(128, 0, 32, 0.1)' } }}
                              title="Ver detalles de la convocatoria"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

        {/* Modal de Detalles del Evento */}
        <Dialog open={modalEventoOpen} onClose={handleCloseModalEvento} maxWidth="md" fullWidth>
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
                        <Typography variant="body2" paragraph>
                          <strong>Fecha de Cierre:</strong> {formatearFecha(eventoSeleccionado.fechaCierre)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModalEvento} color="primary">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
      </Box>
      );
};

      export default EventosAtleta;