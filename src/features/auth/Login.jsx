import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useAuth } from '../../components/common/AuthContext.jsx';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const MySwal = withReactContent(Swal);

// URL base del backend
const API_BASE_URL = "http://localhost:5000";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [rol, setRol] = useState("atleta");
  const [curp, setCurp] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Hook para detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Cambia estas líneas en handleSubmit:

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (Object.keys(formErrors).length > 0) {
      MySwal.fire({ icon: 'error', title: 'Errores en el formulario', text: 'Por favor, corrige los errores antes de continuar.' })
      return
    }

    try {
      // Atleta usa CURP, los demás usan correo
      const payload = rol === 'atleta'
        ? { curp: curp.toUpperCase(), password }
        : { email: correo, password }

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, payload, {
        withCredentials: true
      })

      const { access_token, usuario } = response.data
      console.log('access_token:', access_token ? access_token.substring(0, 30) : 'NO EXISTE')
      console.log('usuario:', usuario)
      console.log('rol:', usuario.rol)

      // Guardar en AuthContext — adaptamos al formato que ya espera tu login()
      login(usuario.curp || usuario.email, usuario.rol, { ...usuario, token: access_token })

      const rutas = {
        atleta: '/atleta',
        club: '/club',
        entrenador: '/entrenador',
        administrador: '/administrador',
        admin: '/administrador',
      }
      navigate(rutas[usuario.rol] || '/')

      MySwal.fire({ icon: 'success', title: 'Éxito', text: 'Inicio de sesión exitoso' })

    } catch (error) {
      const serverError = error.response?.data?.error
      if (serverError === 'La CURP ingresada no existe') {
        MySwal.fire({ icon: 'error', title: 'Usuario No Encontrado', text: 'La CURP ingresada no existe.' })
      } else if (serverError === 'Credenciales incorrectas') {
        MySwal.fire({ icon: 'error', title: 'Error', text: 'Contraseña incorrecta.' })
      } else {
        MySwal.fire({ icon: 'error', title: 'Error', text: serverError || 'Error al iniciar sesión.' })
      }
    }
  }

  const estilos = {
    contenedorPrincipal: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#FFFFFF', // Fondo blanco puro en lugar de imagen
      padding: isMobile ? '10px' : '20px',
    },
    contenedorLogin: {
      backgroundColor: '#F5E8C7', // Beige claro para el contenedor
      borderRadius: isMobile ? '12px' : '8px',
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      maxWidth: isMobile ? '100%' : '400px',
      width: '100%',
      padding: isMobile ? '20px' : '25px',
      flexDirection: 'column',
    },
    contenedorFormulario: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    titulo: {
      fontSize: isMobile ? '20px' : '24px',
      marginBottom: isMobile ? '16px' : '20px',
      color: '#800020', // Granada/vino para el título
      textAlign: 'center',
      fontWeight: '600',
      fontFamily: "'Arial', 'Helvetica', sans-serif",
    },
    campo: {
      marginBottom: isMobile ? '20px' : '15px',
      position: 'relative',
    },
    etiqueta: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '500',
      color: '#333333',
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      fontSize: isMobile ? '16px' : '14px',
    },
    input: {
      width: '100%',
      padding: isMobile ? '14px 40px 14px 14px' : '10px 40px 10px 10px',
      borderRadius: '5px',
      border: '1px solid #B0BEC5',
      fontSize: isMobile ? '16px' : '14px',
      boxSizing: 'border-box',
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      minHeight: isMobile ? '44px' : 'auto',
    },
    boton: {
      backgroundColor: '#800020', // Granada/vino para el botón
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '5px',
      padding: isMobile ? '16px' : '10px',
      fontSize: isMobile ? '16px' : '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      minHeight: isMobile ? '44px' : 'auto',
      '&:hover': {
        backgroundColor: '#A52A2A', // Tono más claro para hover
      },
    },
    enlace: {
      display: 'block',
      marginTop: isMobile ? '16px' : '12px',
      textDecoration: 'none',
      color: '#7A4069', // Morado medio para enlaces
      fontSize: isMobile ? '14px' : '12px',
      textAlign: 'center',
      fontFamily: "'Arial', 'Helvetica', sans-serif",
    },
    error: {
      color: '#D32F2F', // Rojo oscuro para errores
      fontSize: isMobile ? '14px' : '12px',
      marginTop: '5px',
      fontFamily: "'Arial', 'Helvetica', sans-serif",
    },
    icono: {
      position: 'absolute',
      top: '50%',
      right: '12px',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#666',
    },
  };

  return (
    <div style={estilos.contenedorPrincipal}>
      <div style={estilos.contenedorLogin}>
        <div style={estilos.contenedorFormulario}>
          <h2 style={estilos.titulo}>Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2, '& .MuiInputLabel-root': { color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" }, '& .MuiInputLabel-root.Mui-focused': { color: '#800020' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7A4069' }, '&:hover fieldset': { borderColor: '#800020' }, '&.Mui-focused fieldset': { borderColor: '#800020' } } }}>
              <InputLabel>Rol</InputLabel>
              <Select value={rol} onChange={e => setRol(e.target.value)} label="Rol" sx={{ fontFamily: "'Arial', 'Helvetica', sans-serif", color: '#7A4069' }}>
                <MenuItem value="atleta">Atleta</MenuItem>
                <MenuItem value="club">Club</MenuItem>
                <MenuItem value="entrenador">Entrenador</MenuItem>
                <MenuItem value="administrador">Administrador</MenuItem>
              </Select>
            </FormControl>
            {rol === "atleta" ? (
              <TextField
                fullWidth
                label="CURP"
                value={curp}
                onChange={e => setCurp(e.target.value)}
                sx={{ mb: 2, background: '#FFF', '& .MuiInputLabel-root': { color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" }, '& .MuiInputLabel-root.Mui-focused': { color: '#800020' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7A4069' }, '&:hover fieldset': { borderColor: '#800020' }, '&.Mui-focused fieldset': { borderColor: '#800020' }, color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" } }}
                required
              />
            ) : (
              <TextField
                fullWidth
                label="Correo"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                sx={{ mb: 2, background: '#FFF', '& .MuiInputLabel-root': { color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" }, '& .MuiInputLabel-root.Mui-focused': { color: '#800020' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7A4069' }, '&:hover fieldset': { borderColor: '#800020' }, '&.Mui-focused fieldset': { borderColor: '#800020' }, color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" } }}
                required
                type="email"
              />
            )}
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ mb: 2, '& .MuiInputLabel-root': { color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" }, '& .MuiInputLabel-root.Mui-focused': { color: '#800020' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#7A4069' }, '&:hover fieldset': { borderColor: '#800020' }, '&.Mui-focused fieldset': { borderColor: '#800020' }, color: '#7A4069', fontFamily: "'Arial', 'Helvetica', sans-serif" } }}
              required
              InputProps={{
                endAdornment: (
                  <span style={{ cursor: 'pointer' }} onClick={handleTogglePasswordVisibility}>
                    {showPassword ? <FaEyeSlash color="#800020" /> : <FaEye color="#800020" />}
                  </span>
                ),
              }}
            />
            <Button type="submit" variant="contained" fullWidth style={estilos.boton}>
              Iniciar Sesión
            </Button>
            <Link to="/recuperar-correo" style={{
              display: 'block',
              marginTop: 16,
              color: '#7A4069',
              textAlign: 'center',
              fontWeight: 'bold',
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontSize: '14px',
              textDecoration: 'underline',
            }}>
              ¿Olvidaste tu contraseña?
            </Link>
            <Link to="/registro" style={estilos.enlace}>Regístrate</Link>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;