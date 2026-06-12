import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Container,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  Rating,
  IconButton,
  Tooltip,
} from '@mui/material';
import { LocationOn, StarBorder, Star } from '@mui/icons-material';

const HotelesP = () => {
  const [hoteles, setHoteles] = useState([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [ratings, setRatings] = useState({}); // Store ratings for each hotel (in-memory)

  const navigate = useNavigate();

  useEffect(() => {
    fetchHoteles();
  }, []);

  const fetchHoteles = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/hoteles');
      const hotelesData = response.data.map(hotel => {
        let imagenParsed = null;
        try {
          if (hotel.imagen) {
            if (typeof hotel.imagen === 'object' && hotel.imagen.data && hotel.imagen.mimeType) {
              imagenParsed = hotel.imagen;
            } else {
              const parsed = JSON.parse(hotel.imagen);
              if (parsed.data && parsed.mimeType) {
                imagenParsed = { data: parsed.data, mimeType: parsed.mimeType };
              } else {
                imagenParsed = { data: hotel.imagen, mimeType: 'image/jpeg' };
              }
            }
          }
        } catch (error) {
          imagenParsed = { data: hotel.imagen, mimeType: 'image/jpeg' };
        }
        return {
          ...hotel,
          id: hotel.id_hotel,
          imagen: imagenParsed
        };
      });
      setHoteles(hotelesData);
    } catch (error) {
      console.error('Error al obtener hoteles:', error);
    }
  };

  const handleDetailsClick = (hotel) => {
    setSelectedHotel(hotel);
    setOpenDetails(true);
  };

  const handleLocationClick = (direccion) => {
    alert(`Mostrando ubicación de: ${direccion}`);
  };

  const handleImageClick = (hotel) => {
    navigate(`/cuartosp/${hotel.id_hotel}`);
  };

  const handleRatingChange = (hotelId, newValue) => {
    setRatings(prevRatings => ({
      ...prevRatings,
      [hotelId]: newValue
    }));
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        py: 6,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)',
        px: { xs: 2, sm: 4, md: 6 },
      }}
    >
      <Typography
        variant="h3"
        align="center"
        gutterBottom
        sx={{
          color: '#000000',
          fontWeight: 'bold',
          mb: 6,
          fontSize: { xs: '2rem', md: '3rem' },
          letterSpacing: 1,
        }}
      >
        Descubre Nuestros Hoteles
      </Typography>

      {/* Cuadrícula de Hoteles */}
      <Grid container spacing={4}>
        {hoteles.map((hotel) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={hotel.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                bgcolor: '#fff',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={
                  hotel.imagen && hotel.imagen.data && hotel.imagen.mimeType
                    ? `data:${hotel.imagen.mimeType};base64,${hotel.imagen.data}`
                    : 'https://via.placeholder.com/345x200/1976d2/ffffff?text=Hotel+Image'
                }
                alt={hotel.nombrehotel}
                onClick={() => handleImageClick(hotel)}
                sx={{
                  cursor: 'pointer',
                  objectFit: 'cover',
                  transition: 'opacity 0.3s ease',
                  '&:hover': {
                    opacity: 0.9,
                  },
                }}
              />
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    color: '#000000',
                    mb: 1,
                    fontSize: '1.25rem',
                    lineHeight: 1.4,
                  }}
                >
                  {hotel.nombrehotel}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {hotel.direccion || 'Sin dirección disponible'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={`${hotel.numhabitacion} Habitaciones`}
                    color="primary"
                    size="small"
                    sx={{ mr: 1, bgcolor: '#42a5f5', color: '#fff' }}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <Rating
                    name={`rating-${hotel.id}`}
                    value={ratings[hotel.id] || 0}
                    onChange={(event, newValue) => handleRatingChange(hotel.id, newValue)}
                    precision={0.5}
                    emptyIcon={<StarBorder fontSize="inherit" />}
                    icon={<Star fontSize="inherit" />}
                    sx={{ color: '#ffca28' }}
                  />
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleDetailsClick(hotel)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    fontWeight: 'medium',
                  }}
                >
                  Detalles
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Diálogo de Detalles */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1976d2', color: '#fff', py: 3, fontSize: '1.5rem' }}>
          Detalles del Hotel: {selectedHotel?.nombrehotel}
        </DialogTitle>
        <DialogContent sx={{ py: 4 }}>
          {selectedHotel && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  <strong>ID:</strong> {selectedHotel.id}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  <strong>Nombre:</strong> {selectedHotel.nombrehotel}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  <strong>Dirección:</strong> {selectedHotel.direccion || 'Sin dirección'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  <strong>Teléfono:</strong> {selectedHotel.telefono || 'Sin teléfono'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  <strong>Correo:</strong> {selectedHotel.correo || 'Sin correo'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  <strong>Número de Habitaciones:</strong> {selectedHotel.numhabitacion}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  <strong>Descripción:</strong> {selectedHotel.descripcion || 'Sin descripción'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  <strong>Servicios:</strong> {selectedHotel.servicios || 'Sin servicios'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {selectedHotel.imagen && selectedHotel.imagen.data && selectedHotel.imagen.mimeType ? (
                  <img
                    src={`data:${selectedHotel.imagen.mimeType};base64,${selectedHotel.imagen.data}`}
                    alt="Hotel"
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '300px',
                      bgcolor: '#e0e0e0',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      Sin imagen
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
          <Tooltip title="Ver Ubicación">
            <IconButton
              color="primary"
              onClick={() => handleLocationClick(selectedHotel?.direccion)}
              sx={{ mr: 2 }}
            >
              <LocationOn />
            </IconButton>
          </Tooltip>
          <Button
            onClick={() => setOpenDetails(false)}
            color="secondary"
            sx={{ textTransform: 'none', fontWeight: 'medium' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HotelesP;