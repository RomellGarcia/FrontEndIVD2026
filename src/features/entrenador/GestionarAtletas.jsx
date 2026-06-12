import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Alert, Chip, Avatar, CircularProgress, Card, CardContent, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip as MuiChip
} from '@mui/material';
import {
  Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, 
  LocationOn as LocationIcon, CalendarToday as CalendarIcon, 
  Visibility as VisibilityIcon, Edit as EditIcon, 
  TrendingUp as TrendingUpIcon, Sports as SportsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { entrenadorAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const GestionarAtletas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [atletas, setAtletas] = useState([]);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedAtleta, setSelectedAtleta] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  useEffect(() => {
    if (user) {
      cargarAtletas();
    }
  }, [user]);

  const cargarAtletas = async () => {
    try {
      setLoading(true);
      console.log('Cargando atletas para entrenador:', user.id);
      console.log('Usuario actual:', user);
      
      const response = await entrenadorAPI.getAtletas();
      console.log('Respuesta del servidor:', response.data);
      setAtletas(response.data);
    } catch (error) {
      console.error('Error al cargar atletas:', error);
      console.error('Detalles del error:', error.response?.data);
      setError('Error al cargar los atletas asignados');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (atleta) => {
    setSelectedAtleta(atleta);
    setOpenDetailsModal(true);
  };

  const handleCloseModal = () => {
    setOpenDetailsModal(false);
    setSelectedAtleta(null);
  };

  const calcularEdad = (fechaNacimiento) => {
    const fecha = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
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

  const obtenerEstadoAtleta = (atleta) => {
    // Lógica para determinar el estado del atleta
    if (atleta.estado === 'activo') return 'Activo';
    if (atleta.estado === 'inactivo') return 'Inactivo';
    return 'Activo'; // Por defecto
  };

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
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        Gestionar Atletas Asignados
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Header con estadísticas */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: '#7A4069' }}>
          Total de Atletas: {atletas.length}
        </Typography>
        <Box>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
            sx={{ mr: 1, backgroundColor: viewMode === 'table' ? '#800020' : 'transparent' }}
          >
            Tabla
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('cards')}
            sx={{ backgroundColor: viewMode === 'cards' ? '#800020' : 'transparent' }}
          >
            Tarjetas
          </Button>
        </Box>
      </Box>

      {!user.clubId ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <SportsIcon sx={{ fontSize: 60, color: '#7A4069', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#7A4069', mb: 2 }}>
            No estás asignado a ningún club
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Para gestionar atletas, primero necesitas unirte a un club
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/entrenador/buscar-clubes')}
            sx={{ 
              backgroundColor: '#800020',
              '&:hover': { backgroundColor: '#600018' }
            }}
          >
            Buscar Clubes Disponibles
          </Button>
        </Paper>
      ) : atletas.length === 0 ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <SportsIcon sx={{ fontSize: 60, color: '#7A4069', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#7A4069', mb: 2 }}>
            No hay atletas asignados
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Los atletas que se asignen a tu club aparecerán aquí
          </Typography>
        </Paper>
      ) : viewMode === 'table' ? (
        // Vista de Tabla
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
            <Table stickyHeader sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#800020', color: 'white', fontWeight: 'bold' }}>
                    Atleta
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#800020', color: 'white', fontWeight: 'bold' }}>
                    Edad
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#800020', color: 'white', fontWeight: 'bold' }}>
                    Contacto
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#800020', color: 'white', fontWeight: 'bold' }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#800020', color: 'white', fontWeight: 'bold' }}>
                    Fecha de Ingreso
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#800020', color: 'white', fontWeight: 'bold' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {atletas.map((atleta) => (
                  <TableRow key={atleta._id} sx={{ '&:hover': { backgroundColor: '#FAFAFF' } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: '#800020' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {atleta.nombre} {atleta.apellidopa} {atleta.apellidoma}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            CURP: {atleta.curp}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {calcularEdad(atleta.fecha_nacimiento)} años
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatearFecha(atleta.fecha_nacimiento)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, mr: 1, color: '#7A4069' }} />
                          {atleta.gmail}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ fontSize: 16, mr: 1, color: '#7A4069' }} />
                          {atleta.telefono}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={obtenerEstadoAtleta(atleta)}
                        color={obtenerEstadoAtleta(atleta) === 'Activo' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatearFecha(atleta.fechaIngresoClub || atleta.fechaRegistro)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleVerDetalles(atleta)}
                        sx={{ color: '#800020' }}
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      ) : (
        // Vista de Tarjetas
        <Grid container spacing={3}>
          {atletas.map((atleta) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={atleta._id}>
              <Card sx={{ 
                height: '100%', 
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                transition: 'all 0.3s ease'
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2, bgcolor: '#800020', width: 56, height: 56 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#800020' }}>
                        {atleta.nombre} {atleta.apellidopa}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {atleta.apellidoma}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, mr: 1, color: '#7A4069' }} />
                      {calcularEdad(atleta.fecha_nacimiento)} años
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ fontSize: 16, mr: 1, color: '#7A4069' }} />
                      {atleta.gmail}
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ fontSize: 16, mr: 1, color: '#7A4069' }} />
                      {atleta.telefono}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip
                      label={obtenerEstadoAtleta(atleta)}
                      color={obtenerEstadoAtleta(atleta) === 'Activo' ? 'success' : 'default'}
                      size="small"
                    />
                    <Typography variant="caption" color="textSecondary">
                      Ingreso: {formatearFecha(atleta.fechaIngresoClub || atleta.fechaRegistro)}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleVerDetalles(atleta)}
                    sx={{ 
                      borderColor: '#800020', 
                      color: '#800020',
                      '&:hover': { borderColor: '#7A4069', backgroundColor: '#F5E8C7' }
                    }}
                  >
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de Detalles */}
      <Dialog 
        open={openDetailsModal} 
        onClose={handleCloseModal} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Detalles del Atleta
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedAtleta && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069', mb: 1 }}>
                  Información Personal
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Nombre completo:</strong> {selectedAtleta.nombre} {selectedAtleta.apellidopa} {selectedAtleta.apellidoma}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>CURP:</strong> {selectedAtleta.curp}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Fecha de nacimiento:</strong> {formatearFecha(selectedAtleta.fecha_nacimiento)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Edad:</strong> {calcularEdad(selectedAtleta.fecha_nacimiento)} años
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Género:</strong> {selectedAtleta.sexo}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Estado de nacimiento:</strong> {selectedAtleta.estadoNacimiento}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069', mb: 1 }}>
                  Información de Contacto
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {selectedAtleta.gmail}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Teléfono:</strong> {selectedAtleta.telefono}
                  </Typography>
                </Box>

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#7A4069', mb: 1 }}>
                  Información del Club
                </Typography>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Estado:</strong> {obtenerEstadoAtleta(selectedAtleta)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Fecha de ingreso al club:</strong> {formatearFecha(selectedAtleta.fechaIngresoClub || selectedAtleta.fechaRegistro)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Fecha de registro:</strong> {formatearFecha(selectedAtleta.fechaRegistro)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} sx={{ color: '#7A4069' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
};

export default GestionarAtletas;
