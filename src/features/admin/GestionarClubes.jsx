import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
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
  TableContainer,
  IconButton,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Avatar,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { clubesAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Paleta de colores institucional
const C = {
  primary:    '#800020',
  secondary:  '#7A4069',
  secondary2: '#ffffff',
  cream:      '#7E2C2C',
  bg:         '#e4e4e5',
  green:      '#3F7D52',
  greenDark:  '#2C5B3B',
  danger:     '#A13A3A',
};

// Estilos para el estado del club (activo/inactivo)
const ESTADO_STYLES = {
  activo:   { border: C.secondary, text: C.secondary, avatar: C.primary },
  inactivo: { border: 'rgba(128,0,32,0.18)', text: '#2B1E1E', avatar: C.secondary },
};

// Estilos reutilizables para campos de formulario
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#FFFFFF',
    '&:hover fieldset':       { borderColor: C.secondary },
    '&.Mui-focused fieldset': { borderColor: C.secondary },
  },
  '& .MuiInputLabel-root':             { color: C.secondary },
  '& .MuiInputLabel-root.Mui-focused': { color: C.secondary },
};

// Estilos para botones
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
  '&:hover': { bgcolor: C.primary, boxShadow: 'none' },
};

const solidDangerSx = {
  borderRadius: 2,
  bgcolor: C.danger,
  fontWeight: 'bold',
  boxShadow: 'none',
  '&:hover': { bgcolor: C.primary, boxShadow: 'none' },
};

// Valores iniciales del formulario
const VALORES_INICIALES_FORMULARIO = {
  nombre: '', direccion: '', telefono: '',
  email: '', descripcion: '', estado: 'activo',
};

// Calcula la edad a partir de la fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 'N/A';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad  = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

// Estado vacío para listas sin datos
const EmptyState = ({ mensaje }) => (
  <Box sx={{ py: 6, textAlign: 'center' }}>
    <Typography variant="body1" sx={{ color: C.secondary }}>{mensaje}</Typography>
  </Box>
);

// Chip que muestra el estado del club
const ChipEstado = ({ estado }) => {
  const s = ESTADO_STYLES[estado] || ESTADO_STYLES.inactivo;
  return (
    <Chip
      label={estado === 'activo' ? 'Activo' : 'Inactivo'}
      size="small"
      sx={{
        bgcolor: 'transparent',
        color: s.text,
        fontWeight: 700,
        border: `1px solid ${s.border}`,
      }}
    />
  );
};

// Botón de acción con tooltip
const BotonAccion = ({ title, color, onClick, children }) => (
  <Tooltip title={title} arrow>
    <IconButton
      size="small"
      onClick={onClick}
      sx={{
        color,
        transition: 'background-color 0.15s ease',
        '&:hover': { bgcolor: `${color}1A` },
      }}
    >
      {children}
    </IconButton>
  </Tooltip>
);

// Cabecera para los modales
const CabeceraModal = ({ titulo, subtitulo, onClose }) => (
  <DialogTitle
    sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      pb: 1,
      pr: 1,
      bgcolor: C.primary,
    }}
  >
    <Box>
      <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 'bold', lineHeight: 1.3 }}>
        {titulo}
      </Typography>
      {subtitulo && (
        <Typography variant="caption" sx={{ color: C.secondary2 }} display="block">
          {subtitulo}
        </Typography>
      )}
    </Box>
    <IconButton
      onClick={onClose}
      size="small"
      sx={{ flexShrink: 0, color: C.secondary, '&:hover': { bgcolor: 'rgba(128,0,32,0.1)' } }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
);

