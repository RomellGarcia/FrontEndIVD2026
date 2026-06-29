import React, { useState, useEffect } from 'react';
import {
  Box, Button, Container, Table, TableBody, TableCell, TableHead, TableRow,
  Paper, TextField, Typography, IconButton, CircularProgress, Alert, MenuItem,
  Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Pagination,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Close as CloseIcon, Event as EventIcon, CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#F5E8C7';

const fieldSx = {
  '& .MuiInputLabel-root': { color: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: BURGUNDY },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FAFAFA', borderRadius: 2,
    '& fieldset': { borderColor: '#ddd' },
    '&:hover fieldset': { borderColor: BURGUNDY },
    '&.Mui-focused fieldset': { borderColor: BURGUNDY },
  },
};

const Convocatoria = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', fecha: null, descripcion: '', estado: 'abierta' });
  const [editIndex, setEditIndex] = useState(null);
  const [page, setPage] = useState(1);
  const porPagina = 8;

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    fetchConvocatorias();
  }, [user, navigate]);

  const fetchConvocatorias = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/convocatorias?clubId=${user.id}`);
      setConvocatorias(response.data.convocatorias || []);
      setError('');
    } catch {
      setError('Error al cargar las convocatorias.');
    } finally { setLoading(false); }
  };

  const handleAddOrEdit = async () => {
    try {
      const url = editIndex !== null
        ? `http://localhost:5000/api/convocatorias/${convocatorias[editIndex]._id || convocatorias[editIndex].id}`
        : `http://localhost:5000/api/convocatorias`;
      const method = editIndex !== null ? 'put' : 'post';
      await axios({ method, url, data: { ...formData, clubId: user.id } });
      handleCloseModal();
      fetchConvocatorias();
      Swal.fire({
        icon: 'success',
        title: editIndex !== null ? 'Convocatoria actualizada' : 'Convocatoria creada',
        confirmButtonColor: BURGUNDY,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      setError('Error al guardar la convocatoria.');
    }
  };

  const handleDelete = async (index) => {
    const result = await Swal.fire({
      title: '¿Eliminar convocatoria?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: BURGUNDY,
      cancelButtonColor: PURPLE,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:5000/api/convocatorias/${convocatorias[index]._id || convocatorias[index].id}`);
      setConvocatorias(prev => prev.filter((_, i) => i !== index));
    } catch {
      setError('Error al eliminar la convocatoria.');
    }
  };

  const handleOpenModal = (index = null) => {
    if (index !== null) {
      setFormData({ ...convocatorias[index] });
      setEditIndex(index);
    } else {
      setFormData({ nombre: '', fecha: null, descripcion: '', estado: 'abierta' });
      setEditIndex(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData({ nombre: '', fecha: null, descripcion: '', estado: 'abierta' });
    setEditIndex(null);
  };

  const fmt = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const convocatoriasPaginadas = convocatorias.slice((page - 1) * porPagina, page * porPagina);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: CREAM }}>
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 } }}>

        {/* ── Header ── */}
        <Typography variant="h4" sx={{ color: BURGUNDY, fontWeight: 800, textAlign: 'center', mb: .5 }}>
          Gestión de Convocatorias
        </Typography>
        <Typography variant="body1" sx={{ color: PURPLE, textAlign: 'center', mb: 4, opacity: .8 }}>
          Administra las convocatorias de tu club
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Botón agregar */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              bgcolor: BURGUNDY, borderRadius: 2,
              textTransform: 'none', fontWeight: 600,
              '&:hover': { bgcolor: '#600018' },
            }}
          >
            Nueva Convocatoria
          </Button>
        </Box>

        {/* Tabla */}
        {convocatorias.length === 0 ? (
          <Paper sx={{ borderRadius: 3, textAlign: 'center', py: 6, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <Avatar sx={{ bgcolor: `${PURPLE}14`, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <EventIcon sx={{ fontSize: 32, color: PURPLE }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: PURPLE }}>Sin convocatorias</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: .5, mb: 3 }}>
              Crea tu primera convocatoria para invitar atletas a participar
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}
              sx={{ bgcolor: BURGUNDY, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#600018' } }}>
              Crear Convocatoria
            </Button>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: `${BURGUNDY}08` }}>
                  {['Nombre', 'Fecha', 'Descripción', 'Estado', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: BURGUNDY, py: 2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {convocatoriasPaginadas.map((conv, index) => {
                  const realIndex = (page - 1) * porPagina + index;
                  return (
                    <TableRow key={conv._id || conv.id || index} hover sx={{ '&:hover': { bgcolor: `${CREAM}66` } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: BURGUNDY, width: 36, height: 36 }}>
                            <EventIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                            {conv.nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                          <CalendarIcon sx={{ fontSize: 14, color: BURGUNDY }} />
                          {fmt(conv.fecha)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#555', maxWidth: 250 }}>
                          {conv.descripcion ? (conv.descripcion.length > 60 ? conv.descripcion.substring(0, 60) + '...' : conv.descripcion) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={conv.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                          color={conv.estado === 'abierta' ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '.72rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: .5 }}>
                          <IconButton size="small" onClick={() => handleOpenModal(realIndex)}
                            sx={{ color: BURGUNDY, '&:hover': { bgcolor: `${BURGUNDY}08` } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(realIndex)}
                            sx={{ color: '#D32F2F', '&:hover': { bgcolor: 'rgba(211,47,47,.08)' } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {convocatorias.length > porPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #eee' }}>
                <Pagination
                  count={Math.ceil(convocatorias.length / porPagina)}
                  page={page} onChange={(e, v) => setPage(v)}
                  sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: BURGUNDY, color: '#fff' } }}
                />
              </Box>
            )}
          </Paper>
        )}
      </Container>

      {/* Modal Crear/Editar */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: BURGUNDY, width: 36, height: 36 }}>
                  {editIndex !== null ? <EditIcon sx={{ fontSize: 20 }} /> : <AddIcon sx={{ fontSize: 20 }} />}
                </Avatar>
                <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 700 }}>
                  {editIndex !== null ? 'Editar Convocatoria' : 'Nueva Convocatoria'}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseModal} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                fullWidth label="Nombre" value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                sx={fieldSx}
              />
              <DatePicker
                label="Fecha"
                value={formData.fecha ? new Date(formData.fecha) : null}
                onChange={(v) => setFormData({ ...formData, fecha: v })}
                slotProps={{ textField: { fullWidth: true, sx: fieldSx } }}
              />
              <TextField
                fullWidth label="Descripción" value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                multiline rows={3} sx={fieldSx}
              />
              <TextField
                fullWidth select label="Estado" value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                sx={fieldSx}
              >
                <MenuItem value="abierta">Abierta</MenuItem>
                <MenuItem value="cerrada">Cerrada</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseModal} variant="outlined"
              sx={{ color: PURPLE, borderColor: PURPLE, textTransform: 'none', fontWeight: 600 }}>
              Cancelar
            </Button>
            <Button onClick={handleAddOrEdit} variant="contained"
              sx={{ bgcolor: BURGUNDY, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#600018' } }}>
              {editIndex !== null ? 'Guardar Cambios' : 'Crear Convocatoria'}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
};

export default Convocatoria;