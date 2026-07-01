import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Container,
  Modal,
  IconButton,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Input,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const GestionAtletas = () => {
  const [atletas, setAtletas] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [filtroClub, setFiltroClub] = useState('');
  const [verIndependientes, setVerIndependientes] = useState(false);
  const [formData, setFormData] = useState({
    cuarto: '', // Nombre del atleta
    estado: 'Disponible',
    horario: '', // Fecha de nacimiento
    imagenes: [],
    existingImages: [],
    id_hoteles: '', // Club
    preciohora: '',
    preciodia: '',
    precionoche: '',
    preciosemana: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchClubes();
  }, []);

  useEffect(() => {
    fetchAtletas();
  }, [filtroClub, verIndependientes]);

  const fetchAtletas = async () => {
  try {
    let url = 'http://localhost:5000/api/atletas';
    if (verIndependientes) {
      url += '?independientes=true';
    } else if (filtroClub) {
      url += `?clubId=${filtroClub}`;
    }
    const response = await axios.get(url);
    const listaAtletas = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.atletas)
        ? response.data.atletas
        : [];
    setAtletas(listaAtletas);
    setErrorMessage('');
  } catch (error) {
    console.error('Error al obtener atletas:', error);
    setErrorMessage('Error al cargar los atletas. Intente de nuevo.');
    setAtletas([]);
  }
};

