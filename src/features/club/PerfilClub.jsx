import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const PerfilClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clubData, setClubData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    descripcion: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    fetchClubData();
  }, [user, navigate]);

  const fetchClubData = async () => {
    try {
      setLoading(true);
              const response = await axios.get(`http://localhost:5000/api/clubes/${user.id}`);
      const data = response.data;
      setClubData({
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono || '',
        descripcion: data.descripcion || '',
      });
      setErrorMessage('');
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      setErrorMessage('Error al cargar el perfil. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClubData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setEditMode(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancel = () => {
    setEditMode(false);
    fetchClubData(); // Recargar datos originales
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSave = async () => {
    try {
      // Validaciones básicas
      if (!clubData.nombre.trim()) {
        setErrorMessage('El nombre del club es obligatorio.');
        return;
      }

      if (!clubData.email.trim()) {
        setErrorMessage('El correo electrónico es obligatorio.');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clubData.email)) {
        setErrorMessage('Por favor ingrese un correo electrónico válido.');
        return;
      }

      if (!clubData.telefono.trim()) {
        setErrorMessage('El teléfono es obligatorio.');
        return;
      }

      // Validar formato de teléfono (exactamente 10 dígitos)
      const telefonoLimpio = clubData.telefono.replace(/\D/g, '');
      if (telefonoLimpio.length !== 10) {
        setErrorMessage('El teléfono debe tener exactamente 10 dígitos.');
        return;
      }

      // Obtener datos actuales del club para mantener campos no editables
              const clubActual = await axios.get(`http://localhost:5000/api/clubes/${user.id}`);
      const datosActuales = clubActual.data;

              await axios.put(`http://localhost:5000/api/clubes/${user.id}`, {
        nombre: clubData.nombre.trim(),
        direccion: datosActuales.direccion || '', // Mantener dirección existente
        telefono: clubData.telefono.trim(),
        email: clubData.email.trim(),
        entrenador: datosActuales.entrenador || '', // Mantener entrenador existente
        descripcion: clubData.descripcion.trim(),
        estado: datosActuales.estado || 'activo', // Mantener estado existente
      });

      setEditMode(false);
      setSuccessMessage('Perfil actualizado exitosamente.');
      setErrorMessage('');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setErrorMessage(error.response?.data?.message || 'Error al guardar el perfil. Intente de nuevo.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        Perfil del Club
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, borderRadius: '12px', background: '#FFFFFF', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            📋 Información del Club
          </Typography>
          {!editMode && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ 
                color: '#800020', 
                borderColor: '#800020',
                '&:hover': { 
                  backgroundColor: '#800020',
                  color: 'white'
                }
              }}
            >
              Editar Información
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del Club"
              name="nombre"
              value={clubData.nombre}
              onChange={handleInputChange}
              disabled={!editMode}
              required
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '8px', 
                  backgroundColor: editMode ? '#FAFAFF' : 'transparent',
                  '&:hover fieldset': { borderColor: '#800020' },
                  '&.Mui-focused fieldset': { borderColor: '#800020' }
                },
                '& .MuiInputLabel-root': { color: '#800020' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#800020' }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              name="email"
              type="email"
              value={clubData.email}
              onChange={handleInputChange}
              disabled={!editMode}
              required
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '8px', 
                  backgroundColor: editMode ? '#FAFAFF' : 'transparent',
                  '&:hover fieldset': { borderColor: '#800020' },
                  '&.Mui-focused fieldset': { borderColor: '#800020' }
                },
                '& .MuiInputLabel-root': { color: '#800020' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#800020' }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              value={clubData.telefono}
              onChange={handleInputChange}
              disabled={!editMode}
              required
              placeholder="Ej: 5512345678 (10 dígitos)"
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '8px', 
                  backgroundColor: editMode ? '#FAFAFF' : 'transparent',
                  '&:hover fieldset': { borderColor: '#800020' },
                  '&.Mui-focused fieldset': { borderColor: '#800020' }
                },
                '& .MuiInputLabel-root': { color: '#800020' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#800020' }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción del Club (Opcional)"
              name="descripcion"
              value={clubData.descripcion}
              onChange={handleInputChange}
              disabled={!editMode}
              multiline
              rows={4}
              placeholder="Describe tu club, su historia, misión, valores, logros, etc..."
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '8px', 
                  backgroundColor: editMode ? '#FAFAFF' : 'transparent',
                  '&:hover fieldset': { borderColor: '#800020' },
                  '&.Mui-focused fieldset': { borderColor: '#800020' }
                },
                '& .MuiInputLabel-root': { color: '#800020' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#800020' }
              }}
            />
          </Grid>
        </Grid>

        {editMode && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              sx={{ 
                color: '#666',
                borderColor: '#666',
                '&:hover': { 
                  backgroundColor: '#666',
                  color: 'white'
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{
                background: '#800020',
                '&:hover': {
                  background: '#600018',
                },
              }}
            >
              Guardar Cambios
            </Button>
          </Box>
        )}

        {!editMode && (
          <Box sx={{ mt: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: '8px' }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
              💡 <strong>Consejo:</strong> Mantén tu información actualizada para que los atletas puedan conocer mejor tu club. 
              Una descripción atractiva puede ayudar a atraer nuevos talentos.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PerfilClub;