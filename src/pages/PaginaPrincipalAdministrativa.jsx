import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  EventNote as EventNoteIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaginaPrincipalAdministrativa = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAtletas: 0,
    totalClubes: 0,
    totalEventos: 0,
    totalResultados: 0,
    atletasRecientes: 0,
    clubesRecientes: 0
  });
  const [recentActivity, setRecentActivity] = useState({
    atletas: [],
    clubes: [],
    eventos: [],
    resultados: []
  });
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas generales
      const [atletasRes, clubesRes, eventosRes, resultadosRes] = await Promise.all([
        axios.get('http://localhost:5000/api/atletas'),
                  axios.get('http://localhost:5000/api/clubes'),
                  axios.get('http://localhost:5000/api/eventos'),
                  axios.get('http://localhost:5000/api/resultados')
      ]);

      const atletas = atletasRes.data;
      const clubes = clubesRes.data;
      const eventos = eventosRes.data;
      const resultados = resultadosRes.data;

      // Calcular estadísticas
      const fechaHace7Dias = new Date();
      fechaHace7Dias.setDate(fechaHace7Dias.getDate() - 7);

      const atletasRecientes = atletas.filter(atleta => 
        new Date(atleta.fechaRegistro || atleta.createdAt) >= fechaHace7Dias
      ).length;

      const clubesRecientes = clubes.filter(club => 
        new Date(club.fechaCreacion || club.createdAt) >= fechaHace7Dias
      ).length;

      setStats({
        totalAtletas: atletas.length,
        totalClubes: clubes.length,
        totalEventos: eventos.length,
        totalResultados: resultados.length,
        atletasRecientes,
        clubesRecientes
      });

      // Cargar actividad reciente
      const atletasRecientesList = atletas
        .sort((a, b) => new Date(b.fechaRegistro || b.createdAt) - new Date(a.fechaRegistro || a.createdAt))
        .slice(0, 5);

      const clubesRecientesList = clubes
        .sort((a, b) => new Date(b.fechaCreacion || b.createdAt) - new Date(a.fechaCreacion || a.createdAt))
        .slice(0, 5);

      const eventosProximos = eventos
        .filter(evento => new Date(evento.fecha) >= new Date())
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 5);

      const resultadosRecientes = resultados
        .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
        .slice(0, 5);

      setRecentActivity({
        atletas: atletasRecientesList,
        clubes: clubesRecientesList,
        eventos: eventosProximos,
        resultados: resultadosRecientes
      });

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 'N/A';
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'activo': return 'success';
      case 'inactivo': return 'error';
      default: return 'default';
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'atleta':
        navigate('/administrativo/atleta');
        break;
      case 'club':
        navigate('/administrativo/club');
        break;
      case 'evento':
        navigate('/administrativo/eventos');
        break;
      case 'reportes':
        navigate('/administrativo/reportes');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', py: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
                Panel Administrativo
              </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Estadísticas Principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #800020 0%, #7A4069 100%)',
              color: 'white',
              '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s ease' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalAtletas}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Atletas Registrados
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      +{stats.atletasRecientes} esta semana
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <PeopleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #7A4069 0%, #800020 100%)',
              color: 'white',
              '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s ease' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalClubes}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Clubes Registrados
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      +{stats.clubesRecientes} esta semana
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <GroupsIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
              color: 'white',
              '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s ease' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalEventos}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Eventos Activos
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Eventos en el sistema
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <EventIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

                     <Grid item xs={12} sm={6} md={3}>
             <Card sx={{ 
               background: 'linear-gradient(135deg, #7A4069 0%, #800020 100%)',
               color: 'white',
               '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s ease' }
             }}>
               <CardContent>
                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <Box>
                     <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                       {stats.totalResultados}
                     </Typography>
                     <Typography variant="body2" sx={{ opacity: 0.9 }}>
                       Resultados Registrados
                     </Typography>
                     <Typography variant="caption" sx={{ opacity: 0.8 }}>
                       Marcas y tiempos
              </Typography>
            </Box>
                   <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                     <TrophyIcon />
                   </Avatar>
                 </Box>
               </CardContent>
             </Card>
           </Grid>
        </Grid>

        {/* Acciones Rápidas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ color: '#800020', fontWeight: 'bold', mb: 2 }}>
              Vista Rápida
            </Typography>
          </Grid>
         
        </Grid>

        {/* Actividad Reciente */}
            <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  Atletas Recientes
                </Typography>
                <List>
                  {recentActivity.atletas.map((atleta, index) => (
                    <React.Fragment key={atleta._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#800020' }}>
                            {atleta.nombre?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${atleta.nombre} ${atleta.apellidopa} ${atleta.apellidoma}`}
                          secondary={`CURP: ${atleta.curp} • Registrado: ${formatearFecha(atleta.fechaRegistro || atleta.createdAt)}`}
                        />
                        <Chip 
                          label={atleta.sexo} 
                          size="small" 
                          color={atleta.sexo === 'masculino' ? 'primary' : 'secondary'}
                        />
                      </ListItem>
                      {index < recentActivity.atletas.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {recentActivity.atletas.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No hay atletas recientes
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#7A4069', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <GroupsIcon sx={{ mr: 1 }} />
                  Clubes Recientes
                </Typography>
                <List>
                  {recentActivity.clubes.map((club, index) => (
                    <React.Fragment key={club._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#7A4069' }}>
                            {club.nombre?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={club.nombre}
                          secondary={`${club.direccion} • Registrado: ${formatearFecha(club.fechaCreacion || club.createdAt)}`}
                        />
                        <Chip 
                          label={club.estado || 'activo'} 
                          size="small" 
                          color={obtenerColorEstado(club.estado)}
                        />
                      </ListItem>
                      {index < recentActivity.clubes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {recentActivity.clubes.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No hay clubes recientes
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <EventIcon sx={{ mr: 1 }} />
                  Próximos Eventos
                </Typography>
                <List>
                  {recentActivity.eventos.map((evento, index) => (
                    <React.Fragment key={evento._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#2E7D32' }}>
                            <CalendarIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={evento.titulo}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {formatearFecha(evento.fecha)} • {evento.lugar}
                              </Typography>
                              <br />
                              <Typography variant="caption" component="span">
                                {evento.disciplina} • {evento.categoria} • {evento.genero}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip 
                          label={evento.estado ? 'Activo' : 'Inactivo'} 
                          size="small" 
                          color={evento.estado ? 'success' : 'error'}
                        />
                      </ListItem>
                      {index < recentActivity.eventos.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {recentActivity.eventos.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No hay eventos próximos
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

                     <Grid item xs={12} md={6}>
             <Card sx={{ height: '100%' }}>
               <CardContent>
                 <Typography variant="h6" sx={{ color: '#7A4069', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                   <TrophyIcon sx={{ mr: 1 }} />
                   Resultados Recientes
                 </Typography>
                 <List>
                   {recentActivity.resultados.map((resultado, index) => (
                     <React.Fragment key={resultado._id}>
                       <ListItem>
                         <ListItemAvatar>
                           <Avatar sx={{ bgcolor: '#7A4069' }}>
                             <TrophyIcon />
                           </Avatar>
                         </ListItemAvatar>
                         <ListItemText
                           primary={resultado.nombreAtleta}
                           secondary={
                             <Box>
                               <Typography variant="body2" component="span">
                                 {resultado.nombreEvento} • {resultado.disciplina}
                               </Typography>
                               <br />
                               <Typography variant="caption" component="span">
                                 Posición: {resultado.posicion} • Registrado: {formatearFecha(resultado.fechaRegistro)}
                               </Typography>
                             </Box>
                           }
                         />
                         <Chip 
                           label={`${resultado.posicion}°`} 
                           size="small" 
                           color={resultado.posicion <= 3 ? 'success' : 'default'}
                         />
                       </ListItem>
                       {index < recentActivity.resultados.length - 1 && <Divider />}
                     </React.Fragment>
                   ))}
                   {recentActivity.resultados.length === 0 && (
                     <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                       No hay resultados recientes
                     </Typography>
                   )}
                 </List>
               </CardContent>
             </Card>
           </Grid>

           <Grid item xs={12} md={6}>
             <Card sx={{ height: '100%' }}>
                    <CardContent>
                 <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                   <AssessmentIcon sx={{ mr: 1 }} />
                   Ver Reportes
                 </Typography>
                 <Box sx={{ 
                   display: 'flex', 
                   flexDirection: 'column', 
                   alignItems: 'center', 
                   justifyContent: 'center', 
                   height: '200px',
                   textAlign: 'center'
                 }}>
                   <Avatar sx={{ bgcolor: '#800020', width: 80, height: 80, mb: 2 }}>
                     <AssessmentIcon sx={{ fontSize: 40 }} />
                   </Avatar>
                   <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', mb: 1 }}>
                     Análisis y Estadísticas
                      </Typography>
                   <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
                     Accede a reportes detallados, estadísticas del sistema y análisis de rendimiento
                      </Typography>
                      <Button
                        variant="contained"
                     startIcon={<AssessmentIcon />}
                     onClick={() => handleQuickAction('reportes')}
                     sx={{
                       bgcolor: '#800020',
                       color: 'white',
                       '&:hover': {
                         bgcolor: '#7A4069',
                         transform: 'translateY(-2px)',
                         boxShadow: '0 4px 12px rgba(128, 0, 32, 0.3)',
                       },
                       transition: 'all 0.3s ease'
                     }}
                   >
                     Ver  Reportes
                      </Button>
                 </Box>
                    </CardContent>
                  </Card>
                </Grid>
            </Grid>
        </Container>
      </Box>
  );
};

export default PaginaPrincipalAdministrativa;