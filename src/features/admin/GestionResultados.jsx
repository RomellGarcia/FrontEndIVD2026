import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button, 
  Alert, CircularProgress, Chip, Avatar, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Divider
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon, Add as AddIcon, Edit as EditIcon,
  Delete as DeleteIcon, Visibility as VisibilityIcon, Save as SaveIcon,
  Cancel as CancelIcon, Person as PersonIcon, Group as GroupIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import Swal from 'sweetalert2';

const GestionResultados = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [modalResultadoOpen, setModalResultadoOpen] = useState(false);
  const [modalVerResultadoOpen, setModalVerResultadoOpen] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado del formulario de resultado
  const [formData, setFormData] = useState({
    eventoId: '',
    convocatoriaIndex: 0,
    atletaId: '',
    categoria: '',
    sexo: '',
    municipio: '',
    club: '',
    añoCompetitivo: new Date().getFullYear(),
    pruebas: [
      { nombre: '', marca: '', unidad: 'segundos' },
      { nombre: '', marca: '', unidad: 'metros' },
      { nombre: '', marca: '', unidad: 'segundos' },
      { nombre: '', marca: '', unidad: 'metros' }
    ],
    entrenadorId: '',
    lugarEntrenamiento: ''
  });

  // Datos de referencia
  const [atletas, setAtletas] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [clubes, setClubes] = useState([]);

  const categorias = [
    'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18', 
    'Sub-20', 'Sub-23', 'Mayor', 'Máster'
  ];

  const unidades = ['segundos', 'metros', 'minutos', 'centímetros', 'kilómetros'];

  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user]);

  const cargarDatos = async () => {
  try {
    setLoading(true);

    const eventosRes = await axios.get('http://localhost:5000/api/eventos');
    setEventos(Array.isArray(eventosRes.data) ? eventosRes.data : (eventosRes.data?.eventos || []));

    const resultadosRes = await axios.get('http://localhost:5000/api/resultados');
    setResultados(Array.isArray(resultadosRes.data) ? resultadosRes.data : (resultadosRes.data?.resultados || []));

    const atletasRes = await axios.get('http://localhost:5000/api/atletas');
    setAtletas(Array.isArray(atletasRes.data) ? atletasRes.data : (atletasRes.data?.atletas || []));

    const entrenadoresRes = { data: { entrenadores: [] } }; // TODO: endpoint de entrenadores global
    setEntrenadores(Array.isArray(entrenadoresRes.data) ? entrenadoresRes.data : (entrenadoresRes.data?.entrenadores || []));

    const clubesRes = await axios.get('http://localhost:5000/api/clubes');
    setClubes(Array.isArray(clubesRes.data) ? clubesRes.data : (clubesRes.data?.clubes || []));

  } catch (error) {
    console.error('Error al cargar datos:', error);
    setError('Error al cargar los datos');
    setEventos([]);
    setResultados([]);
    setAtletas([]);
    setEntrenadores([]);
    setClubes([]);
  } finally {
    setLoading(false);
  }
};
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePruebaChange = (index, field, value) => {
    const nuevasPruebas = [...formData.pruebas];
    nuevasPruebas[index] = { ...nuevasPruebas[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      pruebas: nuevasPruebas
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validaciones
      if (!formData.eventoId || !formData.atletaId) {
        setError('Evento y atleta son obligatorios');
        return;
      }

      if (editMode && resultadoSeleccionado) {
        // Actualizar resultado existente
        await axios.put(`http://localhost:5000/api/resultados/${resultadoSeleccionado._id}`, formData);
        setSuccess('Resultado actualizado correctamente');
      } else {
        // Crear nuevo resultado
                  await axios.post('http://localhost:5000/api/resultados', formData);
        setSuccess('Resultado creado correctamente');
      }

      // Recargar datos y cerrar modal
      await cargarDatos();
      handleCloseModal();
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: editMode ? 'Resultado actualizado correctamente' : 'Resultado creado correctamente',
        confirmButtonColor: '#800020'
      });
      
    } catch (error) {
      console.error('Error al guardar resultado:', error);
      setError(`Error al guardar: ${error.response?.data?.message || error.message}`);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al guardar: ${error.response?.data?.message || error.message}`,
        confirmButtonColor: '#800020'
      });
    }
  };

  const handleEdit = (resultado) => {
    setResultadoSeleccionado(resultado);
    setFormData({
      eventoId: resultado.eventoId,
      convocatoriaIndex: resultado.convocatoriaIndex,
      atletaId: resultado.atletaId,
      categoria: resultado.categoria,
      sexo: resultado.sexo,
      municipio: resultado.municipio,
      club: resultado.club,
      añoCompetitivo: resultado.añoCompetitivo,
      pruebas: resultado.pruebas || [
        { nombre: '', marca: '', unidad: 'segundos' },
        { nombre: '', marca: '', unidad: 'metros' },
        { nombre: '', marca: '', unidad: 'segundos' },
        { nombre: '', marca: '', unidad: 'metros' }
      ],
      entrenadorId: resultado.entrenadorId || '',
      lugarEntrenamiento: resultado.lugarEntrenamiento || ''
    });
    setEditMode(true);
    setModalResultadoOpen(true);
  };

  const handleDelete = async (resultadoId) => {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/resultados/${resultadoId}`);
        await cargarDatos();
        setSuccess('Resultado eliminado correctamente');
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Resultado eliminado correctamente',
          confirmButtonColor: '#800020'
        });
      } catch (error) {
        console.error('Error al eliminar:', error);
        setError('Error al eliminar el resultado');
      }
    }
  };

  const handleVerResultado = (resultado) => {
    setResultadoSeleccionado(resultado);
    setModalVerResultadoOpen(true);
  };

  const handleCloseModal = () => {
    setModalResultadoOpen(false);
    setModalVerResultadoOpen(false);
    setResultadoSeleccionado(null);
    setEditMode(false);
    setFormData({
      eventoId: '',
      convocatoriaIndex: 0,
      atletaId: '',
      categoria: '',
      sexo: '',
      municipio: '',
      club: '',
      añoCompetitivo: new Date().getFullYear(),
      pruebas: [
        { nombre: '', marca: '', unidad: 'segundos' },
        { nombre: '', marca: '', unidad: 'metros' },
        { nombre: '', marca: '', unidad: 'segundos' },
        { nombre: '', marca: '', unidad: 'metros' }
      ],
      entrenadorId: '',
      lugarEntrenamiento: ''
    });
    setError('');
    setSuccess('');
  };

  const obtenerNombreEvento = (eventoId) => {
    const evento = eventos.find(e => e._id === eventoId);
    return evento ? evento.titulo : 'Evento no encontrado';
  };

  const obtenerNombreAtleta = (atletaId) => {
    const atleta = atletas.find(a => a._id === atletaId);
    if (!atleta) return 'Atleta no encontrado';
    return `${atleta.nombre} ${atleta.apellidopa} ${atleta.apellidoma}`;
  };

  const obtenerNombreEntrenador = (entrenadorId) => {
    if (!entrenadorId) return 'Independiente';
    const entrenador = entrenadores.find(e => e._id === entrenadorId);
    return entrenador ? `${entrenador.nombre} ${entrenador.apellidopa} ${entrenador.apellidoma}` : 'No encontrado';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, background: '#e4e4e5', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        Gestión de Resultados
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
          </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
          </Alert>
      )}

      {/* Botón para agregar nuevo resultado */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalResultadoOpen(true)}
          sx={{
            backgroundColor: '#800020',
            '&:hover': { backgroundColor: '#600018' }
          }}
        >
          Agregar Nuevo Resultado
        </Button>
      </Box>

      {/* Lista de resultados existentes */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', mb: 3 }}>
          Resultados Registrados ({resultados.length})
        </Typography>
        
        {resultados.length === 0 ? (
          <Alert severity="info">
            No hay resultados registrados. Agrega el primer resultado de un evento.
          </Alert>
        ) : (
        <Table>
          <TableHead>
            <TableRow>
                <TableCell><strong>Evento</strong></TableCell>
                <TableCell><strong>Atleta</strong></TableCell>
                <TableCell><strong>Categoría</strong></TableCell>
                <TableCell><strong>Club</strong></TableCell>
                <TableCell><strong>Año</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
              {resultados.map((resultado) => (
                <TableRow key={resultado._id}>
                <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {obtenerNombreEvento(resultado.eventoId)}
                    </Typography>
                </TableCell>
                  <TableCell>{obtenerNombreAtleta(resultado.atletaId)}</TableCell>
                <TableCell>
                    <Chip label={resultado.categoria} color="primary" size="small" />
                </TableCell>
                  <TableCell>{resultado.club || 'Independiente'}</TableCell>
                  <TableCell>{resultado.añoCompetitivo}</TableCell>
                <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleVerResultado(resultado)}
                        color="primary"
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(resultado)}
                        color="secondary"
                        title="Editar"
                      >
                    <EditIcon />
                  </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(resultado._id)}
                        color="error"
                        title="Eliminar"
                      >
                    <DeleteIcon />
                  </IconButton>
                    </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </Paper>

      {/* Modal para crear/editar resultado */}
      <Dialog open={modalResultadoOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
            <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            {editMode ? 'Editar Resultado' : 'Nuevo Resultado'}
            </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Selección de evento y convocatoria */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Evento</InputLabel>
                <Select
                  name="eventoId"
                  value={formData.eventoId}
                  onChange={handleInputChange}
                  label="Evento"
                >
                  {eventos.map((evento) => (
                    <MenuItem key={evento._id} value={evento._id}>
                      {evento.titulo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Índice de Convocatoria"
                name="convocatoriaIndex"
                type="number"
                value={formData.convocatoriaIndex}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Selección de atleta */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Atleta</InputLabel>
                <Select
                  name="atletaId"
                  value={formData.atletaId}
                  onChange={handleInputChange}
                  label="Atleta"
                >
                  {atletas.map((atleta) => (
                    <MenuItem key={atleta._id} value={atleta._id}>
                      {`${atleta.nombre} ${atleta.apellidopa} ${atleta.apellidoma}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Categoría y sexo */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Categoría</InputLabel>
                <Select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  label="Categoría"
                >
                  {categorias.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Sexo</InputLabel>
                <Select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputChange}
                  label="Sexo"
                >
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                  <MenuItem value="mixto">Mixto</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Municipio y club */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Municipio"
                name="municipio"
                value={formData.municipio}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Club</InputLabel>
                <Select
                  name="club"
                  value={formData.club}
                  onChange={handleInputChange}
                  label="Club"
                >
                  <MenuItem value="">Independiente</MenuItem>
                  {clubes.map((club) => (
                    <MenuItem key={club._id} value={club.nombre}>
                      {club.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Año competitivo */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Año Competitivo"
                name="añoCompetitivo"
                type="number"
                value={formData.añoCompetitivo}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                inputProps={{ min: 2020, max: 2030 }}
              />
            </Grid>

            {/* Entrenador */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Entrenador</InputLabel>
                <Select
                  name="entrenadorId"
                  value={formData.entrenadorId}
                  onChange={handleInputChange}
                  label="Entrenador"
                >
                  <MenuItem value="">Independiente</MenuItem>
                  {entrenadores.map((entrenador) => (
                    <MenuItem key={entrenador._id} value={entrenador._id}>
                      {`${entrenador.nombre} ${entrenador.apellidopa} ${entrenador.apellidoma}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Lugar de entrenamiento */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Lugar de Entrenamiento"
                name="lugarEntrenamiento"
                value={formData.lugarEntrenamiento}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Pruebas */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: '#7A4069', fontWeight: 'bold', mb: 2 }}>
                Pruebas y Marcas
              </Typography>
              <Grid container spacing={2}>
                {formData.pruebas.map((prueba, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#800020' }}>
                        Prueba {index + 1}
                      </Typography>
              <TextField
                fullWidth
                        label="Nombre de la Prueba"
                        value={prueba.nombre}
                        onChange={(e) => handlePruebaChange(index, 'nombre', e.target.value)}
                        sx={{ mb: 1 }}
                        size="small"
                      />
                      <Grid container spacing={1}>
                        <Grid item xs={8}>
              <TextField
                fullWidth
                label="Marca"
                            value={prueba.marca}
                            onChange={(e) => handlePruebaChange(index, 'marca', e.target.value)}
                            size="small"
              />
            </Grid>
                        <Grid item xs={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Unidad</InputLabel>
                            <Select
                              value={prueba.unidad}
                              onChange={(e) => handlePruebaChange(index, 'unidad', e.target.value)}
                              label="Unidad"
                            >
                              {unidades.map((unidad) => (
                                <MenuItem key={unidad} value={unidad}>{unidad}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} sx={{ color: '#7A4069' }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
            startIcon={<SaveIcon />}
            sx={{ backgroundColor: '#800020' }}
          >
            {editMode ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver resultado */}
      <Dialog open={modalVerResultadoOpen} onClose={() => setModalVerResultadoOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Detalles del Resultado
          </Typography>
        </DialogTitle>
        <DialogContent>
          {resultadoSeleccionado && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069' }}>
                  Evento:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {obtenerNombreEvento(resultadoSeleccionado.eventoId)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069' }}>
                  Atleta:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {obtenerNombreAtleta(resultadoSeleccionado.atletaId)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069' }}>
                  Categoría:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {resultadoSeleccionado.categoria}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069' }}>
                  Club:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {resultadoSeleccionado.club || 'Independiente'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069' }}>
                  Entrenador:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {obtenerNombreEntrenador(resultadoSeleccionado.entrenadorId)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069' }}>
                  Lugar de Entrenamiento:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {resultadoSeleccionado.lugarEntrenamiento || 'No especificado'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', mb: 2 }}>
                  Pruebas y Marcas
                </Typography>
                <Grid container spacing={2}>
                  {resultadoSeleccionado.pruebas?.map((prueba, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#7A4069' }}>
                          Prueba {index + 1}: {prueba.nombre}
                        </Typography>
                        <Typography variant="body1">
                          Marca: {prueba.marca} {prueba.unidad}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalVerResultadoOpen(false)} sx={{ color: '#7A4069' }}>
            Cerrar
            </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionResultados; 