import React, { useState, useEffect } from "react";
import { contenidoAPI } from "../../api/index.js";
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

function TerminosPCA() {
  const [terminos, setTerminos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
  const fetchTerminos = async () => {
    try {
      const response = await contenidoAPI.get('terminos')
      const data = response.data.contenido 
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
      <Box
        component="footer"
        sx={{
          py: 3,
          px: isMobile ? 2 : 4,
          backgroundColor: theme.palette.background.default,
          borderTop: "1px solid #e0e0e0",
          mt: "auto",
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
              <div key={termino.id}>
                <Typography variant="h6" gutterBottom>
                  {termino.titulo}
                </Typography>
                <List>
                  {termino.contenido
                    .split("\n")
                    .filter((line) => line.trim())
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
    </>
  );
}

export default TerminosPCA;