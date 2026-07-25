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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  FitnessCenter as FitnessCenterIcon,
} from '@mui/icons-material';
import { clubesAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Paleta de colores institucional
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

// Chip que muestra el estado del club
const EstadoChip = ({ label, positivo = true }) => (
  <Chip
    icon={<CheckIcon sx={{ fontSize: 16, color: `${positivo ? COLORS.purple : COLORS.ink} !important` }} />}
    label={label}
    size="small"
    sx={{ bgcolor: 'transparent', border: `1px solid ${positivo ? COLORS.purple : COLORS.line}`, color: positivo ? COLORS.purple : COLORS.ink, fontWeight: 700 }}
  />
);

// Campo de solo lectura con ícono
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

  const [datosClub, setDatosClub] = useState({
    id: null,
    nombre: '',
    email: '',
    telefono: '',
    descripcion: '',
    direccion: '',
    lugar_entrenamiento: '',
    entrenador_id: '',
    entrenador_nombre: '',
    estado: 'activo',
  });
  const [entrenadoresDelClub, setEntrenadoresDelClub] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    cargarDatosClub();
  }, [user, navigate]);

  // Carga los datos del club y sus entrenadores
  const cargarDatosClub = async () => {
    try {
      setCargando(true);
      const response = await clubesAPI.getAll();
      let clubes = response.data.clubes || response.data || [];
      if (!Array.isArray(clubes)) {
        clubes = [clubes];
      }
      const club = clubes.find(c => c.email === user.email);
      if (!club) {
        setMensajeError('No se encontró un club asociado a este usuario.');
        setDatosClub({
          id: null,
          nombre: '',
          email: user.email || '',
          telefono: '',
          descripcion: '',
          direccion: '',
          lugar_entrenamiento: '',
          entrenador_id: '',
          entrenador_nombre: '',
          estado: 'activo',
        });
        setCargando(false);
        return;
      }

      const clubId = club.id || club._id;

      setDatosClub({
        id: clubId,
        nombre: club.nombre || '',
        email: club.email || '',
        telefono: club.telefono || '',
        descripcion: club.descripcion || '',
        direccion: club.direccion || '',
        lugar_entrenamiento: club.lugar_entrenamiento || '',
        entrenador_id: club.entrenador_id || '',
        entrenador_nombre: [club.entrenador_nombre, club.entrenador_apellido_paterno, club.entrenador_apellido_materno].filter(Boolean).join(' '),
        estado: club.estado || 'activo',
      });
      setMensajeError('');

      try {
        const entRes = await clubesAPI.getEntrenadores(clubId);
        setEntrenadoresDelClub(entRes.data.entrenadores || []);
      } catch (errEnt) {
        console.error('Error al cargar entrenadores:', errEnt);
        setEntrenadoresDelClub([]);
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      setMensajeError('Error al cargar el perfil. Intente de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Actualiza el estado cuando el usuario edita un campo
  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setDatosClub((prev) => ({ ...prev, [name]: value }));
  };

  const manejarEditar = () => {
    setModoEdicion(true);
    setMensajeError('');
    setMensajeExito('');
  };

  const manejarCancelar = () => {
    setModoEdicion(false);
    cargarDatosClub();
    setMensajeError('');
    setMensajeExito('');
  };

  // Guarda los cambios del perfil del club
  const manejarGuardar = async () => {
    try {
      if (!datosClub.nombre.trim()) {
        setMensajeError('El nombre del club es obligatorio.');
        return;
      }
      if (!datosClub.email.trim()) {
        setMensajeError('El correo electrónico es obligatorio.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(datosClub.email)) {
        setMensajeError('Por favor ingrese un correo electrónico válido.');
        return;
      }
      if (!datosClub.telefono.trim()) {
        setMensajeError('El teléfono es obligatorio.');
        return;
      }
      const telefonoLimpio = datosClub.telefono.replace(/\D/g, '');
      if (telefonoLimpio.length !== 10) {
        setMensajeError('El teléfono debe tener exactamente 10 dígitos.');
        return;
      }
      if (!datosClub.id) {
        setMensajeError('No se puede actualizar: falta el ID del club.');
        return;
      }

      await clubesAPI.update(datosClub.id, {
        nombre: datosClub.nombre.trim(),
        direccion: datosClub.direccion.trim(),
        telefono: datosClub.telefono.trim(),
        email: datosClub.email.trim(),
        lugar_entrenamiento: datosClub.lugar_entrenamiento.trim(),
        entrenador_id: datosClub.entrenador_id || null,
        descripcion: datosClub.descripcion.trim(),
        estado: datosClub.estado,
      });

      setModoEdicion(false);
      setMensajeExito('Perfil actualizado exitosamente.');
      setMensajeError('');
      await cargarDatosClub();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setMensajeError(error.response?.data?.message || 'Error al guardar el perfil. Intente de nuevo.');
    }
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  const estadoTexto = datosClub.estado === 'activo' ? 'Activo' : 'Inactivo';

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Alertas de error/éxito */}
        {mensajeError && (
          <Alert severity="error" onClose={() => setMensajeError('')} sx={{ mb: 2, borderRadius: '8px' }}>
            {mensajeError}
          </Alert>
        )}
        {mensajeExito && (
          <Alert severity="success" onClose={() => setMensajeExito('')} sx={{ mb: 2, borderRadius: '8px' }}>
            {mensajeExito}
          </Alert>
        )}

        {/* Cabecera del perfil con avatar */}
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
              {datosClub.nombre || 'Club Deportivo'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip
                icon={<CheckIcon sx={{ fontSize: 16, color: `${COLORS.burgundy} !important` }} />}
                label={estadoTexto}
                size="small"
                sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.burgundy}`, color: COLORS.burgundy, fontWeight: 700 }}
              />
              {datosClub.entrenador_nombre && (
                <Chip
                  icon={<PersonIcon sx={{ fontSize: 16, color: `${COLORS.purple} !important` }} />}
                  label={`Entrenador: ${datosClub.entrenador_nombre}`}
                  size="small"
                  sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Sección de información del club */}
        <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800 }}>Información del Club</Typography>
            {!modoEdicion ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={manejarEditar}
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
                  onClick={manejarCancelar}
                  sx={{ borderColor: COLORS.purple, color: COLORS.purple, fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={manejarGuardar}
                  sx={{ bgcolor: COLORS.burgundy, fontWeight: 700, '&:hover': { bgcolor: COLORS.burgundyDark } }}
                >
                  Guardar
                </Button>
              </Box>
            )}
          </Box>
          <Divider sx={{ mb: 2, borderColor: COLORS.line }} />

          {modoEdicion ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Nombre del Club" name="nombre" value={datosClub.nombre || ''} onChange={manejarCambioInput} fullWidth size="small" required sx={inputStyles} />
                <TextField label="Correo Electrónico" name="email" type="email" value={datosClub.email || ''} onChange={manejarCambioInput} fullWidth size="small" required sx={inputStyles} />
                <TextField label="Teléfono (10 dígitos)" name="telefono" value={datosClub.telefono || ''} onChange={manejarCambioInput} fullWidth size="small" required placeholder="5512345678" sx={inputStyles} />
                <FormControl fullWidth size="small" sx={inputStyles}>
                  <InputLabel>Entrenador Principal</InputLabel>
                  <Select name="entrenador_id" value={datosClub.entrenador_id || ''} onChange={manejarCambioInput} label="Entrenador Principal">
                    <MenuItem value="">Sin asignar</MenuItem>
                    {entrenadoresDelClub.map((e) => (
                      <MenuItem key={e.entrenador_id} value={e.entrenador_id}>
                        {[e.nombre, e.apellido_paterno, e.apellido_materno].filter(Boolean).join(' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField label="Dirección" name="direccion" value={datosClub.direccion || ''} onChange={manejarCambioInput} fullWidth size="small" sx={{ ...inputStyles, gridColumn: { sm: '1 / -1' } }} />
                <TextField
                  label="Lugar de Entrenamiento"
                  name="lugar_entrenamiento"
                  value={datosClub.lugar_entrenamiento || ''}
                  onChange={manejarCambioInput}
                  fullWidth
                  size="small"
                  placeholder="Unidad Deportiva Xalapa, cancha 3"
                  helperText="Se muestra automáticamente en el perfil de tus atletas si ellos no tienen uno propio capturado"
                  sx={{ ...inputStyles, gridColumn: { sm: '1 / -1' } }}
                />
                <TextField
                  label="Descripción del Club (Opcional)"
                  name="descripcion"
                  value={datosClub.descripcion || ''}
                  onChange={manejarCambioInput}
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
              <ReadOnlyField icon={<GroupIcon fontSize="small" />} label="Nombre" value={datosClub.nombre} />
              <ReadOnlyField icon={<EmailIcon fontSize="small" />} label="Correo" value={datosClub.email} />
              <ReadOnlyField icon={<PhoneIcon fontSize="small" />} label="Teléfono" value={datosClub.telefono} />
              <ReadOnlyField icon={<PersonIcon fontSize="small" />} label="Entrenador" value={datosClub.entrenador_nombre} />
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <ReadOnlyField icon={<LocationIcon fontSize="small" />} label="Dirección" value={datosClub.direccion} />
              </Box>
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <ReadOnlyField icon={<FitnessCenterIcon fontSize="small" />} label="Lugar de Entrenamiento" value={datosClub.lugar_entrenamiento} />
              </Box>
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <ReadOnlyField icon={<DescriptionIcon fontSize="small" />} label="Descripción" value={datosClub.descripcion} />
              </Box>
            </Box>
          )}
        </Box>

        {!modoEdicion && (
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