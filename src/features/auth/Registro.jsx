import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import zxcvbn from 'zxcvbn';
import sha1 from 'js-sha1';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Chip,
  OutlinedInput,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as RegisterIcon,
  SportsMartialArts as SportIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const MySwal = withReactContent(Swal);

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#ffffff';
const API_BASE_URL = 'http://localhost:5000';

/* sx compartido — quita asterisco + autofill fix */
const fieldSx = {
  '& .MuiInputLabel-root': { color: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
  '& .MuiInputLabel-asterisk': { display: 'none' },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    '& fieldset': { borderColor: '#ccc' },
    '&:hover fieldset': { borderColor: BURGUNDY },
    '&.Mui-focused fieldset': { borderColor: BURGUNDY },
  },
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
    WebkitBoxShadow: '0 0 0 100px #fff inset',
    WebkitTextFillColor: '#333',
    caretColor: '#333',
  },
};

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Coahuila', 'Colima', 'Chiapas', 'Chihuahua', 'Ciudad de México',
  'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
  'Nacido en el Extranjero',
];

const ESPECIALIDADES = [
  'Atletismo', 'Carrera de velocidad', 'Carrera de resistencia',
  'Salto de longitud', 'Salto de altura', 'Lanzamiento de jabalina',
  'Lanzamiento de disco', 'Lanzamiento de peso', 'Marcha atlética',
  'Relevos', 'Cross country', 'Maratón', 'Triatlón', 'Pentatlón', 'Decatlón',
];

const CERTIFICACIONES = [
  'Federación Mexicana de Atletismo', 'CONADE',
  'Instituto del Deporte del Estado', 'Escuela Nacional de Entrenadores Deportivos',
  'Federación Internacional de Atletismo', 'Certificación de Entrenador Personal',
  'Licenciatura en Ciencias del Deporte', 'Maestría en Entrenamiento Deportivo',
  'Certificación de Primeros Auxilios', 'Certificación de Nutrición Deportiva',
];

const SectionHeader = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, mt: 2 }}>
    <Box sx={{ color: BURGUNDY, display: 'flex' }}>{icon}</Box>
    <Typography variant="subtitle1" sx={{ color: BURGUNDY, fontWeight: 'bold' }}>
      {title}
    </Typography>
  </Box>
);

