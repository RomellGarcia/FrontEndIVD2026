import { atletasAPI, clubesAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Alert,
  IconButton,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const PerfilAtleta = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [clubes, setClubes] = useState([]);
  const [solicitud, setSolicitud] = useState(null);
  const [solicitudClubId, setSolicitudClubId] = useState('');
  const [solicitudIndependiente, setSolicitudIndependiente] = useState(false);
  const [clubSeleccionado, setClubSeleccionado] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    console.log('PerfilAtleta useEffect triggered, user:', user);
    if (!user || !user.id) {
      console.log('No user or user.id, redirecting to login');
      navigate('/login');
      return;
    }
    console.log('Starting to fetch data for user:', user.id);
    fetchPerfil();
    fetchClubes();
    fetchSolicitud();
    // eslint-disable-next-line
  }, [user]);

  const fetchPerfil = async () => {
  try {
    if (!user?.id) return;
    setLoading(true);
    const response = await atletasAPI.getPerfil()
    const data = response.data.atleta
    if (data) {
      setPerfil({
        ...data,
        apellidopa: data.apellido_paterno,
        apellidoma: data.apellido_materno,
        fechaNacimiento: data.fecha_nacimiento,
        estadoNacimiento: data.estado_nacimiento,
        gmail: data.email,
        club_id: data.club_id,
      })
      setErrorMessage('')
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error)
    setErrorMessage('Error al cargar el perfil.')
  } finally {
    setLoading(false)
  }
}

  const fetchClubes = async () => {
    try {
      const response = await clubesAPI.getAll()
      setClubes(response.data.clubes || [])
    } catch {
      setClubes([])
    }
  }

  const fetchSolicitud = async () => {
    try {
      if (!user?.id) return;
      const response = await atletasAPI.getSolicitudes({ atleta_id: user.id })
      const data = response.data.solicitudes || []
      const pendientes = data.filter(s => s.estado === 'pendiente')
      setSolicitud(pendientes.length > 0 ? pendientes[0] : null)
      const rechazadas = data.filter(s => s.estado === 'rechazada')
      if (rechazadas.length > 0) {
        const ultima = rechazadas[rechazadas.length - 1]
        const diff = (new Date() - new Date(ultima.fecha_solicitud)) / (1000 * 60 * 60 * 24)
        if (diff <= 7) setErrorMessage('Tu solicitud anterior fue rechazada.')
      }
    } catch {
      setSolicitud(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (perfil) {
      setPerfil({ ...perfil, [name]: value });
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await atletasAPI.updatePerfil({
        telefono: perfil.telefono,
        municipio: perfil.municipio,
        lugar_entrenamiento: perfil.lugar_entrenamiento,
      })
      setEditMode(false)
      setErrorMessage('Perfil actualizado exitosamente.')
      fetchPerfil()
    } catch (error) {
      setErrorMessage('Error al actualizar el perfil.')
    }
  }


  const handleSolicitud = async () => {
    try {
      if (!user?.id) return;
      if (solicitudIndependiente) {
        await axios.post('http://localhost:5000/api/atletas/solicitudes-club', {
          atletaId: user.id,
          tipo: 'independiente',
        });
      } else if (solicitudClubId) {
        await axios.post('http://localhost:5000/api/atletas/solicitudes-club', {
          atletaId: user.id,
          clubId: solicitudClubId,
          tipo: 'asociar',
        });
      }
      setErrorMessage('Solicitud enviada correctamente. Espera la respuesta del club.');
      setSolicitudIndependiente(false);
      setSolicitudClubId('');
      fetchSolicitud();
    } catch (error) {
      setErrorMessage('Error al enviar la solicitud. Intente de nuevo.');
    }
  };

  const handleEnviarSolicitud = async () => {
    try {
      await atletasAPI.crearSolicitud({
        club_id: parseInt(clubSeleccionado),
        tipo: 'asociar'
      })
      setMensaje('Solicitud enviada correctamente.')
      setClubSeleccionado('')
      fetchSolicitud()
    } catch (error) {
      setMensaje(error.response?.data?.error || 'Error al enviar solicitud')
    }
  }

  const handleSalirClub = async () => {
    const result = await Swal.fire({
      title: '¿Confirmar salida del club?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#7A4069',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      try {
        await atletasAPI.crearSolicitud({ tipo: 'independiente' })
        setErrorMessage('Solicitud enviada. Espera confirmación.')
        fetchPerfil()
      } catch (error) {
        setErrorMessage('Error al salir del club.')
      }
    }
  }

  const limpiarMensaje = () => {
    setErrorMessage('');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={60} sx={{ color: '#800020', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#800020' }}>
            Cargando perfil...
          </Typography>
          <Typography variant="body2" sx={{ color: '#7A4069', mt: 1 }}>
            ID de usuario: {user?.id || 'No disponible'}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!perfil) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="h5" sx={{ color: '#800020', mb: 2 }}>
            No se pudieron cargar los datos del perfil
          </Typography>
          <Typography variant="body1" sx={{ color: '#7A4069', mb: 3 }}>
            ID de usuario: {user?.id || 'No disponible'}
          </Typography>
          <Button
            variant="contained"
            onClick={fetchPerfil}
            sx={{
              bgcolor: '#800020',
              '&:hover': { bgcolor: '#600018' }
            }}
          >
            🔄 Intentar de Nuevo
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
        Perfil del Atleta
      </Typography>

      {errorMessage && (
        <Box sx={{ mb: 2 }}>
          <Alert
            severity={errorMessage.includes('exitosamente') || errorMessage.includes('enviada') ? 'success' : 'error'}
            onClose={limpiarMensaje}
            action={
              <Button color="inherit" size="small" onClick={limpiarMensaje}>
                Entendido
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        </Box>
      )}

      {mensaje && (
        <Box sx={{ mb: 2 }}>
          <Alert
            severity="info"
            onClose={() => setMensaje('')}
            action={
              <Button color="inherit" size="small" onClick={() => setMensaje('')}>
                Entendido
              </Button>
            }
          >
            {mensaje}
          </Alert>
        </Box>
      )}

      <Paper elevation={3} sx={{ p: 4, borderRadius: '12px', background: '#FFFFFF', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', mb: 2 }}>
            Información Personal
          </Typography>
          <TextField
            label="Nombre"
            name="nombre"
            value={perfil?.nombre || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!editMode}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Apellido Paterno"
            name="apellidopa"
            value={perfil?.apellidopa || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!editMode}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Apellido Materno"
            name="apellidoma"
            value={perfil?.apellidoma || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!editMode}
            sx={{ mb: 2 }}
          />
          <TextField
            label="CURP"
            name="curp"
            value={perfil?.curp || ''}
            fullWidth
            disabled
            sx={{ mb: 2 }}
            helperText="Verifica que tu CURP sea correcto. No podrás modificarlo después del registro."
          />
          <TextField
            label="Fecha de Nacimiento"
            name="fechaNacimiento"
            type="date"
            value={perfil?.fechaNacimiento ? perfil.fechaNacimiento.slice(0, 10) : ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!editMode}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Teléfono"
            name="telefono"
            value={perfil?.telefono || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!editMode}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Correo Electrónico"
            name="gmail"
            value={perfil?.gmail || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!editMode}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Sexo"
            name="sexo"
            value={perfil?.sexo || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!editMode}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Estado de Nacimiento"
            name="estadoNacimiento"
            value={perfil?.estadoNacimiento || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!editMode}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Club Actual"
            name="club"
            value={perfil && perfil.clubId ? (clubes.find(c => c._id === perfil.clubId)?.nombre || 'Club desconocido') : 'Independiente'}
            fullWidth
            disabled
            sx={{ mb: 2 }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold', mb: 2 }}>
            Gestión de Club
          </Typography>
          {perfil && perfil.clubId ? (
            <Box>
              <Alert severity="info">
                Actualmente perteneces al club: <strong>{clubes.find(c => c._id === perfil.clubId)?.nombre || 'Club desconocido'}</strong>
              </Alert>
              <Button
                variant="contained"
                onClick={handleSalirClub}
                sx={{ background: '#D32F2F', fontWeight: 'bold', mt: 2 }}
              >
                Salir del Club
              </Button>
            </Box>
          ) : (solicitud && solicitud.estado === 'pendiente') ? (
            <Alert severity="info">Tienes una solicitud pendiente. Estado: {solicitud.estado}</Alert>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Solicitar Club</InputLabel>
                <Select
                  value={clubSeleccionado}
                  onChange={e => setClubSeleccionado(e.target.value)}
                  label="Solicitar Club"
                >
                  <MenuItem value="">Selecciona un club</MenuItem>
                  {clubes.map(club => (
                    <MenuItem key={club._id} value={club._id}>{club.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    if (!user?.id) return;
                    limpiarMensaje(); // Limpiar mensajes anteriores
                    setMensaje(''); // Limpiar mensaje de info

                    await axios.post('http://localhost:5000/api/atletas/solicitudes-club', {
                      atletaId: user.id,
                      clubId: clubSeleccionado,
                      tipo: 'asociar',
                    });

                    setMensaje('Solicitud enviada correctamente. Espera la respuesta del club.');
                    setClubSeleccionado('');
                    fetchSolicitud();
                  } catch (error) {
                    console.error('Error al enviar solicitud:', error);
                    setMensaje(error.response?.data?.error || 'Error al enviar solicitud');
                  }
                }}
                disabled={!clubSeleccionado}
                sx={{ background: '#800020', fontWeight: 'bold' }}
              >
                Enviar Solicitud
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
          {editMode ? (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{ background: '#800020', fontWeight: 'bold' }}
            >
              Guardar
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ background: '#800020', fontWeight: 'bold' }}
            >
              Editar
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PerfilAtleta;