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
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  ExitToApp as ExitToAppIcon,
  SportsBaseball as SportsIcon,
  AdminPanelSettings as AdminIcon,
  School as CoachIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { atletasAPI, entrenadoresAPI, clubesAPI, api } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const C = {
  primary:    '#800020',
  primary2:   '#600018',
  secondary:  '#7A4069',
  secondary2: '#5C304F',
  cream:      '#F5E8C7',
  bg:         '#e4e4e5',
  green:      '#3F7D52',
  greenDark:  '#2C5B3B',
  danger:     '#A13A3A',
  dangerDark: '#7E2C2C',
};

const ROL_STYLES = {
  admin:       { color: C.primary,   bg: 'rgba(128,0,32,0.1)',   label: 'Administrador', icon: <AdminIcon fontSize="small" /> },
  entrenador:  { color: C.secondary, bg: 'rgba(122,64,105,0.1)', label: 'Entrenador',    icon: <CoachIcon fontSize="small" /> },
  atleta:      { color: C.green,     bg: 'rgba(63,125,82,0.1)',  label: 'Atleta',        icon: <SportsIcon fontSize="small" /> },
};

const outlineSecondarySx = {
  borderRadius: 2,
  borderColor: C.secondary,
  color: C.secondary,
  '&:hover': { borderColor: C.primary, color: C.primary, bgcolor: 'rgba(128,0,32,0.05)' },
};

const solidPrimarySx = {
  borderRadius: 2,
  bgcolor: C.primary,
  fontWeight: 'bold',
  boxShadow: 'none',
  '&:hover': { bgcolor: C.primary2, boxShadow: 'none' },
};

const solidDangerSx = {
  borderRadius: 2,
  bgcolor: C.danger,
  fontWeight: 'bold',
  boxShadow: 'none',
  '&:hover': { bgcolor: C.dangerDark, boxShadow: 'none' },
};

const solidExpulsarSx = {
  borderRadius: 2,
  bgcolor: C.secondary,
  fontWeight: 'bold',
  boxShadow: 'none',
  '&:hover': { bgcolor: C.secondary2, boxShadow: 'none' },
};

const ActionIconButton = ({ title, color, onClick, disabled, icon }) => (
  <Tooltip title={title} arrow>
    <span>
      <IconButton
        size="small"
        onClick={onClick}
        disabled={disabled}
        sx={{
          color,
          transition: 'background-color 0.15s ease',
          '&:hover': { bgcolor: `${color}1A` },
        }}
      >
        {icon}
      </IconButton>
    </span>
  </Tooltip>
);

//API por rol: cada rol resuelve a las funciones reales de api/index.js.
//Solo atletas soporta eliminar (entrenadores no tiene DELETE en el backend,
//admin no tiene ninguna ruta CRUD todavia, por eso no aparece aqui).
const API_POR_ROL = {
  atleta: {
    updateAdmin: atletasAPI.updateAdmin,
    updateClub:  atletasAPI.updateClub,
    remove:      atletasAPI.remove,
    soportaEdicion: true,
    soportaClub: true,
    soportaEliminar: true,
  },
  entrenador: {
    updateAdmin: entrenadoresAPI.updateAdmin,
    updateClub:  entrenadoresAPI.updateClub,
    remove:      null,
    soportaEdicion: true,
    soportaClub: true,
    soportaEliminar: false,
  },
  admin: {
    updateAdmin: null,
    updateClub:  null,
    remove:      null,
    soportaEdicion: false,
    soportaClub: false,
    soportaEliminar: false,
  },
};

const limpiarPayload = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')
);

const EDITAR_NO_SOPORTADO = 'La edición de administradores todavía no tiene endpoint en el backend.';
const ELIMINAR_NO_SOPORTADO = 'Eliminar entrenadores todavía no tiene endpoint en el backend.';

