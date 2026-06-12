"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  Avatar,
  Fade,
  Zoom,
} from "@mui/material"
import {
  Hotel,
  AccessTime,
  AttachMoney,
  RoomService,
  CheckCircle,
  Cancel,
  Schedule,
  Wifi,
  LocalParking,
  Restaurant,
  FitnessCenter,
  Pool,
  Spa,
} from "@mui/icons-material"

const DetallesHabitacion = () => {
  const { idHabitacion } = useParams()
  const [habitacion, setHabitacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reservationTime, setReservationTime] = useState("")
  const [reservationSuccess, setReservationSuccess] = useState("")

  const styles = {
    container: {
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      minHeight: "100vh",
      paddingTop: "2rem",
      paddingBottom: "2rem",
    },
    headerCard: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      borderRadius: "20px",
      marginBottom: "2rem",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    },
    imageCard: {
      borderRadius: "15px",
      overflow: "hidden",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      "&:hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
      },
    },
    detailsCard: {
      borderRadius: "20px",
      background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    priceCard: {
      background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      borderRadius: "15px",
      padding: "1.5rem",
      marginBottom: "1rem",
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    },
    reservationCard: {
      background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      borderRadius: "20px",
      padding: "2rem",
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    },
    statusChip: {
      fontSize: "1rem",
      fontWeight: "bold",
      padding: "0.5rem 1rem",
      borderRadius: "25px",
    },
    iconBox: {
      display: "flex",
      alignItems: "center",
      marginBottom: "1rem",
      padding: "0.5rem",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.7)",
    },
    serviceIcon: {
      marginRight: "0.5rem",
      color: "#667eea",
    },
  }

  useEffect(() => {
    console.log("ID de la habitación:", idHabitacion)
    fetchHabitacion()
  }, [idHabitacion])

  const fetchHabitacion = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:3000/api/cuartos/${idHabitacion}`)
      console.log("Respuesta de la API:", response.data)
      setHabitacion(response.data)
      setError("")
    } catch (err) {
      const errorMessage =
        err.response?.status === 404
          ? "Habitación no encontrada en la base de datos."
          : err.response?.data?.message || "Error al cargar los detalles de la habitación. Intente de nuevo."
      setError(errorMessage)
      console.error("Error fetching habitacion:", err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const parseImagesSafely = (imagenes) => {
    try {
      if (!imagenes) return []
      return JSON.parse(imagenes)
    } catch (error) {
      console.error("Error al parsear imágenes:", error.message)
      return []
    }
  }

  const handleReservationTimeChange = (e) => {
    setReservationTime(e.target.value)
  }

  const handleReservation = async () => {
    if (!reservationTime) {
      setError("Por favor, seleccione una hora de reserva.")
      return
    }

    if (habitacion.estado !== "Disponible") {
      setError("Esta habitación no está disponible para reservar.")
      return
    }

    try {
      const updatedCuarto = {
        estado: "Ocupado",
        horario: reservationTime,
      }

      const response = await axios.put(`http://localhost:3000/api/cuartos/${idHabitacion}`, updatedCuarto)
      setHabitacion(response.data)
      setReservationSuccess("¡Habitación reservada con éxito!")
      setError("")
      setReservationTime("")
    } catch (err) {
      setError("Error al realizar la reserva. Intente de nuevo.")
      console.error("Error al reservar:", err.response?.data || err.message)
    }
  }

  const getServiceIcons = (servicios) => {
    const serviceMap = {
      wifi: <Wifi sx={styles.serviceIcon} />,
      parking: <LocalParking sx={styles.serviceIcon} />,
      restaurant: <Restaurant sx={styles.serviceIcon} />,
      gym: <FitnessCenter sx={styles.serviceIcon} />,
      pool: <Pool sx={styles.serviceIcon} />,
      spa: <Spa sx={styles.serviceIcon} />,
    }

    return servicios
      ?.toLowerCase()
      .split(",")
      .map((service, index) => (
        <Box key={index} sx={styles.iconBox}>
          {serviceMap[service.trim()] || <RoomService sx={styles.serviceIcon} />}
          <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
            {service.trim()}
          </Typography>
        </Box>
      ))
  }

  if (loading) {
    return (
      <Box sx={styles.container}>
        <Container
          maxWidth="lg"
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={60} sx={{ color: "#667eea", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#667eea" }}>
              Cargando detalles de la habitación...
            </Typography>
          </Box>
        </Container>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={styles.container}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Fade in={true}>
            <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: "15px", fontSize: "1.1rem" }}>
              {error}
            </Alert>
          </Fade>
        </Container>
      </Box>
    )
  }

  if (!habitacion) {
    return (
      <Box sx={styles.container}>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
          <Typography variant="h4" sx={{ color: "#667eea", fontWeight: "bold" }}>
            Habitación no encontrada
          </Typography>
        </Container>
      </Box>
    )
  }

  const images = parseImagesSafely(habitacion.imagenes)
  const normalizedEstado = habitacion.estado.charAt(0).toUpperCase() + habitacion.estado.slice(1).toLowerCase()
  const isAvailable = normalizedEstado === "Disponible"

  return (
    <Box sx={styles.container}>
      <Container maxWidth="lg">
        {/* Header Card */}
        <Fade in={true} timeout={800}>
          <Card sx={styles.headerCard}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 80, height: 80, mx: "auto", mb: 2 }}>
                <Hotel sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
                Habitación {habitacion.cuarto}
              </Typography>
              <Chip
                icon={isAvailable ? <CheckCircle /> : <Cancel />}
                label={normalizedEstado}
                sx={{
                  ...styles.statusChip,
                  bgcolor: isAvailable ? "#4caf50" : "#f44336",
                  color: "white",
                }}
              />
            </CardContent>
          </Card>
        </Fade>

        {/* Success Alert */}
        {reservationSuccess && (
          <Zoom in={true}>
            <Box sx={{ mb: 3 }}>
              <Alert
                severity="success"
                onClose={() => setReservationSuccess("")}
                sx={{ borderRadius: "15px", fontSize: "1.1rem" }}
              >
                {reservationSuccess}
              </Alert>
            </Box>
          </Zoom>
        )}

        {/* Image Gallery */}
        <Fade in={true} timeout={1000}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ color: "#667eea", fontWeight: "bold", mb: 3, textAlign: "center" }}>
              Galería de Imágenes
            </Typography>
            <Grid container spacing={3}>
              {images.length > 0 ? (
                images.map((img, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={styles.imageCard}>
                      <CardMedia
                        component="img"
                        height="250"
                        image={`data:image/jpeg;base64,${img}`}
                        alt={`Imagen ${index + 1} de ${habitacion.cuarto}`}
                        sx={{ objectFit: "cover" }}
                        loading="lazy"
                      />
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Card
                    sx={{
                      ...styles.imageCard,
                      height: "250px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h6" color="textSecondary" sx={{ fontStyle: "italic" }}>
                      No hay imágenes disponibles
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {/* Room Details */}
          <Grid item xs={12} md={8}>
            <Fade in={true} timeout={1200}>
              <Card sx={styles.detailsCard}>
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{ color: "#667eea", fontWeight: "bold", mb: 3, display: "flex", alignItems: "center" }}
                  >
                    <Hotel sx={{ mr: 2 }} />
                    Detalles de la Habitación
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={styles.iconBox}>
                        <AccessTime sx={styles.serviceIcon} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                            Horario
                          </Typography>
                          <Typography variant="body2">
                            {habitacion.horario ? new Date(habitacion.horario).toLocaleString() : "No especificado"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={styles.iconBox}>
                        <Schedule sx={styles.serviceIcon} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                            Estado
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: isAvailable ? "#4caf50" : "#f44336", fontWeight: "bold" }}
                          >
                            {normalizedEstado}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" sx={{ color: "#667eea", fontWeight: "bold", mb: 2 }}>
                    Servicios Incluidos
                  </Typography>
                  <Grid container spacing={2}>
                    {habitacion.servicios ? (
                      getServiceIcons(habitacion.servicios)
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic" }}>
                          No hay servicios especificados
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Pricing and Reservation */}
          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={1400}>
              <Box>
                {/* Pricing Card */}
                <Paper sx={styles.priceCard}>
                  <Typography
                    variant="h6"
                    sx={{ color: "#d84315", fontWeight: "bold", mb: 2, display: "flex", alignItems: "center" }}
                  >
                    <AttachMoney sx={{ mr: 1 }} />
                    Tarifas
                  </Typography>

                  {[
                    { label: "Por Hora", price: habitacion.preciohora },
                    { label: "Por Día", price: habitacion.preciodia },
                    { label: "Por Noche", price: habitacion.precionoche },
                    { label: "Por Semana", price: habitacion.preciosemana },
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {item.label}:
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#d84315", fontWeight: "bold" }}>
                        {item.price ? `$${item.price.toFixed(2)}` : "No definido"}
                      </Typography>
                    </Box>
                  ))}
                </Paper>

                {/* Reservation Card */}
                <Card sx={styles.reservationCard}>
                  <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: "bold", mb: 3, textAlign: "center" }}>
                    🏨 Reservar Habitación
                  </Typography>

                  <TextField
                    label="Fecha y Hora de Reserva"
                    type="datetime-local"
                    value={reservationTime}
                    onChange={handleReservationTimeChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "15px",
                        bgcolor: "rgba(255,255,255,0.8)",
                      },
                    }}
                    disabled={!isAvailable}
                  />

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleReservation}
                    disabled={!isAvailable}
                    sx={{
                      borderRadius: "25px",
                      py: 1.5,
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      background: isAvailable
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%)",
                      "&:hover": {
                        background: isAvailable
                          ? "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)"
                          : "linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%)",
                      },
                    }}
                  >
                    {isAvailable ? "✨ Reservar Ahora" : "❌ No Disponible"}
                  </Button>
                </Card>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default DetallesHabitacion;
