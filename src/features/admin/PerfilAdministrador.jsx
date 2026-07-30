import React, { useState } from 'react';
import {
  Box, Container, Typography, TextField, Button, CircularProgress,
  Avatar, Chip, IconButton, InputAdornment,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { adminsAPI, authAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
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
};

const cardSx = {
  bgcolor: COLORS.paper,
  borderRadius: '10px',
  boxShadow: '0 2px 12px #80002012',
};

// Quita el fondo amarillo que pone el navegador al autocompletar campos
const fieldSx = {
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
    WebkitBoxShadow: '0 0 0 100px #fff inset',
    WebkitTextFillColor: '#333',
    caretColor: '#333',
  },
};

const PerfilAdministrador = () => {
  const { user } = useAuth();

  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [verNuevoPassword, setVerNuevoPassword] = useState(false);
  const [creandoAdmin, setCreandoAdmin] = useState(false);

  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  // Registra un nuevo administrador con solo correo y contraseña
  const manejarCrearAdmin = async (e) => {
    e.preventDefault();
    if (nuevoPassword.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Contraseña muy corta', text: 'Debe tener al menos 8 caracteres.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    try {
      setCreandoAdmin(true);
      await adminsAPI.crear({ email: nuevoEmail.trim(), password: nuevoPassword });
      Swal.fire({ icon: 'success', title: 'Administrador creado', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
      setNuevoEmail('');
      setNuevoPassword('');
    } catch (error) {
      console.error('Error al crear administrador:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error || 'No se pudo crear el administrador.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setCreandoAdmin(false);
    }
  };

  // Cambia la contraseña de la cuenta en sesión
  const manejarCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwordNueva.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Contraseña muy corta', text: 'Debe tener al menos 8 caracteres.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      Swal.fire({ icon: 'warning', title: 'No coinciden', text: 'Las dos contraseñas deben ser iguales.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    try {
      setCambiandoPassword(true);
      await authAPI.changePassword({ password: passwordNueva });
      Swal.fire({ icon: 'success', title: 'Contraseña actualizada', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
      setPasswordNueva('');
      setPasswordConfirmar('');
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error || 'No se pudo cambiar la contraseña.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setCambiandoPassword(false);
    }
  };

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Cabecera del perfil con avatar */}
        <Box sx={{ ...cardSx, mb: 3, overflow: 'visible', position: 'relative' }}>
          <Box sx={{ bgcolor: COLORS.burgundy, height: { xs: 80, md: 100 }, borderRadius: '10px 10px 0 0' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: { xs: '-40px', md: '-48px' }, pb: 3 }}>
            <Avatar
              sx={{
                width: { xs: 80, md: 96 }, height: { xs: 80, md: 96 },
                bgcolor: COLORS.purple, border: '4px solid #fff', boxShadow: '0 4px 14px #00000026', mb: 1.5,
              }}
            >
              <AdminIcon sx={{ fontSize: { xs: 36, md: 44 } }} />
            </Avatar>

            <Typography variant="h5" sx={{ color: COLORS.burgundy, fontWeight: 800, textAlign: 'center', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              {user?.nombre || 'Administrador'}
            </Typography>

            <Chip
              icon={<EmailIcon sx={{ fontSize: 16, color: `${COLORS.purple} !important` }} />}
              label={user?.email}
              size="small"
              sx={{ mt: 1, bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600, maxWidth: '100%' }}
            />
          </Box>
        </Box>

        {/* Cambiar contraseña */}
        <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 }, mb: 3 }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>Cambiar mi Contraseña</Typography>
          <Box component="form" onSubmit={manejarCambiarPassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nueva contraseña"
              type={verPassword ? 'text' : 'password'}
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              required
              helperText="Mínimo 8 caracteres"
              sx={fieldSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setVerPassword((v) => !v)}>
                        {verPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Confirmar contraseña"
              type={verPassword ? 'text' : 'password'}
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              required
              sx={fieldSx}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={cambiandoPassword}
                startIcon={cambiandoPassword ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <LockIcon />}
                sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none' }}
              >
                {cambiandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Agregar un nuevo administrador */}
        <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>Agregar Administrador</Typography>
          <Box component="form" onSubmit={manejarCrearAdmin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              value={nuevoEmail}
              onChange={(e) => setNuevoEmail(e.target.value)}
              required
              sx={fieldSx}
              slotProps={{ input: { startAdornment: <EmailIcon sx={{ fontSize: 18, color: COLORS.burgundy, mr: 1 }} /> } }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type={verNuevoPassword ? 'text' : 'password'}
              value={nuevoPassword}
              onChange={(e) => setNuevoPassword(e.target.value)}
              required
              helperText="Mínimo 8 caracteres"
              sx={fieldSx}
              slotProps={{
                input: {
                  startAdornment: <LockIcon sx={{ fontSize: 18, color: COLORS.burgundy, mr: 1 }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setVerNuevoPassword((v) => !v)}>
                        {verNuevoPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={creandoAdmin}
                startIcon={creandoAdmin ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <PersonAddIcon />}
                sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none' }}
              >
                {creandoAdmin ? 'Creando...' : 'Crear administrador'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PerfilAdministrador;