import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Card, CardContent, Button,
  Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem,
  TextField, Chip, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Assessment as AssessmentIcon, Download as DownloadIcon, FilterList as FilterIcon,
  Visibility as VisibilityIcon, TrendingUp as TrendingUpIcon, People as PeopleIcon,
  EmojiEvents as EmojiEventsIcon, Group as GroupIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import * as XLSX from 'xlsx';

const Reportes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resultados, setResultados] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [filtros, setFiltros] = useState({
    eventoId: '',
    categoria: '',
    club: '',
    añoCompetitivo: '',
    sexo: ''
  });
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);
  const [error, setError] = useState('');

  const categorias = [
    'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18', 
    'Sub-20', 'Sub-23', 'Mayor', 'Máster'
  ];

  useEffect(() => {
    if (user) {
    cargarDatos();
    }
  }, [user]);

 const cargarDatos = async () => {
  try {
    setLoading(true);

    // Cargar resultados
    const resultadosRes = await axios.get('http://localhost:5000/api/resultados');
    setResultados(
      Array.isArray(resultadosRes.data)
        ? resultadosRes.data
        : Array.isArray(resultadosRes.data?.resultados)
          ? resultadosRes.data.resultados
          : []
    );

    // Cargar eventos
    const eventosRes = await axios.get('http://localhost:5000/api/eventos');
    setEventos(
      Array.isArray(eventosRes.data)
        ? eventosRes.data
        : Array.isArray(eventosRes.data?.eventos)
          ? eventosRes.data.eventos
          : []
    );

    // Cargar atletas
    const atletasRes = await axios.get('http://localhost:5000/api/atletas');
    setAtletas(
      Array.isArray(atletasRes.data)
        ? atletasRes.data
        : Array.isArray(atletasRes.data?.atletas)
          ? atletasRes.data.atletas
          : []
    );

    // Cargar clubes
    const clubesRes = await axios.get('http://localhost:5000/api/clubes');
    setClubes(
      Array.isArray(clubesRes.data)
        ? clubesRes.data
        : Array.isArray(clubesRes.data?.clubes)
          ? clubesRes.data.clubes
          : []
    );

    // Cargar estadísticas — en try/catch aparte para que un fallo aquí
    // no tumbe los datos que ya cargaron bien arriba
    try {
      const estadisticasRes = await axios.get('http://localhost:5000/api/resultados/estadisticas/generales');
      setEstadisticas(estadisticasRes.data || {});
    } catch (statsError) {
      console.error('Error al cargar estadísticas:', statsError);
      setEstadisticas({});
    }

  } catch (error) {
    console.error('Error al cargar datos:', error);
    setError('Error al cargar los datos para los reportes');
    setResultados([]);
    setEventos([]);
    setAtletas([]);
    setClubes([]);
  } finally {
    setLoading(false);
  }
};

  const aplicarFiltros = () => {
    let resultadosFiltrados = [...resultados];

    if (filtros.eventoId) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.eventoId === filtros.eventoId);
    }
    if (filtros.categoria) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.categoria === filtros.categoria);
    }
    if (filtros.club) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.club === filtros.club);
    }
    if (filtros.añoCompetitivo) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.añoCompetitivo === parseInt(filtros.añoCompetitivo));
    }
    if (filtros.sexo) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.sexo === filtros.sexo);
    }

    return resultadosFiltrados;
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
    const entrenador = atletas.find(a => a._id === entrenadorId && a.rol === 'entrenador');
    return entrenador ? `${entrenador.nombre} ${entrenador.apellidopa} ${entrenador.apellidoma}` : 'No encontrado';
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  };

  const exportarExcel = () => {
    const resultadosFiltrados = aplicarFiltros();
    
    if (resultadosFiltrados.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Preparar datos para Excel
    const datosExcel = resultadosFiltrados.map(resultado => {
      const atleta = atletas.find(a => a._id === resultado.atletaId);
      const evento = eventos.find(e => e._id === resultado.eventoId);
      
      return {
        'CURP': atleta?.curp || 'N/A',
        'FECHA NACIMIENTO': atleta?.fecha_nacimiento ? new Date(atleta.fecha_nacimiento).toLocaleDateString('es-ES') : 'N/A',
        'NOMBRE ATLETA': atleta ? `${atleta.nombre} ${atleta.apellidopa} ${atleta.apellidoma}` : 'N/A',
        'SEXO': resultado.sexo || 'N/A',
        'CATEGORIA': resultado.categoria || 'N/A',
        'MUNICIPIO': resultado.municipio || 'N/A',
        'CLUB': resultado.club || 'Independiente',
        'AÑO DE COMPETITIVO': resultado.añoCompetitivo || 'N/A',
        'PRUEBA 1': resultado.pruebas?.[0]?.nombre || 'N/A',
        'MARCA 1': resultado.pruebas?.[0]?.marca ? `${resultado.pruebas[0].marca} ${resultado.pruebas[0].unidad}` : 'N/A',
        'PRUEBA 2': resultado.pruebas?.[1]?.nombre || 'N/A',
        'MARCA 2': resultado.pruebas?.[1]?.marca ? `${resultado.pruebas[1].marca} ${resultado.pruebas[1].unidad}` : 'N/A',
        'PRUEBA 3': resultado.pruebas?.[2]?.nombre || 'N/A',
        'MARCA 3': resultado.pruebas?.[2]?.marca ? `${resultado.pruebas[2].marca} ${resultado.pruebas[2].unidad}` : 'N/A',
        'PRUEBA 4': resultado.pruebas?.[3]?.nombre || 'N/A',
        'MARCA 4': resultado.pruebas?.[3]?.marca ? `${resultado.pruebas[3].marca} ${resultado.pruebas[3].unidad}` : 'N/A',
        'NOMBRE ENTRENADOR': obtenerNombreEntrenador(resultado.entrenadorId),
        'LUGAR DE ENTRENAMIENTO': resultado.lugarEntrenamiento || 'N/A'
      };
    });

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    
    // Descargar archivo
    const nombreArchivo = `Reporte_Resultados_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  const handleVerDetalles = (resultado) => {
    setResultadoSeleccionado(resultado);
    setModalDetallesOpen(true);
  };

  const limpiarFiltros = () => {
    setFiltros({
      eventoId: '',
      categoria: '',
      club: '',
      añoCompetitivo: '',
      sexo: ''
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

  const resultadosFiltrados = aplicarFiltros();

  return (
    <Container maxWidth="xl" sx={{ py: 4, background: '#e4e4e5', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        Reportes y Análisis de Resultados
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estadísticas generales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <EmojiEventsIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas.totalResultados || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total de Resultados
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
                <PeopleIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas.totalAtletas || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Atletas Participantes
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
                <GroupIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas.totalClubes || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Clubes Representados
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
                <TrendingUpIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas.totalEventos || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Eventos Registrados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', mb: 3 }}>
          <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filtros de Búsqueda
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Evento</InputLabel>
              <Select
                value={filtros.eventoId}
                onChange={(e) => setFiltros(prev => ({ ...prev, eventoId: e.target.value }))}
                label="Evento"
              >
                <MenuItem value="">Todos los eventos</MenuItem>
                {eventos.map((evento) => (
                  <MenuItem key={evento._id} value={evento._id}>
                    {evento.titulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filtros.categoria}
                onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                label="Categoría"
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Club</InputLabel>
              <Select
                value={filtros.club}
                onChange={(e) => setFiltros(prev => ({ ...prev, club: e.target.value }))}
                label="Club"
              >
                <MenuItem value="">Todos los clubes</MenuItem>
                {clubes.map((club) => (
                  <MenuItem key={club._id} value={club.nombre}>
                    {club.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Año Competitivo"
              type="number"
              value={filtros.añoCompetitivo}
              onChange={(e) => setFiltros(prev => ({ ...prev, añoCompetitivo: e.target.value }))}
              inputProps={{ min: 2020, max: 2030 }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sexo</InputLabel>
              <Select
                value={filtros.sexo}
                onChange={(e) => setFiltros(prev => ({ ...prev, sexo: e.target.value }))}
                label="Sexo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="masculino">Masculino</MenuItem>
                <MenuItem value="femenino">Femenino</MenuItem>
                <MenuItem value="mixto">Mixto</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                onClick={limpiarFiltros}
                size="small"
                sx={{ color: '#7A4069' }}
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Botones de acción */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
          Resultados Filtrados ({resultadosFiltrados.length})
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportarExcel}
          disabled={resultadosFiltrados.length === 0}
          sx={{
            backgroundColor: '#2E7D32',
            '&:hover': { backgroundColor: '#1B5E20' }
          }}
        >
          Exportar a Excel
        </Button>
      </Box>

      {/* Tabla de resultados */}
      <Paper elevation={3} sx={{ overflow: 'auto' }}>
        {resultadosFiltrados.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No hay resultados que coincidan con los filtros aplicados.
            </Typography>
          </Box>
        ) : (
              <Table>
                <TableHead>
                  <TableRow>
                <TableCell><strong>Evento</strong></TableCell>
                <TableCell><strong>Atleta</strong></TableCell>
                <TableCell><strong>Categoría</strong></TableCell>
                <TableCell><strong>Club</strong></TableCell>
                <TableCell><strong>Año</strong></TableCell>
                <TableCell><strong>Pruebas</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
              {resultadosFiltrados.map((resultado) => (
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
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {resultado.pruebas?.map((prueba, index) => (
                        <Chip 
                          key={index}
                          label={`${prueba.nombre}: ${prueba.marca} ${prueba.unidad}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                      </TableCell>
                      <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleVerDetalles(resultado)}
                      color="primary"
                      title="Ver detalles"
                    >
                      <VisibilityIcon />
                    </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
        )}
      </Paper>

      {/* Modal de detalles */}
      <Dialog open={modalDetallesOpen} onClose={() => setModalDetallesOpen(false)} maxWidth="md" fullWidth>
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
          <Button onClick={() => setModalDetallesOpen(false)} sx={{ color: '#7A4069' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Reportes; 