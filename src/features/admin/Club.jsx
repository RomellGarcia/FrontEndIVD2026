import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Sports as SportsIcon,
} from '@mui/icons-material';
import { clubesAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Paleta — consistente con el resto del sistema
// ---------------------------------------------------------------------------
const C = {
  primary:   '#800020',
  primary2:  '#600018',
  secondary: '#7A4069',
  bg:        '#e4e4e5',
  green:     '#2E7D32',
};

// ---------------------------------------------------------------------------
// Formulario vacío — campos del schema PostgreSQL del IVD
// ---------------------------------------------------------------------------
const FORM_EMPTY = {
  nombre:      '',
  direccion:   '',
  telefono:    '',
  email:       '',
  descripcion: '',
  estado:      'activo',
  imagen_url:  '',   // URL de Cloudinary (opcional)
};

// ---------------------------------------------------------------------------
// Sub-componentes reutilizables
// ---------------------------------------------------------------------------
const EmptyState = ({ mensaje }) => (
  <Box sx={{ py: 6, textAlign: 'center' }}>
    <Typography variant="body1" sx={{ color: C.secondary }}>
      {mensaje}
    </Typography>
  </Box>
);

const EstadoChip = ({ estado }) => (
  <Chip
    label={estado === 'activo' ? 'Activo' : 'Inactivo'}
    color={estado === 'activo' ? 'success' : 'error'}
    size="small"
  />
);

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const GestionClubesClub = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [clubes, setClubes]           = useState([]);

  // Modales
  const [openFormModal, setOpenFormModal]     = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // Selección activa
  const [editingClub, setEditingClub]   = useState(null);   // null = modo creación
  const [clubToDelete, setClubToDelete] = useState(null);

  // Formulario
  const [formData, setFormData]         = useState(FORM_EMPTY);
  const [imagePreview, setImagePreview] = useState(null);

  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!user || (user.rol !== 'admin' && user.rol !== 'club')) {
      navigate('/login');
      return;
    }
    cargarClubes();
  }, [user, navigate]);

  // -------------------------------------------------------------------------
  // Carga de datos — API layer centralizado
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
      setError('Error al cargar los clubes. Intente de nuevo.');
      setClubes([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Helpers de formulario
  // -------------------------------------------------------------------------
  const patchForm = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // La imagen se sube a Cloudinary desde el backend al hacer POST/PUT
    // Aquí solo se guarda el archivo para enviarlo con FormData
    setFormData((prev) => ({ ...prev, _imagenFile: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setFormData(FORM_EMPTY);
    setImagePreview(null);
    setEditingClub(null);
    setOpenFormModal(false);
  };

  // -------------------------------------------------------------------------
  // Abrir modal — creación
  // -------------------------------------------------------------------------
  const handleAbrirCrear = () => {
    setFormData(FORM_EMPTY);
    setImagePreview(null);
    setEditingClub(null);
    setOpenFormModal(true);
  };

  // -------------------------------------------------------------------------
  // Abrir modal — edición
  // -------------------------------------------------------------------------
  const handleAbrirEditar = (club) => {
    setFormData({
      nombre:      club.nombre      || '',
      direccion:   club.direccion   || '',
      telefono:    club.telefono    || '',
      email:       club.email       || '',
      descripcion: club.descripcion || '',
      estado:      club.estado      || 'activo',
      imagen_url:  club.imagen_url  || '',
    });
    // Si el club ya tiene imagen en Cloudinary, mostrarla como preview
    setImagePreview(club.imagen_url || null);
    setEditingClub(club);
    setOpenFormModal(true);
  };

  // -------------------------------------------------------------------------
  // Guardar (crear o editar)
  // -------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!formData.nombre || !formData.direccion || !formData.telefono) {
      setError('Nombre, direccion y telefono son obligatorios');
      return;
    }
    const telefonoLimpio = formData.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length !== 10) {
      setError('El telefono debe tener exactamente 10 digitos');
      return;
    }

    // Si hay archivo de imagen, usar FormData para que el backend lo suba a Cloudinary
    let payload;
    if (formData._imagenFile instanceof File) {
      payload = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (key !== '_imagenFile' && val !== null && val !== undefined) {
          payload.append(key, val);
        }
      });
      payload.append('imagen', formData._imagenFile);
    } else {
      // Sin imagen nueva — JSON plano
      const { _imagenFile, ...rest } = formData;
      payload = rest;
    }

    try {
      if (editingClub) {
        await clubesAPI.update(editingClub.id, payload);
        setSuccess('Club actualizado correctamente');
      } else {
        await clubesAPI.create(payload);
        setSuccess('Club agregado correctamente');
      }
      resetForm();
      cargarClubes();
      setError('');
    } catch (err) {
      console.error('Error al guardar club:', err);
      setError(err.response?.data?.message || 'Error al guardar el club. Intente de nuevo.');
    }
  };

  // -------------------------------------------------------------------------
  // Eliminación — con modal de confirmación (sin window.confirm)
  // -------------------------------------------------------------------------
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
      setError('Error al eliminar el club. Verifique las dependencias o intente de nuevo.');
      setOpenDeleteModal(false);
    }
  };

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
      {/* Cabecera */}
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        align="center"
        gutterBottom
        sx={{ color: C.primary, fontWeight: 'bold', mb: 3 }}
      >
        Gestion de Clubes
      </Typography>

      {/* Alertas */}
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

      {/* Barra de acciones */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="subtitle1" sx={{ color: C.primary, fontWeight: 600 }}>
          Total de clubes: {clubes.length}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAbrirCrear}
          sx={{
            bgcolor: C.primary,
            borderRadius: 2,
            fontWeight: 'bold',
            px: 3,
            '&:hover': { bgcolor: C.primary2 },
          }}
        >
          Agregar Club
        </Button>
      </Box>

      {/* ================================================================== */}
      {/* TABLA                                                               */}
      {/* ================================================================== */}
      <Paper
        elevation={2}
        sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#fff' }}
      >
        {clubes.length === 0 ? (
          <EmptyState mensaje="No hay clubes registrados aun. Agrega el primero con el boton de arriba." />
        ) : (
          <TableContainer>
            <Table size={isMobile ? 'small' : 'medium'} aria-label="tabla de clubes">
              <TableHead sx={{ bgcolor: 'rgba(128,0,32,0.07)' }}>
                <TableRow>
                  {['Club', 'Contacto', 'Descripcion', 'Imagen', 'Estado', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 'bold', color: C.primary }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {clubes.map((club) => (
                  <TableRow
                    key={club.id}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(245,232,199,0.5)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {/* Club */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: C.secondary, width: 36, height: 36 }}>
                          <SportsIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: C.primary }}>
                            {club.nombre}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {club.direccion || 'Sin direccion'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Contacto */}
                    <TableCell>
                      <Typography variant="body2">{club.telefono || '—'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {club.email || '—'}
                      </Typography>
                    </TableCell>

                    {/* Descripcion */}
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 220 }}>
                        {club.descripcion
                          ? club.descripcion.substring(0, 80) + (club.descripcion.length > 80 ? '...' : '')
                          : 'Sin descripcion'}
                      </Typography>
                    </TableCell>

                    {/* Imagen — Cloudinary URL */}
                    <TableCell>
                      {club.imagen_url ? (
                        <Box
                          component="img"
                          src={club.imagen_url}
                          alt={club.nombre}
                          sx={{
                            width: 56,
                            height: 56,
                            objectFit: 'cover',
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: C.secondary, fontStyle: 'italic' }}>
                          Sin imagen
                        </Typography>
                      )}
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <EstadoChip estado={club.estado} />
                    </TableCell>

                    {/* Acciones */}
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleAbrirEditar(club)}
                          title="Editar club"
                          sx={{ color: C.primary, '&:hover': { bgcolor: 'rgba(128,0,32,0.08)' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(club)}
                          title="Eliminar club"
                          sx={{ '&:hover': { bgcolor: 'rgba(211,47,47,0.08)' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ================================================================== */}
      {/* MODAL: Crear / Editar Club                                          */}
      {/* ================================================================== */}
      <Dialog
        open={openFormModal}
        onClose={resetForm}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: C.primary, fontWeight: 'bold' }}>
              {editingClub ? 'Editar Club' : 'Agregar Club'}
            </Typography>
            <IconButton onClick={resetForm}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2.5,
              pt: 1,
            }}
          >
            {/* Nombre */}
            <TextField
              label="Nombre del Club"
              value={formData.nombre}
              onChange={patchForm('nombre')}
              required
              fullWidth
              sx={fieldSx}
            />

            {/* Telefono */}
            <TextField
              label="Telefono"
              value={formData.telefono}
              onChange={patchForm('telefono')}
              required
              fullWidth
              sx={fieldSx}
            />

            {/* Direccion — fila completa */}
            <TextField
              label="Direccion"
              value={formData.direccion}
              onChange={patchForm('direccion')}
              required
              fullWidth
              sx={{ ...fieldSx, gridColumn: '1 / -1' }}
            />

            {/* Email */}
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={patchForm('email')}
              fullWidth
              sx={fieldSx}
            />

            {/* Estado */}
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.estado}
                onChange={patchForm('estado')}
                label="Estado"
              >
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </Select>
            </FormControl>

            {/* Descripcion — fila completa */}
            <TextField
              label="Descripcion"
              value={formData.descripcion}
              onChange={patchForm('descripcion')}
              multiline
              rows={3}
              fullWidth
              sx={{ ...fieldSx, gridColumn: '1 / -1' }}
            />

            {/* Imagen — Cloudinary via backend */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body2" sx={{ color: C.secondary, fontWeight: 600, mb: 1 }}>
                Imagen del Club
              </Typography>
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{
                  borderColor: C.secondary,
                  color: C.secondary,
                  '&:hover': { borderColor: C.primary, color: C.primary, bgcolor: C.bg },
                }}
              >
                Seleccionar imagen
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </Button>
              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Vista previa"
                  sx={{
                    display: 'block',
                    mt: 2,
                    width: 100,
                    height: 100,
                    objectFit: 'cover',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={resetForm} sx={{ color: C.secondary }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              bgcolor: C.primary,
              fontWeight: 'bold',
              '&:hover': { bgcolor: C.primary2 },
            }}
          >
            {editingClub ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================================================================== */}
      {/* MODAL: Confirmar Eliminacion                                        */}
      {/* ================================================================== */}
      <Dialog open={openDeleteModal} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: C.primary, fontWeight: 'bold' }}>
            Confirmar Eliminacion
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Estas seguro de que deseas eliminar el club{' '}
            <strong>"{clubToDelete?.nombre}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Esta accion no se puede deshacer. Se eliminara permanentemente el club y todos sus datos asociados.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleDeleteCancel} sx={{ color: C.secondary }}>
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

// ---------------------------------------------------------------------------
// Estilos compartidos para los TextField del formulario
// ---------------------------------------------------------------------------
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#FAFAFF',
    '&:hover fieldset': { borderColor: '#7A4069' },
    '&.Mui-focused fieldset': { borderColor: '#7A4069' },
  },
  '& .MuiInputLabel-root':            { color: '#7A4069' },
  '& .MuiInputLabel-root.Mui-focused':{ color: '#7A4069' },
};

export default GestionClubesClub;