import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  OutlinedInput,
  Tabs,
  Tab
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Sports as SportsIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const PromocionarAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [entrenadores, setEntrenadores] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const especialidades = [
    'Atletismo',
    'Carrera de velocidad',
    'Carrera de resistencia',
    'Salto de longitud',
    'Salto de altura',
    'Lanzamiento de jabalina',
    'Lanzamiento de disco',
    'Lanzamiento de peso',
    'Marcha atlética',
    'Relevos',
    'Cross country',
    'Maratón',
    'Triatlón',
    'Pentatlón',
    'Decatlón'
  ];

  const certificaciones = [
    'Federación Mexicana de Atletismo',
    'CONADE (Comisión Nacional del Deporte)',
    'Instituto del Deporte del Estado',
    'Escuela Nacional de Entrenadores Deportivos',
    'Federación Internacional de Atletismo',
    'Certificación de Entrenador Personal',
    'Licenciatura en Ciencias del Deporte',
    'Maestría en Entrenamiento Deportivo',
    'Certificación de Primeros Auxilios',
    'Certificación de Nutrición Deportiva'
  ];

  useEffect(() => {
    if (!user || user.rol !== 'administrador') {
      navigate('/login');
      return;
    }
    cargarDatos();
  }, [user, navigate]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [entrenadoresRes, clubesRes] = await Promise.all([
        Promise.resolve({ data: { entrenadores: [] } }), // TODO: endpoint de entrenadores global
                  axios.get('http://localhost:5000/api/clubes')
      ]);
      setEntrenadores(entrenadoresRes.data);
      setClubes(clubesRes.data);
      setError('');
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const obtenerClubEntrenador = (clubId) => {
    if (!clubId) return 'Independiente';
    const club = clubes.find(c => c._id === clubId);
    return club ? club.nombre : 'Club no encontrado';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const fechaActual = new Date();
    const fechaNac = new Date(fechaNacimiento);
    const edad = fechaActual.getFullYear() - fechaNac.getFullYear();
    const mes = fechaActual.getMonth() - fechaNac.getMonth();
    return mes < 0 || (mes === 0 && fechaActual.getDate() < fechaNac.getDate()) ? edad - 1 : edad;
  };



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, background: '#e4e4e5', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        🏆 Gestionar Entrenadores
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ 
          '& .MuiTab-root': { 
            color: '#7A4069',
            fontWeight: 'bold',
            fontSize: '16px'
          },
          '& .Mui-selected': { 
            color: '#800020 !important'
          },
          '& .MuiTabs-indicator': { 
            backgroundColor: '#800020'
          }
        }}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SportsIcon />
                Entrenadores Registrados
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon />
                Asignaciones-Club
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {/* Contenido de la pestaña Entrenadores Registrados */}
      {activeTab === 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#800020' }}>
              Total de Entrenadores: {entrenadores.length}
            </Typography>
          </Box>

          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ 
              maxHeight: '70vh', 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#800020',
                borderRadius: '4px',
                '&:hover': {
                  background: '#600018',
                },
              },
            }}>
              <Table stickyHeader sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      backgroundColor: '#800020', 
                      color: 'white', 
                      fontWeight: 'bold',
                      minWidth: 200,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      Entrenador
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#800020', 
                      color: 'white', 
                      fontWeight: 'bold',
                      minWidth: 150,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      Edad
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#800020', 
                      color: 'white', 
                      fontWeight: 'bold',
                      minWidth: 120,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      Teléfono
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#800020', 
                      color: 'white', 
                      fontWeight: 'bold',
                      minWidth: 200,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#800020', 
                      color: 'white', 
                      fontWeight: 'bold',
                      minWidth: 150,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      Especialidades
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#800020', 
                      color: 'white', 
                      fontWeight: 'bold',
                      minWidth: 150,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      Experiencia
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#800020', 
                      color: 'white', 
                      fontWeight: 'bold',
                      minWidth: 150,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      Club
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entrenadores.map((entrenador) => (
                    <TableRow key={entrenador._id} sx={{ '&:hover': { backgroundColor: '#FAFAFF' } }}>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#800020' }}>
                            {entrenador.nombre?.charAt(0) || 'E'}
                          </Avatar>
                          <Typography variant="body2" noWrap>
                            {entrenador.nombre} {entrenador.apellidopa} {entrenador.apellidoma}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Typography variant="body2">
                          {calcularEdad(entrenador.fecha_nacimiento)} años
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Typography variant="body2">
                          {entrenador.telefono || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" noWrap>
                          {entrenador.gmail || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {entrenador.especialidades && entrenador.especialidades.length > 0 ? (
                            entrenador.especialidades.slice(0, 2).map((esp, index) => (
                              <Chip key={index} label={esp} size="small" color="primary" />
                            ))
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Sin especificar
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Typography variant="body2">
                          {entrenador.añosExperiencia || 'N/A'} años
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Chip 
                            label={obtenerClubEntrenador(entrenador.clubId)} 
                            size="small"
                            color={entrenador.clubId ? 'success' : 'default'}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </>
      )}

      {/* Contenido de la pestaña Asignaciones-Club */}
      {activeTab === 1 && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#800020', mb: 2 }}>
              Asignaciones de Entrenadores por Club
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {clubes.map((club) => {
              const entrenadoresClub = entrenadores.filter(e => e.clubId === club._id);
              return (
                <Grid item xs={12} md={6} lg={4} key={club._id}>
                  <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <GroupIcon sx={{ color: '#800020' }} />
                      <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
                        {club.nombre}
                      </Typography>
                      <Chip 
                        label={entrenadoresClub.length} 
                        color="success" 
                        size="small"
                      />
                    </Box>

                    {entrenadoresClub.length === 0 ? (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                        No hay entrenadores asignados
                      </Typography>
                    ) : (
                      <Box>
                        {entrenadoresClub.map((entrenador) => (
                          <Box key={entrenador._id} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 1,
                            p: 1,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1
                          }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#800020', fontSize: '12px' }}>
                              {entrenador.nombre?.charAt(0) || 'E'}
                            </Avatar>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {entrenador.nombre} {entrenador.apellidopa}
                            </Typography>
                            <Chip 
                              label={entrenador.especialidades?.[0] || 'Sin especialidad'} 
                              size="small"
                              color="primary"
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default PromocionarAtleta;
