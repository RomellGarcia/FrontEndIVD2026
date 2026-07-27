import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Box, Typography, Container, Button, TextField, CircularProgress, IconButton, InputAdornment,
} from '@mui/material';
import {
  LockReset as LockResetIcon, ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckIcon, Cancel as CancelIcon,
} from '@mui/icons-material';
import { recuperarAPI } from '../../api/index.js';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

// Componente para mostrar requisitos de contraseña
const RequisitoPassword = ({ cumple, texto }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
    {cumple
      ? <CheckIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
      : <CancelIcon sx={{ fontSize: 16, color: COLORS.ink, opacity: 0.35 }} />}
    <Typography variant="caption" sx={{ color: cumple ? COLORS.burgundy : COLORS.ink, opacity: cumple ? 1 : 0.6, fontWeight: cumple ? 700 : 400 }}>
      {texto}
    </Typography>
  </Box>
);

const RestablecerPassword = () => {
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  const [confirmarContraseña, setConfirmarContraseña] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarNuevaContraseña, setMostrarNuevaContraseña] = useState(false);
  const [mostrarConfirmarContraseña, setMostrarConfirmarContraseña] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { gmail, code } = location.state || {};

  const cumpleLongitud = nuevaContraseña.length >= 6;
  const coinciden = nuevaContraseña.length > 0 && nuevaContraseña === confirmarContraseña;

  // Envía la nueva contraseña para restablecerla
  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!nuevaContraseña || !confirmarContraseña) {
      Swal.fire({ icon: 'error', title: 'Campos vacíos', text: 'Completa ambos campos.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    if (!cumpleLongitud) {
      Swal.fire({ icon: 'error', title: 'Contraseña débil', text: 'La contraseña debe tener al menos 6 caracteres.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    if (!coinciden) {
      Swal.fire({ icon: 'error', title: 'No coinciden', text: 'Las contraseñas no coinciden.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    setCargando(true);
    try {
      await recuperarAPI.resetPassword({ gmail, code, newPassword: nuevaContraseña });
      Swal.fire({
        icon: 'success',
        title: 'Contraseña restablecida',
        text: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
        confirmButtonColor: COLORS.burgundy,
      });
      navigate('/login');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo restablecer la contraseña. Intenta de nuevo.',
        confirmButtonColor: COLORS.burgundy,
      });
    } finally {
      setCargando(false);
    }
  };

  if (!gmail || !code) {
    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Box sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 1 }}>
              Acceso inválido
            </Typography>
            <Typography sx={{ color: COLORS.ink, mb: 3 }}>
              Inicia el proceso de recuperación desde tu correo.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/recuperar-correo')} sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}>
              Ir al inicio del proceso
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', '& .MuiFormLabel-asterisk': { display: 'none' } }}>
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/verificar-codigo', { state: { gmail } })}
            sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Volver
          </Button>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Recuperar Acceso
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Nueva Contraseña
          </Typography>
          <Typography sx={{ opacity: 0.8, mt: 0.5 }}>
            Paso 3 de 3 · Elige tu nueva contraseña
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        <Box sx={{ ...cardSx, mt: { xs: -4, md: -5 }, p: { xs: 3, md: 5 } }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%', bgcolor: COLORS.lineSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
          }}>
            <LockResetIcon sx={{ fontSize: 36, color: COLORS.burgundy }} />
          </Box>

          <Box component="form" onSubmit={manejarEnvio}>
            <TextField
              fullWidth
              type={mostrarNuevaContraseña ? 'text' : 'password'}
              label="Nueva contraseña"
              value={nuevaContraseña}
              onChange={(e) => setNuevaContraseña(e.target.value)}
              required
              autoFocus
              sx={{ mb: 1.5 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setMostrarNuevaContraseña((v) => !v)} edge="end" size="small">
                        {mostrarNuevaContraseña ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2.5, pl: 0.5 }}>
              <RequisitoPassword cumple={cumpleLongitud} texto="Al menos 6 caracteres" />
            </Box>

            <TextField
              fullWidth
              type={mostrarConfirmarContraseña ? 'text' : 'password'}
              label="Confirmar contraseña"
              value={confirmarContraseña}
              onChange={(e) => setConfirmarContraseña(e.target.value)}
              required
              sx={{ mb: 1.5 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setMostrarConfirmarContraseña((v) => !v)} edge="end" size="small">
                        {mostrarConfirmarContraseña ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {confirmarContraseña.length > 0 && (
              <Box sx={{ mb: 2.5, pl: 0.5 }}>
                <RequisitoPassword cumple={coinciden} texto="Las contraseñas coinciden" />
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={cargando}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none', py: 1.4, mt: 1 }}
            >
              {cargando ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Restablecer contraseña'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RestablecerPassword;