const GestionarUsuarios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [filtroRol, setFiltroRol] = useState('todos');

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);

  const [openExpulsarModal, setOpenExpulsarModal] = useState(false);
  const [usuarioToExpulsar, setUsuarioToExpulsar] = useState(null);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [usuarioToEdit, setUsuarioToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    telefono: '',
    curp: '',
    fecha_nacimiento: '',
    estado_nacimiento: '',
    genero: '',
    clubId: '',
    anos_experiencia: '',
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
      const [atletasRes, entrenadoresRes, adminsRes, clubesRes] = await Promise.all([
        atletasAPI.getAll(),
        entrenadoresAPI.getAll().catch(() => ({ data: { entrenadores: [] } })),
        api.get('/admins').catch(() => ({ data: { admins: [] } })),
        clubesAPI.getAll().catch(() => ({ data: { clubes: [] } })),
      ]);

      const atletas = atletasRes.data?.atletas || [];
      const entrenadores = entrenadoresRes.data?.entrenadores || [];
      const admins = adminsRes.data?.admins || [];

      setUsuarios([
        ...atletas.map((a) => ({ ...a, rol: 'atleta' })),
        ...entrenadores.map((e) => ({ ...e, rol: 'entrenador' })),
        ...admins.map((a) => ({ ...a, rol: 'admin' })),
      ]);
      setClubes(clubesRes.data?.clubes || []);
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

  const usuariosFiltrados = filtroRol === 'todos'
    ? usuarios
    : usuarios.filter((u) => u.rol === filtroRol);

  const handleDeleteClick = (usuario) => {
    setUsuarioToDelete(usuario);
    setOpenDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await API_POR_ROL[usuarioToDelete.rol].remove(usuarioToDelete.id);
      setSuccess('Usuario eliminado correctamente');
      setOpenDeleteModal(false);
      setUsuarioToDelete(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setError(error.response?.data?.error || 'Error al eliminar el usuario');
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteModal(false);
    setUsuarioToDelete(null);
  };

  const handleExpulsarClick = (usuario) => {
    setUsuarioToExpulsar(usuario);
    setOpenExpulsarModal(true);
  };

  const handleExpulsarConfirm = async () => {
    try {
      await API_POR_ROL[usuarioToExpulsar.rol].updateClub(usuarioToExpulsar.id, { club_id: null });
      setSuccess('Atleta expulsado correctamente del club. Ahora es independiente.');
      setOpenExpulsarModal(false);
      setUsuarioToExpulsar(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al expulsar atleta:', error);
      setError(error.response?.data?.error || 'Error al expulsar atleta del club');
    }
  };

  const handleExpulsarCancel = () => {
    setOpenExpulsarModal(false);
    setUsuarioToExpulsar(null);
  };

  const handleEditClick = (usuario) => {
    setUsuarioToEdit(usuario);
    setEditFormData({
      nombre: usuario.nombre || '',
      apellido_paterno: usuario.apellido_paterno || '',
      apellido_materno: usuario.apellido_materno || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      curp: usuario.curp || '',
      fecha_nacimiento: usuario.fecha_nacimiento ? usuario.fecha_nacimiento.split('T')[0] : '',
      estado_nacimiento: usuario.estado_nacimiento || '',
      genero: usuario.genero || '',
      clubId: usuario.club_id ?? '',
      anos_experiencia: usuario.anos_experiencia ?? '',
    });
    setOpenEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    const rol = usuarioToEdit.rol;
    const id = usuarioToEdit.id;
    const rolApi = API_POR_ROL[rol];

    try {
      const payloadGeneral = limpiarPayload({
        nombre: editFormData.nombre,
        apellido_paterno: editFormData.apellido_paterno,
        apellido_materno: editFormData.apellido_materno,
        email: editFormData.email,
        telefono: editFormData.telefono,
        curp: editFormData.curp,
        fecha_nacimiento: editFormData.fecha_nacimiento,
        estado_nacimiento: editFormData.estado_nacimiento,
        genero: editFormData.genero,
        anos_experiencia: rol === 'entrenador' && editFormData.anos_experiencia !== ''
          ? Number(editFormData.anos_experiencia)
          : undefined,
      });

      await rolApi.updateAdmin(id, payloadGeneral);

      if (rolApi.soportaClub) {
        await rolApi.updateClub(id, {
          club_id: editFormData.clubId === '' ? null : Number(editFormData.clubId),
        });
      }

      setSuccess('Usuario actualizado correctamente');
      setOpenEditModal(false);
      setUsuarioToEdit(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setError(error.response?.data?.error || 'Error al actualizar el usuario');
    }
  };

  const handleEditCancel = () => {
    setOpenEditModal(false);
    setUsuarioToEdit(null);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 'N/A';
      return fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
      return 'N/A';
    }
  };

  const getRolStyle = (rol) => ROL_STYLES[rol] || ROL_STYLES.atleta;

  if (loading) {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100vh', width: '100%' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress size={60} sx={{ color: C.primary }} />
        </Box>
      </Box>
    );
  }

  const clubActualNombre = usuarioToEdit?.club_nombre || 'Sin club asignado';

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ color: C.primary, fontWeight: 'bold' }}>
            Gestión de Usuarios
          </Typography>
          <Box sx={{ width: 64, height: 4, bgcolor: C.secondary, borderRadius: 2, mx: 'auto', mt: 1.5 }} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box
          sx={{
            mb: 3, p: 2, borderRadius: 2, bgcolor: C.cream, border: '1px solid rgba(128,0,32,0.12)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: C.primary, fontWeight: 600 }}>
            Total de Usuarios: {usuariosFiltrados.length}
          </Typography>
          <FormControl sx={{ minWidth: 200, bgcolor: '#fff', borderRadius: 1 }} size="small">
            <InputLabel id="filtro-rol-label">Filtrar por rol</InputLabel>
            <Select labelId="filtro-rol-label" value={filtroRol} label="Filtrar por rol" onChange={(e) => setFiltroRol(e.target.value)}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="atleta">Atletas</MenuItem>
              <MenuItem value="entrenador">Entrenadores</MenuItem>
              <MenuItem value="admin">Administradores</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, border: '1px solid rgba(128,0,32,0.1)' }}>
          <Box
            sx={{
              maxHeight: '70vh',
              overflow: 'auto',
              '&::-webkit-scrollbar': { width: '8px', height: '8px' },
              '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
              '&::-webkit-scrollbar-thumb': { background: C.primary, borderRadius: '4px', '&:hover': { background: C.primary2 } },
            }}
          >
            <Table stickyHeader sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  {['Usuario', 'Rol', 'Correo', 'Teléfono', 'Fecha Nac.', 'Club / Experiencia', 'Acciones'].map((h, i) => (
                    <TableCell
                      key={h}
                      sx={{
                        backgroundColor: C.primary, color: 'white', fontWeight: 'bold',
                        minWidth: [200, 120, 180, 120, 150, 170, 180][i],
                        position: 'sticky', top: 0, zIndex: 1,
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {usuariosFiltrados.map((usuario) => {
                  const rolStyle = getRolStyle(usuario.rol);
                  const soporte = API_POR_ROL[usuario.rol] || {};
                  return (
                    <TableRow key={`${usuario.rol}-${usuario.id}`} sx={{ '&:hover': { backgroundColor: 'rgba(245,232,199,0.4)' } }}>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: C.primary }}>
                            {usuario.nombre?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography variant="body2" noWrap>
                            {usuario.nombre} {usuario.apellido_paterno} {usuario.apellido_materno}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Chip icon={rolStyle.icon} label={rolStyle.label} size="small" sx={{ bgcolor: rolStyle.bg, color: rolStyle.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, color: C.secondary }} />
                          <Typography variant="body2" noWrap>{usuario.email || 'N/A'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: C.secondary }} />
                          <Typography variant="body2" noWrap>{usuario.telefono || 'N/A'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        {usuario.rol === 'atleta' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: C.secondary }} />
                            <Typography variant="body2" noWrap>
                              {usuario.fecha_nacimiento ? `${formatearFecha(usuario.fecha_nacimiento)} (${usuario.edad ?? 'N/A'} años)` : 'N/A'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        {usuario.rol === 'atleta' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <GroupIcon sx={{ fontSize: 16, color: C.secondary }} />
                            <Chip
                              label={usuario.club_nombre || 'Independiente'}
                              size="small"
                              sx={usuario.club_id
                                ? { bgcolor: 'rgba(63,125,82,0.12)', color: C.greenDark, fontWeight: 600 }
                                : { bgcolor: 'rgba(0,0,0,0.06)', color: 'text.secondary', fontWeight: 600 }}
                            />
                          </Box>
                        ) : usuario.rol === 'entrenador' ? (
                          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                            <Chip
                              label={`${usuario.anos_experiencia ?? 0} años exp.`}
                              size="small"
                              sx={{ bgcolor: 'rgba(122,64,105,0.12)', color: C.secondary2, fontWeight: 600 }}
                            />
                            {usuario.club_id && (
                              <Chip label={usuario.club_nombre} size="small" variant="outlined" sx={{ borderColor: C.green, color: C.greenDark, fontWeight: 600 }} />
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="textSecondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
                          <ActionIconButton
                            title="Editar"
                            color={C.primary}
                            icon={<EditIcon fontSize="small" />}
                            disabled={!soporte.soportaEdicion}
                            onClick={() => soporte.soportaEdicion ? handleEditClick(usuario) : setError(EDITAR_NO_SOPORTADO)}
                          />
                          {usuario.rol === 'atleta' && usuario.club_id && (
                            <ActionIconButton
                              title="Expulsar del club"
                              color={C.secondary}
                              icon={<ExitToAppIcon fontSize="small" />}
                              onClick={() => handleExpulsarClick(usuario)}
                            />
                          )}
                          <ActionIconButton
                            title="Eliminar"
                            color={C.danger}
                            icon={<DeleteIcon fontSize="small" />}
                            disabled={!soporte.soportaEliminar}
                            onClick={() => soporte.soportaEliminar ? handleDeleteClick(usuario) : setError(ELIMINAR_NO_SOPORTADO)}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Paper>

        <Dialog open={openDeleteModal} onClose={handleDeleteCancel} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ bgcolor: C.cream }}>
            <Typography component="span" variant="h6" sx={{ color: C.primary, fontWeight: 'bold' }}>
              Confirmar Eliminación
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <WarningIcon sx={{ color: C.danger, fontSize: 40 }} />
              <Typography variant="h6" sx={{ color: C.danger }}>Atención</Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <Box component="span" sx={{ fontWeight: 'bold', color: C.primary }}>
                "{usuarioToDelete?.nombre} {usuarioToDelete?.apellido_paterno} {usuarioToDelete?.apellido_materno}"
              </Box>?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Esta acción no se puede deshacer. Si el atleta tiene resultados o inscripciones registradas, el backend rechazará la eliminación.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={handleDeleteCancel} variant="outlined" sx={outlineSecondarySx}>Cancelar</Button>
            <Button onClick={handleDeleteConfirm} variant="contained" sx={solidDangerSx}>Eliminar Usuario</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openExpulsarModal} onClose={handleExpulsarCancel} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ bgcolor: C.cream }}>
            <Typography component="span" variant="h6" sx={{ color: C.primary, fontWeight: 'bold' }}>
              Confirmar Expulsión del Club
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ExitToAppIcon sx={{ color: C.secondary, fontSize: 40 }} />
              <Typography variant="h6" sx={{ color: C.secondary }}>Expulsar del Club</Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ¿Estás seguro de que deseas expulsar a{' '}
              <Box component="span" sx={{ fontWeight: 'bold', color: C.primary }}>
                "{usuarioToExpulsar?.nombre} {usuarioToExpulsar?.apellido_paterno} {usuarioToExpulsar?.apellido_materno}"
              </Box>{' '}del club?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Pasará a ser independiente y podrá ser asignado a otro club más adelante.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={handleExpulsarCancel} variant="outlined" sx={outlineSecondarySx}>Cancelar</Button>
            <Button onClick={handleExpulsarConfirm} variant="contained" sx={solidExpulsarSx}>Expulsar del Club</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openEditModal} onClose={handleEditCancel} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ backgroundColor: C.primary, color: 'white', py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}>
                {editFormData.nombre?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>Editar Usuario</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {editFormData.nombre} {editFormData.apellido_paterno} {editFormData.apellido_materno} · {ROL_STYLES[usuarioToEdit?.rol]?.label}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ backgroundColor: C.bg, p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 2 }}>
              <PersonIcon sx={{ color: C.primary }} fontSize="small" />
              <Typography variant="subtitle2" sx={{ color: C.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Información personal
              </Typography>
            </Stack>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3, border: '1px solid rgba(128,0,32,0.12)' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField label="Nombre" name="nombre" value={editFormData.nombre} onChange={handleEditChange} fullWidth size="small" />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField label="Apellido Paterno" name="apellido_paterno" value={editFormData.apellido_paterno} onChange={handleEditChange} fullWidth size="small" />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField label="Apellido Materno" name="apellido_materno" value={editFormData.apellido_materno} onChange={handleEditChange} fullWidth size="small" />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField
                    label="Correo electrónico" name="email" type="email" value={editFormData.email} onChange={handleEditChange} fullWidth size="small"
                    InputProps={{ startAdornment: <EmailIcon sx={{ fontSize: 18, color: C.secondary, mr: 1 }} /> }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField
                    label="Teléfono (10 dígitos)" name="telefono" value={editFormData.telefono} onChange={handleEditChange} fullWidth size="small"
                    InputProps={{ startAdornment: <PhoneIcon sx={{ fontSize: 18, color: C.secondary, mr: 1 }} /> }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField
                    label="CURP" name="curp" value={editFormData.curp} onChange={handleEditChange} fullWidth size="small"
                    InputProps={{ startAdornment: <BadgeIcon sx={{ fontSize: 18, color: C.secondary, mr: 1 }} /> }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField
                    label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={editFormData.fecha_nacimiento}
                    onChange={handleEditChange} fullWidth size="small" InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="edit-genero-label">Género</InputLabel>
                    <Select labelId="edit-genero-label" name="genero" value={editFormData.genero} label="Género" onChange={handleEditChange}>
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="femenino">Femenino</MenuItem>
                      <MenuItem value="otro">Otro</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField label="Estado de Nacimiento" name="estado_nacimiento" value={editFormData.estado_nacimiento} onChange={handleEditChange} fullWidth size="small" />
                </Box>
                {usuarioToEdit?.rol === 'entrenador' && (
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <TextField
                      label="Años de experiencia" name="anos_experiencia" type="number" value={editFormData.anos_experiencia}
                      onChange={handleEditChange} fullWidth size="small"
                    />
                  </Box>
                )}
              </Box>
            </Paper>

            {(usuarioToEdit?.rol === 'atleta' || usuarioToEdit?.rol === 'entrenador') && (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <GroupIcon sx={{ color: C.primary }} fontSize="small" />
                  <Typography variant="subtitle2" sx={{ color: C.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Club
                  </Typography>
                </Stack>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 1, border: '1px solid rgba(128,0,32,0.12)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Actualmente en:</Typography>
                    <Chip
                      label={clubActualNombre}
                      size="small"
                      sx={usuarioToEdit?.club_id
                        ? { bgcolor: 'rgba(63,125,82,0.12)', color: C.greenDark, fontWeight: 600 }
                        : { bgcolor: 'rgba(0,0,0,0.06)', color: 'text.secondary', fontWeight: 600 }}
                    />
                  </Box>
                  <FormControl fullWidth size="small">
                    <InputLabel id="edit-club-label">Cambiar o asignar club</InputLabel>
                    <Select labelId="edit-club-label" name="clubId" value={editFormData.clubId} label="Cambiar o asignar club" onChange={handleEditChange}>
                      <MenuItem value="">Sin club (independiente)</MenuItem>
                      {clubes.map((club) => (
                        <MenuItem key={club.id} value={club.id}>{club.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Paper>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, backgroundColor: C.bg, gap: 1 }}>
            <Button onClick={handleEditCancel} variant="outlined" sx={outlineSecondarySx}>Cancelar</Button>
            <Button onClick={handleEditSubmit} variant="contained" sx={solidPrimarySx}>Guardar Cambios</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default GestionarUsuarios;