const GestionClubesAdmin = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [exito, setExito]           = useState('');

  const [clubes, setClubes]           = useState([]);
  const [atletasClub, setAtletasClub] = useState([]);

  const [modalAbierto, setModalAbierto]                   = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto]   = useState(false);
  const [modalAtletasAbierto, setModalAtletasAbierto]     = useState(false);

  const [clubSeleccionado, setClubSeleccionado]           = useState(null);
  const [clubAEliminar, setClubAEliminar]                 = useState(null);
  const [clubParaAtletas, setClubParaAtletas]             = useState(null);

  const [datosFormulario, setDatosFormulario] = useState(VALORES_INICIALES_FORMULARIO);

  useEffect(() => {
    if (!user || user.rol !== 'admin') { navigate('/login'); return; }
    cargarClubes();
  }, [user, navigate]);

  // Carga la lista de clubes desde el backend
  const cargarClubes = async () => {
    try {
      setCargando(true);
      const response = await clubesAPI.getAll();
      const lista    = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.clubes)
          ? response.data.clubes
          : [];
      setClubes(lista);
      setError('');
    } catch (err) {
      console.error('Error al cargar clubes:', err);
      setError('Error al cargar los clubes');
      setClubes([]);
    } finally {
      setCargando(false);
    }
  };

  // Carga los atletas de un club específico
  const cargarAtletasClub = async (clubId) => {
    try {
      const response = await clubesAPI.getAtletas(clubId);
      const lista    = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.atletas)
          ? response.data.atletas
          : [];
      setAtletasClub(lista);
    } catch (err) {
      console.error('Error al cargar atletas:', err);
      setAtletasClub([]);
    }
  };

  // Actualiza un campo del formulario
  const manejarCambioFormulario = (campo) => (e) =>
    setDatosFormulario((prev) => ({ ...prev, [campo]: e.target.value }));

  // Abre el modal de edición con los datos del club
  const manejarAbrirModal = (club) => {
    setDatosFormulario({
      nombre:      club.nombre      || '',
      direccion:   club.direccion   || '',
      telefono:    club.telefono    || '',
      email:       club.email       || '',
      descripcion: club.descripcion || '',
      estado:      club.estado      || 'activo',
    });
    setClubSeleccionado(club);
    setModalAbierto(true);
  };

  // Cierra el modal de edición
  const manejarCerrarModal = () => {
    setModalAbierto(false);
    setClubSeleccionado(null);
    setDatosFormulario(VALORES_INICIALES_FORMULARIO);
  };

  // Guarda los cambios del club
  const manejarGuardar = async () => {
    if (!datosFormulario.nombre || !datosFormulario.direccion || !datosFormulario.telefono) {
      setError('Nombre, dirección y teléfono son obligatorios');
      return;
    }
    if (datosFormulario.telefono.replace(/\D/g, '').length !== 10) {
      setError('El teléfono debe tener exactamente 10 dígitos');
      return;
    }
    try {
      await clubesAPI.update(clubSeleccionado.id, datosFormulario);
      setExito('Información del club actualizada correctamente');
      manejarCerrarModal();
      cargarClubes();
    } catch (err) {
      console.error('Error al actualizar club:', err);
      setError(err.response?.data?.message || 'Error al actualizar la información del club');
    }
  };

  // Abre el modal de confirmación de eliminación
  const manejarEliminarClick   = (club) => { setClubAEliminar(club); setModalEliminarAbierto(true); };
  const manejarEliminarCancelar  = ()     => { setModalEliminarAbierto(false); setClubAEliminar(null); };

  // Confirma la eliminación del club
  const manejarEliminarConfirmar = async () => {
    try {
      await clubesAPI.delete(clubAEliminar.id);
      setExito('Club eliminado correctamente');
      setModalEliminarAbierto(false);
      setClubAEliminar(null);
      cargarClubes();
    } catch (err) {
      console.error('Error al eliminar club:', err);
      setError('Error al eliminar el club');
    }
  };

  // Abre el modal con la lista de atletas del club
  const manejarAbrirModalAtletas = async (club) => {
    setClubParaAtletas(club);
    await cargarAtletasClub(club.id);
    setModalAtletasAbierto(true);
  };

  const totalActivos   = clubes.filter((c) => c.estado === 'activo').length;
  const totalInactivos = clubes.filter((c) => c.estado === 'inactivo').length;

  if (cargando) {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} sx={{ color: C.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', width: '100%' }}>
      {/* Cabecera superior */}
      <Box sx={{ bgcolor: C.primary, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="xl" sx={{ textAlign: 'center', px: { xs: 2, md: 4 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel Administrativo
          </Typography>
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 800, mt: 1 }}>
            Gestión de Clubes Deportivos
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
        {/* Tarjeta de estadísticas (flotante) */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 3,
            bgcolor: '#fff', borderRadius: 3,
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            overflow: 'hidden',
          }}
        >
          {[
            { value: clubes.length, label: 'Clubes Registrados', accent: C.primary },
            { value: totalActivos, label: 'Activos', accent: C.secondary },
            { value: totalInactivos, label: 'Inactivos', accent: C.primary },
          ].map((s, i) => (
            <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(128,0,32,0.12)' : 'none' }}>
              <Typography sx={{ fontWeight: 800, color: s.accent, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#2B1E1E', fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>
        )}
        {exito && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setExito('')}>{exito}</Alert>
        )}

        <Paper sx={{ width: '100%', mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(128,0,32,0.1)' }}>
          {clubes.length === 0 ? <EmptyState mensaje="No hay clubes registrados aún." /> : (
            <TableContainer>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: C.primary }}>
                    {['Club', 'Contacto', 'Estado', 'Acciones'].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 700, color: '#fff', fontSize: '0.72rem',
                          textTransform: 'uppercase', letterSpacing: '0.04em', py: 2,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clubes.map((club) => (
                    <TableRow key={club.id} sx={{ '&:hover': { bgcolor: 'rgba(128,0,32,0.04)' } }}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {club.nombre}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {club.direccion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, color: C.secondary }} />
                            <Typography variant="caption">{club.telefono}</Typography>
                          </Box>
                          {club.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 14, color: C.secondary }} />
                              <Typography variant="caption">{club.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell><ChipEstado estado={club.estado} /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <BotonAccion title="Ver atletas" color={C.secondary} onClick={() => manejarAbrirModalAtletas(club)}>
                            <PeopleIcon fontSize="small" />
                          </BotonAccion>
                          <BotonAccion title="Editar" color={C.primary} onClick={() => manejarAbrirModal(club)}>
                            <EditIcon fontSize="small" />
                          </BotonAccion>
                          <BotonAccion title="Eliminar" color={C.danger} onClick={() => manejarEliminarClick(club)}>
                            <DeleteIcon fontSize="small" />
                          </BotonAccion>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Modal de edición de club */}
        <Dialog
          open={modalAbierto}
          onClose={manejarCerrarModal}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
        >
          <CabeceraModal titulo="Editar Club" onClose={manejarCerrarModal} />
          <Divider />

          <DialogContent sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
            <Typography variant="overline" sx={{ color: C.secondary, fontWeight: 700, letterSpacing: 1 }}>
              Datos del Club
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5, mb: 3 }}>
              <TextField
                fullWidth
                label="Nombre del Club"
                value={datosFormulario.nombre}
                onChange={manejarCambioFormulario('nombre')}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="Dirección"
                value={datosFormulario.direccion}
                onChange={manejarCambioFormulario('direccion')}
                sx={fieldSx}
              />
            </Box>

            <Typography variant="overline" sx={{ color: C.secondary, fontWeight: 700, letterSpacing: 1 }}>
              Contacto
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mt: 0.5, mb: 3 }}>
              <TextField
                fullWidth
                label="Teléfono"
                value={datosFormulario.telefono}
                onChange={manejarCambioFormulario('telefono')}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={datosFormulario.email}
                onChange={manejarCambioFormulario('email')}
                sx={fieldSx}
              />
            </Box>

            <Typography variant="overline" sx={{ color: C.secondary, fontWeight: 700, letterSpacing: 1 }}>
              Información Adicional
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={datosFormulario.descripcion}
                onChange={manejarCambioFormulario('descripcion')}
                sx={fieldSx}
              />
              <FormControl fullWidth sx={{ ...fieldSx, maxWidth: { sm: '50%' } }}>
                <InputLabel>Estado</InputLabel>
                <Select value={datosFormulario.estado} onChange={manejarCambioFormulario('estado')} label="Estado">
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={manejarCerrarModal} variant="outlined" sx={outlineSecondarySx}>
              Cancelar
            </Button>
            <Button onClick={manejarGuardar} variant="contained" sx={solidPrimarySx}>
              Actualizar Club
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de lista de atletas del club */}
        <Dialog
          open={modalAtletasAbierto}
          onClose={() => setModalAtletasAbierto(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
        >
          <CabeceraModal
            titulo="Atletas del Club"
            subtitulo={clubParaAtletas?.nombre}
            onClose={() => setModalAtletasAbierto(false)}
          />
          <Divider />

          <DialogContent sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 2,
                py: 0.75,
                mb: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(128,0,32,0.06)',
                border: `1px solid rgba(128,0,32,0.15)`,
              }}
            >
              <Typography variant="body2" sx={{ color: C.primary, fontWeight: 600 }}>
                Total de atletas: {atletasClub.length}
              </Typography>
            </Box>

            {atletasClub.length === 0 ? (
              <EmptyState mensaje="No hay atletas asociados a este club." />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {atletasClub.map((atleta) => (
                  <Box
                    key={atleta.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid rgba(128,0,32,0.1)',
                      bgcolor: '#fff',
                      height: '100%',
                    }}
                  >
                    <Avatar sx={{ bgcolor: C.primary, flexShrink: 0 }}>
                      {atleta.nombre?.charAt(0)?.toUpperCase() || 'A'}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }} noWrap>
                        {atleta.nombre} {atleta.apellido_paterno} {atleta.apellido_materno}
                      </Typography>
                      {[
                        { label: 'Edad',    value: `${calcularEdad(atleta.fecha_nacimiento)} años` },
                        { label: 'Género',  value: atleta.genero || 'N/A' },
                        { label: 'Teléfono', value: atleta.telefono || 'N/A' },
                        { label: 'Email',   value: atleta.email || 'N/A' },
                        { label: 'Estado',  value: atleta.estado_nacimiento || 'N/A' },
                      ].map(({ label, value }) => (
                        <Typography key={label} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          <Box component="span" sx={{ fontWeight: 600, color: C.secondary }}>{label}: </Box>
                          {value}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>

          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setModalAtletasAbierto(false)} variant="outlined" sx={outlineSecondarySx}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de confirmación de eliminación */}
        <Dialog
          open={modalEliminarAbierto}
          onClose={manejarEliminarCancelar}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <CabeceraModal titulo="Confirmar Eliminación" onClose={manejarEliminarCancelar} />
          <Divider />

          <DialogContent sx={{ px: 3, py: 3 }}>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              ¿Estás seguro de que deseas eliminar el club{' '}
              <Box component="span" sx={{ fontWeight: 'bold', color: C.primary }}>
                "{clubAEliminar?.nombre}"
              </Box>
              ?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Esta acción no se puede deshacer. Se eliminará permanentemente el club y todos sus datos asociados.
            </Typography>
          </DialogContent>

          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={manejarEliminarCancelar} variant="outlined" sx={outlineSecondarySx}>
              Cancelar
            </Button>
            <Button onClick={manejarEliminarConfirmar} variant="contained" sx={solidDangerSx}>
              Eliminar Club
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default GestionClubesAdmin;