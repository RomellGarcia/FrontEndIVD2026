import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
  Divider,
  Chip,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Group as GroupIcon,
  CheckCircle as CheckIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e4e4e5';

const PerfilClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [clubData, setClubData] = useState({
    id: null,
    nombre: '',
    email: '',
    telefono: '',
    descripcion: '',
    direccion: '',
    entrenador: '',
    estado: 'activo',
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
      // Obtener todos los clubes y filtrar por email
      const response = await axios.get('http://localhost:5000/api/clubes');
      let clubes = response.data.clubes || response.data || [];
      if (!Array.isArray(clubes)) {
        clubes = [clubes];
      }
      const club = clubes.find(c => c.email === user.email);
      if (!club) {
        setErrorMessage('No se encontró un club asociado a este usuario.');
        setClubData({
          id: null,
          nombre: '',
          email: user.email || '',
          telefono: '',
          descripcion: '',
          direccion: '',
          entrenador: '',
          estado: 'activo',
        });
        setLoading(false);
        return;
      }

      setClubData({
        id: club.id || club._id,
        nombre: club.nombre || '',
        email: club.email || '',
        telefono: club.telefono || '',
        descripcion: club.descripcion || '',
        direccion: club.direccion || '',
        entrenador: club.entrenador || '',
        estado: club.estado || 'activo',
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
    fetchClubData();
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSave = async () => {
    try {
      if (!clubData.nombre.trim()) {
        setErrorMessage('El nombre del club es obligatorio.');
        return;
      }
      if (!clubData.email.trim()) {
        setErrorMessage('El correo electrónico es obligatorio.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clubData.email)) {
        setErrorMessage('Por favor ingrese un correo electrónico válido.');
        return;
      }
      if (!clubData.telefono.trim()) {
        setErrorMessage('El teléfono es obligatorio.');
        return;
      }
      const telefonoLimpio = clubData.telefono.replace(/\D/g, '');
      if (telefonoLimpio.length !== 10) {
        setErrorMessage('El teléfono debe tener exactamente 10 dígitos.');
        return;
      }

      if (!clubData.id) {
        setErrorMessage('No se puede actualizar: falta el ID del club.');
        return;
      }
      const token = user?.token;

      await axios.put(
        `http://localhost:5000/api/clubes/${clubData.id}`,
        {
          nombre: clubData.nombre.trim(),
          direccion: clubData.direccion.trim(),
          telefono: clubData.telefono.trim(),
          email: clubData.email.trim(),
          entrenador: clubData.entrenador.trim(),
          descripcion: clubData.descripcion.trim(),
          estado: clubData.estado,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditMode(false);
      setSuccessMessage('Perfil actualizado exitosamente.');
      setErrorMessage('');
      await fetchClubData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setErrorMessage(error.response?.data?.message || 'Error al guardar el perfil. Intente de nuevo.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: CREAM }}>
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  const estadoTexto = clubData.estado === 'activo' ? 'Activo' : 'Inactivo';
  const estadoColor = clubData.estado === 'activo' ? 'success' : 'error';

  const ReadOnlyField = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 2, px: 1 }}>
      <Box sx={{ color: BURGUNDY, mt: 0.4, flexShrink: 0, fontSize: 22 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: PURPLE, fontWeight: 500, mb: 0.3 }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ color: '#1a1a1a', fontWeight: 600, wordBreak: 'break-word' }}>
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Alertas */}
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2, borderRadius: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Header */}
        <Card sx={{ borderRadius: 3, mb: 3, overflow: 'visible', position: 'relative' }}>
          <Box sx={{ bgcolor: BURGUNDY, height: { xs: 80, md: 100 }, borderRadius: '12px 12px 0 0' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: { xs: '-40px', md: '-48px' }, pb: 3 }}>
            <Avatar sx={{ width: { xs: 80, md: 96 }, height: { xs: 80, md: 96 }, bgcolor: PURPLE, border: '4px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', mb: 1.5 }}>
              <GroupIcon sx={{ fontSize: { xs: 40, md: 50 } }} />
            </Avatar>
            <Typography variant="h5" sx={{ color: BURGUNDY, fontWeight: 'bold', textAlign: 'center' }}>
              {clubData.nombre || 'Club Deportivo'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip icon={<CheckIcon sx={{ fontSize: 16 }} />} label={estadoTexto} color={estadoColor} size="small" sx={{ fontWeight: 600 }} />
              {clubData.entrenador && (
                <Chip icon={<PersonIcon sx={{ fontSize: 16 }} />} label={`Entrenador: ${clubData.entrenador}`} size="small" sx={{ bgcolor: 'rgba(122,64,105,0.08)', color: PURPLE, fontWeight: 500 }} />
              )}
            </Box>
          </Box>
        </Card>

        {/* Información del Club */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>Información del Club</Typography>
              {!editMode ? (
                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={handleEdit} sx={{ borderColor: BURGUNDY, color: BURGUNDY, '&:hover': { borderColor: '#600018', bgcolor: 'rgba(128,0,32,0.04)' } }}>Editar</Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<CancelIcon />} onClick={handleCancel} sx={{ borderColor: PURPLE, color: PURPLE, '&:hover': { bgcolor: 'rgba(122,64,105,0.04)' } }}>Cancelar</Button>
                  <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSave} sx={{ bgcolor: BURGUNDY, '&:hover': { bgcolor: '#600018' } }}>Guardar</Button>
                </Box>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {editMode ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Nombre del Club" name="nombre" value={clubData.nombre || ''} onChange={handleInputChange} fullWidth size="small" required sx={inputStyles} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Correo Electrónico" name="email" type="email" value={clubData.email || ''} onChange={handleInputChange} fullWidth size="small" required sx={inputStyles} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Teléfono (10 dígitos)" name="telefono" value={clubData.telefono || ''} onChange={handleInputChange} fullWidth size="small" required placeholder="Ej: 5512345678" sx={inputStyles} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Entrenador Principal" name="entrenador" value={clubData.entrenador || ''} onChange={handleInputChange} fullWidth size="small" sx={inputStyles} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Dirección" name="direccion" value={clubData.direccion || ''} onChange={handleInputChange} fullWidth size="small" sx={inputStyles} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Descripción del Club (Opcional)" name="descripcion" value={clubData.descripcion || ''} onChange={handleInputChange} fullWidth multiline rows={3} placeholder="Describe tu club, su historia, misión, valores, logros, etc." sx={inputStyles} />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={0}>
                <Grid item xs={12} sm={6}><ReadOnlyField icon={<GroupIcon fontSize="small" />} label="Nombre" value={clubData.nombre} /></Grid>
                <Grid item xs={12} sm={6}><ReadOnlyField icon={<EmailIcon fontSize="small" />} label="Correo" value={clubData.email} /></Grid>
                <Grid item xs={12} sm={6}><ReadOnlyField icon={<PhoneIcon fontSize="small" />} label="Teléfono" value={clubData.telefono} /></Grid>
                <Grid item xs={12} sm={6}><ReadOnlyField icon={<PersonIcon fontSize="small" />} label="Entrenador" value={clubData.entrenador} /></Grid>
                <Grid item xs={12}><ReadOnlyField icon={<LocationIcon fontSize="small" />} label="Dirección" value={clubData.direccion} /></Grid>
                <Grid item xs={12}><ReadOnlyField icon={<DescriptionIcon fontSize="small" />} label="Descripción" value={clubData.descripcion} /></Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {!editMode && (
          <Box sx={{ mt: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
              💡 <strong>Consejo:</strong> Mantén tu información actualizada para que los atletas puedan conocer mejor tu club. Una descripción atractiva puede ayudar a atraer nuevos talentos.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

const inputStyles = {
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BURGUNDY },
  '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
};

export default PerfilClub;