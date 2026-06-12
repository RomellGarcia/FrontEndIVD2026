import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Azul moderno
    },
    secondary: {
      main: "#4caf50", // Verde
    },
    background: {
      default: "#f5f5f5", // Fondo claro
    },
    text: {
      primary: "#212121",
      secondary: "#757575",
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h6: {
      fontWeight: 600,
      color: "#1976d2",
    },
    body2: {
      color: "#757575",
    },
  },
});

// URL base del backend (ajustada al puerto 5000 del CRUD)
  const API_BASE_URL = "http://localhost:5000";

function TerminosPCA() {
  const [terminos, setTerminos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
  const fetchTerminos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contenido/terminos`)
      const data = response.data.contenido  // ← extraer .contenido
      if (!data) {
        setTerminos([])
        setLoading(false)
        return
      }
      setTerminos([{
        id:       data.id,
        titulo:   data.titulo,
        contenido: data.contenido
      }])
      setLoading(false)
    } catch (err) {
      console.error('Error al obtener los términos:', err)
      setError('No se pudieron cargar los términos y condiciones.')
      setLoading(false)
    }
  }
  fetchTerminos()
}, [])

  if (loading) return <Typography align="center">Cargando términos y condiciones...</Typography>;
  if (error) return <Typography align="center" color="error">{error}</Typography>;

  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
          }
        `}
      </style>
      <ThemeProvider theme={theme}>
        <Box
        component="footer"
        sx={{
          py: 3,
          px: isMobile ? 2 : 4,
          backgroundColor: theme.palette.background.default,
          borderTop: "1px solid #e0e0e0",
          mt: "auto", // Empuja el footer al final de la página
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h6" align="center" gutterBottom>
            Términos y Condiciones de la Empresa
          </Typography>
          <Divider sx={{ my: 2 }} />
          {terminos.length === 0 ? (
            <Typography align="center" color="text.secondary">
              No hay términos y condiciones disponibles.
            </Typography>
          ) : (
            terminos.map((termino) => (
              <div key={termino._id}>
                <Typography variant="h6" gutterBottom>
                  {termino.titulo}
                </Typography>
                <List>
                  {termino.contenido
                    .split("\n") // Divide el contenido por saltos de línea
                    .filter((line) => line.trim()) // Filtra líneas vacías
                    .map((line, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="text.primary">
                              • {line.trim()}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
                <Divider sx={{ my: 2 }} />
              </div>
            ))
          )}
        </Container>
      </Box>
      </ThemeProvider>
    </>
  );
}

export default TerminosPCA;