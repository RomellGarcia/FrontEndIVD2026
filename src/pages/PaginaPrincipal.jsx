import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Fade,
  ThemeProvider,
  createTheme,
} from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
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
    h1: {
      fontWeight: 600,
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
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#A52A2A',
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

const IMAGEN_IZQUIERDA =
  'https://res.cloudinary.com/dtnxbeqox/image/upload/v1782952585/VERT_ATLETA_kdfgpz.jpg';
const IMAGEN_DERECHA =
  'https://res.cloudinary.com/dtnxbeqox/image/upload/v1782952340/VERT_CACHE_alncsz.avif';


const tarjetaContenido = [
  {
    titulo: '¡Únete a la Revolución Deportiva!',
    texto:
      'El Instituto Veracruzano del Deporte, transforma vidas a través de la promoción de la inclusión y la pasión por el deporte en cada comunidad veracruzana. Con programas de entrenamiento gratuito, acceso a instalaciones modernas y eventos que fomentan el desarrollo integral, el Instituto Veracruzano del Deporte invita a todos los veracruzanos a unirse a esta revolución que impulsa el bienestar físico y social, fortaleciendo valores como la disciplina y la perseverancia.',
  },
  {
    titulo: '¡Lidera el Cambio con Nosotros!',
    texto:
      'Impulsamos el deporte con capacitación lideramos el cambio impulsando el deporte con capacitaciones especializadas, infraestructura de vanguardia y competencias estatales que posicionan a Veracruz como un referente de excelencia. Colaboramos con asociaciones deportivas y la Universidad Veracruzana para diseñar programas que promueven el deporte popular, estudiantil y de alto rendimiento, invitándote a ser parte de esta transformación que eleva el nivel deportivo en todo el estado.',
  },
  {
    titulo: '¡Vive la Energía del Deporte!',
    texto:
      'Vive la energía del deporte con el Instituto a través de eventos emocionantes como los torneos locales y actividades que unen a familias enteras en la promoción de la disciplina y la perseverancia. Desde encuentros amistosos hasta competencias en disciplinas como carrera de 75 metros, salto de garrocha, lanzamiento de disco y más, cada evento es una oportunidad para disfrutar y fortalecer el espíritu comunitario en Veracruz.',
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
        {/* Un solo contenedor para controlar mejor el espaciado */}
        <Container maxWidth="lg" sx={{ pt: { xs: 1, md: 2 }, pb: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 } }}>
            <Typography
              variant="h1"
              color="primary.main"
              sx={{ margin: 0, fontSize: { xs: '1.75rem', sm: '2.1rem', md: '2.5rem' } }}
            >
              Instituto Veracruzano del Deporte
            </Typography>
          </Box>
          {/* Imagen - Texto - Imagen */}
          <Fade in timeout={1000}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
                gap: { xs: 2, md: 3 },
                alignItems: 'stretch',
              }}
            >
              {/* Columna izquierda: imagen vertical */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box
                  component="img"
                  src={IMAGEN_IZQUIERDA}
                  alt="Deporte veracruzano"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </Box>

              {/* Columna central: tarjetas de texto */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 2, md: 3 },
                }}
              >
                {tarjetaContenido.map((item, index) => (
                  <Card
                    key={index}
                    sx={{
                      backgroundColor: '#7A4069',
                      color: '#FFFFFF',
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                      <Typography
                        variant="h3"
                        sx={{ mb: 1, fontSize: { xs: '1.05rem', md: '1.3rem' } }}
                      >
                        {item.titulo}
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                        {item.texto}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Columna derecha: imagen vertical */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box
                  component="img"
                  src={IMAGEN_DERECHA}
                  alt="Instalaciones del IVD"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default PaginaPrincipal;