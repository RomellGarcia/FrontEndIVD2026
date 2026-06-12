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
  InputLabel,
  Input,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const GestionClubes = () => {
  const [clubes, setClubes] = useState([]);
  const [formData, setFormData] = useState({
    nombrehotel: '', // Nombre del club
    direccion: '',
    telefono: '',
    correo: '',
    numhabitacion: '', // Número de miembros
    descripcion: '',
    servicios: '', // Deportes o actividades
    imagen: null,
    removeImage: false, // Para manejar la eliminación de la imagen
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchClubes();
  }, []);

  const fetchClubes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/clubes');
      const clubesData = response.data.map(club => {
        let imagenParsed = null;
        try {
          if (club.imagen) {
            imagenParsed = JSON.parse(club.imagen);
          }
        } catch (error) {
          console.error(`Error al parsear imagen del club ${club.id}:`, error);
          imagenParsed = null;
        }
        return {
          ...club,
          id: club.id,
          imagen: imagenParsed
        };
      });
      setClubes(clubesData);
      setErrorMessage('');
    } catch (error) {
      console.error('Error al obtener clubes:', error);
      setErrorMessage('Error al cargar los clubes. Intente de nuevo.');
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
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imagen: file,
        removeImage: false, // Resetear la opción de eliminar al subir una nueva imagen
      });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImageChange = (e) => {
    setFormData({
      ...formData,
      removeImage: e.target.checked,
      imagen: null, // Resetear la imagen si se marca eliminar
    });
    if (e.target.checked) {
      setImagePreview(null); // Limpiar la vista previa
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formato de teléfono (exactamente 10 dígitos)
    const telefonoLimpio = formData.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length !== 10) {
      setErrorMessage('El teléfono debe tener exactamente 10 dígitos.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('nombrehotel', formData.nombrehotel); // Nombre del club
    formDataToSend.append('direccion', formData.direccion);
    formDataToSend.append('telefono', formData.telefono);
    formDataToSend.append('correo', formData.correo);
    formDataToSend.append('numhabitacion', formData.numhabitacion); // Número de miembros
    formDataToSend.append('descripcion', formData.descripcion);
    formDataToSend.append('servicios', formData.servicios); // Deportes o actividades
    formDataToSend.append('removeImage', formData.removeImage);
    if (formData.imagen instanceof File) {
      formDataToSend.append('imagen', formData.imagen);
    }

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/clubes/${editingId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
                  await axios.post('http://localhost:5000/api/clubes', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchClubes();
      resetForm();
      setOpenModal(false);
    } catch (error) {
      console.error('Error al guardar club:', error);
      setErrorMessage(error.response?.data || 'Error al guardar el club. Intente de nuevo.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este club?')) {
      try {
        await axios.delete(`http://localhost:5000/api/clubes/${id}`);
        fetchClubes();
        setErrorMessage('');
      } catch (error) {
        console.error('Error al eliminar club:', error);
        setErrorMessage('Error al eliminar el club. Verifique las dependencias o intente de nuevo.');
      }
    }
  };

  const handleEdit = (club) => {
    setFormData({
      nombrehotel: club.nombrehotel || '', // Nombre del club
      direccion: club.direccion || '',
      telefono: club.telefono || '',
      correo: club.correo || '',
      numhabitacion: club.numhabitacion || '', // Número de miembros
      descripcion: club.descripcion || '',
      servicios: club.servicios || '', // Deportes o actividades
      imagen: null,
      removeImage: false,
    });
    setImagePreview(club.imagen && club.imagen.data ? `data:${club.imagen.mimeType};base64,${club.imagen.data}` : null);
    setEditingId(club.id);
    setOpenModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombrehotel: '',
      direccion: '',
      telefono: '',
      correo: '',
      numhabitacion: '',
      descripcion: '',
      servicios: '',
      imagen: null,
      removeImage: false,
    });
    setImagePreview(null);
    setEditingId(null);
    setOpenModal(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
        Gestión de Clubes
      </Typography>

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
            '&:hover': {
              background: '#7A4069',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(122, 64, 105, 0.3)',
            },
          }}
        >
          Agregar Club
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
            }}
          >
            {editingId ? 'Editar Club' : 'Agregar Club'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            {[
              { label: 'Nombre del Club', name: 'nombrehotel', type: 'text' },
              { label: 'Dirección', name: 'direccion', type: 'text' },
              { label: 'Teléfono', name: 'telefono', type: 'text' },
              { label: 'Correo', name: 'correo', type: 'email' },
              { label: 'Número de Miembros', name: 'numhabitacion', type: 'number', inputProps: { min: 0 } },
              { label: 'Deportes o Actividades', name: 'servicios', type: 'text' },
            ].map(({ label, name, type, inputProps }) => (
              <TextField
                key={name}
                label={label}
                name={name}
                type={type}
                value={formData[name]}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
                required={['nombrehotel', 'correo', 'numhabitacion'].includes(name)}
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
            <TextField
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              sx={{
                mb: 2,
                gridColumn: '1 / -1',
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
            <Box sx={{ mb: 2, gridColumn: '1 / -1' }}>
              <InputLabel sx={{ color: '#7A4069', fontWeight: '500', mb: 1 }}>
                Imagen del Club
              </InputLabel>
              <Input
                type="file"
                name="imagen"
                onChange={handleImageChange}
                inputProps={{ accept: 'image/*' }}
                fullWidth
                sx={{
                  backgroundColor: '#FAFAFF',
                  borderRadius: '8px',
                  padding: '8px',
                }}
              />
              {imagePreview && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    style={{
                      height: '100px',
                      width: '100px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </Box>
              )}
              {editingId && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.removeImage}
                      onChange={handleRemoveImageChange}
                      name="removeImage"
                      color="primary"
                    />
                  }
                  label="Eliminar imagen actual"
                  sx={{ mt: 1, color: '#7A4069' }}
                />
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
        <Table sx={{ minWidth: 650 }} aria-label="clubes table">
          <TableHead sx={{ backgroundColor: '#F5E8C7' }}>
            <TableRow>
              {['Nombre', 'Dirección', 'Teléfono', 'Correo', 'Miembros', 'Descripción', 'Deportes/Actividades', 'Imagen', 'Acciones'].map(
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
            {clubes.map((club) => (
              <TableRow
                key={club.id}
                sx={{
                  '&:hover': { backgroundColor: '#FAFAFF' },
                  transition: 'background-color 0.3s',
                  fontFamily: "'Arial', 'Helvetica', sans-serif",
                }}
              >
                <TableCell sx={{ color: '#333333' }}>{club.nombrehotel}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{club.direccion || 'Sin dirección'}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{club.telefono || 'Sin teléfono'}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{club.correo}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{club.numhabitacion}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{club.descripcion || 'Sin descripción'}</TableCell>
                <TableCell sx={{ color: '#333333' }}>{club.servicios || 'Sin deportes/actividades'}</TableCell>
                <TableCell>
                  {club.imagen && club.imagen.data ? (
                    <img
                      src={`data:${club.imagen.mimeType};base64,${club.imagen.data}`}
                      alt="Club"
                      style={{
                        height: '64px',
                        width: '64px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  ) : (
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic', color: '#7A4069' }}>
                      Sin imagen
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(club)}
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
                    onClick={() => handleDelete(club.id)}
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

export default GestionClubes;