const fetchClubes = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/clubes');
    const listaClubes = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.clubes)
        ? response.data.clubes
        : [];
    setClubes(listaClubes);
  } catch (error) {
    console.error('Error al obtener clubes:', error);
    setErrorMessage('Error al cargar los clubes. Intente de nuevo.');
    setClubes([]);
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      imagenes: [...formData.imagenes, ...files],
    });
  };

  const handleRemoveImage = (index, isExisting) => {
    if (isExisting) {
      setFormData({
        ...formData,
        existingImages: formData.existingImages.filter((_, i) => i !== index),
      });
    } else {
      setFormData({
        ...formData,
        imagenes: formData.imagenes.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('cuarto', formData.cuarto); // Nombre del atleta
    formDataToSend.append('estado', formData.estado);
    formDataToSend.append('horario', formData.horario); // Fecha de nacimiento
    formDataToSend.append('id_hoteles', formData.id_hoteles); // Club
    formDataToSend.append('preciohora', formData.preciohora || '');
    formDataToSend.append('preciodia', formData.preciodia || '');
    formDataToSend.append('precionoche', formData.precionoche || '');
    formDataToSend.append('preciosemana', formData.preciosemana || '');

    const originalImages = editingId ? parseImagesSafely(atletas.find(c => c.id === editingId)?.imagenes) : [];
    const imagesToRemove = originalImages
      .map((img, index) => (formData.existingImages.includes(img) ? -1 : index))
      .filter(index => index !== -1);
    if (imagesToRemove.length > 0) {
      formDataToSend.append('imagesToRemove', JSON.stringify(imagesToRemove));
    }

    formData.imagenes.forEach((image) => {
      formDataToSend.append('imagenes', image);
    });

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/atletas/${editingId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post('http://localhost:5000/api/atletas', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchAtletas();
      resetForm();
      setOpenModal(false);
    } catch (error) {
      console.error('Error al guardar atleta:', error);
      setErrorMessage(error.response?.data || 'Error al guardar el atleta. Intente de nuevo.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este atleta?')) {
      try {
        await axios.delete(`http://localhost:5000/api/atletas/${id}`);
        fetchAtletas();
        setErrorMessage('');
      } catch (error) {
        console.error('Error al eliminar atleta:', error);
        setErrorMessage(error.response?.data || 'Error al eliminar el atleta. Intente de nuevo.');
      }
    }
  };

  const handleEdit = (atleta) => {
    const existingImages = parseImagesSafely(atleta.imagenes);
    setFormData({
      cuarto: atleta.cuarto, // Nombre del atleta
      estado: atleta.estado,
      horario: atleta.horario ? new Date(atleta.horario).toISOString().slice(0, 16) : '', // Fecha de nacimiento
      imagenes: [],
      existingImages,
      id_hoteles: atleta.id_hoteles, // Club
      preciohora: atleta.preciohora || '',
      preciodia: atleta.preciodia || '',
      precionoche: atleta.precionoche || '',
      preciosemana: atleta.preciosemana || '',
    });
    setEditingId(atleta.id);
    setOpenModal(true);
  };

  const resetForm = () => {
    setFormData({
      cuarto: '',
      estado: 'Disponible',
      horario: '',
      imagenes: [],
      existingImages: [],
      id_hoteles: '',
      preciohora: '',
      preciodia: '',
      precionoche: '',
      preciosemana: '',
    });
    setEditingId(null);
    setOpenModal(false);
  };

  const parseImagesSafely = (imagenes) => {
    try {
      if (!imagenes) return [];
      return JSON.parse(imagenes);
    } catch (error) {
      console.error('Error al parsear imágenes:', error.message);
      return [];
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: '#e4e4e5', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
        Gestión de Atletas
      </Typography>

      {/* Filtros de club e independientes */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por Club</InputLabel>
          <Select
            value={filtroClub}
            onChange={e => { setFiltroClub(e.target.value); setVerIndependientes(false); }}
            label="Filtrar por Club"
          >
            <MenuItem value="">Todos</MenuItem>
            {clubes.map(club => (
              <MenuItem key={club._id} value={club._id}>{club.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Checkbox checked={verIndependientes} onChange={e => { setVerIndependientes(e.target.checked); setFiltroClub(''); }} />}
          label="Ver solo independientes"
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{
            background: '#800020',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            '&:hover': {
              background: '#7A4069',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(122, 64, 105, 0.3)',
            },
          }}
        >
          Agregar Atleta
        </Button>
      </Box>

      {errorMessage && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        </Box>
      )}

      <Modal open={openModal} onClose={resetForm}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', md: 600 },
            bgcolor: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            p: 4,
            borderRadius: 2,
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '2px solid #EEEEEE',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              color: '#800020',
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 3,
              fontFamily: "'Arial', 'Helvetica', sans-serif",
            }}
          >
            {editingId ? 'Editar Atleta' : 'Agregar Atleta'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            <TextField
              label="Nombre del Atleta"
              name="cuarto"
              type="text"
              value={formData.cuarto}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              required
              inputProps={{ pattern: "[A-Za-z0-9 ]+" }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#FAFAFF',
                  '&:hover fieldset': {
                    borderColor: '#7A4069',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7A4069',
                    boxShadow: '0 0 8px rgba(122, 64, 105, 0.3)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#7A4069',
                  fontWeight: '500',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#7A4069',
                },
              }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#7A4069', fontWeight: '500', '&.Mui-focused': { color: '#7A4069' } }}>
                Estado
              </InputLabel>
              <Select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                variant="outlined"
                required
                sx={{
                  borderRadius: '8px',
                  backgroundColor: '#FAFAFF',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7A4069',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7A4069',
                    boxShadow: '0 0 8px rgba(122, 64, 105, 0.3)',
                  },
                }}
              >
                <MenuItem value="Disponible">Disponible</MenuItem>
                <MenuItem value="NoDisponible">No Disponible</MenuItem>
                <MenuItem value="Ocupado">Ocupado</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha de Nacimiento"
              name="horario"
              type="date"
              value={formData.horario}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#FAFAFF',
                  '&:hover fieldset': {
                    borderColor: '#7A4069',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7A4069',
                    boxShadow: '0 0 8px rgba(122, 64, 105, 0.3)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#7A4069',
                  fontWeight: '500',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#7A4069',
                },
              }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#7A4069', fontWeight: '500', '&.Mui-focused': { color: '#7A4069' } }}>
                Club
              </InputLabel>
              <Select
                name="id_hoteles"
                value={formData.id_hoteles}
                onChange={handleInputChange}
                variant="outlined"
                required
                disabled={editingId !== null}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: '#FAFAFF',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7A4069',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7A4069',
                    boxShadow: '0 0 8px rgba(122, 64, 105, 0.3)',
                  },
                }}
              >
                {clubes.map((club) => (
                  <MenuItem key={club._id} value={club._id}>
                    {club.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {[
              { label: 'Precio por Hora', name: 'preciohora', type: 'number', inputProps: { step: '0.01', min: 0 } },
              { label: 'Precio por Día', name: 'preciodia', type: 'number', inputProps: { step: '0.01', min: 0 } },
              { label: 'Precio por Noche', name: 'precionoche', type: 'number', inputProps: { step: '0.01', min: 0 } },
              { label: 'Precio por Semana', name: 'preciosemana', type: 'number', inputProps: { step: '0.01', min: 0 } },
            ].map(({ label, name, type, inputProps }) => (
              <TextField
                key={name}
                label={label}
                name={name}
                type={type}
                value={formData[name] || ''}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
                inputProps={inputProps}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#FAFAFF',
                    '&:hover fieldset': {
                      borderColor: '#7A4069',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#7A4069',
                      boxShadow: '0 0 8px rgba(122, 64, 105, 0.3)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#7A4069',
                    fontWeight: '500',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#7A4069',
                  },
                }}
              />
            ))}
            <Box sx={{ mb: 2, gridColumn: '1 / -1' }}>
              <InputLabel sx={{ color: '#7A4069', fontWeight: '500', mb: 1 }}>
                Imágenes (puede subir varias)
              </InputLabel>
              <Input
                type="file"
                name="imagenes"
                onChange={handleImageChange}
                inputProps={{ multiple: true, accept: 'image/*' }}
                fullWidth
                sx={{
                  backgroundColor: '#FAFAFF',
                  borderRadius: '8px',
                  padding: '8px',
                }}
              />
              {(formData.existingImages.length > 0 || formData.imagenes.length > 0) && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {formData.existingImages.map((image, index) => (
                    <Box key={`existing-${index}`} sx={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={`data:image/jpeg;base64,${image}`}
                        alt={`Imagen existente ${index + 1}`}
                        style={{
                          height: '64px',
                          width: '64px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index, true)}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          color: 'white',
                          backgroundColor: 'rgba(211, 47, 47, 0.7)',
                          '&:hover': { backgroundColor: 'rgba(211, 47, 47, 1)' },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {formData.imagenes.map((image, index) => (
                    <Box key={`new-${index}`} sx={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Vista previa ${index + 1}`}
                        style={{
                          height: '64px',
                          width: '64px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index, false)}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          color: 'white',
                          backgroundColor: 'rgba(211, 47, 47, 0.7)',
                          '&:hover': { backgroundColor: 'rgba(211, 47, 47, 1)' },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  mt: 1,
                  background: '#800020',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 'bold',
                  fontFamily: "'Arial', 'Helvetica', sans-serif",
                  '&:hover': {
                    background: '#7A4069',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(122, 64, 105, 0.3)',
                  },
                }}
              >
                {editingId ? 'Actualizar' : 'Agregar'}
              </Button>
              <Button
                variant="contained"
                sx={{
                  mt: 1,
                  background: '#7A4069',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 'bold',
                  fontFamily: "'Arial', 'Helvetica', sans-serif",
                  '&:hover': {
                    background: '#D32F2F',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                  },
                }}
                onClick={resetForm}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      <Paper
        elevation={3}
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          background: '#FFFFFF',
        }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="atletas table">
          <TableHead sx={{ backgroundColor: '#e4e4e5' }}>
            <TableRow>
              {['Nombre', 'Estado', 'Fecha de Nacimiento', 'Club', 'Precio/Hora', 'Precio/Día', 'Precio/Noche', 'Precio/Semana', 'Imágenes', 'Acciones'].map(
                (head) => (
                  <TableCell
                    key={head}
                    sx={{
                      fontWeight: 'bold',
                      color: '#800020',
                      fontSize: '1rem',
                      padding: '16px',
                      fontFamily: "'Arial', 'Helvetica', sans-serif",
                    }}
                  >
                    {head}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {atletas.map((atleta) => (
              <TableRow
                key={atleta._id}
                sx={{
                  '&:hover': { backgroundColor: '#FAFAFF' },
                  transition: 'background-color 0.3s',
                  backgroundColor: atleta.estado === 'NoDisponible' || atleta.estado === 'Ocupado' ? '#FFE0E0' : 'inherit',
                  fontFamily: "'Arial', 'Helvetica', sans-serif",
                }}
              >
                <TableCell sx={{ color: '#333333' }}>{atleta.cuarto || atleta.nombre}</TableCell>
                <TableCell sx={{ color: '#333333', fontWeight: atleta.estado !== 'Disponible' ? 'bold' : 'normal' }}>
                  {atleta.estado}
                </TableCell>
                <TableCell sx={{ color: '#333333' }}>{atleta.horario ? new Date(atleta.horario).toLocaleDateString() : 'Sin fecha'}</TableCell>
                <TableCell sx={{ color: '#333333' }}>
                  {atleta.clubId
                    ? (clubes.find(c => c._id === atleta.clubId)?.nombre || 'Club desconocido')
                    : 'Independiente'}
                </TableCell>
                <TableCell sx={{ color: '#333333' }}>{atleta.preciohora ? `$${atleta.preciohora.toFixed(2)}` : 'No definido'}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{atleta.preciodia ? `$${atleta.preciodia.toFixed(2)}` : 'No definido'}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{atleta.precionoche ? `$${atleta.precionoche.toFixed(2)}` : 'No definido'}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{atleta.preciosemana ? `$${atleta.preciosemana.toFixed(2)}` : 'No definido'}</TableCell>
                <TableCell>
                  {(() => {
                    const images = parseImagesSafely(atleta.imagenes);
                    if (images.length > 0) {
                      return (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {images.map((img, index) => (
                            <img
                              key={index}
                              src={`data:image/jpeg;base64,${img}`}
                              alt={`Imagen ${index + 1}`}
                              style={{
                                height: '64px',
                                width: '64px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              }}
                            />
                          ))}
                        </Box>
                      );
                    }
                    return (
                      <Typography color="textSecondary" sx={{ fontStyle: 'italic', color: '#7A4069' }}>
                        Sin imágenes
                      </Typography>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(atleta)}
                    sx={{
                      mr: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(128, 0, 32, 0.1)',
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(atleta._id)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default GestionAtletas;