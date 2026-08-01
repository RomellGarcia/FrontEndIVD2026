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
import { atletasAPI, entrenadoresAPI, clubesAPI, adminsAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Paleta de colores institucional
const C = {
  primary:    '#800020',
  primary2:   '#600018',
  secondary:  '#7A4069',
  secondary2: '#5C304F',
  bg:         '#e4e4e5',
  danger:     '#A13A3A',
};

// Configuración de estilos para cada rol
const ROL_STYLES = {
  admin:       { color: C.primary,   bg: '#8000201A',   label: 'Administrador', icon: <AdminIcon fontSize="small" /> },
  entrenador:  { color: C.secondary, bg: '#7A40691A', label: 'Entrenador',    icon: <CoachIcon fontSize="small" /> },
  atleta:      { color: '#2B1E1E',   bg: '#2B1E1E14',  label: 'Atleta',        icon: <SportsIcon fontSize="small" /> },
};

// Estilos reutilizables para botones
const outlineSecondarySx = {
  borderRadius: 2,
  borderColor: C.secondary,
  color: C.secondary,
  '&:hover': { borderColor: C.primary, color: C.primary, bgcolor: '#8000200D' },
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
  '&:hover': { bgcolor: C.primary, boxShadow: 'none' },
};

const solidExpulsarSx = {
  borderRadius: 2,
  bgcolor: C.secondary,
  fontWeight: 'bold',
  boxShadow: 'none',
  '&:hover': { bgcolor: C.secondary2, boxShadow: 'none' },
};

// Botón de acción con tooltip
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

// API por rol: mapea cada rol a las funciones correspondientes
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
    remove:      entrenadoresAPI.remove,
    soportaEdicion: true,
    soportaClub: true,
    soportaEliminar: true,
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

// Elimina campos vacíos o undefined del payload
const limpiarPayload = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')
);

const EDITAR_NO_SOPORTADO = 'La edición de administradores todavía no tiene endpoint en el backend.';
const ELIMINAR_NO_SOPORTADO = 'Eliminar entrenadores todavía no tiene endpoint en el backend.';

