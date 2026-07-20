import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Chip,
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
import { clubesAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// --- Paleta institucional IVD (misma que las páginas principales) ---
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)',
  lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = {
  bgcolor: COLORS.paper,
  borderRadius: '10px',
  boxShadow: '0 2px 12px rgba(128,0,32,0.07)',
};

const inputStyles = {
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.burgundy },
  '& .MuiInputLabel-root.Mui-focused': { color: COLORS.burgundy },
};

const EstadoChip = ({ label, positivo = true }) => (
  <Chip
    icon={<CheckIcon sx={{ fontSize: 16, color: `${positivo ? COLORS.purple : COLORS.ink} !important` }} />}
    label={label}
    size="small"
    sx={{ bgcolor: 'transparent', border: `1px solid ${positivo ? COLORS.purple : COLORS.line}`, color: positivo ? COLORS.purple : COLORS.ink, fontWeight: 700 }}
  />
);

const ReadOnlyField = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 2, px: 1 }}>
    <Box sx={{ color: COLORS.burgundy, mt: 0.4, flexShrink: 0, fontSize: 22 }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', mb: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ color: COLORS.ink, fontWeight: 600, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

const PerfilClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      const response = await clubesAPI.getAll();
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

      await clubesAPI.update(clubData.id, {
        nombre: clubData.nombre.trim(),
        direccion: clubData.direccion.trim(),
        telefono: clubData.telefono.trim(),
        email: clubData.email.trim(),
        entrenador: clubData.entrenador.trim(),
        descripcion: clubData.descripcion.trim(),
        estado: clubData.estado,
      });

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  const estadoTexto = clubData.estado === 'activo' ? 'Activo' : 'Inactivo';

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>

        {/* ── Alertas ── */}
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2, borderRadius: '8px' }}>
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2, borderRadius: '8px' }}>
            {successMessage}
          </Alert>
        )}

        {/* ── Encabezado de perfil ── */}
        <Box sx={{ ...cardSx, mb: 3, overflow: 'visible', position: 'relative' }}>
          <Box sx={{ bgcolor: COLORS.burgundy, height: { xs: 80, md: 100 }, borderRadius: '10px 10px 0 0' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: { xs: '-40px', md: '-48px' }, pb: 3 }}>
            <Avatar
              sx={{
                width: { xs: 80, md: 96 }, height: { xs: 80, md: 96 },
                bgcolor: COLORS.purple, border: '4px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', mb: 1.5,
              }}
            >
              <GroupIcon sx={{ fontSize: { xs: 36, md: 44 } }} />
            </Avatar>

            <Typography variant="h5" sx={{ color: COLORS.burgundy, fontWeight: 800, textAlign: 'center', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              {clubData.nombre || 'Club Deportivo'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip
                icon={<CheckIcon sx={{ fontSize: 16, color: `${COLORS.burgundy} !important` }} />}
                label={estadoTexto}
                size="small"
                sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.burgundy}`, color: COLORS.burgundy, fontWeight: 700 }}
              />
              {clubData.entrenador && (
                <Chip
                  icon={<PersonIcon sx={{ fontSize: 16, color: `${COLORS.purple} !important` }} />}
                  label={`Entrenador: ${clubData.entrenador}`}
                  size="small"
                  sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>
        </Box>


        {/* Información del Club */}
        <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800 }}>Información del Club</Typography>
            {!editMode ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ borderColor: COLORS.burgundy, color: COLORS.burgundy, fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
              >
                Editar
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{ borderColor: COLORS.purple, color: COLORS.purple, fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{ bgcolor: COLORS.burgundy, fontWeight: 700, '&:hover': { bgcolor: COLORS.burgundyDark } }}
                >
                  Guardar
                </Button>
              </Box>
            )}
          </Box>
          <Divider sx={{ mb: 2, borderColor: COLORS.line }} />

          {editMode ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Nombre del Club" name="nombre" value={clubData.nombre || ''} onChange={handleInputChange} fullWidth size="small" required sx={inputStyles} />
                <TextField label="Correo Electrónico" name="email" type="email" value={clubData.email || ''} onChange={handleInputChange} fullWidth size="small" required sx={inputStyles} />
                <TextField label="Teléfono (10 dígitos)" name="telefono" value={clubData.telefono || ''} onChange={handleInputChange} fullWidth size="small" required placeholder="Ej: 5512345678" sx={inputStyles} />
                <TextField label="Entrenador Principal" name="entrenador" value={clubData.entrenador || ''} onChange={handleInputChange} fullWidth size="small" sx={inputStyles} />
                <TextField label="Dirección" name="direccion" value={clubData.direccion || ''} onChange={handleInputChange} fullWidth size="small" sx={{ ...inputStyles, gridColumn: { sm: '1 / -1' } }} />
                <TextField
                  label="Descripción del Club (Opcional)"
                  name="descripcion"
                  value={clubData.descripcion || ''}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Describe tu club, su historia, misión, valores, logros, etc."
                  sx={{ ...inputStyles, gridColumn: { sm: '1 / -1' } }}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <ReadOnlyField icon={<GroupIcon fontSize="small" />} label="Nombre" value={clubData.nombre} />
              <ReadOnlyField icon={<EmailIcon fontSize="small" />} label="Correo" value={clubData.email} />
              <ReadOnlyField icon={<PhoneIcon fontSize="small" />} label="Teléfono" value={clubData.telefono} />
              <ReadOnlyField icon={<PersonIcon fontSize="small" />} label="Entrenador" value={clubData.entrenador} />
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <ReadOnlyField icon={<LocationIcon fontSize="small" />} label="Dirección" value={clubData.direccion} />
              </Box>
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <ReadOnlyField icon={<DescriptionIcon fontSize="small" />} label="Descripción" value={clubData.descripcion} />
              </Box>
            </Box>
          )}
        </Box>

        {!editMode && (
          <Box sx={{ mt: 3, p: 3, ...cardSx, boxShadow: 'none', border: `1px solid ${COLORS.line}` }}>
            <Typography variant="body2" sx={{ color: COLORS.purple, fontStyle: 'italic' }}>
              💡 <strong>Consejo:</strong> Mantén tu información actualizada para que los atletas puedan conocer mejor tu club. Una descripción atractiva puede ayudar a atraer nuevos talentos.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PerfilClub;