function Registro() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    rol: '',
    nombre: '',
    apellidopa: '',
    apellidoma: '',
    curp: '',
    fechaNacimiento: '',
    sexo: '',
    estadoNacimiento: '',
    municipio: '',
    telefono: '',
    gmail: '',
    password: '',
    repetirPassword: '',
    especialidades: [],
    certificaciones: [],
    añosExperiencia: '',
    clubId: '',
    direccion: '',
    descripcion: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [repetirPasswordVisible, setRepetirPasswordVisible] = useState(false);
  const [clubes, setClubes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const rol = formData.rol;
  const isAtleta = rol === 'atleta';
  const isClub = rol === 'club';
  const isEntrenador = rol === 'entrenador';
  const showPersonalFields = isAtleta || isEntrenador;

  useEffect(() => {
    if (isEntrenador) {
      axios
        .get(`${API_BASE_URL}/api/clubes`)
        .then((res) => setClubes(res.data.clubes || res.data || []))
        .catch(() => setClubes([]));
    }
  }, [isEntrenador]);

  const validateField = (name, value) => {
    const errors = { ...formErrors };
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,30}$/;

    switch (name) {
      case 'nombre':
      case 'apellidopa':
      case 'apellidoma':
        if (!nameRegex.test(value)) errors[name] = 'Solo letras, mínimo 2 caracteres.';
        else delete errors[name];
        break;
      case 'telefono':
        if (!/^\d{10}$/.test(value)) errors[name] = 'Debe tener exactamente 10 dígitos.';
        else delete errors[name];
        break;
      case 'gmail':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[name] = 'Correo electrónico inválido.';
        else delete errors[name];
        break;
      case 'curp':
        if (value && !/^[A-Za-z0-9]{18}$/.test(value)) errors[name] = 'Debe tener 18 caracteres alfanuméricos.';
        else delete errors[name];
        break;
      case 'fechaNacimiento': {
        if (!value) { errors[name] = 'Campo obligatorio.'; break; }
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        const minAge = isEntrenador ? 18 : 12;
        if (age < minAge || age > 100) errors[name] = `Edad entre ${minAge} y 100 años.`;
        else delete errors[name];
        break;
      }
      case 'municipio':
        if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]{2,100}$/.test(value))
          errors[name] = 'Solo letras, mínimo 2 caracteres.';
        else delete errors[name];
        break;
      case 'direccion':
        if (value && value.length < 3) errors[name] = 'Mínimo 3 caracteres.';
        else delete errors[name];
        break;
      case 'password':
        if (value.length < 8 || value.length > 15) errors[name] = 'Entre 8 y 15 caracteres.';
        else delete errors[name];
        if (formData.repetirPassword && value !== formData.repetirPassword)
          errors.repetirPassword = 'Las contraseñas no coinciden.';
        else delete errors.repetirPassword;
        break;
      case 'repetirPassword':
        if (value !== formData.password) errors[name] = 'Las contraseñas no coinciden.';
        else delete errors[name];
        break;
      default:
        break;
    }
    setFormErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'password') setPasswordStrength(zxcvbn(value).score);
    validateField(name, value);
  };

  const handleMultiSelect = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const checkPasswordCompromised = async (password) => {
    try {
      const hash = sha1(password);
      const res = await axios.get(`https://api.pwnedpasswords.com/range/${hash.substring(0, 5)}`);
      return res.data.includes(hash.substring(5).toUpperCase());
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(formErrors).length > 0) {
      MySwal.fire({ icon: 'error', title: 'Errores en el formulario', text: 'Corrige los errores antes de continuar.' });
      return;
    }

    setSubmitting(true);

    const isCompromised = await checkPasswordCompromised(formData.password);
    if (isCompromised) {
      setSubmitting(false);
      MySwal.fire({ icon: 'error', title: 'Contraseña comprometida', text: 'Esta contraseña ha sido filtrada. Por favor, elige otra.' });
      return;
    }

    try {
      let endpoint = `${API_BASE_URL}/api/auth/register`;
      let dataToSend;

      if (isClub) {
        dataToSend = {
          nombre: formData.nombre,
          direccion: formData.direccion.trim(),
          telefono: formData.telefono,
          email: formData.gmail,
          password: formData.password,
          descripcion: formData.descripcion.trim(),
          rol: 'club',
        };
      } else if (isEntrenador) {
        dataToSend = {
          nombre: formData.nombre,
          apellido_paterno: formData.apellidopa,
          apellido_materno: formData.apellidoma,
          curp: formData.curp,
          fecha_nacimiento: formData.fechaNacimiento,
          genero: formData.sexo,
          estado_nacimiento: formData.estadoNacimiento,
          municipio: formData.municipio,
          telefono: formData.telefono,
          email: formData.gmail,
          password: formData.password,
          rol: 'entrenador',
          especialidades: formData.especialidades,
          certificaciones: formData.certificaciones,
          anos_experiencia: formData.añosExperiencia,
          ...(formData.clubId && { club_id: formData.clubId }),
        };
      } else {
        dataToSend = {
          nombre: formData.nombre,
          apellido_paterno: formData.apellidopa,
          apellido_materno: formData.apellidoma,
          curp: formData.curp,
          fecha_nacimiento: formData.fechaNacimiento,
          genero: formData.sexo,
          estado_nacimiento: formData.estadoNacimiento,
          municipio: formData.municipio,
          telefono: formData.telefono,
          email: formData.gmail,
          password: formData.password,
          rol: 'atleta',
        };
      }

      await axios.post(endpoint, dataToSend, { headers: { 'Content-Type': 'application/json' } });

      MySwal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: 'Para iniciar sesión, verifica tu correo electrónico. Revisa tu bandeja de entrada o spam.',
      }).then(() => {
        navigate('/login');
      });
    } catch (error) {
      MySwal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error || 'No se pudo completar el registro.' });
    } finally {
      setSubmitting(false);
    }
  };

  const strengthLabel = ['Débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const strengthColor = ['#D32F2F', '#D32F2F', '#FF9800', '#4CAF50', '#2E7D32'];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        bgcolor: CREAM,
        px: 2,
        py: { xs: 3, md: 5 },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(128,0,32,0.12)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: BURGUNDY,
            py: { xs: 3, sm: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: '16px 16px 0 0',
          }}
        >
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.15)', mb: 1 }}>
            <SportIcon sx={{ fontSize: 28, color: '#fff' }} />
          </Avatar>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: '1.15rem', sm: '1.35rem' } }}>
            Crear Cuenta
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            Instituto Veracruzano del Deporte
          </Typography>
        </Box>

        {/* Form */}
        <CardContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          <Box component="form" onSubmit={handleSubmit}>

            {/* ── 1. Rol ── */}
            <FormControl fullWidth sx={{ mb: 3, ...fieldSx }} required>
              <InputLabel>¿Cómo deseas registrarte?</InputLabel>
              <Select name="rol" value={rol} onChange={handleChange} label="¿Cómo deseas registrarte?">
                <MenuItem value="atleta">Atleta</MenuItem>
                <MenuItem value="club">Club</MenuItem>
                <MenuItem value="entrenador">Entrenador</MenuItem>
              </Select>
            </FormControl>

            {rol && (
              <>
                {/* Datos personales / Club */}
                <SectionHeader
                  icon={<PersonIcon fontSize="small" />}
                  title={isClub ? 'Datos del Club' : 'Datos Personales'}
                />
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label={isClub ? 'Nombre del Club' : 'Nombre'}
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    error={!!formErrors.nombre}
                    helperText={formErrors.nombre}
                    sx={{ ...fieldSx, ...(isClub && { gridColumn: '1 / -1' }) }}
                  />

                  {isClub && (
                    <>
                      <TextField
                        fullWidth
                        label="Dirección"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        required
                        error={!!formErrors.direccion}
                        helperText={formErrors.direccion}
                        sx={{ ...fieldSx, gridColumn: '1 / -1' }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"><LocationIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Descripción (Opcional)"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        placeholder="Breve descripción de tu club..."
                        sx={{ ...fieldSx, gridColumn: '1 / -1' }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"><DescriptionIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                          ),
                        }}
                      />
                    </>
                  )}

                  {showPersonalFields && (
                    <>
                      <TextField
                        fullWidth
                        label="Apellido Paterno"
                        name="apellidopa"
                        value={formData.apellidopa}
                        onChange={handleChange}
                        required
                        error={!!formErrors.apellidopa}
                        helperText={formErrors.apellidopa}
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="Apellido Materno"
                        name="apellidoma"
                        value={formData.apellidoma}
                        onChange={handleChange}
                        error={!!formErrors.apellidoma}
                        helperText={formErrors.apellidoma}
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="CURP"
                        name="curp"
                        value={formData.curp}
                        onChange={handleChange}
                        required
                        error={!!formErrors.curp}
                        helperText={formErrors.curp}
                        inputProps={{ maxLength: 18, style: { textTransform: 'uppercase' } }}
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="Fecha de nacimiento"
                        name="fechaNacimiento"
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={handleChange}
                        required
                        error={!!formErrors.fechaNacimiento}
                        helperText={formErrors.fechaNacimiento}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={fieldSx}
                      />
                      <FormControl fullWidth required sx={fieldSx}>
                        <InputLabel>Sexo</InputLabel>
                        <Select name="sexo" value={formData.sexo} onChange={handleChange} label="Sexo">
                          <MenuItem value="masculino">Masculino</MenuItem>
                          <MenuItem value="femenino">Femenino</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl fullWidth required sx={fieldSx}>
                        <InputLabel>Estado de Nacimiento</InputLabel>
                        <Select
                          name="estadoNacimiento"
                          value={formData.estadoNacimiento}
                          onChange={handleChange}
                          label="Estado de Nacimiento"
                        >
                          {ESTADOS_MEXICO.map((e) => (
                            <MenuItem key={e} value={e}>{e}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        label="Municipio"
                        name="municipio"
                        value={formData.municipio}
                        onChange={handleChange}
                        error={!!formErrors.municipio}
                        helperText={formErrors.municipio || 'Municipio donde resides actualmente'}
                        sx={fieldSx}
                      />
                    </>
                  )}
                </Box>

                {/* Profesional (solo entrenador) */}
                {isEntrenador && (
                  <>
                    <SectionHeader icon={<SchoolIcon fontSize="small" />} title="Información Profesional" />
                    <Divider sx={{ mb: 2.5 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                      <FormControl fullWidth sx={fieldSx}>
                        <InputLabel>Especialidades</InputLabel>
                        <Select
                          multiple
                          value={formData.especialidades}
                          onChange={(e) => handleMultiSelect('especialidades', e.target.value)}
                          input={<OutlinedInput label="Especialidades" />}
                          renderValue={(sel) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {sel.map((v) => <Chip key={v} label={v} size="small" />)}
                            </Box>
                          )}
                        >
                          {ESPECIALIDADES.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth sx={fieldSx}>
                        <InputLabel>Certificaciones</InputLabel>
                        <Select
                          multiple
                          value={formData.certificaciones}
                          onChange={(e) => handleMultiSelect('certificaciones', e.target.value)}
                          input={<OutlinedInput label="Certificaciones" />}
                          renderValue={(sel) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {sel.map((v) => <Chip key={v} label={v} size="small" />)}
                            </Box>
                          )}
                        >
                          {CERTIFICACIONES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        label="Años de Experiencia"
                        name="añosExperiencia"
                        type="number"
                        value={formData.añosExperiencia}
                        onChange={handleChange}
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"><WorkIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                          ),
                        }}
                      />
                      <FormControl fullWidth sx={fieldSx}>
                        <InputLabel>Club (Opcional)</InputLabel>
                        <Select name="clubId" value={formData.clubId} onChange={handleChange} label="Club (Opcional)">
                          <MenuItem value=""><em>Sin asignar</em></MenuItem>
                          {clubes.map((c) => (
                            <MenuItem key={c._id || c.id} value={c._id || c.id}>{c.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </>
                )}

                {/* Contacto */}
                <SectionHeader icon={<EmailIcon fontSize="small" />} title="Contacto" />
                <Divider sx={{ mb: 2.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    name="gmail"
                    type="email"
                    value={formData.gmail}
                    onChange={handleChange}
                    required
                    error={!!formErrors.gmail}
                    helperText={formErrors.gmail}
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><EmailIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    error={!!formErrors.telefono}
                    helperText={formErrors.telefono}
                    inputProps={{ maxLength: 10 }}
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><PhoneIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Seguridad */}
                <SectionHeader icon={<LockIcon fontSize="small" />} title="Seguridad" />
                <Divider sx={{ mb: 2.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="Contraseña"
                      name="password"
                      type={passwordVisible ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      error={!!formErrors.password}
                      helperText={formErrors.password}
                      sx={fieldSx}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start"><LockIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setPasswordVisible(!passwordVisible)} edge="end" sx={{ color: BURGUNDY }}>
                                {passwordVisible ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {formData.password && (
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(passwordStrength / 4) * 100}
                          sx={{
                            flex: 1, height: 5, borderRadius: 3, bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: strengthColor[passwordStrength] },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: strengthColor[passwordStrength], fontWeight: 600, minWidth: 70 }}>
                          {strengthLabel[passwordStrength]}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <TextField
                    fullWidth
                    label="Repetir Contraseña"
                    name="repetirPassword"
                    type={repetirPasswordVisible ? 'text' : 'password'}
                    value={formData.repetirPassword}
                    onChange={handleChange}
                    required
                    error={!!formErrors.repetirPassword}
                    helperText={formErrors.repetirPassword}
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start"><LockIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setRepetirPasswordVisible(!repetirPasswordVisible)} edge="end" sx={{ color: BURGUNDY }}>
                              {repetirPasswordVisible ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                {/* Boton */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <RegisterIcon />}
                  sx={{
                    mt: 4,
                    bgcolor: BURGUNDY,
                    py: 1.3,
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#600018' },
                  }}
                >
                  {submitting ? 'Registrando...' : 'Crear Cuenta'}
                </Button>

                {/* Link login */}
                <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                  <Typography variant="body2" component="span" sx={{ color: '#888' }}>
                    ¿Ya tienes cuenta?{' '}
                  </Typography>
                  <Link to="/login" style={{ color: PURPLE, fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                    Iniciar Sesión
                  </Link>
                </Box>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Registro;