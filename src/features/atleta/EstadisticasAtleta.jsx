import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Avatar
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import axios from 'axios';
import { atletasAPI, resultadosAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const EstadisticasAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Datos del atleta
  const [perfilAtleta, setPerfilAtleta] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [progresoDisciplinas, setProgresoDisciplinas] = useState({});
  const [comparativaRendimiento, setComparativaRendimiento] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    cargarEstadisticas();
  }, [user, navigate]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Cargar perfil del atleta
              const perfilRes = await atletasAPI.getPerfil();
      setPerfilAtleta(perfilRes.data);
      
      // Cargar resultados del atleta
              const resultadosRes = await resultadosAPI.getByAtleta(user.id);
      setResultados(resultadosRes.data);
      
      // Cargar estadísticas detalladas
              // estadisticas por atleta no disponible
      setEstadisticas({})
      
      // Calcular progreso por disciplinas
      calcularProgresoDisciplinas(resultadosRes.data);
      
      // Calcular comparativa de rendimiento
      calcularComparativaRendimiento(resultadosRes.data);
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('Error al cargar las estadísticas del atleta');
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresoDisciplinas = (datos) => {
    const progreso = {};
    
    // Agrupar por disciplina
    datos.forEach(resultado => {
      if (!progreso[resultado.disciplina]) {
        progreso[resultado.disciplina] = [];
      }
      progreso[resultado.disciplina].push({
        fecha: new Date(resultado.fechaEvento).toLocaleDateString('es-ES'),
        tiempo: resultado.tiempo,
        posicion: resultado.posicion,
        evento: resultado.nombreEvento
      });
    });
    
    // Ordenar por fecha
    Object.keys(progreso).forEach(disciplina => {
      progreso[disciplina].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    });
    
    setProgresoDisciplinas(progreso);
  };

  const calcularComparativaRendimiento = (datos) => {
    const comparativa = [];
    
    // Agrupar por disciplina y calcular métricas
    const disciplinas = {};
    datos.forEach(resultado => {
      if (!disciplinas[resultado.disciplina]) {
        disciplinas[resultado.disciplina] = {
          disciplina: resultado.disciplina,
          totalEventos: 0,
          mejorTiempo: null,
          peorTiempo: null,
          promedioTiempo: 0,
          podios: 0,
          mejorPosicion: null
        };
      }
      
      const disciplina = disciplinas[resultado.disciplina];
      disciplina.totalEventos++;
      
      if (resultado.tiempo) {
        if (!disciplina.mejorTiempo || resultado.tiempo < disciplina.mejorTiempo) {
          disciplina.mejorTiempo = resultado.tiempo;
        }
        if (!disciplina.peorTiempo || resultado.tiempo > disciplina.peorTiempo) {
          disciplina.peorTiempo = resultado.tiempo;
        }
        disciplina.promedioTiempo += resultado.tiempo;
      }
      
      if (resultado.posicion) {
        if (!disciplina.mejorPosicion || resultado.posicion < disciplina.mejorPosicion) {
          disciplina.mejorPosicion = resultado.posicion;
        }
        if (resultado.posicion <= 3) {
          disciplina.podios++;
        }
      }
    });
    
    // Calcular promedios
    Object.values(disciplinas).forEach(disciplina => {
      if (disciplina.promedioTiempo > 0) {
        disciplina.promedioTiempo = disciplina.promedioTiempo / disciplina.totalEventos;
      }
    });
    
    setComparativaRendimiento(Object.values(disciplinas));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
        📊 Mis Estadísticas de Rendimiento
      </Typography>

      {/* Información del atleta */}
      {perfilAtleta && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#800020',
                  fontSize: '2rem'
                }}
              >
                {perfilAtleta.nombre?.charAt(0) || 'A'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" sx={{ color: '#800020', fontWeight: 'bold' }}>
                {perfilAtleta.nombre} {perfilAtleta.apellidopa} {perfilAtleta.apellidoma}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Edad: {calcularEdad(perfilAtleta.fecha_nacimiento)} años | 
                Género: {perfilAtleta.sexo === 'masculino' ? 'Masculino' : 'Femenino'} |
                Categoría: {perfilAtleta.categoria || 'No especificada'}
              </Typography>
              {perfilAtleta.clubId && (
                <Typography variant="body2" color="textSecondary">
                  Club: {perfilAtleta.nombreClub || 'Club asociado'}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tarjetas de estadísticas generales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <EmojiEventsIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas.totalEventos || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Eventos Participados
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
                <StarIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas.podios || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Podios Obtenidos
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
                <SpeedIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas.mejorTiempo ? `${estadisticas.mejorTiempo}s` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Mejor Tiempo
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
                <TimelineIcon sx={{ fontSize: 40, color: '#800020', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {Object.keys(progresoDisciplinas).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Disciplinas Practicadas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs para diferentes tipos de análisis */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Progreso por Disciplina" />
          <Tab label="Comparativa de Rendimiento" />
          <Tab label="Análisis de Resultados" />
          <Tab label="Historial Completo" />
        </Tabs>

        {/* Contenido de los tabs */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Progreso Temporal por Disciplina</Typography>
              <Grid container spacing={3}>
                {Object.entries(progresoDisciplinas).map(([disciplina, datos]) => (
                  <Grid item xs={12} md={6} key={disciplina}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#800020' }}>
                          {disciplina}
                        </Typography>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={datos}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="tiempo" 
                              stroke="#800020" 
                              strokeWidth={2}
                              dot={{ fill: '#800020', strokeWidth: 2, r: 4 }}
                              name="Tiempo (s)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Comparativa de Rendimiento por Disciplina</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Mejores Tiempos por Disciplina</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparativaRendimiento}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="disciplina" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="mejorTiempo" fill="#800020" name="Mejor Tiempo (s)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Podios por Disciplina</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparativaRendimiento}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="disciplina" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="podios" fill="#00C49F" name="Podios" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Análisis Detallado de Resultados</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Distribución de Participaciones</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={comparativaRendimiento.map(item => ({
                              name: item.disciplina,
                              value: item.totalEventos
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {comparativaRendimiento.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Rendimiento por Disciplina</Typography>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Disciplina</TableCell>
                            <TableCell>Eventos</TableCell>
                            <TableCell>Mejor Tiempo</TableCell>
                            <TableCell>Podios</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {comparativaRendimiento.map((item) => (
                            <TableRow key={item.disciplina}>
                              <TableCell>
                                <Chip label={item.disciplina} color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell>{item.totalEventos}</TableCell>
                              <TableCell>
                                {item.mejorTiempo ? (
                                  <Chip 
                                    label={`${item.mejorTiempo}s`} 
                                    color="success" 
                                    size="small"
                                  />
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={item.podios} 
                                  color={item.podios > 0 ? "success" : "default"}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Historial Completo de Resultados</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Evento</TableCell>
                    <TableCell>Disciplina</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Tiempo</TableCell>
                    <TableCell>Posición</TableCell>
                    <TableCell>Marca</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultados
                    .sort((a, b) => new Date(b.fechaEvento) - new Date(a.fechaEvento))
                    .map((resultado) => (
                    <TableRow key={resultado._id}>
                      <TableCell>
                        {new Date(resultado.fechaEvento).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>{resultado.nombreEvento}</TableCell>
                      <TableCell>
                        <Chip label={resultado.disciplina} size="small" />
                      </TableCell>
                      <TableCell>{resultado.categoria}</TableCell>
                      <TableCell>
                        {resultado.tiempo ? (
                          <Chip 
                            label={`${resultado.tiempo}s`} 
                            color="primary" 
                            size="small"
                          />
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {resultado.posicion ? (
                          <Chip 
                            label={`${resultado.posicion}°`} 
                            color={resultado.posicion <= 3 ? "success" : "default"}
                            size="small"
                          />
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{resultado.marca || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default EstadisticasAtleta;