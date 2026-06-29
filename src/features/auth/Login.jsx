import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useAuth } from '../../components/common/AuthContext.jsx';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  SportsMartialArts as SportIcon,
} from '@mui/icons-material';

const MySwal = withReactContent(Swal);

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e4e4e5';

const API_BASE_URL = 'http://localhost:5000';

/* MUI sx reutilizable para TextFields */
const fieldSx = {
  '& .MuiInputLabel-root': { color: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
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

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [rol, setRol] = useState('atleta');
  const [curp, setCurp] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload =
        rol === 'atleta'
          ? { curp: curp.toUpperCase(), password, rol }
          : { email: correo, password, rol };

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, payload, {
        withCredentials: true,
      });

      const { access_token, usuario } = response.data;

      login(usuario.curp || usuario.email, usuario.rol, {
        ...usuario,
        token: access_token,
      });

      const rutas = {
        atleta: '/atleta',
        club: '/club',
        entrenador: '/entrenador',
        administrador: '/administrador',
        admin: '/administrador',
      };
      navigate(rutas[usuario.rol] || '/');

      MySwal.fire({ icon: 'success', title: 'Éxito', text: 'Inicio de sesión exitoso' });
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Verifique sus credenciales e intente de nuevo.',
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: CREAM,
        px: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(128,0,32,0.12)',
          overflow: 'visible',
        }}
      >
        {/* ── Header burgundy ── */}
        <Box
          sx={{
            bgcolor: BURGUNDY,
            py: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: '16px 16px 0 0',
          }}
        >
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'rgba(255,255,255,0.15)',
              mb: 1.5,
            }}
          >
            <SportIcon sx={{ fontSize: 30, color: '#fff' }} />
          </Avatar>
          <Typography
            variant="h5"
            sx={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
            }}
          >
            Instituto Veracruzano
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}
          >
            del Deporte
          </Typography>
        </Box>

        {/* ── Form ── */}
        <CardContent sx={{ px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              color: BURGUNDY,
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 3,
            }}
          >
            Iniciar Sesión
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            {/* Selector de rol */}
            <FormControl fullWidth sx={{ mb: 2.5, ...fieldSx }}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                label="Rol"
              >
                <MenuItem value="atleta">Atleta</MenuItem>
                <MenuItem value="club">Club</MenuItem>
                <MenuItem value="entrenador">Entrenador</MenuItem>
                <MenuItem value="administrador">Administrador</MenuItem>
              </Select>
            </FormControl>

            {/* CURP o Correo según rol */}
            {rol === 'atleta' ? (
              <TextField
                fullWidth
                label="CURP"
                value={curp}
                onChange={(e) => setCurp(e.target.value)}
                required
                sx={{ mb: 2.5, ...fieldSx }}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            ) : (
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                sx={{ mb: 2.5, ...fieldSx }}
              />
            )}

            {/* Contraseña */}
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3, ...fieldSx }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: BURGUNDY }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Botón */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={<LoginIcon />}
              sx={{
                bgcolor: BURGUNDY,
                py: 1.2,
                fontWeight: 'bold',
                fontSize: '0.95rem',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { bgcolor: '#600018' },
              }}
            >
              Iniciar Sesión
            </Button>

            {/* Links */}
            <Box sx={{ textAlign: 'center', mt: 2.5 }}>
              <Link
                to="/recuperar-correo"
                style={{
                  color: BURGUNDY,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 1.5 }}>
              <Typography variant="body2" component="span" sx={{ color: '#888' }}>
                ¿No tienes cuenta?{' '}
              </Typography>
              <Link
                to="/registro"
                style={{
                  color: PURPLE,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                Regístrate
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;