const GestionarUsuarios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [filtroRol, setFiltroRol] = useState('todos');

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const [modalExpulsarAbierto, setModalExpulsarAbierto] = useState(false);
  const [usuarioAExpulsar, setUsuarioAExpulsar] = useState(null);

  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({
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

  // Carga todos los datos necesarios: atletas, entrenadores, admins y clubes
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [atletasRes, entrenadoresRes, adminsRes, clubesRes] = await Promise.all([
        atletasAPI.getAll(),
        entrenadoresAPI.getAll().catch(() => ({ data: { entrenadores: [] } })),
        adminsAPI.getAll().catch(() => ({ data: { admins: [] } })),
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
      setCargando(false);
    }
  };

  const usuariosFiltrados = filtroRol === 'todos'
    ? usuarios
    : usuarios.filter((u) => u.rol === filtroRol);

  // Manejadores para eliminar usuario
  const manejarEliminarClick = (usuario) => {
    setUsuarioAEliminar(usuario);
    setModalEliminarAbierto(true);
  };

  const manejarEliminarConfirmar = async () => {
    try {
      await API_POR_ROL[usuarioAEliminar.rol].remove(usuarioAEliminar.id);
      setExito('Usuario eliminado correctamente');
      setModalEliminarAbierto(false);
      setUsuarioAEliminar(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setError(error.response?.data?.error || 'Error al eliminar el usuario');
    }
  };

  const manejarEliminarCancelar = () => {
    setModalEliminarAbierto(false);
    setUsuarioAEliminar(null);
  };

  // Manejadores para expulsar del club
  const manejarExpulsarClick = (usuario) => {
    setUsuarioAExpulsar(usuario);
    setModalExpulsarAbierto(true);
  };

  const manejarExpulsarConfirmar = async () => {
    try {
      await API_POR_ROL[usuarioAExpulsar.rol].updateClub(usuarioAExpulsar.id, { club_id: null });
      setExito('Usuario expulsado correctamente del club. Ahora es independiente.');
      setModalExpulsarAbierto(false);
      setUsuarioAExpulsar(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al expulsar atleta:', error);
      setError(error.response?.data?.error || 'Error al expulsar atleta del club');
    }
  };

  const manejarExpulsarCancelar = () => {
    setModalExpulsarAbierto(false);
    setUsuarioAExpulsar(null);
  };

  // Manejadores para editar usuario
  const manejarEditarClick = (usuario) => {
    setUsuarioAEditar(usuario);
    setFormEditar({
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
    setModalEditarAbierto(true);
  };

  const manejarEditarChange = (e) => {
    const { name, value } = e.target;
    setFormEditar((prev) => ({ ...prev, [name]: value }));
  };

  const manejarEditarGuardar = async () => {
    const rol = usuarioAEditar.rol;
    const id = usuarioAEditar.id;
    const rolApi = API_POR_ROL[rol];

    try {
      const payloadGeneral = limpiarPayload({
        nombre: formEditar.nombre,
        apellido_paterno: formEditar.apellido_paterno,
        apellido_materno: formEditar.apellido_materno,
        email: formEditar.email,
        telefono: formEditar.telefono,
        curp: formEditar.curp,
        fecha_nacimiento: formEditar.fecha_nacimiento,
        estado_nacimiento: formEditar.estado_nacimiento,
        genero: formEditar.genero,
        anos_experiencia: rol === 'entrenador' && formEditar.anos_experiencia !== ''
          ? Number(formEditar.anos_experiencia)
          : undefined,
      });

      await rolApi.updateAdmin(id, payloadGeneral);

      if (rolApi.soportaClub) {
        await rolApi.updateClub(id, {
          club_id: formEditar.clubId === '' ? null : Number(formEditar.clubId),
        });
      }

      setExito('Usuario actualizado correctamente');
      setModalEditarAbierto(false);
      setUsuarioAEditar(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setError(error.response?.data?.error || 'Error al actualizar el usuario');
    }
  };

  const manejarEditarCancelar = () => {
    setModalEditarAbierto(false);
    setUsuarioAEditar(null);
  };

  // Formatea fecha a formato largo
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

  // Calcula la edad a partir de la fecha de nacimiento
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const obtenerRolStyle = (rol) => ROL_STYLES[rol] || ROL_STYLES.atleta;

  if (cargando) {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} sx={{ color: C.primary }} />
      </Box>
    );
  }

  const clubActualNombre = usuarioAEditar?.club_nombre || 'Sin club asignado';
  const totalAtletas = usuarios.filter((u) => u.rol === 'atleta').length;
  const totalEntrenadores = usuarios.filter((u) => u.rol === 'entrenador').length;
  const totalAdmins = usuarios.filter((u) => u.rol === 'admin').length;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', width: '100%' }}>
      {/* Cabecera superior */}
      <Box sx={{ bgcolor: C.primary, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="xl" sx={{ textAlign: 'center', px: { xs: 2, md: 4 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel Administrativo
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Gestión de Usuarios
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
        {/* Tarjeta de estadísticas (flotante) */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 3,
            bgcolor: '#fff', borderRadius: 3,
            boxShadow: '0 10px 28px #00000024',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            overflow: 'hidden',
          }}
        >
          {[
            { value: totalAtletas, label: 'Atletas', accent: '#2B1E1E' },
            { value: totalEntrenadores, label: 'Entrenadores', accent: C.secondary },
            { value: totalAdmins, label: 'Administradores', accent: C.primary },
          ].map((s, i) => (
            <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? '1px solid #8000201F' : 'none' }}>
              <Typography sx={{ fontWeight: 800, color: s.accent, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#2B1E1E', fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {exito && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setExito('')}>
            {exito}
          </Alert>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, border: '1px solid #8000201A' }}>
          <Box
            sx={{
              p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 2, borderBottom: '1px solid #8000201A',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: C.primary, fontWeight: 700 }}>
              Total de usuarios: {usuariosFiltrados.length}
            </Typography>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="filtro-rol-label">Filtrar por rol</InputLabel>
              <Select labelId="filtro-rol-label" value={filtroRol} label="Filtrar por rol" onChange={(e) => setFiltroRol(e.target.value)}>
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="atleta">Atletas</MenuItem>
                <MenuItem value="entrenador">Entrenadores</MenuItem>
                <MenuItem value="admin">Administradores</MenuItem>
              </Select>
            </FormControl>
          </Box>

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
                  const rolStyle = obtenerRolStyle(usuario.rol);
                  const soporte = API_POR_ROL[usuario.rol] || {};
                  return (
                    <TableRow key={`${usuario.rol}-${usuario.id}`} sx={{ '&:hover': { backgroundColor: '#8000200A' } }}>
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
                        {usuario.rol === 'atleta' || usuario.rol === 'entrenador' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: C.secondary }} />
                            <Typography variant="body2" noWrap>
                              {usuario.fecha_nacimiento
                                ? `${formatearFecha(usuario.fecha_nacimiento)} (${usuario.edad ?? calcularEdad(usuario.fecha_nacimiento) ?? 'N/A'} años)`
                                : 'N/A'}
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
                                ? { bgcolor: 'transparent', border: `1px solid ${C.secondary}`, color: C.secondary, fontWeight: 600 }
                                : { bgcolor: '#0000000F', color: 'text.secondary', fontWeight: 600 }}
                            />
                          </Box>
                        ) : usuario.rol === 'entrenador' ? (
                          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                            <Chip
                              label={`${usuario.anos_experiencia ?? 0} años exp.`}
                              size="small"
                              sx={{ bgcolor: '#7A40691F', color: C.secondary2, fontWeight: 600 }}
                            />
                            {usuario.club_id && (
                              <Chip label={usuario.club_nombre} size="small" variant="outlined" sx={{ borderColor: C.secondary, color: C.secondary, fontWeight: 600 }} />
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
                            onClick={() => soporte.soportaEdicion ? manejarEditarClick(usuario) : setError(EDITAR_NO_SOPORTADO)}
                          />
                          {(usuario.rol === 'atleta' || usuario.rol === 'entrenador') && usuario.club_id && (
                            <ActionIconButton
                              title="Expulsar del club"
                              color={C.secondary}
                              icon={<ExitToAppIcon fontSize="small" />}
                              onClick={() => manejarExpulsarClick(usuario)}
                            />
                          )}
                          <ActionIconButton
                            title="Eliminar"
                            color={C.danger}
                            icon={<DeleteIcon fontSize="small" />}
                            disabled={!soporte.soportaEliminar}
                            onClick={() => soporte.soportaEliminar ? manejarEliminarClick(usuario) : setError(ELIMINAR_NO_SOPORTADO)}
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

        {/* Modal de confirmación de eliminación */}
        <Dialog open={modalEliminarAbierto} onClose={manejarEliminarCancelar} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
          <DialogTitle sx={{ bgcolor: C.primary }}>
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
                "{usuarioAEliminar?.nombre} {usuarioAEliminar?.apellido_paterno} {usuarioAEliminar?.apellido_materno}"
              </Box>?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Esta acción no se puede deshacer. Si el atleta tiene resultados o inscripciones registradas, el backend rechazará la eliminación.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={manejarEliminarCancelar} variant="outlined" sx={outlineSecondarySx}>Cancelar</Button>
            <Button onClick={manejarEliminarConfirmar} variant="contained" sx={solidDangerSx}>Eliminar Usuario</Button>
          </DialogActions>
        </Dialog>

        {/* Modal de confirmación de expulsión del club */}
        <Dialog open={modalExpulsarAbierto} onClose={manejarExpulsarCancelar} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
          <DialogTitle sx={{ bgcolor: C.primary }}>
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
                "{usuarioAExpulsar?.nombre} {usuarioAExpulsar?.apellido_paterno} {usuarioAExpulsar?.apellido_materno}"
              </Box>{' '}del club?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Pasará a ser independiente y podrá ser asignado a otro club más adelante.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={manejarExpulsarCancelar} variant="outlined" sx={outlineSecondarySx}>Cancelar</Button>
            <Button onClick={manejarExpulsarConfirmar} variant="contained" sx={solidExpulsarSx}>Expulsar del Club</Button>
          </DialogActions>
        </Dialog>

        {/* Modal de edición de usuario */}
        <Dialog open={modalEditarAbierto} onClose={manejarEditarCancelar} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
          <DialogTitle sx={{ backgroundColor: C.primary, color: 'white', py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: '#FFFFFF33', color: 'white', fontWeight: 'bold' }}>
                {formEditar.nombre?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>Editar Usuario</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {formEditar.nombre} {formEditar.apellido_paterno} {formEditar.apellido_materno} · {ROL_STYLES[usuarioAEditar?.rol]?.label}
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

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3, border: '1px solid #8000201F' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField label="Nombre" name="nombre" value={formEditar.nombre} onChange={manejarEditarChange} fullWidth size="small" />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField label="Apellido Paterno" name="apellido_paterno" value={formEditar.apellido_paterno} onChange={manejarEditarChange} fullWidth size="small" />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField label="Apellido Materno" name="apellido_materno" value={formEditar.apellido_materno} onChange={manejarEditarChange} fullWidth size="small" />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField
                    label="Correo electrónico" name="email" type="email" value={formEditar.email} onChange={manejarEditarChange} fullWidth size="small"
                    slotProps={{ input: { startAdornment: <EmailIcon sx={{ fontSize: 18, color: C.secondary, mr: 1 }} /> } }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField
                    label="Teléfono (10 dígitos)" name="telefono" value={formEditar.telefono} onChange={manejarEditarChange} fullWidth size="small"
                    slotProps={{ input: { startAdornment: <PhoneIcon sx={{ fontSize: 18, color: C.secondary, mr: 1 }} /> } }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField
                    label="CURP" name="curp" value={formEditar.curp} onChange={manejarEditarChange} fullWidth size="small"
                    slotProps={{ input: { startAdornment: <BadgeIcon sx={{ fontSize: 18, color: C.secondary, mr: 1 }} /> } }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField
                    label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={formEditar.fecha_nacimiento}
                    onChange={manejarEditarChange} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="edit-genero-label">Género</InputLabel>
                    <Select labelId="edit-genero-label" name="genero" value={formEditar.genero} label="Género" onChange={manejarEditarChange}>
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="femenino">Femenino</MenuItem>
                      <MenuItem value="otro">Otro</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                  <TextField label="Estado de Nacimiento" name="estado_nacimiento" value={formEditar.estado_nacimiento} onChange={manejarEditarChange} fullWidth size="small" />
                </Box>
                {usuarioAEditar?.rol === 'entrenador' && (
                  <Box sx={{ flex: '1 1 220px', minWidth: 200 }}>
                    <TextField
                      label="Años de experiencia" name="anos_experiencia" type="number" value={formEditar.anos_experiencia}
                      onChange={manejarEditarChange} fullWidth size="small"
                    />
                  </Box>
                )}
              </Box>
            </Paper>

            {(usuarioAEditar?.rol === 'atleta' || usuarioAEditar?.rol === 'entrenador') && (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <GroupIcon sx={{ color: C.primary }} fontSize="small" />
                  <Typography variant="subtitle2" sx={{ color: C.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Club
                  </Typography>
                </Stack>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 1, border: '1px solid #8000201F' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Actualmente en:</Typography>
                    <Chip
                      label={clubActualNombre}
                      size="small"
                      sx={usuarioAEditar?.club_id
                        ? { bgcolor: 'transparent', border: `1px solid ${C.secondary}`, color: C.secondary, fontWeight: 600 }
                        : { bgcolor: '#0000000F', color: 'text.secondary', fontWeight: 600 }}
                    />
                  </Box>
                  <FormControl fullWidth size="small">
                    <InputLabel id="edit-club-label">Cambiar o asignar club</InputLabel>
                    <Select labelId="edit-club-label" name="clubId" value={formEditar.clubId} label="Cambiar o asignar club" onChange={manejarEditarChange}>
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
            <Button onClick={manejarEditarCancelar} variant="outlined" sx={outlineSecondarySx}>Cancelar</Button>
            <Button onClick={manejarEditarGuardar} variant="contained" sx={solidPrimarySx}>Guardar Cambios</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default GestionarUsuarios;