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
  TableContainer,
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
  ListItemAvatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sports as SportsIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { clubesAPI, atletasAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Paleta — consistente con todo el sistema IVD
// ---------------------------------------------------------------------------
const C = {
  primary:   '#800020',
  primary2:  '#600018',
  secondary: '#7A4069',
  bg:        '#e4e4e5',
  green:     '#2E7D32',
};

// ---------------------------------------------------------------------------
// Estilos de TextField — consistentes con el portal de club
// ---------------------------------------------------------------------------
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#FAFAFF',
    '&:hover fieldset':       { borderColor: C.secondary },
    '&.Mui-focused fieldset': { borderColor: C.secondary },
  },
  '& .MuiInputLabel-root':             { color: C.secondary },
  '& .MuiInputLabel-root.Mui-focused': { color: C.secondary },
};

// ---------------------------------------------------------------------------
// FORM_EMPTY fuera del componente — no se recrea en cada render
// ---------------------------------------------------------------------------
const FORM_EMPTY = {
  nombre: '', direccion: '', telefono: '',
  email: '', descripcion: '', estado: 'activo',
};

// ---------------------------------------------------------------------------
// Helper puro
// ---------------------------------------------------------------------------
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 'N/A';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad  = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
const EmptyState = ({ mensaje }) => (
  <Box sx={{ py: 6, textAlign: 'center' }}>
    <Typography variant="body1" sx={{ color: C.secondary }}>{mensaje}</Typography>
  </Box>
);

const EstadoChip = ({ estado }) => (
  <Chip
    label={estado === 'activo' ? 'Activo' : 'Inactivo'}
    color={estado === 'activo' ? 'success' : 'error'}
    size="small"
  />
);

