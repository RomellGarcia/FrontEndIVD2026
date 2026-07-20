import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Box, Typography, Container, Button, TextField, CircularProgress,
} from '@mui/material';
import {
  MailLock as MailLockIcon, ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:5000';

const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

const RecuperarCorreo = () => {
  const [gmail, setGmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/recuperar/forgot-password`, { gmail });
      Swal.fire({
        icon: 'success',
        title: 'Código enviado',
        text: 'Si el correo está registrado, revisa tu bandeja de entrada (y spam) para obtener el código.',
        confirmButtonColor: COLORS.burgundy,
      });
      navigate('/verificar-codigo', { state: { gmail } });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo enviar el código. Intenta de nuevo.',
        confirmButtonColor: COLORS.burgundy,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', '& .MuiFormLabel-asterisk': { display: 'none' } }}>
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/login')}
            sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Volver a iniciar sesión
          </Button>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Recuperar Acceso
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Recuperar Contraseña
          </Typography>
          <Typography sx={{ opacity: 0.8, mt: 0.5 }}>
            Paso 1 de 3 · Ingresa tu correo
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        <Box sx={{ ...cardSx, mt: { xs: -4, md: -5 }, p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%', bgcolor: COLORS.lineSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
          }}>
            <MailLockIcon sx={{ fontSize: 36, color: COLORS.burgundy }} />
          </Box>

          <Typography variant="body1" sx={{ color: COLORS.ink, mb: 3 }}>
            Escribe el correo con el que te registraste. Te mandaremos un código de 6 dígitos para poder cambiar tu contraseña.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ textAlign: 'left' }}>
            <TextField
              fullWidth
              type="email"
              label="Correo electrónico"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              required
              autoFocus
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none', py: 1.4 }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Enviar código'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RecuperarCorreo;