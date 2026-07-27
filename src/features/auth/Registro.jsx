import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import zxcvbn from 'zxcvbn';
import sha1 from 'js-sha1';
import { authAPI, entrenadorAPI } from '../../api/index.js';
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
  Divider,
  CircularProgress,
  Autocomplete,
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

// Paleta de colores institucional
const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#ffffff';

// Estilos reutilizables para campos de formulario
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

// Lista de estados de México
const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Coahuila', 'Colima', 'Chiapas', 'Chihuahua', 'Ciudad de México',
  'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
  'Nacido en el Extranjero',
];

// Encabezado de sección
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

  // Estado del formulario
  const [formulario, setFormulario] = useState({
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
    correo: '',
    password: '',
    repetirPassword: '',
    especialidades: [],
    certificaciones: [],
    añosExperiencia: '',
    direccion: '',
    lugarEntrenamiento: '',
    descripcion: '',
  });

  const [erroresFormulario, setErroresFormulario] = useState({});
  const [fortalezaContraseña, setFortalezaContraseña] = useState(0);
  const [contraseñaVisible, setContraseñaVisible] = useState(false);
  const [repetirContraseñaVisible, setRepetirContraseñaVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sugerenciasCertificaciones, setSugerenciasCertificaciones] = useState([]);
  const [sugerenciasEspecialidades, setSugerenciasEspecialidades] = useState([]);

  const rol = formulario.rol;
  const esAtleta = rol === 'atleta';
  const esClub = rol === 'club';
  const esEntrenador = rol === 'entrenador';
  const mostrarCamposPersonales = esAtleta || esEntrenador;

  const MAX_CERTIFICACIONES = 3;
  const MAX_ESPECIALIDADES = 3;

  // Sugerencias de certificaciones y especialidades para entrenadores
  useEffect(() => {
    if (esEntrenador) {
      entrenadorAPI
        .getCertificacionesSugeridas()
        .then((res) => setSugerenciasCertificaciones(res.data.certificaciones || []))
        .catch((err) => {
          console.error('Error al cargar certificaciones sugeridas:', err.response?.status, err.response?.data || err.message);
          setSugerenciasCertificaciones([]);
        });

      entrenadorAPI
        .getEspecialidadesSugeridas()
        .then((res) => setSugerenciasEspecialidades(res.data.especialidades || []))
        .catch((err) => {
          console.error('Error al cargar especialidades sugeridas:', err.response?.status, err.response?.data || err.message);
          setSugerenciasEspecialidades([]);
        });
    }
  }, [esEntrenador]);

  // Valida un campo individual
  const validarCampo = (nombre, valor) => {
    const errores = { ...erroresFormulario };
    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,30}$/;

    switch (nombre) {
      case 'nombre':
      case 'apellidopa':
      case 'apellidoma':
        if (!regexNombre.test(valor)) errores[nombre] = 'Solo letras, mínimo 2 caracteres.';
        else delete errores[nombre];
        break;
      case 'telefono':
        if (!/^\d{10}$/.test(valor)) errores[nombre] = 'Debe tener exactamente 10 dígitos.';
        else delete errores[nombre];
        break;
      case 'correo':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) errores[nombre] = 'Correo electrónico inválido.';
        else delete errores[nombre];
        break;
      case 'curp':
        if (valor && !/^[A-Za-z0-9]{18}$/.test(valor)) errores[nombre] = 'Debe tener 18 caracteres alfanuméricos.';
        else delete errores[nombre];
        break;
      case 'fechaNacimiento': {
        if (!valor) { errores[nombre] = 'Campo obligatorio.'; break; }
        const edad = new Date().getFullYear() - new Date(valor).getFullYear();
        const edadMinima = esEntrenador ? 18 : 12;
        if (edad < edadMinima || edad > 100) errores[nombre] = `Edad entre ${edadMinima} y 100 años.`;
        else delete errores[nombre];
        break;
      }
      case 'municipio':
        if (valor && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]{2,100}$/.test(valor))
          errores[nombre] = 'Solo letras, mínimo 2 caracteres.';
        else delete errores[nombre];
        break;
      case 'direccion':
        if (valor && valor.length < 3) errores[nombre] = 'Mínimo 3 caracteres.';
        else delete errores[nombre];
        break;
      case 'password':
        if (valor.length < 8 || valor.length > 15) errores[nombre] = 'Entre 8 y 15 caracteres.';
        else delete errores[nombre];
        if (formulario.repetirPassword && valor !== formulario.repetirPassword)
          errores.repetirPassword = 'Las contraseñas no coinciden.';
        else delete errores.repetirPassword;
        break;
      case 'repetirPassword':
        if (valor !== formulario.password) errores[nombre] = 'Las contraseñas no coinciden.';
        else delete errores[nombre];
        break;
      default:
        break;
    }
    setErroresFormulario(errores);
  };

  // Maneja cambios en los campos del formulario
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    if (name === 'password') setFortalezaContraseña(zxcvbn(value).score);
    validarCampo(name, value);
  };

  // Maneja cambios en Autocomplete (certificaciones y especialidades)
  const manejarCambioChips = (campo, max) => (event, nuevosValores) => {
    const limpios = [];
    const vistos = new Set();
    for (const v of nuevosValores) {
      const valor = (v || '').trim();
      const clave = valor.toLowerCase();
      if (!valor || vistos.has(clave)) continue;
      vistos.add(clave);
      limpios.push(valor);
    }
    setFormulario((prev) => ({ ...prev, [campo]: limpios.slice(0, max) }));
  };

  // Verifica si la contraseña ha sido filtrada en brechas de seguridad
  const verificarContraseñaComprometida = async (password) => {
    try {
      const hash = sha1(password);
      const res = await axios.get(`https://api.pwnedpasswords.com/range/${hash.substring(0, 5)}`);
      return res.data.includes(hash.substring(5).toUpperCase());
    } catch {
      return false;
    }
  };

  // Envía el formulario de registro
  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (Object.keys(erroresFormulario).length > 0) {
      MySwal.fire({ icon: 'error', title: 'Errores en el formulario', text: 'Corrige los errores antes de continuar.' });
      return;
    }

    setEnviando(true);

    const comprometida = await verificarContraseñaComprometida(formulario.password);
    if (comprometida) {
      setEnviando(false);
      MySwal.fire({ icon: 'error', title: 'Contraseña comprometida', text: 'Esta contraseña ha sido filtrada. Por favor, elige otra.' });
      return;
    }

    try {
      let datosEnviar;

      if (esClub) {
        datosEnviar = {
          nombre: formulario.nombre,
          direccion: formulario.direccion.trim(),
          telefono: formulario.telefono,
          email: formulario.correo,
          password: formulario.password,
          descripcion: formulario.descripcion.trim(),
          lugar_entrenamiento: formulario.lugarEntrenamiento.trim(),
          rol: 'club',
        };
      } else if (esEntrenador) {
        datosEnviar = {
          nombre: formulario.nombre,
          apellido_paterno: formulario.apellidopa,
          apellido_materno: formulario.apellidoma,
          curp: formulario.curp,
          fecha_nacimiento: formulario.fechaNacimiento,
          genero: formulario.sexo,
          estado_nacimiento: formulario.estadoNacimiento,
          municipio: formulario.municipio,
          telefono: formulario.telefono,
          email: formulario.correo,
          password: formulario.password,
          rol: 'entrenador',
          especialidades: formulario.especialidades,
          certificaciones: formulario.certificaciones,
          anos_experiencia: formulario.añosExperiencia,
        };
      } else {
        datosEnviar = {
          nombre: formulario.nombre,
          apellido_paterno: formulario.apellidopa,
          apellido_materno: formulario.apellidoma,
          curp: formulario.curp,
          fecha_nacimiento: formulario.fechaNacimiento,
          genero: formulario.sexo,
          estado_nacimiento: formulario.estadoNacimiento,
          municipio: formulario.municipio,
          telefono: formulario.telefono,
          email: formulario.correo,
          password: formulario.password,
          rol: 'atleta',
        };
      }

      await authAPI.register(datosEnviar);

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
      setEnviando(false);
    }
  };

  const etiquetaFortaleza = ['Débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const colorFortaleza = ['#D32F2F', '#D32F2F', '#FF9800', '#4CAF50', '#2E7D32'];

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
        {/* Cabecera */}
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

        {/* Formulario */}
        <CardContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          <Box component="form" onSubmit={manejarEnvio}>
            {/* Selector de rol */}
            <FormControl fullWidth sx={{ mb: 3, ...fieldSx }} required>
              <InputLabel>¿Cómo deseas registrarte?</InputLabel>
              <Select name="rol" value={rol} onChange={manejarCambio} label="¿Cómo deseas registrarte?">
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
                  title={esClub ? 'Datos del Club' : 'Datos Personales'}
                />
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label={esClub ? 'Nombre del Club' : 'Nombre'}
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    required
                    error={!!erroresFormulario.nombre}
                    helperText={erroresFormulario.nombre}
                    sx={{ ...fieldSx, ...(esClub && { gridColumn: '1 / -1' }) }}
                  />

                  {esClub && (
                    <>
                      <TextField
                        fullWidth
                        label="Dirección"
                        name="direccion"
                        value={formulario.direccion}
                        onChange={manejarCambio}
                        required
                        error={!!erroresFormulario.direccion}
                        helperText={erroresFormulario.direccion}
                        sx={{ ...fieldSx, gridColumn: '1 / -1' }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"><LocationIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Lugar de Entrenamiento (Opcional)"
                        name="lugarEntrenamiento"
                        value={formulario.lugarEntrenamiento}
                        onChange={manejarCambio}
                        placeholder="Ej: Unidad Deportiva Xalapa, cancha 3"
                        helperText="Si lo dejas en blanco, tus atletas podrán capturar el suyo propio; si lo llenas, se aplica automáticamente a todos ellos"
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
                        value={formulario.descripcion}
                        onChange={manejarCambio}
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

                  {mostrarCamposPersonales && (
                    <>
                      <TextField
                        fullWidth
                        label="Apellido Paterno"
                        name="apellidopa"
                        value={formulario.apellidopa}
                        onChange={manejarCambio}
                        required
                        error={!!erroresFormulario.apellidopa}
                        helperText={erroresFormulario.apellidopa}
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="Apellido Materno"
                        name="apellidoma"
                        value={formulario.apellidoma}
                        onChange={manejarCambio}
                        error={!!erroresFormulario.apellidoma}
                        helperText={erroresFormulario.apellidoma}
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="CURP"
                        name="curp"
                        value={formulario.curp}
                        onChange={manejarCambio}
                        required
                        error={!!erroresFormulario.curp}
                        helperText={erroresFormulario.curp}
                        inputProps={{ maxLength: 18, style: { textTransform: 'uppercase' } }}
                        sx={fieldSx}
                      />
                      <TextField
                        fullWidth
                        label="Fecha de nacimiento"
                        name="fechaNacimiento"
                        type="date"
                        value={formulario.fechaNacimiento}
                        onChange={manejarCambio}
                        required
                        error={!!erroresFormulario.fechaNacimiento}
                        helperText={erroresFormulario.fechaNacimiento}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={fieldSx}
                      />
                      <FormControl fullWidth required sx={fieldSx}>
                        <InputLabel>Sexo</InputLabel>
                        <Select name="sexo" value={formulario.sexo} onChange={manejarCambio} label="Sexo">
                          <MenuItem value="masculino">Masculino</MenuItem>
                          <MenuItem value="femenino">Femenino</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl fullWidth required sx={fieldSx}>
                        <InputLabel>Estado de Nacimiento</InputLabel>
                        <Select
                          name="estadoNacimiento"
                          value={formulario.estadoNacimiento}
                          onChange={manejarCambio}
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
                        value={formulario.municipio}
                        onChange={manejarCambio}
                        error={!!erroresFormulario.municipio}
                        helperText={erroresFormulario.municipio || 'Municipio donde resides actualmente'}
                        sx={fieldSx}
                      />
                    </>
                  )}
                </Box>

                {/* Información profesional (solo entrenador) */}
                {esEntrenador && (
                  <>
                    <SectionHeader icon={<SchoolIcon fontSize="small" />} title="Información Profesional" />
                    <Divider sx={{ mb: 2.5 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={sugerenciasEspecialidades}
                        value={formulario.especialidades}
                        onChange={manejarCambioChips('especialidades', MAX_ESPECIALIDADES)}
                        renderTags={(valores, getTagProps) =>
                          valores.map((valor, index) => (
                            <Chip label={valor} size="small" {...getTagProps({ index })} key={valor} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Especialidades"
                            placeholder={formulario.especialidades.length < MAX_ESPECIALIDADES ? 'Escoge de la lista o escribe una nueva...' : ''}
                            helperText={`Máximo ${MAX_ESPECIALIDADES} — ${formulario.especialidades.length}/${MAX_ESPECIALIDADES}`}
                            sx={fieldSx}
                          />
                        )}
                        disabled={formulario.especialidades.length >= MAX_ESPECIALIDADES}
                      />
                      <Autocomplete
                        multiple
                        freeSolo
                        options={sugerenciasCertificaciones}
                        value={formulario.certificaciones}
                        onChange={manejarCambioChips('certificaciones', MAX_CERTIFICACIONES)}
                        renderTags={(valores, getTagProps) =>
                          valores.map((valor, index) => (
                            <Chip label={valor} size="small" {...getTagProps({ index })} key={valor} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Certificaciones"
                            placeholder={formulario.certificaciones.length < MAX_CERTIFICACIONES ? 'Escoge de la lista o escribe una nueva...' : ''}
                            helperText={`Máximo ${MAX_CERTIFICACIONES} — ${formulario.certificaciones.length}/${MAX_CERTIFICACIONES}`}
                            sx={fieldSx}
                          />
                        )}
                        disabled={formulario.certificaciones.length >= MAX_CERTIFICACIONES}
                      />
                      <TextField
                        fullWidth
                        label="Años de Experiencia"
                        name="añosExperiencia"
                        type="number"
                        value={formulario.añosExperiencia}
                        onChange={manejarCambio}
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"><WorkIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                          ),
                        }}
                      />
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
                    name="correo"
                    type="email"
                    value={formulario.correo}
                    onChange={manejarCambio}
                    required
                    error={!!erroresFormulario.correo}
                    helperText={erroresFormulario.correo}
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
                    value={formulario.telefono}
                    onChange={manejarCambio}
                    required
                    error={!!erroresFormulario.telefono}
                    helperText={erroresFormulario.telefono}
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
                      type={contraseñaVisible ? 'text' : 'password'}
                      value={formulario.password}
                      onChange={manejarCambio}
                      required
                      error={!!erroresFormulario.password}
                      helperText={erroresFormulario.password}
                      sx={fieldSx}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start"><LockIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setContraseñaVisible(!contraseñaVisible)} edge="end" sx={{ color: BURGUNDY }}>
                                {contraseñaVisible ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {formulario.password && (
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(fortalezaContraseña / 4) * 100}
                          sx={{
                            flex: 1, height: 5, borderRadius: 3, bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: colorFortaleza[fortalezaContraseña] },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: colorFortaleza[fortalezaContraseña], fontWeight: 600, minWidth: 70 }}>
                          {etiquetaFortaleza[fortalezaContraseña]}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <TextField
                    fullWidth
                    label="Repetir Contraseña"
                    name="repetirPassword"
                    type={repetirContraseñaVisible ? 'text' : 'password'}
                    value={formulario.repetirPassword}
                    onChange={manejarCambio}
                    required
                    error={!!erroresFormulario.repetirPassword}
                    helperText={erroresFormulario.repetirPassword}
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start"><LockIcon sx={{ color: PURPLE, fontSize: 20 }} /></InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setRepetirContraseñaVisible(!repetirContraseñaVisible)} edge="end" sx={{ color: BURGUNDY }}>
                              {repetirContraseñaVisible ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                {/* Botón de registro */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={enviando}
                  startIcon={enviando ? <CircularProgress size={20} color="inherit" /> : <RegisterIcon />}
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
                  {enviando ? 'Registrando...' : 'Crear Cuenta'}
                </Button>

                {/* Enlace a login */}
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