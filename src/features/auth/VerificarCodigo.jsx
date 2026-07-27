import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Box, Typography, Container, Button, TextField, CircularProgress,
} from '@mui/material';
import {
  VpnKey as PinIcon, ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { recuperarAPI } from '../../api/index.js';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

const VerificarCodigo = () => {
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { gmail } = location.state || {};

  // Verifica el código de recuperación
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await recuperarAPI.verifyCode({ gmail, code: codigo });
      Swal.fire({
        icon: 'success',
        title: 'Código verificado',
        text: 'Ahora puedes elegir tu nueva contraseña.',
        confirmButtonColor: COLORS.burgundy,
        timer: 1600,
        showConfirmButton: false,
      });
      navigate('/restablecer-password', { state: { gmail, code: codigo } });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'El código es incorrecto o expiró.',
        confirmButtonColor: COLORS.burgundy,
      });
    } finally {
      setCargando(false);
    }
  };

  // Reenvía el código de recuperación
  const manejarReenviar = async () => {
    if (!gmail) return;
    setReenviando(true);
    try {
      await recuperarAPI.forgotPassword({ gmail });
      Swal.fire({ icon: 'success', title: 'Código reenviado', confirmButtonColor: COLORS.burgundy, timer: 1600, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'No se pudo reenviar', text: 'Intenta de nuevo en unos minutos.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setReenviando(false);
    }
  };

  if (!gmail) {
    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Box sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 1 }}>
              Acceso inválido
            </Typography>
            <Typography sx={{ color: COLORS.ink, mb: 3 }}>
              Inicia el proceso de recuperación desde el principio.
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
            onClick={() => navigate('/recuperar-correo')}
            sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Cambiar correo
          </Button>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Recuperar Acceso
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Verificar Código
          </Typography>
          <Typography sx={{ opacity: 0.8, mt: 0.5 }}>
            Paso 2 de 3 · Revisa tu correo
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        <Box sx={{ ...cardSx, mt: { xs: -4, md: -5 }, p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%', bgcolor: COLORS.lineSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
          }}>
            <PinIcon sx={{ fontSize: 36, color: COLORS.burgundy }} />
          </Box>

          <Typography variant="body1" sx={{ color: COLORS.ink, mb: 0.5 }}>
            Te mandamos un código de 6 dígitos a:
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 3 }}>
            {gmail}
          </Typography>

          <Box component="form" onSubmit={manejarEnvio} sx={{ textAlign: 'left' }}>
            <TextField
              fullWidth
              label="Código de recuperación"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6, style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 } } }}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={cargando || codigo.length !== 6}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none', py: 1.4, mb: 2 }}
            >
              {cargando ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Verificar código'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: COLORS.ink, opacity: 0.7, display: 'inline' }}>
                ¿No te llegó?{' '}
              </Typography>
              <Button
                onClick={manejarReenviar}
                disabled={reenviando}
                sx={{ color: COLORS.purple, fontWeight: 700, textTransform: 'none', p: 0, minWidth: 0, verticalAlign: 'baseline' }}
              >
                {reenviando ? 'Reenviando...' : 'Reenviar código'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default VerificarCodigo;