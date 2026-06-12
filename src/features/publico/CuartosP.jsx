import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Container,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';

const CuartosP = ({ idHotel }) => {
  const [cuartos, setCuartos] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCuartos();
  }, [idHotel]);

  const fetchCuartos = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/cuartos/hotel/${idHotel}`); // Actualizada la ruta
      setCuartos(response.data);
      setErrorMessage('');
    } catch (error) {
      console.error('Error al obtener cuartos:', error);
      setErrorMessage('Error al cargar los cuartos. Intente de nuevo.');
    }
  };

  const parseImagesSafely = (imagenes) => {
    try {
      if (!imagenes) return [];
      return JSON.parse(imagenes);
    } catch (error) {
      console.error('Error al parsear imágenes:', error.message);
      return [];
    }
  };

  const handleCardClick = (id) => {
    navigate(`/detalles-habitacion/${id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: 'linear-gradient(to bottom, rgb(255, 255, 255),rgb(255, 255, 255))', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mb: 4 }}>
        Habitaciones Disponibles
      </Typography>

      {errorMessage && (
        <Box sx={{ mb: 4 }}>
          <Alert severity="error" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        </Box>
      )}

      <Grid container spacing={3}>
        {cuartos.map((cuarto) => {
          const images = parseImagesSafely(cuarto.imagenes);
          const primaryImage = images.length > 0 ? images[0] : null;

          return (
            <Grid item xs={12} sm={6} md={4} key={cuarto.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(25, 118, 210, 0.2)',
                  },
                  cursor: 'pointer',
                }}
                onClick={() => handleCardClick(cuarto.id)}
              >
                {primaryImage && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={`data:image/jpeg;base64,${primaryImage}`}
                    alt={`Imagen de ${cuarto.cuarto}`}
                    sx={{ objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                  />
                )}
                {!primaryImage && (
                  <Box
                    sx={{
                      height: '200px',
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px 8px 0 0',
                    }}
                  >
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      Sin imagen
                    </Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" sx={{ color: '#333', fontWeight: 'bold', mb: 1 }}>
                    Habitación: {cuarto.cuarto}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Estado: <span style={{ color: cuarto.estado === 'disponible' ? '#2e7d32' : '#d32f2f' }}>{cuarto.estado}</span>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Horario: {cuarto.horario || 'No especificado'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {cuartos.length === 0 && !errorMessage && (
        <Typography variant="body1" align="center" sx={{ color: '#666', mt: 4 }}>
          No hay habitaciones disponibles para este hotel.
        </Typography>
      )}
    </Container>
  );
};

export default CuartosP;