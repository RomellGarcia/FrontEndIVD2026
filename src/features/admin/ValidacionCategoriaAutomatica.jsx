import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixHighIcon,
  Person as PersonIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';

const ValidacionCategoriaAutomatica = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [atletas, setAtletas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [validaciones, setValidaciones] = useState([]);
  const [filtroEvento, setFiltroEvento] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);

  // Configuración de categorías por edad y género
  const categoriasConfig = {
    masculino: {
      'Infantil A': { min: 6, max: 8 },
      'Infantil B': { min: 9, max: 10 },
      'Infantil C': { min: 11, max: 12 },
      'Juvenil A': { min: 13, max: 14 },
      'Juvenil B': { min: 15, max: 16 },
      'Juvenil C': { min: 17, max: 18 },
      'Mayor': { min: 19, max: 35 },
      'Veterano A': { min: 36, max: 45 },
      'Veterano B': { min: 46, max: 55 },
      'Veterano C': { min: 56, max: 100 }
    },
    femenino: {
      'Infantil A': { min: 6, max: 8 },
      'Infantil B': { min: 9, max: 10 },
      'Infantil C': { min: 11, max: 12 },
      'Juvenil A': { min: 13, max: 14 },
      'Juvenil B': { min: 15, max: 16 },
      'Juvenil C': { min: 17, max: 18 },
      'Mayor': { min: 19, max: 35 },
      'Veterano A': { min: 36, max: 45 },
      'Veterano B': { min: 46, max: 55 },
      'Veterano C': { min: 56, max: 100 }
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar atletas
      const atletasRes = await axios.get('http://localhost:5000/api/atletas');
      setAtletas(atletasRes.data);
      
      // Cargar eventos
      const eventosRes = await axios.get('http://localhost:5000/api/eventos');
      setEventos(eventosRes.data);
      
      // Cargar inscripciones
      const inscripcionesRes = await axios.get('http://localhost:5000/api/eventos/inscripciones');
      setInscripciones(inscripcionesRes.data);
      
      // Realizar validaciones automáticas
      realizarValidaciones(atletasRes.data, inscripcionesRes.data);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos para validación');
    } finally {
      setLoading(false);
    }
  };

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  };

  const obtenerCategoriaAutomatica = (edad, genero) => {
    const config = categoriasConfig[genero] || categoriasConfig.masculino;
    
    for (const [categoria, rango] of Object.entries(config)) {
      if (edad >= rango.min && edad <= rango.max) {
        return categoria;
      }
    }
    
    return 'Sin categoría';
  };

  const realizarValidaciones = (atletas, inscripciones) => {
    const validacionesResult = [];
    
    inscripciones.forEach(inscripcion => {
      const atleta = atletas.find(a => a._id === inscripcion.atletaId);
      const evento = eventos.find(e => e._id === inscripcion.eventoId);
      
      if (atleta && evento) {
        const edad = calcularEdad(atleta.fecha_nacimiento);
        const categoriaAutomatica = obtenerCategoriaAutomatica(edad, atleta.sexo);
        const categoriaEvento = evento.categoria;
        
        // Validaciones
        const validaciones = {
          inscripcionId: inscripcion._id,
          atletaId: atleta._id,
          eventoId: evento._id,
          nombreAtleta: `${atleta.nombre} ${atleta.apellidopa} ${atleta.apellidoma}`,
          nombreEvento: evento.titulo,
          edad: edad,
          genero: atleta.sexo,
          categoriaAutomatica: categoriaAutomatica,
          categoriaEvento: categoriaEvento,
          fechaInscripcion: inscripcion.fechaInscripcion,
          validaciones: {
            edad: {
              valida: edad >= evento.edadMin && edad <= evento.edadMax,
              mensaje: edad >= evento.edadMin && edad <= evento.edadMax 
                ? `Edad válida (${edad} años)` 
                : `Edad fuera de rango: ${edad} años (requerido: ${evento.edadMin}-${evento.edadMax})`
            },
            genero: {
              valida: evento.genero === 'mixto' || evento.genero === atleta.sexo,
              mensaje: evento.genero === 'mixto' || evento.genero === atleta.sexo
                ? `Género válido (${atleta.sexo})`
                : `Género no permitido: ${atleta.sexo} (evento: ${evento.genero})`
            },
            categoria: {
              valida: categoriaAutomatica === categoriaEvento,
              mensaje: categoriaAutomatica === categoriaEvento
                ? `Categoría correcta (${categoriaAutomatica})`
                : `Categoría incorrecta: ${categoriaAutomatica} vs ${categoriaEvento}`
            }
          }
        };
        
        validaciones.validaciones.todasValidas = 
          validaciones.validaciones.edad.valida &&
          validaciones.validaciones.genero.valida &&
          validaciones.validaciones.categoria.valida;
        
        validacionesResult.push(validaciones);
      }
    });
    
    setValidaciones(validacionesResult);
  };

  const obtenerFiltradas = () => {
    let filtradas = validaciones;
    
    if (filtroEvento) {
      filtradas = filtradas.filter(v => v.eventoId === filtroEvento);
    }
    
    if (filtroEstado === 'validas') {
      filtradas = filtradas.filter(v => v.validaciones.todasValidas);
    } else if (filtroEstado === 'invalidas') {
      filtradas = filtradas.filter(v => !v.validaciones.todasValidas);
    }
    
    return filtradas;
  };

  const obtenerIconoEstado = (validaciones) => {
    if (validaciones.todasValidas) {
      return <CheckCircleIcon color="success" />;
    } else if (validaciones.edad.valida && validaciones.genero.valida) {
      return <WarningIcon color="warning" />;
    } else {
      return <ErrorIcon color="error" />;
    }
  };

  const obtenerColorEstado = (validaciones) => {
    if (validaciones.todasValidas) {
      return 'success';
    } else if (validaciones.edad.valida && validaciones.genero.valida) {
      return 'warning';
    } else {
      return 'error';
    }
  };

  const abrirDialogo = (inscripcion) => {
    setSelectedInscripcion(inscripcion);
    setDialogOpen(true);
  };

  const cerrarDialogo = () => {
    setDialogOpen(false);
    setSelectedInscripcion(null);
  };

  const aplicarCorreccionAutomatica = async (inscripcion) => {
    try {
      const categoriaAutomatica = obtenerCategoriaAutomatica(
        inscripcion.edad, 
        inscripcion.genero
      );
      
      // Aquí se podría implementar la lógica para actualizar la inscripción
      // con la categoría correcta automáticamente
      
      alert(`Se aplicaría la categoría automática: ${categoriaAutomatica}`);
      
    } catch (error) {
      console.error('Error al aplicar corrección:', error);
      setError('Error al aplicar la corrección automática');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const validacionesFiltradas = obtenerFiltradas();
  const estadisticas = {
    total: validaciones.length,
    validas: validaciones.filter(v => v.validaciones.todasValidas).length,
    invalidas: validaciones.filter(v => !v.validaciones.todasValidas).length,
    conAdvertencias: validaciones.filter(v => 
      !v.validaciones.todasValidas && 
      v.validaciones.edad.valida && 
      v.validaciones.genero.valida
    ).length
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
        🔍 Validación Automática de Categorías
      </Typography>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <InfoIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total de Inscripciones
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {estadisticas.validas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Válidas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {estadisticas.conAdvertencias}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Con Advertencias
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ErrorIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="error.main">
                    {estadisticas.invalidas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Inválidas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filtros</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Evento</InputLabel>
              <Select
                value={filtroEvento}
                onChange={(e) => setFiltroEvento(e.target.value)}
                label="Evento"
              >
                <MenuItem value="">Todos los eventos</MenuItem>
                {eventos.map(evento => (
                  <MenuItem key={evento._id} value={evento._id}>
                    {evento.titulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                label="Estado"
              >
                <MenuItem value="todos">Todos los estados</MenuItem>
                <MenuItem value="validas">Válidas</MenuItem>
                <MenuItem value="invalidas">Inválidas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={cargarDatos}
              fullWidth
              sx={{ height: 56 }}
            >
              Actualizar Validaciones
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de validaciones */}
      <Paper sx={{ width: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Estado</TableCell>
              <TableCell>Atleta</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell>Edad</TableCell>
              <TableCell>Género</TableCell>
              <TableCell>Categoría Actual</TableCell>
              <TableCell>Categoría Automática</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {validacionesFiltradas.map((validacion) => (
              <TableRow key={validacion.inscripcionId}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {obtenerIconoEstado(validacion.validaciones)}
                    <Chip 
                      label={validacion.validaciones.todasValidas ? 'Válida' : 'Inválida'}
                      color={obtenerColorEstado(validacion.validaciones)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </TableCell>
                <TableCell>{validacion.nombreAtleta}</TableCell>
                <TableCell>{validacion.nombreEvento}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${validacion.edad} años`}
                    color={validacion.validaciones.edad.valida ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={validacion.genero}
                    color={validacion.validaciones.genero.valida ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={validacion.categoriaEvento}
                    color={validacion.validaciones.categoria.valida ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={validacion.categoriaAutomatica}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Ver detalles">
                    <IconButton 
                      size="small" 
                      onClick={() => abrirDialogo(validacion)}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  {!validacion.validaciones.todasValidas && (
                    <Tooltip title="Aplicar corrección automática">
                      <IconButton 
                        size="small" 
                        onClick={() => aplicarCorreccionAutomatica(validacion)}
                        color="warning"
                      >
                        <AutoFixHighIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog para detalles */}
      <Dialog open={dialogOpen} onClose={cerrarDialogo} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles de Validación
        </DialogTitle>
        <DialogContent>
          {selectedInscripcion && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInscripcion.nombreAtleta} - {selectedInscripcion.nombreEvento}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Información del Atleta
                      </Typography>
                      <Typography variant="body2">
                        <strong>Edad:</strong> {selectedInscripcion.edad} años
                      </Typography>
                      <Typography variant="body2">
                        <strong>Género:</strong> {selectedInscripcion.genero}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Categoría Automática:</strong> {selectedInscripcion.categoriaAutomatica}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Información del Evento
                      </Typography>
                      <Typography variant="body2">
                        <strong>Categoría del Evento:</strong> {selectedInscripcion.categoriaEvento}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Fecha de Inscripción:</strong> {new Date(selectedInscripcion.fechaInscripcion).toLocaleDateString('es-ES')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Resultados de Validación
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      {selectedInscripcion.validaciones.edad.valida ? 
                        <CheckCircleIcon color="success" /> : 
                        <ErrorIcon color="error" />
                      }
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {selectedInscripcion.validaciones.edad.mensaje}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      {selectedInscripcion.validaciones.genero.valida ? 
                        <CheckCircleIcon color="success" /> : 
                        <ErrorIcon color="error" />
                      }
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {selectedInscripcion.validaciones.genero.mensaje}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center">
                      {selectedInscripcion.validaciones.categoria.valida ? 
                        <CheckCircleIcon color="success" /> : 
                        <ErrorIcon color="error" />
                      }
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {selectedInscripcion.validaciones.categoria.mensaje}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ValidacionCategoriaAutomatica; 