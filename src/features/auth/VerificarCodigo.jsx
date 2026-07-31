import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Box, Typography, Container, Button, TextField, CircularProgress,
} from '@mui/material';
import {
  Pin as PinIcon, ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { recuperarAPI } from '../../api/index.js';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  lineSoft: '#80002014',
};

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px #80002012' };

const VerificarCodigo = () => {
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { gmail } = location.state || {};

  // Verifica el código de 6 dígitos enviado al correo
  const manejarVerificacion = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await recuperarAPI.verifyCode({ gmail, code: codigo });
      navigate('/restablecer-password', { state: { gmail, code: codigo } });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Código incorrecto',
        text: error.response?.data?.error || 'El código no es válido o ya expiró.',
        confirmButtonColor: COLORS.burgundy,
      });
    } finally {
      setCargando(false);
    }
  };

  // Si se llega a esta pantalla sin haber pedido un código, se redirige al paso inicial
  if (!gmail) {
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
            onClick={() => navigate('/recuperar-correo')}
            sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: '#FFFFFF1A' } }}
          >
            Volver
          </Button>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Recuperar Acceso
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Verificar Código
          </Typography>
          <Typography sx={{ opacity: 0.8, mt: 0.5 }}>
            Paso 2 de 3 · Ingresa el código enviado a tu correo
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

          <Typography variant="body1" sx={{ color: COLORS.ink, mb: 3 }}>
            Revisa tu bandeja de entrada (y spam). El código tiene 6 dígitos.
          </Typography>

          <Box component="form" onSubmit={manejarVerificacion} sx={{ textAlign: 'left' }}>
            <TextField
              fullWidth
              type="text"
              label="Código de 6 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              inputProps={{ inputMode: 'numeric', maxLength: 6 }}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={cargando || codigo.length !== 6}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none', py: 1.4 }}
            >
              {cargando ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Verificar código'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default VerificarCodigo;