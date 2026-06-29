import { atletasAPI, clubesAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
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
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e3e4e5';

const PerfilAtleta = () => {
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [perfil, setPerfil] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [clubes, setClubes] = useState([]);
  const [solicitud, setSolicitud] = useState(null);
  const [solicitudClubId, setSolicitudClubId] = useState('');
  const [solicitudIndependiente, setSolicitudIndependiente] = useState(false);
  const [clubSeleccionado, setClubSeleccionado] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
      return;
    }
    fetchPerfil();
    fetchClubes();
    fetchSolicitud();
  }, [user]);

  const fetchPerfil = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);
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
          club_id: data.club_id,
          sexo: data.genero,
        });
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setErrorMessage('Error al cargar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClubes = async () => {
    try {
      const response = await clubesAPI.getAll();
      setClubes(response.data.clubes || []);
    } catch {
      setClubes([]);
    }
  };

  const fetchSolicitud = async () => {
    try {
      if (!user?.id) return;
      const response = await atletasAPI.getSolicitudes({ atleta_id: user.id });
      const data = response.data.solicitudes || [];
      const pendientes = data.filter((s) => s.estado === 'pendiente');
      setSolicitud(pendientes.length > 0 ? pendientes[0] : null);
      const rechazadas = data.filter((s) => s.estado === 'rechazada');
      if (rechazadas.length > 0) {
        const ultima = rechazadas[rechazadas.length - 1];
        const diff = (new Date() - new Date(ultima.fecha_solicitud)) / (1000 * 60 * 60 * 24);
        if (diff <= 7) setErrorMessage('Tu solicitud anterior fue rechazada.');
      }
    } catch {
      setSolicitud(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (perfil) {
      setPerfil({ ...perfil, [name]: value });
    }
  };

  const handleEdit = () => setEditMode(true);
  const handleCancelEdit = () => {
    setEditMode(false);
    fetchPerfil();
  };

  const handleSave = async () => {
    try {
      await atletasAPI.updatePerfil({
        nombre: perfil.nombre,
        apellido_paterno: perfil.apellidopa,
        apellido_materno: perfil.apellidoma,
        telefono: perfil.telefono,
        email: perfil.gmail,
        sexo: perfil.sexo,
        municipio: perfil.municipio,
      });
      setEditMode(false);
      setErrorMessage('Perfil actualizado exitosamente.');
      fetchPerfil();
    } catch (error) {
      setErrorMessage('Error al actualizar el perfil.');
    }
  };

  const handleEnviarSolicitud = async () => {
    try {
      if (!user?.id) return;
      limpiarMensaje();
      setMensaje('');

      await axios.post('http://localhost:5000/api/atletas/solicitudes-club', {
        atletaId: user.id,
        clubId: clubSeleccionado,
        tipo: 'asociar',
      });

      setMensaje('Solicitud enviada correctamente. Espera la respuesta del club.');
      setClubSeleccionado('');
      fetchSolicitud();
    } catch (error) {
      setMensaje(error.response?.data?.error || 'Error al enviar solicitud');
    }
  };

  const handleSalirClub = async () => {
    const result = await Swal.fire({
      title: '¿Confirmar salida del club?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: BURGUNDY,
      cancelButtonColor: PURPLE,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      try {
        await atletasAPI.crearSolicitud({ tipo: 'independiente' });
        setErrorMessage('Solicitud enviada. Espera confirmación.');
        fetchPerfil();
      } catch (error) {
        setErrorMessage('Error al salir del club.');
      }
    }
  };

  const limpiarMensaje = () => setErrorMessage('');

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return fecha;
    }
  };

  const getInitials = () => {
    if (!perfil) return '?';
    const n = perfil.nombre?.[0] || '';
    const a = perfil.apellidopa?.[0] || '';
    return (n + a).toUpperCase();
  };

  const clubNombre =
    perfil && perfil.club_id
      ? clubes.find((c) => c.id === perfil.club_id || c._id === perfil.club_id)?.nombre || 'Club asignado'
      : 'Independiente';

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: CREAM,
          width: '100%',
        }}
      >
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  if (!perfil) {
    return (
      <Box sx={{ bgcolor: CREAM, minHeight: '100vh', width: '100%' }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', p: 4 }}>
            <PersonIcon sx={{ fontSize: 64, color: PURPLE, opacity: 0.4, mb: 2 }} />
            <Typography variant="h5" sx={{ color: BURGUNDY, mb: 1, fontWeight: 'bold' }}>
              No se pudieron cargar los datos
            </Typography>
            <Typography variant="body2" sx={{ color: PURPLE, mb: 3 }}>
              ID de usuario: {user?.id || 'No disponible'}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchPerfil}
              sx={{ bgcolor: BURGUNDY, '&:hover': { bgcolor: '#600018' } }}
            >
              Intentar de Nuevo
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  const ReadOnlyField = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 2, px: 1 }}>
      <Box sx={{ color: BURGUNDY, mt: 0.4, flexShrink: 0, fontSize: 22 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ color: PURPLE, display: 'block', lineHeight: 1.2, mb: 0.3, fontWeight: 500 }}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#1a1a1a',
            fontWeight: 600,
            wordBreak: 'break-word',
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            lineHeight: 1.4,
          }}
        >
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* ── Alerts ── */}
        {errorMessage && (
          <Alert
            severity={
              errorMessage.includes('exitosamente') || errorMessage.includes('enviada')
                ? 'success'
                : 'error'
            }
            onClose={limpiarMensaje}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {errorMessage}
          </Alert>
        )}
        {mensaje && (
          <Alert severity="info" onClose={() => setMensaje('')} sx={{ mb: 2, borderRadius: 2 }}>
            {mensaje}
          </Alert>
        )}

        <Card
          sx={{
            borderRadius: 3,
            mb: 3,
            overflow: 'visible',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              bgcolor: BURGUNDY,
              height: { xs: 80, md: 100 },
              borderRadius: '12px 12px 0 0',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: { xs: '-40px', md: '-48px' },
              pb: 3,
            }}
          >
            <Avatar
              sx={{
                width: { xs: 80, md: 96 },
                height: { xs: 80, md: 96 },
                bgcolor: PURPLE,
                fontSize: { xs: '1.6rem', md: '2rem' },
                fontWeight: 'bold',
                border: '4px solid #fff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                mb: 1.5,
              }}
            >
              {getInitials()}
            </Avatar>

            <Typography
              variant="h5"
              sx={{
                color: BURGUNDY,
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: { xs: '1.25rem', md: '1.5rem' },
              }}
            >
              {perfil.nombre} {perfil.apellidopa} {perfil.apellidoma}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip
                icon={<GroupIcon sx={{ fontSize: 16 }} />}
                label={clubNombre}
                size="small"
                sx={{
                  bgcolor: 'rgba(128,0,32,0.08)',
                  color: BURGUNDY,
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: BURGUNDY },
                }}
              />
              {perfil.curp && (
                <Chip
                  icon={<BadgeIcon sx={{ fontSize: 16 }} />}
                  label={perfil.curp}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(122,64,105,0.08)',
                    color: PURPLE,
                    fontWeight: 500,
                    '& .MuiChip-icon': { color: PURPLE },
                  }}
                />
              )}
            </Box>
          </Box>
        </Card>
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>
                Información Personal
              </Typography>
              {!editMode ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{
                    borderColor: BURGUNDY,
                    color: BURGUNDY,
                    '&:hover': { borderColor: '#600018', bgcolor: 'rgba(128,0,32,0.04)' },
                  }}
                >
                  Editar
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    sx={{
                      borderColor: PURPLE,
                      color: PURPLE,
                      '&:hover': { bgcolor: 'rgba(122,64,105,0.04)' },
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    sx={{ bgcolor: BURGUNDY, '&:hover': { bgcolor: '#600018' } }}
                  >
                    Guardar
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {editMode ? (
              <Grid container spacing={2}>
                {/* Campos editables */}
                <Grid item xs={12}>
                  <Chip label="Campos editables" size="small" sx={{ color: PURPLE, fontSize: '0.75rem', mb: 0.5 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre"
                    name="nombre"
                    value={perfil.nombre || ''}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: BURGUNDY,
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Apellido Paterno"
                    name="apellidopa"
                    value={perfil.apellidopa || ''}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: BURGUNDY,
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Apellido Materno"
                    name="apellidoma"
                    value={perfil.apellidoma || ''}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: BURGUNDY,
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Teléfono"
                    name="telefono"
                    value={perfil.telefono || ''}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: BURGUNDY,
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Correo Electrónico"
                    name="gmail"
                    value={perfil.gmail || ''}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: BURGUNDY,
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={{
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: BURGUNDY,
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
                  }}>
                    <InputLabel>Sexo</InputLabel>
                    <Select
                      name="sexo"
                      value={perfil.sexo || ''}
                      onChange={handleInputChange}
                      label="Sexo"
                    >
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="femenino">Femenino</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Municipio"
                    name="municipio"
                    value={perfil.municipio || ''}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: BURGUNDY,
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
                    }}
                  />
                </Grid>

                {/* Campos no editables */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Chip label="Datos no editables" size="small" sx={{ color: '#999', fontSize: '0.75rem' }} />
                  </Divider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="CURP" value={perfil.curp || ''} fullWidth disabled size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fecha de Nacimiento"
                    type="date"
                    value={perfil.fechaNacimiento ? perfil.fechaNacimiento.slice(0, 10) : ''}
                    fullWidth
                    disabled
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Estado de Nacimiento" value={perfil.estadoNacimiento || ''} fullWidth disabled size="small" />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Lugar de Entrenamiento" value={perfil.lugar_entrenamiento || ''} fullWidth disabled size="small" />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={0}>
                <Grid item xs={12} sm={6}>
                  <ReadOnlyField
                    icon={<PersonIcon fontSize="small" />}
                    label="Nombre completo"
                    value={`${perfil.nombre || ''} ${perfil.apellidopa || ''} ${perfil.apellidoma || ''}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReadOnlyField
                    icon={<BadgeIcon fontSize="small" />}
                    label="CURP"
                    value={perfil.curp}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReadOnlyField
                    icon={<CalendarTodayIcon fontSize="small" />}
                    label="Fecha de nacimiento"
                    value={formatFecha(perfil.fechaNacimiento)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReadOnlyField
                    icon={<PersonIcon fontSize="small" />}
                    label="Sexo"
                    value={perfil.sexo}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReadOnlyField
                    icon={<PhoneIcon fontSize="small" />}
                    label="Teléfono"
                    value={perfil.telefono}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReadOnlyField
                    icon={<EmailIcon fontSize="small" />}
                    label="Correo electrónico"
                    value={perfil.gmail}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReadOnlyField
                    icon={<LocationOnIcon fontSize="small" />}
                    label="Estado de nacimiento"
                    value={perfil.estadoNacimiento}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReadOnlyField
                    icon={<LocationOnIcon fontSize="small" />}
                    label="Municipio"
                    value={perfil.municipio}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ReadOnlyField
                    icon={<FitnessCenterIcon fontSize="small" />}
                    label="Lugar de entrenamiento"
                    value={perfil.lugar_entrenamiento}
                  />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 'bold', mb: 2 }}>
              Gestión de Club
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            {perfil && perfil.club_id ? (
              /* ── Tiene club ── */
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    bgcolor: 'rgba(128,0,32,0.04)',
                    borderRadius: 2,
                    border: '1px solid rgba(128,0,32,0.12)',
                    mb: 2,
                  }}
                >
                  <Avatar sx={{ bgcolor: BURGUNDY, width: 44, height: 44 }}>
                    <GroupIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ color: PURPLE }}>
                      Club actual
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: BURGUNDY }}>
                      {clubNombre}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ExitToAppIcon />}
                  onClick={handleSalirClub}
                  size="small"
                >
                  Salir del Club
                </Button>
              </Box>
            ) : solicitud && solicitud.estado === 'pendiente' ? (
              /* ── Solicitud pendiente ── */
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(25,118,210,0.06)',
                  borderRadius: 2,
                  border: '1px solid rgba(25,118,210,0.2)',
                }}
              >
                <Typography variant="body2" sx={{ color: '#1565C0', fontWeight: 500 }}>
                  Tienes una solicitud pendiente de aprobación.
                </Typography>
              </Box>
            ) : (
              /* ── Sin club — puede solicitar ── */
              <Box>
                <Typography variant="body2" sx={{ color: '#555', mb: 2 }}>
                  Actualmente no perteneces a ningún club. Puedes solicitar unirte a uno:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 240 } }}>
                    <InputLabel>Selecciona un club</InputLabel>
                    <Select
                      value={clubSeleccionado}
                      onChange={(e) => setClubSeleccionado(e.target.value)}
                      label="Selecciona un club"
                    >
                      <MenuItem value="">
                        <em>Selecciona un club</em>
                      </MenuItem>
                      {clubes.map((club) => (
                        <MenuItem key={club._id || club.id} value={club._id || club.id}>
                          {club.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleEnviarSolicitud}
                    disabled={!clubSeleccionado}
                    startIcon={<SendIcon />}
                    sx={{
                      bgcolor: BURGUNDY,
                      '&:hover': { bgcolor: '#600018' },
                      whiteSpace: 'nowrap',
                      alignSelf: { xs: 'stretch', sm: 'auto' },
                    }}
                  >
                    Enviar Solicitud
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default PerfilAtleta;