import { perfilEmpresaAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Business, Email, Phone, Description } from '@mui/icons-material';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { FaWhatsapp } from 'react-icons/fa';
import CircularProgress from '@mui/material/CircularProgress';

const MySwal = withReactContent(Swal);

// Tema personalizado (sin cambios)
const theme = createTheme({
  palette: {
    primary: {
      main: '#800020',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7A4069',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5E8C7',
    },
    text: {
      primary: '#333333',
      secondary: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: "'Arial', 'Helvetica', sans-serif",
    h4: {
      fontWeight: 600,
      fontSize: '24px',
      color: '#800020',
    },
    body2: {
      fontSize: '14px',
      color: '#333333',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '5px',
            backgroundColor: '#FFFFFF',
            '&:hover fieldset': {
              borderColor: '#800020',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#800020',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#333333',
            '&.Mui-focused': {
              color: '#800020',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '5px',
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 600,
          padding: '10px 20px',
          backgroundColor: '#800020',
          '&:hover': {
            backgroundColor: '#A52A2A',
            transform: 'none',
          },
        },
      },
    },
  },
});

const API_BASE_URL = 'http://localhost:5000';

function Perfil() {
  const [perfil, setPerfil] = useState({
    nombreEmpresa: 'Instituto Veracruzano del Deporte',
    eslogan: '',
    logo: '',
    direccion: '',
    correo: '',
    telefono: '',
    facebook: '', // Nuevo campo
    instagram: '', // Nuevo campo
    twitter: '', // Nuevo campo
    mostrarWhatsapp: true, // Nuevo campo, encendido por defecto
  });
  const [formErrors, setFormErrors] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasPerfil, setHasPerfil] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/perfil-empresa`);
        console.log('Datos recibidos del backend:', response.data);
        if (response.data && response.data._id) {
          setPerfil(response.data); // Usar el valor real
          setHasPerfil(true);
          setIsRegistering(false);
        } else {
          setHasPerfil(false);
          setIsRegistering(true);
        }
      } catch (error) {
        console.error('Error al obtener perfil:', error.message);
        setHasPerfil(false);
        setIsRegistering(true);
      }
    };
    fetchPerfil();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'telefono') {
      if (!/^\d*$/.test(value) || value.length > 10) {
        return;
      }
    } else if (name === 'nombreEmpresa' || name === 'eslogan') {
      const regex = /^[a-zA-Z0-9\s]*$/;
      if (!regex.test(value) || value.length > 50) {
        return;
      }
    }

    setPerfil((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    validateField(name, newValue);
  };

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setPerfil((prev) => ({
        ...prev,
        logo: e.target.files[0],
      }));
    }
  };

  const handleSwitchChange = async (e) => {
    const checked = e.target.checked;
    setPerfil((prev) => ({ ...prev, mostrarWhatsapp: checked }));
    setSavingWhatsapp(true);
    try {
      const formData = new FormData();
      formData.append('nombreEmpresa', perfil.nombre_empresa);
      formData.append('eslogan', perfil.eslogan);
      formData.append('direccion', perfil.direccion);
      formData.append('correo', perfil.correo);
      formData.append('telefono', perfil.telefono);
      formData.append('facebook', perfil.facebook);
      formData.append('instagram', perfil.instagram);
      formData.append('twitter', perfil.twitter);
      formData.append('mostrarWhatsapp', checked ? 'true' : 'false');
      if (perfil.logo && typeof perfil.logo !== 'string') {
        formData.append('logo', perfil.logo);
      }
      await axios.put(`${API_BASE_URL}/api/perfil-empresa`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Volver a consultar el perfil para sincronizar el estado
      const response = await axios.get(`${API_BASE_URL}/api/perfil-empresa`);
      setPerfil(response.data); // Usar el valor real
      setSavingWhatsapp(false);
    } catch (error) {
      setSavingWhatsapp(false);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la visibilidad de WhatsApp.' });
    }
  };

  const validateField = (name, value) => {
    let errors = { ...formErrors };

    if (['nombreEmpresa', 'eslogan', 'direccion', 'correo', 'telefono'].includes(name)) {
      if (!value) {
        errors[name] = 'Este campo es obligatorio';
      } else {
        delete errors[name];
      }
    }

    if (name === 'telefono' && value) {
      if (!/^\d{10}$/.test(value)) {
        errors[name] = 'El teléfono debe tener exactamente 10 dígitos numéricos';
      } else {
        delete errors[name];
      }
    }

    if (name === 'correo' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[name] = 'Introduce un correo electrónico válido';
      } else {
        delete errors[name];
      }
    }

    setFormErrors(errors);
  };

  const validateForm = () => {
    const requiredFields = ['eslogan', 'direccion', 'correo', 'telefono'];
    const errors = {};

    requiredFields.forEach((field) => {
      if (!perfil[field]) {
        errors[field] = 'Este campo es obligatorio';
      }
    });

    if (perfil.telefono && !/^\d{10}$/.test(perfil.telefono)) {
      errors.telefono = 'El teléfono debe tener exactamente 10 dígitos numéricos';
    }

    if (perfil.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.correo)) {
      errors.correo = 'Introduce un correo electrónico válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      MySwal.fire({
        icon: 'error',
        title: 'Errores en el formulario',
        text: 'Por favor, corrige los errores antes de continuar.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('nombreEmpresa', perfil.nombre_empresa);
    formData.append('eslogan', perfil.eslogan);
    formData.append('direccion', perfil.direccion);
    formData.append('correo', perfil.correo);
    formData.append('telefono', perfil.telefono);
    formData.append('facebook', perfil.facebook); // Nuevo campo
    formData.append('instagram', perfil.instagram); // Nuevo campo
    formData.append('twitter', perfil.twitter); // Nuevo campo
    formData.append('mostrarWhatsapp', perfil.mostrarWhatsapp);
    if (perfil.logo && typeof perfil.logo !== 'string') {
      formData.append('logo', perfil.logo);
    }

    try {
      const endpoint = isRegistering ? '/api/perfil-empresa' : '/api/perfil-empresa';
      const method = isRegistering ? axios.post : axios.put;
      const response = await method(`${API_BASE_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Respuesta del backend:', response.data);

      if (response.data.perfil && typeof response.data.perfil === 'object') {
        MySwal.fire({
          icon: 'success',
          title: isRegistering ? 'Perfil registrado' : 'Perfil actualizado',
          text: response.data.message,
          confirmButtonText: 'Aceptar',
        });

        setPerfil(response.data.perfil);
        setHasPerfil(true);
        setIsRegistering(false);
      } else {
        MySwal.fire({
          icon: 'success',
          title: 'Perfil actualizado',
          text: 'Los datos se actualizaron correctamente en la base de datos.',
          confirmButtonText: 'Aceptar',
        });

        setPerfil({ ...perfil, ...response.data.perfil });
        setHasPerfil(true);
        setIsRegistering(false);
      }
    } catch (error) {
      console.error(`Error al ${isRegistering ? 'registrar' : 'actualizar'} perfil:`, error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || `No se pudo ${isRegistering ? 'registrar' : 'actualizar'} el perfil. Detalle: ${error.message}`,
      });
    }
  };

  const handleDelete = async () => {
    MySwal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el perfil permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE_URL}/api/perfil-empresa`);
          MySwal.fire({
            icon: 'success',
            title: 'Perfil eliminado',
            text: 'El perfil ha sido eliminado exitosamente.',
            confirmButtonText: 'Aceptar',
          });
          setPerfil({
            nombreEmpresa: 'Instituto Veracruzano del Deporte',
            eslogan: '',
            logo: '',
            direccion: '',
            correo: '',
            telefono: '',
            facebook: '', // Nuevo campo
            instagram: '', // Nuevo campo
            twitter: '', // Nuevo campo
            mostrarWhatsapp: true, // Resetear el switch
          });
          setHasPerfil(false);
          setIsRegistering(true);
        } catch (error) {
          console.error('Error al eliminar perfil:', error);
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.error || 'No se pudo eliminar el perfil.',
          });
        }
      }
    });
  };

  const handleCancel = () => {
    setPerfil({
      nombreEmpresa: 'Instituto Veracruzano del Deporte',
      eslogan: '',
      logo: '',
      direccion: '',
      correo: '',
      telefono: '',
      facebook: '', // Nuevo campo
      instagram: '', // Nuevo campo
      twitter: '', // Nuevo campo
      mostrarWhatsapp: true, // Resetear el switch
    });
    setFormErrors({});
    setIsRegistering(!hasPerfil);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          padding: '20px',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: isMobile ? 3 : 4,
            maxWidth: isMobile ? '90%' : '900px',
            width: '100%',
            mx: 'auto',
            borderRadius: '8px',
            bgcolor: '#F5E8C7',
            boxSizing: 'border-box',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            mt: isMobile ? 2 : 4,
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Gestión de Perfil de la Institución
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3 }}>
            {isRegistering ? 'Registra el perfil de la institución' : 'Actualiza los datos del perfil'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de la Institución"
                  name="nombreEmpresa"
                  value={perfil.nombre_empresa}
                  onChange={handleChange}
                  placeholder="Ingresa el nombre de la institución"
                  required
                  error={!!formErrors.nombreEmpresa}
                  helperText={formErrors.nombreEmpresa || ' '}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1 }}>
                        <Business />
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Eslogan"
                  name="eslogan"
                  value={perfil.eslogan}
                  onChange={handleChange}
                  placeholder="Ingresa el eslogan"
                  required
                  error={!!formErrors.eslogan}
                  helperText={formErrors.eslogan || ' '}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1 }}>
                        <Description />
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Logo"
                  name="logo"
                  type="file"
                  InputLabelProps={{ shrink: true }}
                  onChange={handleLogoChange}
                  inputProps={{ accept: 'image/*' }}
                />
                {perfil.logo && typeof perfil.logo === 'string' && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={perfil.logo}
                      alt="Logo actual"
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: '3px solid #800020',
                        background: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                  </Box>
                )}
              </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dirección (para el mapa)"
                name="direccion"
                value={perfil.direccion}
                onChange={handleChange}
                placeholder="Ingresa la dirección completa (ej. Calle 123, Veracruz, México)"
                required
                error={!!formErrors.direccion}
                helperText={formErrors.direccion || ' '}
              />
            </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo"
                  name="correo"
                  value={perfil.correo}
                  onChange={handleChange}
                  placeholder="Ingresa el correo electrónico"
                  required
                  error={!!formErrors.correo}
                  helperText={formErrors.correo || ' '}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1 }}>
                        <Email />
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono (10 dígitos)"
                  name="telefono"
                  value={perfil.telefono}
                  onChange={handleChange}
                  placeholder="Ingresa el teléfono"
                  required
                  error={!!formErrors.telefono}
                  helperText={formErrors.telefono || ' '}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1 }}>
                        <Phone />
                      </Box>
                    ),
                  }}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Facebook (Opcional)"
                  name="facebook"
                  value={perfil.facebook}
                  onChange={handleChange}
                  placeholder="Ingresa la URL de Facebook"
                  error={!!formErrors.facebook}
                  helperText={formErrors.facebook || ' '}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Instagram (Opcional)"
                  name="instagram"
                  value={perfil.instagram}
                  onChange={handleChange}
                  placeholder="Ingresa la URL de Instagram"
                  error={!!formErrors.instagram}
                  helperText={formErrors.instagram || ' '}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Twitter (Opcional)"
                  name="twitter"
                  value={perfil.twitter}
                  onChange={handleChange}
                  placeholder="Ingresa la URL de Twitter"
                  error={!!formErrors.twitter}
                  helperText={formErrors.twitter || ' '}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!perfil.mostrarWhatsapp}
                      onChange={handleSwitchChange}
                      color="primary"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#800020',
                        },
                        '& .MuiSwitch-switchBase': {
                          color: '#7A4069',
                        },
                        '& .MuiSwitch-track': {
                          backgroundColor: perfil.mostrarWhatsapp ? '#800020' : '#7A4069',
                          opacity: 1,
                        },
                      }}
                    />
                  }
                  label={<span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}><FaWhatsapp style={{ color: '#25D366', marginRight: 8 }} /> Mostrar WhatsApp {savingWhatsapp && <CircularProgress size={18} sx={{ ml: 1 }} />}</span>}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ maxWidth: '300px', width: '100%' }}
                  >
                    {isRegistering ? 'Registrar Perfil' : 'Actualizar Perfil'}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleCancel}
                    sx={{ maxWidth: '300px', width: '100%' }}
                  >
                    Cancelar
                  </Button>
                  {hasPerfil && (
                    <Button
                      variant="contained"
                      sx={{
                        maxWidth: '300px',
                        width: '100%',
                        backgroundColor: '#B22222',
                        '&:hover': { backgroundColor: '#8B0000' },
                      }}
                      onClick={handleDelete}
                    >
                      Eliminar Perfil
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default Perfil;