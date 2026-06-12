import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import zxcvbn from "zxcvbn";
import sha1 from "js-sha1";
import {
  Container,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Box,
  LinearProgress,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Person,
  Email,
  Lock,
  Phone,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const MySwal = withReactContent(Swal);

// Tema personalizado adaptado al diseño del IVD
const theme = createTheme({
  palette: {
    primary: {
      main: "#800020",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#7A4069",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FFFFFF",
      paper: "#F5E8C7",
    },
    text: {
      primary: "#333333",
      secondary: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: "'Arial', 'Helvetica', sans-serif",
    h4: {
      fontWeight: 600,
      fontSize: "24px",
      color: "#800020",
    },
    body2: {
      fontSize: "14px",
      color: "#333333",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "5px",
            backgroundColor: "#FFFFFF",
            "&:hover fieldset": {
              borderColor: "#800020",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#800020",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#333333",
            "&.Mui-focused": {
              color: "#800020",
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "5px",
          textTransform: "none",
          fontSize: "14px",
          fontWeight: 600,
          padding: "10px 20px",
          backgroundColor: "#800020",
          "&:hover": {
            backgroundColor: "#A52A2A",
            transform: "none",
          },
        },
      },
    },
  },
});

// URL base del backend for development
  const API_BASE_URL = "http://localhost:5000";

function Registro() {
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [passwordError, setPasswordError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [repetirPasswordVisible, setRepetirPasswordVisible] = useState(false);
  const [clubes, setClubes] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellidopa: "",
    apellidoma: "",
    fechaNacimiento: "",
    rol: "",
    telefono: "",
    gmail: "",
    password: "",
    repetirPassword: "",
    sexo: "masculino",
    estadoNacimiento: "Aguascalientes",
    curp: "",
    clubId: "",
    esIndependiente: false,
  });

  useEffect(() => {
    if (formData.rol === "atleta") {
      axios
        .get(`${API_BASE_URL}/api/clubes`)
        .then((res) => setClubes(res.data))
        .catch(() => setClubes([]));
    }
  }, [formData.rol]);

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "esIndependiente") {
      setFormData((prevData) => ({
        ...prevData,
        esIndependiente: checked,
        clubId: checked ? "" : prevData.clubId,
      }));
      return;
    }

    if (name === "password") {
      const strength = zxcvbn(value);
      setPasswordStrength(strength.score);
      validatePassword(value);
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errors = { ...formErrors };

    if (name === "nombre" || name === "apellidopa" || name === "apellidoma") {
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{4,16}$/;
      if (!nameRegex.test(value)) {
        errors[name] = "Solo letras entre 4 y 16 caracteres.";
      } else {
        delete errors[name];
      }
    }

    if (name === "fechaNacimiento") {
      if (!value && formData.rol !== "club") {
        errors[name] = "La fecha de nacimiento es obligatoria.";
      } else {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 12 || age > 100) {
          errors[name] = "Edad debe estar entre 12 y 100 años.";
        } else {
          delete errors[name];
        }
      }
    }

    if (name === "rol") {
      if (!value) {
        errors[name] = "Selecciona un rol.";
      } else {
        delete errors[name];
      }
    }

    if (name === "telefono") {
      const phoneRegex = /^\d{10}$/;
      if (!value) {
        errors[name] = "El teléfono es obligatorio.";
      } else if (!phoneRegex.test(value)) {
        errors[name] = "Contener exactamente 10 dígitos.";
      } else {
        delete errors[name];
      }
    }

    if (name === "password") {
      const passwordRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,15}$/;
      if (!passwordRegex.test(value)) {
        errors[name] = "Tener entre 8 y 15 caracteres.";
      } else {
        delete errors[name];
      }
    }

    if (name === "repetirPassword") {
      if (value !== formData.password) {
        errors[name] = "Las contraseñas no coinciden.";
      } else {
        delete errors[name];
      }
    }

    if (name === "gmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[name] = "Introduce un correo electrónico válido.";
      } else {
        delete errors[name];
      }
    }

    if (name === "curp") {
      const curpRegex = /^[A-Za-z0-9]{18}$/;
      if (value && !curpRegex.test(value) && formData.rol !== "club") {
        errors[name] = "La CURP debe tener exactamente 18 caracteres alfanuméricos.";
      } else {
        delete errors[name];
      }
    }



    setFormErrors(errors);
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const commonPatterns = ["12345", "password", "qwerty", "abcdef"];
    let errorMessage = "";

    if (password.length < minLength) {
      errorMessage = `La contraseña debe tener al menos ${minLength} caracteres.`;
    }

    for (const pattern of commonPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        errorMessage = "Evita usar secuencias comunes como '12345' o 'password'.";
        MySwal.fire({
          icon: "error",
          title: "Contraseña no válida",
          text: errorMessage,
        });
        break;
      }
    }

    setPasswordError(errorMessage);
  };

  const handlePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleRepetirPasswordVisibility = () => {
    setRepetirPasswordVisible(!repetirPasswordVisible);
  };

  const checkPasswordCompromised = async (password) => {
    const hash = sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    try {
      const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
      const compromised = response.data.includes(suffix.toUpperCase());
      return compromised;
    } catch (error) {
      console.error("Error al verificar la contraseña en HIBP:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Datos enviados al backend:", formData);

    const isValidForm = Object.keys(formErrors).length === 0;

    if (!isValidForm || passwordError) {
      MySwal.fire({
        icon: "error",
        title: "Errores en el formulario",
        text: passwordError || "Por favor, corrige los errores antes de continuar.",
      });
      return;
    }
    // Validar teléfono obligatorio para ambos roles
    if (!formData.telefono) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "El teléfono es obligatorio.",
      });
      return;
    }

    const isCompromised = await checkPasswordCompromised(formData.password);
    if (isCompromised) {
      MySwal.fire({
        icon: "error",
        title: "Contraseña comprometida",
        text: "Esta contraseña ha sido filtrada en brechas de datos. Por favor, elige otra.",
      });
      return;
    }

    let dataToSend;
    let endpoint = `${API_BASE_URL}/api/auth/register`;
    if (formData.rol === "club") {
      // Solo enviar los datos relevantes para club
      dataToSend = {
        nombre: formData.nombre,
        direccion: `${formData.apellidopa || ""} ${formData.apellidoma || ""}`.trim() || "Sin dirección",
        telefono: formData.telefono || "0000000000",
        email: formData.gmail,
        password: formData.password,
        rol: formData.rol,
        entrenador: "",
        descripcion: "",
        estado: "activo"
      };
      endpoint = `${API_BASE_URL}/api/clubes`;
    } else {
      // En el registro de atleta, no enviar clubId ni esIndependiente
      dataToSend = {
        nombre: formData.nombre,
        apellidopa: formData.apellidopa,
        apellidoma: formData.apellidoma,
        fechaNacimiento: formData.fechaNacimiento,
        rol: formData.rol,
        telefono: formData.telefono,
        gmail: formData.gmail,
        password: formData.password,
        sexo: formData.sexo,
        estadoNacimiento: formData.estadoNacimiento,
        curp: formData.curp,
      };
    }

    try {
      const response = await axios.post(endpoint, dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Respuesta del backend:", response.data);
      // Si es atleta y seleccionó club, crear solicitud de asociación
      if (formData.rol === "atleta" && !formData.esIndependiente && formData.clubId) {
        // Buscar el id del atleta recién creado
        const atletaId = response.data.usuario._id;
        await axios.post(`${API_BASE_URL}/api/atletas/solicitudes-club`, {
          atletaId,
          clubId: formData.clubId,
          tipo: 'asociar',
        });
      }
      MySwal.fire({
        title: "Tu registro se realizó correctamente",
        text: "Tu cuenta ha sido creada con éxito.",
        icon: "success",
        confirmButtonText: "Aceptar",
      }).then(() => {
        navigate("/login");
      });
    } catch (error) {
      console.error("Error al registrar el usuario:", error.response ? error.response.data : error.message);
      if (error.response && error.response.data.error) {
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: error.response.data.error,
        });
      } else {
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: "No te pudiste registrar. Por favor, intenta de nuevo.",
        });
      }
    }
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return "Débil";
      case 2:
        return "Media";
      case 3:
        return "Fuerte";
      case 4:
        return "Muy Fuerte";
      default:
        return "";
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          padding: "20px",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: isMobile ? 3 : 4,
            maxWidth: isMobile ? "90%" : "900px",
            width: "100%",
            mx: "auto",
            borderRadius: "8px",
            bgcolor: "#F5E8C7",
            boxSizing: "border-box",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            mt: isMobile ? 2 : 4,
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Registro
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3 }}>
            Crea una cuenta para comenzar
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ingresa tu nombre"
                  required
                  error={!!formErrors.nombre}
                  helperText={formErrors.nombre || " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!formErrors.rol}>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    label="Rol"
                  >
                    <MenuItem value="atleta">Atleta</MenuItem>
                    <MenuItem value="club">Club</MenuItem>
                    <MenuItem value="entrenador">Entrenador</MenuItem>
                  </Select>
                  {formErrors.rol && (
                    <Typography color="error" variant="caption">
                      {formErrors.rol}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Apellido Paterno"
                  name="apellidopa"
                  value={formData.apellidopa}
                  onChange={handleChange}
                  placeholder="Ingresa tu apellido paterno"
                  required
                  error={!!formErrors.apellidopa}
                  helperText={formErrors.apellidopa || " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                  disabled={formData.rol === "club"}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Apellido Materno"
                  name="apellidoma"
                  value={formData.apellidoma}
                  onChange={handleChange}
                  placeholder="Ingresa tu apellido materno"
                  required
                  error={!!formErrors.apellidoma}
                  helperText={formErrors.apellidoma || " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                  disabled={formData.rol === "club"}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ingresa tu teléfono"
                  required
                  error={!!formErrors.telefono}
                  helperText={formErrors.telefono || " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fecha de Nacimiento"
                  name="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  error={!!formErrors.fechaNacimiento}
                  helperText={formErrors.fechaNacimiento || " "}
                  disabled={formData.rol === "club"}
                />
              </Grid>
              {formData.rol !== "club" && (
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Sexo</InputLabel>
                    <Select
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleChange}
                      label="Sexo"
                    >
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="femenino">Femenino</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>Estado de Nacimiento</InputLabel>
                  <Select
                    name="estadoNacimiento"
                    value={formData.estadoNacimiento}
                    onChange={handleChange}
                    label="Estado de Nacimiento"
                    disabled={formData.rol === "club"}
                  >
                    <MenuItem value="Aguascalientes">Aguascalientes</MenuItem>
                    <MenuItem value="Baja California">Baja California</MenuItem>
                    <MenuItem value="Baja California Sur">Baja California Sur</MenuItem>
                    <MenuItem value="Campeche">Campeche</MenuItem>
                    <MenuItem value="Coahuila">Coahuila</MenuItem>
                    <MenuItem value="Colima">Colima</MenuItem>
                    <MenuItem value="Chiapas">Chiapas</MenuItem>
                    <MenuItem value="Chihuahua">Chihuahua</MenuItem>
                    <MenuItem value="Distrito Federal">Distrito Federal</MenuItem>
                    <MenuItem value="Durango">Durango</MenuItem>
                    <MenuItem value="Guanajuato">Guanajuato</MenuItem>
                    <MenuItem value="Guerrero">Guerrero</MenuItem>
                    <MenuItem value="Hidalgo">Hidalgo</MenuItem>
                    <MenuItem value="Jalisco">Jalisco</MenuItem>
                    <MenuItem value="México">México</MenuItem>
                    <MenuItem value="Michoacán">Michoacán</MenuItem>
                    <MenuItem value="Morelos">Morelos</MenuItem>
                    <MenuItem value="Nayarit">Nayarit</MenuItem>
                    <MenuItem value="Nuevo León">Nuevo León</MenuItem>
                    <MenuItem value="Oaxaca">Oaxaca</MenuItem>
                    <MenuItem value="Puebla">Puebla</MenuItem>
                    <MenuItem value="Querétaro">Querétaro</MenuItem>
                    <MenuItem value="Quintana Roo">Quintana Roo</MenuItem>
                    <MenuItem value="San Luis Potosí">San Luis Potosí</MenuItem>
                    <MenuItem value="Sinaloa">Sinaloa</MenuItem>
                    <MenuItem value="Sonora">Sonora</MenuItem>
                    <MenuItem value="Tabasco">Tabasco</MenuItem>
                    <MenuItem value="Tamaulipas">Tamaulipas</MenuItem>
                    <MenuItem value="Tlaxcala">Tlaxcala</MenuItem>
                    <MenuItem value="Veracruz">Veracruz</MenuItem>
                    <MenuItem value="Yucatán">Yucatán</MenuItem>
                    <MenuItem value="Zacatecas">Zacatecas</MenuItem>
                    <MenuItem value="Nacido en el Extranjero">Nacido en el Extranjero</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Correo"
                  name="gmail"
                  value={formData.gmail}
                  onChange={handleChange}
                  placeholder="Ingresa tu correo electrónico"
                  required
                  error={!!formErrors.gmail}
                  helperText={formErrors.gmail || " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CURP"
                  name="curp"
                  value={formData.curp}
                  onChange={handleChange}
                  placeholder="Ingresa tu CURP"
                  required
                  error={!!formErrors.curp}
                  helperText={formErrors.curp || " "}
                  inputProps={{ maxLength: 18 }}
                  disabled={formData.rol === "club"}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Crea una contraseña"
                  required
                  error={!!formErrors.password}
                  helperText={formErrors.password || " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handlePasswordVisibility}>
                          {passwordVisible ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {passwordStrength > 0 && (
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(passwordStrength / 4) * 100}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#E0E0E0",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 3,
                          backgroundColor:
                            passwordStrength < 2
                              ? "#D32F2F"
                              : passwordStrength < 3
                              ? "#FF9800"
                              : "#4CAF50",
                        },
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {getPasswordStrengthText(passwordStrength)}
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Repetir Contraseña"
                  name="repetirPassword"
                  type={repetirPasswordVisible ? "text" : "password"}
                  value={formData.repetirPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                  error={!!formErrors.repetirPassword}
                  helperText={formErrors.repetirPassword || " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleRepetirPasswordVisibility}>
                          {repetirPasswordVisible ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ maxWidth: "300px", width: "100%" }}
                  >
                    Registrar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default Registro;