import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const GestionarAtletas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [atletas, setAtletas] = useState([]);
  const [clubes, setClubes] = useState([]);
  
  // Estados para modal de eliminación
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [atletaToDelete, setAtletaToDelete] = useState(null);
  
  // Estados para modal de expulsión del club
  const [openExpulsarModal, setOpenExpulsarModal] = useState(false);
  const [atletaToExpulsar, setAtletaToExpulsar] = useState(null);

  useEffect(() => {
    if (!user || user.rol !== 'admin') {
      navigate('/login');
      return;
    }
    cargarDatos();
  }, [user, navigate]);

  const cargarDatos = async () => {
  try {
    setLoading(true);
    const [atletasRes, clubesRes] = await Promise.all([
      axios.get('http://localhost:5000/api/atletas'),
      axios.get('http://localhost:5000/api/clubes')
    ]);
    const listaAtletas = Array.isArray(atletasRes.data)
      ? atletasRes.data
      : Array.isArray(atletasRes.data?.atletas)
        ? atletasRes.data.atletas
        : [];
    const listaClubes = Array.isArray(clubesRes.data)
      ? clubesRes.data
      : Array.isArray(clubesRes.data?.clubes)
        ? clubesRes.data.clubes
        : [];
    setAtletas(listaAtletas);
    setClubes(listaClubes);
    setError('');
  } catch (error) {
    console.error('Error al cargar datos:', error);
    setError('Error al cargar los datos');
    setAtletas([]);
    setClubes([]);
  } finally {
    setLoading(false);
  }
};

  const handleDeleteClick = (atleta) => {
    setAtletaToDelete(atleta);
    setOpenDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
              await axios.delete(`http://localhost:5000/api/atletas/${atletaToDelete.id}`);
      setSuccess('Atleta eliminado correctamente');
      setOpenDeleteModal(false);
      setAtletaToDelete(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar atleta:', error);
      setError('Error al eliminar el atleta');
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteModal(false);
    setAtletaToDelete(null);
  };

  const handleExpulsarClick = (atleta) => {
    setAtletaToExpulsar(atleta);
    setOpenExpulsarModal(true);
  };

  const handleExpulsarConfirm = async () => {
    try {
      // Solo enviar clubId: null para desasociar, sin otros campos
              await axios.put(`http://localhost:5000/api/atletas/${atletaToExpulsar.id}/club`, {
        clubId: null
      });
      setSuccess('Atleta expulsado correctamente del club. Ahora es independiente.');
      setOpenExpulsarModal(false);
      setAtletaToExpulsar(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al expulsar atleta:', error);
      setError('Error al expulsar atleta del club');
    }
  };

  const handleExpulsarCancel = () => {
    setOpenExpulsarModal(false);
    setAtletaToExpulsar(null);
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const fechaActual = new Date();
    const fechaNac = new Date(fechaNacimiento);
    const edad = fechaActual.getFullYear() - fechaNac.getFullYear();
    const mes = fechaActual.getMonth() - fechaNac.getMonth();
    return mes < 0 || (mes === 0 && fechaActual.getDate() < fechaNac.getDate()) ? edad - 1 : edad;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 'N/A';
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const obtenerClubAtleta = (clubId) => {
    if (!clubId) return 'Independiente';
    const club = clubes.find(c => c._id === clubId);
    return club ? club.nombre : 'Club no encontrado';
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
        🏃 Gestión de Atletas
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
          Total de Atletas Registrados: {atletas.length}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Los atletas se registran desde el apartado de registro
        </Typography>
      </Box>

      {/* Tabla de atletas con scroll */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ 
          maxHeight: '70vh', 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#800020',
            borderRadius: '4px',
            '&:hover': {
              background: '#600018',
            },
          },
        }}>
          <Table stickyHeader sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 200,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Atleta
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 150,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  CURP
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 180,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Fecha de Nacimiento
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 120,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Teléfono
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 200,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Email
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 100,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Género
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 150,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Estado de Nacimiento
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 150,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Fecha de Registro
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 150,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Club
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: '#800020', 
                  color: 'white', 
                  fontWeight: 'bold',
                  minWidth: 150,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {atletas.map((atleta) => (
                <TableRow key={atleta._id} sx={{ '&:hover': { backgroundColor: '#FAFAFF' } }}>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#800020' }}>
                        {atleta.nombre?.charAt(0) || 'A'}
                      </Avatar>
                      <Typography variant="body2" noWrap>
                        {atleta.nombre} {atleta.apellidopa} {atleta.apellidoma}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2" noWrap>
                      {atleta.curp || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {atleta.fecha_nacimiento ? 
                          `${formatearFecha(atleta.fecha_nacimiento)} (${calcularEdad(atleta.fecha_nacimiento)} años)` : 
                          'N/A'
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {atleta.telefono || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {atleta.gmail || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 100 }}>
                    <Chip 
                      label={atleta.sexo || 'N/A'} 
                      size="small"
                      color={atleta.sexo === 'masculino' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {atleta.estadoNacimiento || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {formatearFecha(atleta.fechaRegistro)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Chip 
                        label={obtenerClubAtleta(atleta.clubId)} 
                        size="small"
                        color={atleta.clubId ? 'success' : 'default'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                      {atleta.clubId && (
                                               <IconButton
                         sx={{ color: '#7A4069' }}
                         onClick={() => handleExpulsarClick(atleta)}
                         title="Expulsar del club"
                         size="small"
                       >
                         <ExitToAppIcon />
                       </IconButton>
                      )}
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(atleta)}
                        title="Eliminar atleta"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Modal de confirmación para eliminar atleta */}
      <Dialog open={openDeleteModal} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Confirmar Eliminación
          </Typography>
        </DialogTitle>
        <DialogContent>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
             <WarningIcon sx={{ color: '#800020', fontSize: 40 }} />
             <Typography variant="h6" sx={{ color: '#800020' }}>
               ¡Atención!
             </Typography>
           </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar al atleta <strong>"{atletaToDelete?.nombre} {atletaToDelete?.apellidopa} {atletaToDelete?.apellidoma}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer. Se eliminará permanentemente:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              • Todos los datos del atleta
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              • Su participación en eventos
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              • Su asociación con clubes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Todos los resultados y registros relacionados
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar Atleta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación para expulsar del club */}
      <Dialog open={openExpulsarModal} onClose={handleExpulsarCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Confirmar Expulsión del Club
          </Typography>
        </DialogTitle>
        <DialogContent>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
             <ExitToAppIcon sx={{ color: '#7A4069', fontSize: 40 }} />
             <Typography variant="h6" sx={{ color: '#7A4069' }}>
               Expulsar del Club
             </Typography>
           </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas expulsar al atleta <strong>"{atletaToExpulsar?.nombre} {atletaToExpulsar?.apellidopa} {atletaToExpulsar?.apellidoma}"</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExpulsarCancel} color="primary">
            Cancelar
          </Button>
                     <Button onClick={handleExpulsarConfirm} sx={{ backgroundColor: '#7A4069', '&:hover': { backgroundColor: '#5A3049' } }} variant="contained">
             Expulsar del Club
           </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionarAtletas;
