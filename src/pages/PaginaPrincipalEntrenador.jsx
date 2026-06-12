import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, 
  Chip, Avatar, CircularProgress, Alert, Paper, Divider
} from '@mui/material';
import {
  People as PeopleIcon, Event as EventIcon, TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon, Group as GroupIcon, CalendarToday as CalendarIcon,
  Sports as SportsIcon, Work as WorkIcon, School as SchoolIcon, Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';
import { entrenadorAPI } from '../api/index.js';
import { useAuth } from '../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const PaginaPrincipalEntrenador = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    atletasActivos: 0,
    eventosProximos: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [clubInfo, setClubInfo] = useState(null);
  const [atletasClub, setAtletasClub] = useState([]);

  useEffect(() => {
    if (isAuthenticated()) {
      cargarDatos();
    }
  }, [user]);

  // Agregar validación para redirigir si no hay usuario
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }
  }, [user, navigate, isAuthenticated]);

  // Validación adicional para asegurar que el usuario tenga las propiedades necesarias
  useEffect(() => {
    if (user && (!user.id || !user.nombre)) {
      console.log('Usuario incompleto, redirigiendo a login');
      navigate('/login', { replace: true });
      return;
    }
  }, [user, navigate]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Verificar que user existe antes de continuar
      if (!isAuthenticated()) {
        setError('Usuario no autenticado');
        return;
      }
      
      // Cargar información del club si está asignado
      if (user.clubId) {
        const clubResponse = await axios.get(`http://localhost:5000/api/clubes/${user.clubId}`);
        setClubInfo(clubResponse.data);
        
        // Cargar atletas del club asignado
        try {
          const atletasResponse = await axios.get(`http://localhost:5000/api/atletas?club_id=${user.clubId}`);
          setAtletasClub(atletasResponse.data);
          // Contar atletas activos (que tengan estado activo o similar)
          const atletasActivos = atletasResponse.data.filter(atleta => 
            atleta.estado === 'activo' || atleta.estado === 'Activo' || !atleta.estado
          ).length;
          setStats(prev => ({ ...prev, atletasActivos }));
        } catch (atletasError) {
          console.error('Error al cargar atletas del club:', atletasError);
          setStats(prev => ({ ...prev, atletasActivos: 0 }));
        }
      }

      // Cargar eventos próximos
      try {
        const eventosResponse = await axios.get('http://localhost:5000/api/eventos');
        const eventosFuturos = eventosResponse.data.filter(evento => {
          const fechaEvento = new Date(evento.fecha);
          const fechaActual = new Date();
          return fechaEvento >= fechaActual;
        });
        setStats(prev => ({ ...prev, eventosProximos: eventosFuturos.length }));
      } catch (eventosError) {
        console.error('Error al cargar eventos:', eventosError);
        setStats(prev => ({ ...prev, eventosProximos: 0 }));
      }

      // Cargar actividad reciente
              const activityResponse = await entrenadorAPI.getActividad();
      setRecentActivity(activityResponse.data);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'gestionarAtletas':
        navigate('/entrenador/gestionar-atletas');
        break;
      case 'verReportes':
        navigate('/entrenador/reportes');
        break;
      case 'eventos':
        navigate('/entrenador/eventos');
        break;
      default:
        break;
    }
  };

  if (!isAuthenticated()) {
    return null; // No renderizar nada si no hay usuario autenticado
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

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
        {/* Header con información del entrenador */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#800020' }}>
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" sx={{ color: '#800020', fontWeight: 'bold', mb: 1, fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
            ¡Bienvenido, {user?.nombre} {user?.apellidopa}!
          </Typography>
          <Typography variant="h6" sx={{ color: '#7A4069', mb: 3, fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
            Panel de Entrenador
          </Typography>
          {clubInfo && (
            <Chip 
              label={`Club: ${clubInfo.nombre}`} 
              sx={{ backgroundColor: '#2E7D32', color: 'white', fontWeight: 'bold' }}
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Estadísticas Principales - Mismo diseño que atleta */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={6}>
            <Card sx={{ bgcolor: '#800020', color: 'white', height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                  {stats.atletasActivos}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                  Atletas Activos del Club
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Card sx={{ bgcolor: '#7A4069', color: 'white', height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <EventIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                  {stats.eventosProximos}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                  Eventos Próximos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Acciones Rápidas y Actividad Reciente - Mismo diseño que atleta */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Acciones Rápidas */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <GroupIcon sx={{ fontSize: 30, color: '#800020', mr: 2 }} />
                  <Typography variant="h5" sx={{ color: '#800020', fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                    Acciones Rápidas
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Card sx={{ 
                      border: '2px solid #F5E8C7', 
                      '&:hover': { borderColor: '#800020', transform: 'translateY(-2px)' },
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }} onClick={() => handleQuickAction('gestionarAtletas')}>
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <GroupIcon sx={{ fontSize: 40, color: '#800020', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                          Gestionar Atletas
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                          Ver y gestionar atletas asignados
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card sx={{ 
                      border: '2px solid #F5E8C7', 
                      '&:hover': { borderColor: '#2E7D32', transform: 'translateY(-2px)' },
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }} onClick={() => handleQuickAction('eventos')}>
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <EventIcon sx={{ fontSize: 40, color: '#2E7D32', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                          Ver Eventos
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                          Consultar eventos y competencias
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card sx={{ 
                      border: '2px solid #F5E8C7', 
                      '&:hover': { borderColor: '#1976D2', transform: 'translateY(-2px)' },
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }} onClick={() => handleQuickAction('verReportes')}>
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <AssessmentIcon sx={{ fontSize: 40, color: '#1976D2', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#1976D2', fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                          Ver Reportes
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                          Análisis y reportes de rendimiento
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Actividad Reciente */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <CalendarIcon sx={{ fontSize: 30, color: '#800020', mr: 2 }} />
                  <Typography variant="h5" sx={{ color: '#800020', fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                    Actividad Reciente
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #E0E0E0', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Avatar sx={{ 
                            bgcolor: activity.tipo === 'sesion' ? '#2E7D32' : 
                                     activity.tipo === 'evento' ? '#7A4069' : '#800020',
                            mr: 2,
                            width: 32,
                            height: 32
                          }}>
                            {activity.tipo === 'sesion' ? <SportsIcon /> : 
                             activity.tipo === 'evento' ? <EventIcon /> : <WorkIcon />}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#800020', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                            {activity.titulo}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                          {activity.descripcion}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                          {new Date(activity.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="textSecondary" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                        No hay actividad reciente
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Información del Entrenador - Mismo diseño que atleta */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <PersonIcon sx={{ fontSize: 30, color: '#800020', mr: 2 }} />
              <Typography variant="h5" sx={{ color: '#800020', fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                Información Profesional
              </Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                    Especialidades:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {user?.especialidades && user.especialidades.length > 0 ? (
                      user.especialidades.map((especialidad, index) => (
                        <Chip 
                          key={index} 
                          label={especialidad} 
                          size="small" 
                          sx={{ backgroundColor: '#F5E8C7', color: '#800020' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                        No especificadas
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                    Certificaciones:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {user?.certificaciones && user.certificaciones.length > 0 ? (
                      user.certificaciones.map((certificacion, index) => (
                        <Chip 
                          key={index} 
                          label={certificacion} 
                          size="small" 
                          sx={{ backgroundColor: '#E8F5E8', color: '#2E7D32' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                        No especificadas
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                  Años de Experiencia: {user?.añosExperiencia || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
                  Estado: {user?.estado || 'Activo'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default PaginaPrincipalEntrenador;