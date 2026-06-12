import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button, 
  Alert, CircularProgress, Chip, Avatar, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput
} from '@mui/material';
import {
  Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon,
  School as SchoolIcon, Work as WorkIcon, Group as GroupIcon,
  Save as SaveIcon, Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';
import { entrenadorAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import Swal from 'sweetalert2';

const PerfilEntrenador = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [perfilData, setPerfilData] = useState({
    nombre: '',
    apellidopa: '',
    apellidoma: '',
    telefono: '',
    gmail: '',
    certificaciones: [],
    especialidades: [],
    añosExperiencia: '',
    estado: 'activo'
  });
  const [clubInfo, setClubInfo] = useState(null);

  const especialidades = [
    'Atletismo', 'Carrera de velocidad', 'Carrera de resistencia', 'Salto de longitud',
    'Salto de altura', 'Lanzamiento de jabalina', 'Lanzamiento de disco', 'Lanzamiento de peso',
    'Marcha atlética', 'Relevos', 'Decatlón', 'Heptatlón', 'Triatlón', 'Maratón',
    'Carrera de obstáculos', 'Salto con pértiga', 'Triple salto'
  ];

  const certificaciones = [
    'Federación Mexicana de Atletismo', 'CONADE', 'Comité Olímpico Mexicano',
    'Federación Internacional de Atletismo', 'Entrenador Nacional', 'Entrenador Internacional',
    'Licenciatura en Ciencias del Deporte', 'Maestría en Alto Rendimiento',
    'Certificación en Nutrición Deportiva', 'Certificación en Psicología Deportiva',
    'Certificación en Biomecánica', 'Certificación en Fisiología del Ejercicio'
  ];

  useEffect(() => {
    if (user) {
      cargarPerfil();
    }
  }, [user]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      console.log('Cargando perfil para usuario:', user);
      
      const userId = user._id || user.id;
      const response = await entrenadorAPI.getPerfil();
      
      console.log('Respuesta del servidor:', response.data);
      
      const { entrenador, club } = response.data;
      
      setPerfilData({
        nombre: entrenador.nombre || '',
        apellidopa: entrenador.apellidopa || '',
        apellidoma: entrenador.apellidoma || '',
        telefono: entrenador.telefono || '',
        gmail: entrenador.gmail || '',
        certificaciones: entrenador.certificaciones || [],
        especialidades: entrenador.especialidades || [],
        añosExperiencia: entrenador.añosExperiencia || '',
        estado: entrenador.estado || 'activo'
      });
      
      setClubInfo(club);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      console.error('Error response:', error.response?.data);
      setError(`Error al cargar el perfil: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfilData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (name, value) => {
    setPerfilData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!perfilData.nombre.trim()) errors.push('Nombre es requerido');
    if (!perfilData.apellidopa.trim()) errors.push('Apellido paterno es requerido');
    if (!perfilData.apellidoma.trim()) errors.push('Apellido materno es requerido');
    if (!perfilData.telefono.trim()) errors.push('Teléfono es requerido');
    if (!/^\d{10}$/.test(perfilData.telefono)) errors.push('Teléfono debe tener 10 dígitos');
    if (!perfilData.gmail.trim()) errors.push('Email es requerido');
    if (!/\S+@\S+\.\S+/.test(perfilData.gmail)) errors.push('Email debe tener formato válido');
    if (perfilData.añosExperiencia < 0 || perfilData.añosExperiencia > 50) {
      errors.push('Años de experiencia deben estar entre 0 y 50');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      console.log('Enviando datos actualizados:', perfilData);
      
      const userId = user._id || user.id;
      const response = await axios.put(`http://localhost:5000/api/entrenador/perfil/${userId}`, perfilData);
      
      console.log('Respuesta del servidor:', response.data);
      
      // Actualizar el contexto de autenticación con los nuevos datos
      if (response.data.success) {
        // Actualizar el usuario en el contexto
        const updatedUser = {
          ...user,
          nombre: perfilData.nombre,
          apellidopa: perfilData.apellidopa,
          apellidoma: perfilData.apellidoma,
          telefono: perfilData.telefono,
          gmail: perfilData.gmail,
          certificaciones: perfilData.certificaciones,
          especialidades: perfilData.especialidades,
          añosExperiencia: perfilData.añosExperiencia,
          estado: perfilData.estado
        };
        
        // Actualizar en sessionStorage
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Forzar recarga de datos del perfil
        await cargarPerfil();
      }
      
      setSuccess('Perfil actualizado correctamente');
      setEditMode(false);
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Perfil actualizado correctamente. Los cambios se han guardado en la base de datos.',
        confirmButtonColor: '#800020'
      });
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      console.error('Error response:', error.response?.data);
      setError(`Error al actualizar el perfil: ${error.response?.data?.message || error.message}`);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al actualizar el perfil: ${error.response?.data?.message || error.message}`,
        confirmButtonColor: '#800020'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    cargarPerfil(); // Recargar datos originales
    setError('');
    setSuccess('');
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
      <Container maxWidth="lg" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        Perfil del Entrenador
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

      <Grid container spacing={4}>
        {/* Información Personal */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ mr: 2, bgcolor: '#800020', width: 56, height: 56 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
                  Información Personal
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Datos básicos del entrenador
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={perfilData.nombre}
                  onChange={handleChange}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellido Paterno"
                  name="apellidopa"
                  value={perfilData.apellidopa}
                  onChange={handleChange}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Apellido Materno"
                  name="apellidoma"
                  value={perfilData.apellidoma}
                  onChange={handleChange}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={perfilData.telefono}
                  onChange={handleChange}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="gmail"
                  value={perfilData.gmail}
                  onChange={handleChange}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Información Profesional */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ mr: 2, bgcolor: '#7A4069', width: 56, height: 56 }}>
                <SchoolIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#7A4069', fontWeight: 'bold' }}>
                  Información Profesional
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Credenciales y experiencia
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Especialidades</InputLabel>
                  <Select
                    multiple
                    name="especialidades"
                    value={perfilData.especialidades}
                    onChange={(e) => handleMultiSelectChange('especialidades', e.target.value)}
                    disabled={!editMode}
                    input={<OutlinedInput label="Especialidades" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {especialidades.map((especialidad) => (
                      <MenuItem key={especialidad} value={especialidad}>
                        {especialidad}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Certificaciones</InputLabel>
                  <Select
                    multiple
                    name="certificaciones"
                    value={perfilData.certificaciones}
                    onChange={(e) => handleMultiSelectChange('certificaciones', e.target.value)}
                    disabled={!editMode}
                    input={<OutlinedInput label="Certificaciones" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {certificaciones.map((certificacion) => (
                      <MenuItem key={certificacion} value={certificacion}>
                        {certificacion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Años de Experiencia"
                  name="añosExperiencia"
                  type="number"
                  value={perfilData.añosExperiencia}
                  onChange={handleChange}
                  disabled={!editMode}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, max: 50 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={perfilData.estado}
                    onChange={handleChange}
                    disabled={!editMode}
                    label="Estado"
                  >
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Información del Club */}
        {clubInfo && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ mr: 2, bgcolor: '#2E7D32', width: 56, height: 56 }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                    Club Asignado
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Información del club donde trabaja
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    Nombre del Club:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {clubInfo.nombre}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    Email del Club:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {clubInfo.email}
                  </Typography>
                </Grid>
                {clubInfo.telefono && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      Teléfono del Club:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {clubInfo.telefono}
                    </Typography>
                  </Grid>
                )}
                {clubInfo.descripcion && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      Descripción del Club:
                    </Typography>
                    <Typography variant="body1">
                      {clubInfo.descripcion}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Botones de Acción */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" gap={2}>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                sx={{ 
                  backgroundColor: '#800020',
                  '&:hover': { backgroundColor: '#600018' }
                }}
              >
                Editar Perfil
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ 
                    backgroundColor: '#2E7D32',
                    '&:hover': { backgroundColor: '#1B5E20' }
                  }}
                >
                  {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar Cambios'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  sx={{ 
                    borderColor: '#7A4069',
                    color: '#7A4069',
                    '&:hover': { borderColor: '#5A3049', backgroundColor: '#F5E8C7' }
                  }}
                >
                  Cancelar
                </Button>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
    </>
  );
};

export default PerfilEntrenador;
