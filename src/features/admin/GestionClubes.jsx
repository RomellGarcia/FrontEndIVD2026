import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sports as SportsIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const GestionClubes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para clubes
  const [clubes, setClubes] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  
  // Estados para formulario
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    entrenador: '',
    descripcion: '',
    estado: 'activo'
  });
  
  // Estados para modal de confirmación de eliminación
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);
  
  // Estados para atletas del club
  const [atletasClub, setAtletasClub] = useState([]);
  const [openAtletasModal, setOpenAtletasModal] = useState(false);
  const [selectedClubForAtletas, setSelectedClubForAtletas] = useState(null);

  useEffect(() => {
    if (!user || user.rol !== 'admin') {
      navigate('/login');
      return;
    }
    cargarClubes();
  }, [user, navigate]);

  const cargarClubes = async () => {
  try {
    setLoading(true);
    const response = await axios.get('http://localhost:5000/api/clubes');
    const listaClubes = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.clubes)
        ? response.data.clubes
        : [];
    setClubes(listaClubes);
    setError('');
  } catch (error) {
    console.error('Error al cargar clubes:', error);
    setError('Error al cargar los clubes');
    setClubes([]);
  } finally {
    setLoading(false);
  }
};

  const handleOpenModal = (club) => {
    setFormData({
      nombre: club.nombre || '',
      direccion: club.direccion || '',
      telefono: club.telefono || '',
      email: club.email || '',
      entrenador: club.entrenador || '',
      descripcion: club.descripcion || '',
      estado: club.estado || 'activo'
    });
    setSelectedClub(club);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedClub(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.nombre || !formData.direccion || !formData.telefono) {
        setError('Nombre, dirección y teléfono son obligatorios');
        return;
      }

      // Validar formato de teléfono (exactamente 10 dígitos)
      const telefonoLimpio = formData.telefono.replace(/\D/g, '');
      if (telefonoLimpio.length !== 10) {
        setError('El teléfono debe tener exactamente 10 dígitos.');
        return;
      }

              await axios.put(`http://localhost:5000/api/clubes/${selectedClub._id}`, formData);
      setSuccess('Información del club actualizada correctamente');
      handleCloseModal();
      cargarClubes();
      setError('');
    } catch (error) {
      console.error('Error al actualizar club:', error);
      setError(error.response?.data?.message || 'Error al actualizar la información del club');
    }
  };

  const handleDeleteClick = (club) => {
    setClubToDelete(club);
    setOpenDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
              await axios.delete(`http://localhost:5000/api/clubes/${clubToDelete._id}`);
      setSuccess('Club eliminado correctamente');
      setOpenDeleteModal(false);
      setClubToDelete(null);
      cargarClubes();
    } catch (error) {
      console.error('Error al eliminar club:', error);
      setError('Error al eliminar el club');
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteModal(false);
    setClubToDelete(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const cargarAtletasClub = async (clubId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/atletas?club_id=${clubId}`);
    const listaAtletas = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.atletas)
        ? response.data.atletas
        : [];
    setAtletasClub(listaAtletas);
  } catch (error) {
    console.error('Error al cargar atletas del club:', error);
    setAtletasClub([]);
  }
};

  const handleOpenAtletasModal = async (club) => {
    setSelectedClubForAtletas(club);
    await cargarAtletasClub(club._id);
    setOpenAtletasModal(true);
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const fechaActual = new Date();
    const fechaNac = new Date(fechaNacimiento);
    const edad = fechaActual.getFullYear() - fechaNac.getFullYear();
    const mes = fechaActual.getMonth() - fechaNac.getMonth();
    return mes < 0 || (mes === 0 && fechaActual.getDate() < fechaNac.getDate()) ? edad - 1 : edad;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        🏆 Gestión de Clubes Deportivos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Información de gestión */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: '#800020' }}>
          Total de Clubes Registrados: {clubes.length}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Los clubes se registran desde el apartado de registro
        </Typography>
      </Box>

      {/* Tabs para diferentes vistas */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Lista de Clubes" />
          <Tab label="Vista de Tarjetas" />
          <Tab label="Estadísticas" />
        </Tabs>

        {/* Contenido de los tabs */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800020' }}>Club</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800020' }}>Entrenador</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800020' }}>Contacto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800020' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#800020' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clubes.map((club) => (
                  <TableRow key={club._id} sx={{ '&:hover': { backgroundColor: '#FAFAFF' } }}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {club.nombre}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {club.direccion}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{club.entrenador || 'No asignado'}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          {club.telefono}
                        </Typography>
                        {club.email && (
                          <Typography variant="body2">
                            <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            {club.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={club.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        color={club.estado === 'activo' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                                         <TableCell>
                       <Box sx={{ display: 'flex', gap: 1 }}>
                         <IconButton
                           color="primary"
                           onClick={() => handleOpenAtletasModal(club)}
                           title="Ver atletas del club"
                         >
                           <PeopleIcon />
                         </IconButton>
                         <IconButton
                           color="secondary"
                           onClick={() => handleOpenModal(club)}
                           title="Editar club"
                         >
                           <EditIcon />
                         </IconButton>
                         <IconButton
                           color="error"
                           onClick={() => handleDeleteClick(club)}
                           title="Eliminar club"
                         >
                           <DeleteIcon />
                         </IconButton>
                       </Box>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              {clubes.map((club) => (
                <Grid item xs={12} sm={6} md={4} key={club._id}>
                  <Card sx={{ height: '100%', '&:hover': { boxShadow: 4 } }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: '#800020', mr: 2 }}>
                          <SportsIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {club.nombre}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {club.direccion}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, mr: 1 }} />
                          <strong>Entrenador:</strong> {club.entrenador || 'No asignado'}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                          <strong>Teléfono:</strong> {club.telefono}
                        </Typography>
                        {club.email && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 1 }} />
                            <strong>Email:</strong> {club.email}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip 
                          label={club.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          color={club.estado === 'activo' ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      
                                             <Box sx={{ display: 'flex', gap: 1 }}>
                         <Button
                           size="small"
                           variant="outlined"
                           startIcon={<PeopleIcon />}
                           onClick={() => handleOpenAtletasModal(club)}
                           fullWidth
                         >
                           Ver Atletas
                         </Button>
                         <Button
                           size="small"
                           variant="outlined"
                           startIcon={<EditIcon />}
                           onClick={() => handleOpenModal(club)}
                           fullWidth
                         >
                           Editar
                         </Button>
                       </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Estadísticas Generales
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                      <Box>
                        <Typography variant="h4" color="primary">
                          {clubes.length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total de Clubes
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="success.main">
                          {clubes.filter(c => c.estado === 'activo').length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Clubes Activos
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="warning.main">
                          {clubes.filter(c => c.estado === 'inactivo').length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Clubes Inactivos
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Clubes por Estado
                    </Typography>
                    <List>
                      {clubes.map((club) => (
                        <ListItem key={club._id}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: club.estado === 'activo' ? 'success.main' : 'error.main' }}>
                              <SportsIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={club.nombre}
                            secondary={`${club.entrenador || 'Sin entrenador'} • ${club.telefono}`}
                          />
                          <Chip 
                            label={club.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            color={club.estado === 'activo' ? 'success' : 'error'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Modal para editar club */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Editar Información del Club
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre del Club"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Entrenador"
                value={formData.entrenador}
                onChange={(e) => setFormData({ ...formData, entrenador: e.target.value })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  label="Estado"
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ bgcolor: '#800020', '&:hover': { bgcolor: '#600018' } }}
          >
            Actualizar Club
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver atletas del club */}
      <Dialog open={openAtletasModal} onClose={() => setOpenAtletasModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Atletas del Club - {selectedClubForAtletas?.nombre}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total de Atletas: {atletasClub.length}
            </Typography>
            {atletasClub.length > 0 ? (
              <List>
                {atletasClub.map((atleta) => (
                  <ListItem key={atleta._id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#800020' }}>
                        {atleta.nombre?.charAt(0) || 'A'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${atleta.nombre} ${atleta.apellidopa} ${atleta.apellidoma}`}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            <strong>Edad:</strong> {calcularEdad(atleta.fecha_nacimiento)} años
                          </Typography>
                          <Typography variant="body2">
                            <strong>Género:</strong> {atleta.sexo || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Teléfono:</strong> {atleta.telefono || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Email:</strong> {atleta.gmail || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Estado de Nacimiento:</strong> {atleta.estadoNacimiento || 'N/A'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  No hay atletas asociados a este club
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAtletasModal(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación para eliminar club */}
      <Dialog open={openDeleteModal} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Confirmar Eliminación
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar el club <strong>"{clubToDelete?.nombre}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Esta acción no se puede deshacer. Se eliminará permanentemente el club y todos sus datos asociados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar Club
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionClubes;