// Cabecera reutilizable para todos los modales
// DialogTitle se convierte en el propio flex container para que la X
// quede alineada verticalmente con el título sin caer debajo de él.
const ModalHeader = ({ titulo, subtitulo, onClose }) => (
  <DialogTitle
    sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      pb: 1,
      pr: 1,          // reduce padding derecho para que el IconButton no flote
    }}
  >
    <Box>
      <Typography variant="h6" sx={{ color: C.primary, fontWeight: 'bold', lineHeight: 1.3 }}>
        {titulo}
      </Typography>
      {subtitulo && (
        <Typography variant="caption" color="textSecondary" display="block">
          {subtitulo}
        </Typography>
      )}
    </Box>
    <IconButton onClick={onClose} size="small" sx={{ flexShrink: 0 }}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>
);

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const GestionClubesAdmin = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const [clubes, setClubes]           = useState([]);
  const [atletasClub, setAtletasClub] = useState([]);

  const [openModal, setOpenModal]               = useState(false);
  const [openDeleteModal, setOpenDeleteModal]   = useState(false);
  const [openAtletasModal, setOpenAtletasModal] = useState(false);

  const [selectedClub, setSelectedClub]                     = useState(null);
  const [clubToDelete, setClubToDelete]                     = useState(null);
  const [selectedClubForAtletas, setSelectedClubForAtletas] = useState(null);

  const [formData, setFormData] = useState(FORM_EMPTY);

  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!user || user.rol !== 'admin') { navigate('/login'); return; }
    cargarClubes();
  }, [user, navigate]);

  // -------------------------------------------------------------------------
  const cargarClubes = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const cargarAtletasClub = async (clubId) => {
    try {
      const response = await atletasAPI.getByClub(clubId);
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

  // -------------------------------------------------------------------------
  const patchForm = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleOpenModal = (club) => {
    setFormData({
      nombre:      club.nombre      || '',
      direccion:   club.direccion   || '',
      telefono:    club.telefono    || '',
      email:       club.email       || '',
      descripcion: club.descripcion || '',
      estado:      club.estado      || 'activo',
    });
    setSelectedClub(club);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedClub(null);
    setFormData(FORM_EMPTY);
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.direccion || !formData.telefono) {
      setError('Nombre, direccion y telefono son obligatorios');
      return;
    }
    if (formData.telefono.replace(/\D/g, '').length !== 10) {
      setError('El telefono debe tener exactamente 10 digitos');
      return;
    }
    try {
      await clubesAPI.update(selectedClub.id, formData);
      setSuccess('Informacion del club actualizada correctamente');
      handleCloseModal();
      cargarClubes();
    } catch (err) {
      console.error('Error al actualizar club:', err);
      setError(err.response?.data?.message || 'Error al actualizar la informacion del club');
    }
  };

  const handleDeleteClick   = (club) => { setClubToDelete(club); setOpenDeleteModal(true); };
  const handleDeleteCancel  = ()     => { setOpenDeleteModal(false); setClubToDelete(null); };

  const handleDeleteConfirm = async () => {
    try {
      await clubesAPI.delete(clubToDelete.id);
      setSuccess('Club eliminado correctamente');
      setOpenDeleteModal(false);
      setClubToDelete(null);
      cargarClubes();
    } catch (err) {
      console.error('Error al eliminar club:', err);
      setError('Error al eliminar el club');
    }
  };

  const handleOpenAtletasModal = async (club) => {
    setSelectedClubForAtletas(club);
    await cargarAtletasClub(club.id);
    setOpenAtletasModal(true);
  };

  const handleTabChange = (_, newValue) => setActiveTab(newValue);

  // Stats derivadas
  const totalActivos   = clubes.filter((c) => c.estado === 'activo').length;
  const totalInactivos = clubes.filter((c) => c.estado === 'inactivo').length;

  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: C.primary }} />
      </Box>
    );
  }

  // -------------------------------------------------------------------------
  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 }, bgcolor: C.bg, minHeight: '100vh' }}
    >
      {/* Cabecera de página */}
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        align="center"
        gutterBottom
        sx={{ color: C.primary, fontWeight: 'bold', mb: 3 }}
      >
        Gestion de Clubes Deportivos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>
      )}

      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ color: C.primary, fontWeight: 600 }}>
          Total de clubes registrados: {clubes.length}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Los clubes se registran desde el apartado de registro
        </Typography>
      </Box>

      {/* ================================================================== */}
      {/* TABS                                                                */}
      {/* ================================================================== */}
      <Paper sx={{ width: '100%', mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root.Mui-selected': { color: C.primary },
            '& .MuiTabs-indicator': { bgcolor: C.primary },
          }}
        >
          <Tab label="Lista de Clubes" />
          <Tab label="Vista de Tarjetas" />
          <Tab label="Estadisticas" />
        </Tabs>

        <Box sx={{ p: { xs: 1.5, md: 3 } }}>

          {/* TAB 0 — Tabla */}
          {activeTab === 0 && (
            clubes.length === 0 ? <EmptyState mensaje="No hay clubes registrados aun." /> : (
              <TableContainer>
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(128,0,32,0.06)' }}>
                      {['Club', 'Contacto', 'Estado', 'Acciones'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 'bold', color: C.primary }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clubes.map((club) => (
                      <TableRow key={club.id} sx={{ '&:hover': { bgcolor: 'rgba(245,232,199,0.5)' } }}>
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
                        <TableCell><EstadoChip estado={club.estado} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => handleOpenAtletasModal(club)}
                              title="Ver atletas" sx={{ color: C.secondary }}>
                              <PeopleIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleOpenModal(club)}
                              title="Editar" sx={{ color: C.primary }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteClick(club)}
                              title="Eliminar">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 1 — Tarjetas */}
          {activeTab === 1 && (
            clubes.length === 0 ? <EmptyState mensaje="No hay clubes registrados aun." /> : (
              <Grid container spacing={3}>
                {clubes.map((club) => (
                  <Grid item xs={12} sm={6} md={4} key={club.id} sx={{ display: 'flex' }}>
                    <Card sx={{
                      flex: 1, borderRadius: 3, transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0 6px 20px rgba(128,0,32,0.18)' },
                    }}>
                      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                          <Avatar sx={{ bgcolor: C.primary, width: 44, height: 44 }}>
                            <SportsIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                              {club.nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {club.direccion}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 15, color: C.secondary }} />
                            <Typography variant="body2">{club.telefono}</Typography>
                          </Box>
                          {club.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon sx={{ fontSize: 15, color: C.secondary }} />
                              <Typography variant="body2">{club.email}</Typography>
                            </Box>
                          )}
                          {club.descripcion && (
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                              {club.descripcion.substring(0, 100)}{club.descripcion.length > 100 ? '...' : ''}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <EstadoChip estado={club.estado} />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" startIcon={<PeopleIcon />}
                              onClick={() => handleOpenAtletasModal(club)} fullWidth
                              sx={{ borderColor: C.secondary, color: C.secondary,
                                '&:hover': { borderColor: C.primary, color: C.primary, bgcolor: C.bg } }}>
                              Atletas
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<EditIcon />}
                              onClick={() => handleOpenModal(club)} fullWidth
                              sx={{ borderColor: C.primary, color: C.primary,
                                '&:hover': { borderColor: C.primary2, bgcolor: C.bg } }}>
                              Editar
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )
          )}

          {/* TAB 2 — Estadisticas */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ color: C.primary, fontWeight: 'bold', mb: 3 }}>
                      Resumen General
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Total de Clubes',  value: clubes.length,  color: C.primary },
                        { label: 'Clubes Activos',   value: totalActivos,   color: C.green   },
                        { label: 'Clubes Inactivos', value: totalInactivos, color: '#D32F2F' },
                      ].map((stat) => (
                        <Grid item xs={4} key={stat.label}>
                          <Box sx={{
                            textAlign: 'center', p: 2, borderRadius: 2,
                            bgcolor: 'rgba(0,0,0,0.03)', border: `2px solid ${stat.color}22`,
                          }}>
                            <Typography variant="h4" sx={{ color: stat.color, fontWeight: 'bold' }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {stat.label}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={7}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ color: C.primary, fontWeight: 'bold', mb: 2 }}>
                      Clubes por Estado
                    </Typography>
                    {clubes.length === 0 ? <EmptyState mensaje="No hay clubes registrados." /> : (
                      <List disablePadding>
                        {clubes.map((club, i) => (
                          <React.Fragment key={club.id}>
                            <ListItem sx={{ px: 0, py: 1 }}>
                              <ListItemAvatar>
                                <Avatar sx={{
                                  bgcolor: club.estado === 'activo' ? C.green : '#D32F2F',
                                  width: 36, height: 36,
                                }}>
                                  <SportsIcon fontSize="small" />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {club.nombre}
                                  </Typography>
                                }
                                secondary={club.telefono}
                              />
                              <EstadoChip estado={club.estado} />
                            </ListItem>
                            {i < clubes.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* ================================================================== */}
      {/* MODAL: Editar Club — diseño corregido                               */}
      {/* ================================================================== */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <ModalHeader titulo="Editar Club" onClose={handleCloseModal} />

        <Divider />

        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
          {/* Sección: datos principales */}
          <Typography variant="overline" sx={{ color: C.secondary, fontWeight: 700, letterSpacing: 1 }}>
            Datos del Club
          </Typography>

          <Grid container spacing={2.5} sx={{ mt: 0.5, mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Club"
                value={formData.nombre}
                onChange={patchForm('nombre')}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Direccion"
                value={formData.direccion}
                onChange={patchForm('direccion')}
                sx={fieldSx}
              />
            </Grid>
          </Grid>

          {/* Sección: contacto */}
          <Typography variant="overline" sx={{ color: C.secondary, fontWeight: 700, letterSpacing: 1 }}>
            Contacto
          </Typography>

          <Grid container spacing={2.5} sx={{ mt: 0.5, mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefono"
                value={formData.telefono}
                onChange={patchForm('telefono')}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={patchForm('email')}
                sx={fieldSx}
              />
            </Grid>
          </Grid>

          {/* Sección: descripcion y estado */}
          <Typography variant="overline" sx={{ color: C.secondary, fontWeight: 700, letterSpacing: 1 }}>
            Informacion Adicional
          </Typography>

          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripcion"
                multiline
                rows={3}
                value={formData.descripcion}
                onChange={patchForm('descripcion')}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Estado</InputLabel>
                <Select value={formData.estado} onChange={patchForm('estado')} label="Estado">
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            sx={{
              borderColor: C.secondary,
              color: C.secondary,
              '&:hover': { borderColor: C.primary, color: C.primary, bgcolor: C.bg },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ bgcolor: C.primary, fontWeight: 'bold', '&:hover': { bgcolor: C.primary2 } }}
          >
            Actualizar Club
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================================================================== */}
      {/* MODAL: Atletas del Club                                             */}
      {/* ================================================================== */}
      <Dialog
        open={openAtletasModal}
        onClose={() => setOpenAtletasModal(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <ModalHeader
          titulo="Atletas del Club"
          subtitulo={selectedClubForAtletas?.nombre}
          onClose={() => setOpenAtletasModal(false)}
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
            <Grid container spacing={2}>
              {atletasClub.map((atleta) => (
                <Grid item xs={12} sm={6} key={atleta.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.08)',
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
                        { label: 'Genero',  value: atleta.genero || 'N/A' },
                        { label: 'Telefono', value: atleta.telefono || 'N/A' },
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
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenAtletasModal(false)}
            variant="outlined"
            sx={{
              borderColor: C.secondary,
              color: C.secondary,
              '&:hover': { borderColor: C.primary, color: C.primary, bgcolor: C.bg },
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================================================================== */}
      {/* MODAL: Confirmar Eliminacion                                        */}
      {/* ================================================================== */}
      <Dialog
        open={openDeleteModal}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <ModalHeader titulo="Confirmar Eliminacion" onClose={handleDeleteCancel} />
        <Divider />

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="body1" sx={{ mb: 1.5 }}>
            Estas seguro de que deseas eliminar el club{' '}
            <Box component="span" sx={{ fontWeight: 'bold', color: C.primary }}>
              "{clubToDelete?.nombre}"
            </Box>
            ?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Esta accion no se puede deshacer. Se eliminara permanentemente el club y todos sus datos asociados.
          </Typography>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{
              borderColor: C.secondary,
              color: C.secondary,
              '&:hover': { borderColor: C.primary, color: C.primary, bgcolor: C.bg },
            }}
          >
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

export default GestionClubesAdmin;