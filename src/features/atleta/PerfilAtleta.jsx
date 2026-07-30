import { atletasAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: '#8000202E',
  lineSoft: '#80002014',
};

const cardSx = {
  bgcolor: COLORS.paper,
  borderRadius: '10px',
  boxShadow: '0 2px 12px #80002012',
};

const fieldFocusSx = {
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.burgundy },
  '& .MuiInputLabel-root.Mui-focused': { color: COLORS.burgundy },
};

// Componente para mostrar un campo de solo lectura con ícono
const ReadOnlyField = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 2, px: 1 }}>
    <Box sx={{ color: COLORS.burgundy, mt: 0.4, flexShrink: 0, fontSize: 22 }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', mb: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ color: COLORS.ink, fontWeight: 600, wordBreak: 'break-word', fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.4 }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

const PerfilAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
      return;
    }
    cargarPerfil();
  }, [user]);

  // Carga el perfil del atleta desde el backend
  const cargarPerfil = async () => {
    try {
      if (!user?.id) return;
      setCargando(true);
      const response = await atletasAPI.getPerfil();
      const data = response.data.atleta;
      if (data) {
        setPerfil({
          ...data,
          apellidopa: data.apellido_paterno,
          apellidoma: data.apellido_materno,
          fechaNacimiento: data.fecha_nacimiento,
          estadoNacimiento: data.estado_nacimiento,
          gmail: data.email,
          sexo: (data.genero || '').toLowerCase(),
        });
        setMensajeError('');
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setMensajeError('Error al cargar el perfil.');
    } finally {
      setCargando(false);
    }
  };

  // Actualiza el estado del perfil cuando el usuario edita un campo
  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    if (perfil) {
      setPerfil({ ...perfil, [name]: value });
    }
  };

  const manejarEditar = () => setModoEdicion(true);
  const manejarCancelarEdicion = () => {
    setModoEdicion(false);
    cargarPerfil();
  };

  // Guarda los cambios del perfil
  const manejarGuardar = async () => {
    try {
      await atletasAPI.updatePerfil({
        nombre: perfil.nombre,
        apellido_paterno: perfil.apellidopa,
        apellido_materno: perfil.apellidoma,
        telefono: perfil.telefono,
        email: perfil.gmail,
        genero: perfil.sexo,
        municipio: perfil.municipio,
        lugar_entrenamiento: perfil.lugar_entrenamiento,
      });
      setModoEdicion(false);
      await cargarPerfil();
      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Tus datos se guardaron correctamente.',
        confirmButtonColor: COLORS.burgundy,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error) {
      const detalles = error.response?.data?.detalles;
      const mensajeDetalle = detalles
        ? Object.entries(detalles).map(([campo, errores]) => `${campo}: ${errores.join(', ')}`).join('\n')
        : null;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensajeDetalle || error.response?.data?.error || 'Error al actualizar el perfil.',
        confirmButtonColor: COLORS.burgundy,
      });
    }
  };

  const limpiarError = () => setMensajeError('');

  // Formatea una fecha para mostrarla en español
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return fecha;
    }
  };

  // Solo para mostrar en la vista de lectura
  const textoGenero = (valor) => {
    if (!valor) return '';
    return valor.charAt(0).toUpperCase() + valor.slice(1);
  };

  const obtenerIniciales = () => {
    if (!perfil) return '?';
    const n = perfil.nombre?.[0] || '';
    const a = perfil.apellidopa?.[0] || '';
    return (n + a).toUpperCase();
  };

  const clubNombre = perfil?.club_id ? (perfil.club_nombre || 'Club asignado') : 'Independiente';

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: COLORS.cream, width: '100%' }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  if (!perfil) {
    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box sx={{ ...cardSx, textAlign: 'center', p: 4 }}>
            <PersonIcon sx={{ fontSize: 64, color: COLORS.purple, opacity: 0.4, mb: 2 }} />
            <Typography variant="h5" sx={{ color: COLORS.burgundy, mb: 1, fontWeight: 800 }}>
              No se pudieron cargar los datos
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, mb: 3 }}>
              ID de usuario: {user?.id || 'No disponible'}
            </Typography>
            <Button
              variant="contained"
              onClick={cargarPerfil}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
            >
              Intentar de Nuevo
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Alertas de error/éxito */}
        {mensajeError && (
          <Alert
            severity="error"
            onClose={limpiarError}
            sx={{ mb: 2, borderRadius: '8px' }}
          >
            {mensajeError}
          </Alert>
        )}

        {/* Cabecera del perfil con foto e iniciales */}
        <Box sx={{ ...cardSx, mb: 3, overflow: 'visible', position: 'relative' }}>
          <Box sx={{ bgcolor: COLORS.burgundy, height: { xs: 80, md: 100 }, borderRadius: '10px 10px 0 0' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: { xs: '-40px', md: '-48px' }, pb: 3 }}>
            <Avatar
              sx={{
                width: { xs: 80, md: 96 }, height: { xs: 80, md: 96 },
                bgcolor: COLORS.purple, fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 800,
                border: '4px solid #fff', boxShadow: '0 4px 14px #00000026', mb: 1.5,
              }}
            >
              {obtenerIniciales()}
            </Avatar>

            <Typography variant="h5" sx={{ color: COLORS.burgundy, fontWeight: 800, textAlign: 'center', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              {perfil.nombre} {perfil.apellidopa} {perfil.apellidoma}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip
                icon={<GroupIcon sx={{ fontSize: 16, color: `${COLORS.burgundy} !important` }} />}
                label={clubNombre}
                size="small"
                sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.burgundy}`, color: COLORS.burgundy, fontWeight: 700 }}
              />
              {perfil.curp && (
                <Chip
                  icon={<BadgeIcon sx={{ fontSize: 16, color: `${COLORS.purple} !important` }} />}
                  label={perfil.curp}
                  size="small"
                  sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Sección de información personal */}
        <Box sx={{ ...cardSx, mb: 3, p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800 }}>
              Información Personal
            </Typography>
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
                  onClick={manejarCancelarEdicion}
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
              <Chip label="Campos editables" size="small" sx={{ alignSelf: 'flex-start', bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontSize: '0.75rem' }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Nombre" name="nombre" value={perfil.nombre || ''} onChange={manejarCambioInput} fullWidth size="small" sx={fieldFocusSx} />
                <TextField label="Apellido Paterno" name="apellidopa" value={perfil.apellidopa || ''} onChange={manejarCambioInput} fullWidth size="small" sx={fieldFocusSx} />
                <TextField label="Apellido Materno" name="apellidoma" value={perfil.apellidoma || ''} onChange={manejarCambioInput} fullWidth size="small" sx={fieldFocusSx} />
                <TextField label="Teléfono" name="telefono" value={perfil.telefono || ''} onChange={manejarCambioInput} fullWidth size="small" sx={fieldFocusSx} />
                <TextField label="Correo Electrónico" name="gmail" value={perfil.gmail || ''} onChange={manejarCambioInput} fullWidth size="small" sx={fieldFocusSx} />
                <FormControl fullWidth size="small" sx={fieldFocusSx}>
                  <InputLabel>Sexo</InputLabel>
                  <Select name="sexo" value={(perfil.sexo || '').toLowerCase()} onChange={manejarCambioInput} label="Sexo">
                    <MenuItem value="masculino">Masculino</MenuItem>
                    <MenuItem value="femenino">Femenino</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Municipio" name="municipio" value={perfil.municipio || ''} onChange={manejarCambioInput} fullWidth size="small" sx={fieldFocusSx} />
                <TextField
                  label="Lugar de Entrenamiento"
                  name="lugar_entrenamiento"
                  value={perfil.lugar_entrenamiento || ''}
                  onChange={manejarCambioInput}
                  fullWidth
                  size="small"
                  disabled={!!perfil.club_lugar_entrenamiento}
                  helperText={perfil.club_lugar_entrenamiento ? 'Lo define tu club — no se puede editar aquí' : ''}
                  sx={{ ...fieldFocusSx, gridColumn: { sm: '1 / -1' } }}
                />
              </Box>

              <Divider sx={{ my: 1, borderColor: COLORS.line }}>
                <Chip label="Datos no editables" size="small" sx={{ color: COLORS.ink, bgcolor: COLORS.cream, fontSize: '0.75rem' }} />
              </Divider>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="CURP" value={perfil.curp || ''} fullWidth disabled size="small" />
                <TextField
                  label="Fecha de Nacimiento"
                  type="date"
                  value={perfil.fechaNacimiento ? perfil.fechaNacimiento.slice(0, 10) : ''}
                  fullWidth disabled size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField label="Estado de Nacimiento" value={perfil.estadoNacimiento || ''} fullWidth disabled size="small" />
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <ReadOnlyField icon={<PersonIcon fontSize="small" />} label="Nombre completo" value={`${perfil.nombre || ''} ${perfil.apellidopa || ''} ${perfil.apellidoma || ''}`} />
              <ReadOnlyField icon={<BadgeIcon fontSize="small" />} label="CURP" value={perfil.curp} />
              <ReadOnlyField icon={<CalendarTodayIcon fontSize="small" />} label="Fecha de nacimiento" value={formatearFecha(perfil.fechaNacimiento)} />
              <ReadOnlyField icon={<PersonIcon fontSize="small" />} label="Sexo" value={textoGenero(perfil.sexo)} />
              <ReadOnlyField icon={<PhoneIcon fontSize="small" />} label="Teléfono" value={perfil.telefono} />
              <ReadOnlyField icon={<EmailIcon fontSize="small" />} label="Correo electrónico" value={perfil.gmail} />
              <ReadOnlyField icon={<LocationOnIcon fontSize="small" />} label="Estado de nacimiento" value={perfil.estadoNacimiento} />
              <ReadOnlyField icon={<LocationOnIcon fontSize="small" />} label="Municipio" value={perfil.municipio} />
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <ReadOnlyField icon={<FitnessCenterIcon fontSize="small" />} label="Lugar de entrenamiento" value={perfil.lugar_entrenamiento} />
              </Box>
            </Box>
          )}
        </Box>

        {/* Sección de club */}
        <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
            Mi Club
          </Typography>
          <Divider sx={{ mb: 2.5, borderColor: COLORS.line }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: perfil.club_id ? COLORS.burgundy : COLORS.lineSoft, color: perfil.club_id ? '#fff' : COLORS.purple, width: 44, height: 44 }}>
                <GroupIcon />
              </Avatar>
              <Box>
                <Typography sx={{ color: COLORS.purple, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {perfil.club_id ? 'Club actual' : 'Estado'}
                </Typography>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink }}>
                  {clubNombre}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              onClick={() => navigate('/atleta/club')}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
            >
              {perfil.club_id ? 'Administrar mi club' : 'Buscar club o ver invitaciones'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PerfilAtleta;