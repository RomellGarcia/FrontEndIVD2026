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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Divider,
  Stack
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  ExitToApp as ExitToAppIcon,
  SportsBaseball as SportsIcon,
  AdminPanelSettings as AdminIcon,
  School as CoachIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const GestionarUsuarios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [filtroRol, setFiltroRol] = useState('todos');

  // Estados para modal de eliminación
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);

  // Estados para modal de expulsión del club
  const [openExpulsarModal, setOpenExpulsarModal] = useState(false);
  const [usuarioToExpulsar, setUsuarioToExpulsar] = useState(null);

  // Estados para modal de edición
  const [openEditModal, setOpenEditModal] = useState(false);
  const [usuarioToEdit, setUsuarioToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    apellidopa: '',
    apellidoma: '',
    gmail: '',
    telefono: '',
    rol: '',
    // campos específicos de atleta
    curp: '',
    fecha_nacimiento: '',
    sexo: '',
    estadoNacimiento: '',
    clubId: '',
    // campo específico de entrenador
    especialidad: ''
  });

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
    // Cargar atletas, entrenadores y admins en paralelo
    const [atletasRes, entrenadoresRes, adminsRes, clubesRes] = await Promise.all([
      axios.get('http://localhost:5000/api/atletas'),
      axios.get('http://localhost:5000/api/entrenadores').catch(() => ({ data: [] })), // si no existe, devuelve []
      axios.get('http://localhost:5000/api/admins').catch(() => ({ data: [] })),
      axios.get('http://localhost:5000/api/clubes')
    ]);

    // Asegurar que cada respuesta sea un array
    const atletas = Array.isArray(atletasRes.data) ? atletasRes.data : (atletasRes.data?.atletas || []);
    const entrenadores = Array.isArray(entrenadoresRes.data) ? entrenadoresRes.data : (entrenadoresRes.data?.entrenadores || []);
    const admins = Array.isArray(adminsRes.data) ? adminsRes.data : (adminsRes.data?.admins || []);

    // Agregar el campo 'rol' a cada usuario
    const usuariosUnificados = [
      ...atletas.map(a => ({ ...a, rol: 'atleta' })),
      ...entrenadores.map(e => ({ ...e, rol: 'entrenador' })),
      ...admins.map(a => ({ ...a, rol: 'admin' }))
    ];

    setUsuarios(usuariosUnificados);
    setClubes(Array.isArray(clubesRes.data) ? clubesRes.data : (clubesRes.data?.clubes || []));
    setError('');
  } catch (error) {
    console.error('Error al cargar datos:', error);
    setError('Error al cargar los datos');
    setUsuarios([]);
    setClubes([]);
  } finally {
    setLoading(false);
  }
};

  // Filtrado por rol
  const usuariosFiltrados = filtroRol === 'todos'
    ? usuarios
    : usuarios.filter(u => u.rol === filtroRol);

  // Handlers para eliminar
  const handleDeleteClick = (usuario) => {
    setUsuarioToDelete(usuario);
    setOpenDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/usuarios/${usuarioToDelete._id}`);
      setSuccess('Usuario eliminado correctamente');
      setOpenDeleteModal(false);
      setUsuarioToDelete(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setError('Error al eliminar el usuario');
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteModal(false);
    setUsuarioToDelete(null);
  };

  // Handlers para expulsar del club (solo atletas)
  const handleExpulsarClick = (usuario) => {
    setUsuarioToExpulsar(usuario);
    setOpenExpulsarModal(true);
  };

  const handleExpulsarConfirm = async () => {
    try {
      await axios.put(`http://localhost:5000/api/usuarios/${usuarioToExpulsar._id}`, {
        clubId: null
      });
      setSuccess('Atleta expulsado correctamente del club. Ahora es independiente.');
      setOpenExpulsarModal(false);
      setUsuarioToExpulsar(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al expulsar atleta:', error);
      setError('Error al expulsar atleta del club');
    }
  };

  const handleExpulsarCancel = () => {
    setOpenExpulsarModal(false);
    setUsuarioToExpulsar(null);
  };

  // Handlers para editar
  const handleEditClick = (usuario) => {
    setUsuarioToEdit(usuario);
    setEditFormData({
      nombre: usuario.nombre || '',
      apellidopa: obtenerCampo(usuario, CAMPOS.apellidopa),
      apellidoma: obtenerCampo(usuario, CAMPOS.apellidoma),
      gmail: obtenerCorreo(usuario),
      telefono: obtenerCampo(usuario, CAMPOS.telefono),
      rol: usuario.rol || 'atleta',
      curp: obtenerCampo(usuario, CAMPOS.curp),
      fecha_nacimiento: usuario.fecha_nacimiento ? usuario.fecha_nacimiento.split('T')[0] : '',
      sexo: obtenerCampo(usuario, CAMPOS.sexo),
      estadoNacimiento: obtenerCampo(usuario, CAMPOS.estadoNacimiento),
      clubId: obtenerIdClub(usuario.clubId),
      especialidad: usuario.especialidad || ''
    });
    setOpenEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    try {
      // Construir el objeto a enviar solo con los campos relevantes según el rol
      const payload = {
        nombre: editFormData.nombre,
        apellidopa: editFormData.apellidopa,
        apellidoma: editFormData.apellidoma,
        gmail: editFormData.gmail,
        telefono: editFormData.telefono,
        rol: editFormData.rol
      };

      // Si es atleta, añadir campos específicos
      // CURP y fecha de nacimiento son datos oficiales de identidad: se
      // muestran solo como referencia (no editables) y no se envían en la
      // actualización para evitar sobrescribirlos accidentalmente.
      if (editFormData.rol === 'atleta') {
        payload.sexo = editFormData.sexo;
        payload.estadoNacimiento = editFormData.estadoNacimiento;
        payload.clubId = editFormData.clubId || null;
      }

      // Si es entrenador, añadir especialidad y club (opcional)
      if (editFormData.rol === 'entrenador') {
        payload.especialidad = editFormData.especialidad;
        payload.clubId = editFormData.clubId || null;
      }

      await axios.put(`http://localhost:5000/api/usuarios/${usuarioToEdit._id}`, payload);
      setSuccess('Usuario actualizado correctamente');
      setOpenEditModal(false);
      setUsuarioToEdit(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setError('Error al actualizar el usuario');
    }
  };

  const handleEditCancel = () => {
    setOpenEditModal(false);
    setUsuarioToEdit(null);
  };

  // Funciones auxiliares
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

  // El backend a veces devuelve clubId ya "poblado" (objeto {_id, nombre, ...})
  // en lugar del simple string del id. Esta función normaliza ambos casos.
  const obtenerIdClub = (clubId) => {
    if (!clubId) return '';
    if (typeof clubId === 'object') return clubId._id || clubId.id || '';
    return clubId;
  };

  const obtenerClubAtleta = (clubId) => {
    if (!clubId) return 'Independiente';
    // Si ya viene poblado desde el backend, usamos el nombre directamente
    if (typeof clubId === 'object' && clubId.nombre) return clubId.nombre;
    const id = obtenerIdClub(clubId);
    if (!id) return 'Independiente';
    const club = clubes.find(c => c._id === id);
    return club ? club.nombre : 'Club no encontrado';
  };

  // ── Resolución flexible de campos ───────────────────────────────────────
  // Distintas colecciones del backend a veces guardan el mismo dato con
  // nombres de campo distintos (p. ej. "correo" vs "gmail", "apellidoPaterno"
  // vs "apellidopa"). En vez de leer un solo nombre fijo, probamos varias
  // variantes conocidas. Si tras esto algún dato sigue sin aparecer, agrega
  // aquí el nombre exacto que use tu API (revisa la respuesta de
  // /api/atletas en la pestaña Network del navegador).
  const CAMPOS = {
    apellidopa: ['apellidopa', 'apellidoPaterno', 'apellido_paterno', 'apellidoPa'],
    apellidoma: ['apellidoma', 'apellidoMaterno', 'apellido_materno', 'apellidoMa'],
    gmail: ['gmail', 'correo', 'email', 'correoElectronico'],
    telefono: ['telefono', 'phone', 'celular'],
    curp: ['curp', 'CURP'],
    sexo: ['sexo', 'genero'],
    estadoNacimiento: ['estadoNacimiento', 'estado_nacimiento', 'estado']
  };

  const obtenerCampo = (usuario, claves) => {
    for (const clave of claves) {
      const valor = usuario?.[clave];
      if (valor !== undefined && valor !== null && valor !== '') return valor;
    }
    return '';
  };

  const obtenerCorreo = (usuario) => obtenerCampo(usuario, CAMPOS.gmail);

  const getRolIcon = (rol) => {
    switch (rol) {
      case 'admin': return <AdminIcon fontSize="small" />;
      case 'entrenador': return <CoachIcon fontSize="small" />;
      default: return <SportsIcon fontSize="small" />;
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'admin': return 'error';
      case 'entrenador': return 'warning';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#800020' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, background: '#e4e4e5', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4 }}>
        Gestión de Usuarios
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

      {/* Filtro y resumen */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ color: '#800020' }}>
          Total de Usuarios: {usuariosFiltrados.length}
        </Typography>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="filtro-rol-label">Filtrar por rol</InputLabel>
          <Select
            labelId="filtro-rol-label"
            value={filtroRol}
            label="Filtrar por rol"
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="atleta">Atletas</MenuItem>
            <MenuItem value="entrenador">Entrenadores</MenuItem>
            <MenuItem value="admin">Administradores</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabla de usuarios con scroll */}
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
                  Usuario
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
                  Rol
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
                  Correo
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
                  minWidth: 150,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  Fecha Nac.
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
                  Club / Especialidad
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
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuariosFiltrados.map((usuario) => (
                <TableRow key={usuario._id} sx={{ '&:hover': { backgroundColor: '#FAFAFF' } }}>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#800020' }}>
                        {usuario.nombre?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography variant="body2" noWrap>
                        {usuario.nombre} {obtenerCampo(usuario, CAMPOS.apellidopa)} {obtenerCampo(usuario, CAMPOS.apellidoma)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Chip
                      icon={getRolIcon(usuario.rol)}
                      label={usuario.rol === 'admin' ? 'Administrador' : usuario.rol === 'entrenador' ? 'Entrenador' : 'Atleta'}
                      size="small"
                      color={getRolColor(usuario.rol)}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {obtenerCorreo(usuario) || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {usuario.telefono || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    {usuario.rol === 'atleta' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" noWrap>
                          {usuario.fecha_nacimiento ? `${formatearFecha(usuario.fecha_nacimiento)} (${calcularEdad(usuario.fecha_nacimiento)} años)` : 'N/A'}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    {usuario.rol === 'atleta' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Chip
                          label={obtenerClubAtleta(usuario.clubId)}
                          size="small"
                          color={usuario.clubId ? 'success' : 'default'}
                        />
                      </Box>
                    ) : usuario.rol === 'entrenador' ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        <Chip
                          label={usuario.especialidad || 'Sin especialidad'}
                          size="small"
                          color="info"
                        />
                        {usuario.clubId && (
                          <Chip
                            label={obtenerClubAtleta(usuario.clubId)}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="textSecondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditClick(usuario)}
                        title="Editar usuario"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      {usuario.rol === 'atleta' && usuario.clubId && (
                        <IconButton
                          sx={{ color: '#7A4069' }}
                          onClick={() => handleExpulsarClick(usuario)}
                          title="Expulsar del club"
                          size="small"
                        >
                          <ExitToAppIcon />
                        </IconButton>
                      )}
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(usuario)}
                        title="Eliminar usuario"
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

      {/* Modal de confirmación para eliminar usuario */}
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
              Atención
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar al usuario <strong>"{usuarioToDelete?.nombre} {obtenerCampo(usuarioToDelete || {}, CAMPOS.apellidopa)} {obtenerCampo(usuarioToDelete || {}, CAMPOS.apellidoma)}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer. Se eliminará permanentemente:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              • Todos los datos del usuario
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              • Su participación en eventos (si aplica)
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              • Su asociación con clubes (si aplica)
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
            Eliminar Usuario
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
            ¿Estás seguro de que deseas expulsar al atleta <strong>"{usuarioToExpulsar?.nombre} {obtenerCampo(usuarioToExpulsar || {}, CAMPOS.apellidopa)} {obtenerCampo(usuarioToExpulsar || {}, CAMPOS.apellidoma)}"</strong> del club?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            El atleta pasará a ser independiente y podrá ser asignado a otro club más adelante.
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

      {/* Modal de edición de usuario */}
      <Dialog
        open={openEditModal}
        onClose={handleEditCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ backgroundColor: '#800020', color: 'white', py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}>
              {editFormData.nombre?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                Editar Usuario
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {editFormData.nombre || usuarioToEdit?.nombre} {editFormData.apellidopa} {editFormData.apellidoma}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ backgroundColor: '#FAFAFA', p: 3 }}>
          {/* Sección: Información personal */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 2 }}>
            <PersonIcon sx={{ color: '#800020' }} fontSize="small" />
            <Typography variant="subtitle2" sx={{ color: '#800020', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Información personal
            </Typography>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={editFormData.nombre}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                />
              </Box>
              <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="edit-rol-label">Rol</InputLabel>
                  <Select
                    labelId="edit-rol-label"
                    name="rol"
                    value={editFormData.rol}
                    label="Rol"
                    onChange={handleEditChange}
                  >
                    <MenuItem value="atleta">Atleta</MenuItem>
                    <MenuItem value="entrenador">Entrenador</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                <TextField
                  label="Apellido Paterno"
                  name="apellidopa"
                  value={editFormData.apellidopa}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                />
              </Box>
              <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                <TextField
                  label="Apellido Materno"
                  name="apellidoma"
                  value={editFormData.apellidoma}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                />
              </Box>
              <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                <TextField
                  label="Correo electrónico"
                  name="gmail"
                  type="email"
                  value={editFormData.gmail}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                <TextField
                  label="Teléfono"
                  name="telefono"
                  value={editFormData.telefono}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Sección: Datos de atleta */}
          {editFormData.rol === 'atleta' && (
            <>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <SportsIcon sx={{ color: '#800020' }} fontSize="small" />
                <Typography variant="subtitle2" sx={{ color: '#800020', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Datos de atleta
                </Typography>
              </Stack>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 1 }}>
                {/* Campos editables */}
                <Chip label="Campos editables" size="small" sx={{ mb: 2, bgcolor: '#EDE7F6', color: '#4A148C', fontWeight: 'bold' }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
                      <InputLabel id="edit-sexo-label">Sexo</InputLabel>
                      <Select
                        labelId="edit-sexo-label"
                        name="sexo"
                        value={editFormData.sexo}
                        label="Sexo"
                        onChange={handleEditChange}
                      >
                        <MenuItem value="masculino">Masculino</MenuItem>
                        <MenuItem value="femenino">Femenino</MenuItem>
                        <MenuItem value="otro">Otro</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <TextField
                      label="Estado de Nacimiento"
                      name="estadoNacimiento"
                      value={editFormData.estadoNacimiento}
                      onChange={handleEditChange}
                      fullWidth
                      size="small"
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
                      <InputLabel id="edit-club-label">Club (opcional)</InputLabel>
                      <Select
                        labelId="edit-club-label"
                        name="clubId"
                        value={editFormData.clubId}
                        label="Club (opcional)"
                        onChange={handleEditChange}
                      >
                        <MenuItem value="">Sin club</MenuItem>
                        {clubes.map((club) => (
                          <MenuItem key={club._id} value={club._id}>
                            {club.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Datos no editables */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Chip label="Datos no editables" size="small" icon={<LockIcon sx={{ fontSize: 16 }} />} sx={{ bgcolor: '#EEEEEE', color: '#616161', fontWeight: 'bold' }} />
                </Stack>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <TextField
                      label="CURP"
                      name="curp"
                      value={editFormData.curp}
                      fullWidth
                      size="small"
                      disabled
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <TextField
                      label="Fecha de Nacimiento"
                      name="fecha_nacimiento"
                      type="date"
                      value={editFormData.fecha_nacimiento}
                      fullWidth
                      size="small"
                      disabled
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1.5 }}>
                  Estos datos de identidad no se editan desde aquí para evitar inconsistencias con el registro oficial del atleta.
                </Typography>
              </Paper>
            </>
          )}

          {/* Sección: Datos de entrenador */}
          {editFormData.rol === 'entrenador' && (
            <>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <CoachIcon sx={{ color: '#800020' }} fontSize="small" />
                <Typography variant="subtitle2" sx={{ color: '#800020', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Datos de entrenador
                </Typography>
              </Stack>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <TextField
                      label="Especialidad"
                      name="especialidad"
                      value={editFormData.especialidad}
                      onChange={handleEditChange}
                      fullWidth
                      size="small"
                      placeholder="Ej: Natación, Atletismo, etc."
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
                      <InputLabel id="edit-club-entrenador-label">Club (opcional)</InputLabel>
                      <Select
                        labelId="edit-club-entrenador-label"
                        name="clubId"
                        value={editFormData.clubId}
                        label="Club (opcional)"
                        onChange={handleEditChange}
                      >
                        <MenuItem value="">Sin club</MenuItem>
                        {clubes.map((club) => (
                          <MenuItem key={club._id} value={club._id}>
                            {club.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#FAFAFA' }}>
          <Button onClick={handleEditCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleEditSubmit} variant="contained" sx={{ backgroundColor: '#800020', '&:hover': { backgroundColor: '#600018' } }}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionarUsuarios;