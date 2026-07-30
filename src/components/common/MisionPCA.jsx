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

function MisionPCA() {
  const [mision, setMision] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
  const fetchMision = async () => {
    try {
      const response = await contenidoAPI.get('mision')
      const data = response.data.contenido
      if (!data) { setMision([]); setLoading(false); return }
      setMision([{ id: data.id, titulo: data.titulo, contenido: data.contenido }])
      setLoading(false)
    } catch (err) {
      console.error('Error al obtener la Misión:', err)
      setError('No se pudieron cargar la Misión.')
      setLoading(false)
    }
  }
  fetchMision()
}, [])

  if (loading) return <Typography align="center">Cargando Mision...</Typography>;
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
            Misión de la Empresa
          </Typography>
          <Divider sx={{ my: 2 }} />
          {mision.length === 0 ? (
            <Typography align="center" color="text.secondary">
              No hay misiones disponibles.
            </Typography>
          ) : (
            <List>
              {mision.map((misionItem) => (
                <React.Fragment key={misionItem.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={misionItem.titulo}
                      secondary={
                        <List>
                          {misionItem.contenido
                            .split("\n")
                            .filter((line) => line.trim())
                            .map((point, index) => (
                              <ListItem key={index}>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  • {point.trim()}
                                </Typography>
                              </ListItem>
                            ))}
                        </List>
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

export default MisionPCA;