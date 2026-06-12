import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Fade,
  Slide,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { ArrowForward as ArrowRight } from '@mui/icons-material';

// Tema personalizado adaptado al diseño del IVD
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#800020', // Granada/Vino para fondo y botones
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7A4069', // Morado medio para secciones destacadas
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF', // Fondo blanco puro
      paper: '#F5E8C7', // Beige claro para fondos secundarios
    },
    text: {
      primary: '#333333', // Gris oscuro para texto principal
      secondary: '#FFFFFF', // Blanco para texto en fondos oscuros
    },
  },
  typography: {
    fontFamily: "'Arial', 'Helvetica', sans-serif", // Fuente sencilla y profesional
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: 0,
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: 0,
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.3rem',
      letterSpacing: 0,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: '1.6',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: { borderRadius: 8 }, // Bordes más suaves pero menos redondeados
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#A52A2A', // Tono más claro para hover
          },
        },
        containedPrimary: {
          backgroundColor: '#800020',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          border: '1px solid #B0BEC5',
          '&:hover': {
            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
  },
});

// Contenido ajustado
const tarjetaContenido = [
  {
    titulo: '¡Únete a la Revolución Deportiva!',
   texto: 'El Instituto Veracruzano del Deporte, transforma vidas a través de la promoción de la inclusión y la pasión por el deporte en cada comunidad veracruzana. Con programas de entrenamiento gratuito, acceso a instalaciones modernas y eventos que fomentan el desarrollo integral, el Instituto Veracruzano del Deporte invita a todos los veracruzanos a unirse a esta revolución que impulsa el bienestar físico y social, fortaleciendo valores como la disciplina y la perseverancia.',
  },
  {
    titulo: '¡Lidera el Cambio con Nosotros!',
    texto: 'Impulsamos el deporte con capacitación lideramos el cambio impulsando el deporte con capacitaciones especializadas, infraestructura de vanguardia y competencias estatales que posicionan a Veracruz como un referente de excelencia. Colaboramos con asociaciones deportivas y la Universidad Veracruzana para diseñar programas que promueven el deporte popular, estudiantil y de alto rendimiento, invitándote a ser parte de esta transformación que eleva el nivel deportivo en todo el estado.',
  },
  {
    titulo: '¡Vive la Energía del Deporte!',
    texto: 'Vive la energía del deporte con el Instituto a través de eventos emocionantes como los torneos locales y actividades que unen a familias enteras en la promoción de la disciplina y la perseverancia. Desde encuentros amistosos  hasta competencias en disciplinas como carrera de 75 metros, salto de garrocha, lanzamiento de disco y más, cada evento es una oportunidad para disfrutar y fortalecer el espíritu comunitario en Veracruz.',
  },
 
];

const PaginaPrincipal = () => {
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Header */}
        <Container maxWidth="lg" sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h1" color="primary.main">
            Instituto Veracruzano del Deporte
          </Typography>
        </Container>

        {/* Tarjetas */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Fade in timeout={1000}>
            <Grid container spacing={3} justifyContent="center">
              {tarjetaContenido.map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    sx={{
                      height: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: '#7A4069',
                      color: '#FFFFFF',
                    }}
                  >
                    <CardContent sx={{ p: 2, flexGrow: 1 }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>
                        {item.titulo}
                      </Typography>
                      <Typography variant="body1">
                        {item.texto}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Fade>
        </Container>

       
       
        {/* Call to Action */}
        
      </Box>
    </ThemeProvider>
  );
};

export default PaginaPrincipal;