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

function VisionPCA() {
  const [visiones, setVisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchVisiones = async () => {
      try {
        const response = await contenidoAPI.get('vision')
        const data = response.data.contenido
        if (!data) { setVisiones([]); setLoading(false); return }
        setVisiones([{
          id: data.id,
          titulo: data.titulo,
          contenido: data.contenido,
          updatedAt: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : null
        }])
        setLoading(false)
      } catch (err) {
        console.error('Error al obtener las visiones:', err)
        setError('No se pudieron cargar las visiones.')
        setLoading(false)
      }
    }
    fetchVisiones()
  }, [])

  if (loading) return <Typography align="center">Cargando visiones...</Typography>;
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
            Visión de la Empresa
          </Typography>
          <Divider sx={{ my: 2 }} />
          {visiones.length === 0 ? (
            <Typography align="center" color="text.secondary">
              No hay visiones disponibles.
            </Typography>
          ) : (
            <List>
              {visiones.map((vision) => (
                <React.Fragment key={vision.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={vision.titulo}
                      secondary={
                        <Typography component="span" variant="body2" color="text.primary">
                          {vision.contenido}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Container>
      </Box>
    </>
  );
}

export default VisionPCA;