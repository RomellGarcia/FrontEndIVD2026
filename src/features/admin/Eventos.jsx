import { perfilEmpresaAPI } from '../../api/index.js';
// components/AgregarEvento.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// import { PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import jsPDF from 'jspdf';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import GestureIcon from '@mui/icons-material/Gesture';
import { 
  CircularProgress, 
  Typography, 
  Button, 
  Box, 
  Card, 
  CardContent, 
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  IconButton as MuiIconButton,
  Tooltip
} from '@mui/material';

const MySwal = withReactContent(Swal);

// Disciplinas extraídas del documento (puedes ajustar según necesidad)
const disciplinas = [
  '75 m. Planos', '150 m. Planos', '300 m. Planos', '600 m. Planos', '2000 m. Planos', '5000 m. Planos', '10000 m. Planos',
  '80 m. con Vallas', '100 m. con Vallas', '110 m. con Vallas', '300 m. con Vallas', '400 m. con Vallas', '2000 m. con obstáculos',
  '3000 m. con obstáculos', '5000 m. Marcha', '3000 m. Marcha', '10000 m. Caminata', 'Salto de Altura', 'Salto de Longitud',
  'Salto Triple', 'Salto con Garrocha', 'Lanzamiento de Disco', 'Lanzamiento de Bala', 'Lanzamiento de Pelota', 'Lanzamiento de Martillo',
  'Lanzamiento de Jabalina', 'Tetratlón', 'Heptatlón', 'Decatlón'
];

// Listas fijas de categorías y sus rangos de edad
const categorias = [
  { nombre: 'Sub-14', min: 12, max: 13 },
  { nombre: 'Sub-16', min: 14, max: 15 },
  { nombre: 'Sub-18', min: 16, max: 17 },
  { nombre: 'Sub-20', min: 18, max: 19 },
  { nombre: 'Sub-23', min: 20, max: 22 },
  { nombre: 'Libre', min: 23, max: 35 }, // Puedes ajustar si hay otra categoría
];
const generos = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'mixto', label: 'Mixto' },
];

const AgregarEvento = () => {
  const [evento, setEvento] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    lugar: '',
    descripcion: '',
  });
  const [convocatorias, setConvocatorias] = useState([
    {
      disciplina: '',
      categoria: '',
      edadMin: '',
      edadMax: '',
      genero: 'mixto',
    }
  ]);
  const [showConvocatoriasForm, setShowConvocatoriasForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalParticipantesOpen, setModalParticipantesOpen] = useState(false);
  const [modalEventoOpen, setModalEventoOpen] = useState(false);
  const [participantes, setParticipantes] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [modalPDFOpen, setModalPDFOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [modalConvocatoriasOpen, setModalConvocatoriasOpen] = useState(false);
  const [eventoConvocatorias, setEventoConvocatorias] = useState(null);

  // Cargar eventos al montar el componente
  useEffect(() => {
    cargarEventos();
    fetchLogo();
  }, []);

  const cargarEventos = async () => {
    try {
      setLoadingEventos(true);
      const response = await axios.get('http://localhost:5000/api/eventos');
      setEventos(response.data || []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEventos([]);
      // No mostrar error si es la primera carga
      if (eventos.length > 0) {
        MySwal.fire({
          title: 'Error!',
          text: 'Error al cargar los eventos',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    } finally {
      setLoadingEventos(false);
    }
  };

  const fetchLogo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/perfil-empresa');
      setLogoUrl(response.data.perfil.logo || '');
    } catch (error) {
      setLogoUrl('');
    }
  };

  const handleCategoriaChange = (index, e) => {
    const cat = categorias.find(c => c.nombre === e.target.value);
    const nuevasConvocatorias = [...convocatorias];
    nuevasConvocatorias[index] = {
      ...nuevasConvocatorias[index],
      categoria: cat.nombre,
      edadMin: cat.min,
      edadMax: cat.max,
    };
    setConvocatorias(nuevasConvocatorias);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvento({ ...evento, [name]: value });
  };

  const handleConvocatoriaChange = (index, e) => {
    const { name, value } = e.target;
    const nuevasConvocatorias = [...convocatorias];
    nuevasConvocatorias[index] = {
      ...nuevasConvocatorias[index],
      [name]: value,
    };
    setConvocatorias(nuevasConvocatorias);
  };

  const addConvocatoria = () => {
    setConvocatorias([
      ...convocatorias,
      {
        disciplina: '',
        categoria: '',
        edadMin: '',
        edadMax: '',
        genero: 'mixto',
      }
    ]);
  };

  const removeConvocatoria = (index) => {
    if (convocatorias.length > 1) {
      const nuevasConvocatorias = convocatorias.filter((_, i) => i !== index);
      setConvocatorias(nuevasConvocatorias);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación frontend
    if (!evento.titulo || !evento.fecha || !evento.hora || !evento.lugar) {
      MySwal.fire({
        title: 'Error!',
        text: 'Todos los campos del evento son requeridos',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    // Validar convocatorias
    for (let i = 0; i < convocatorias.length; i++) {
      const conv = convocatorias[i];
      if (!conv.disciplina || !conv.categoria || !conv.genero || !conv.edadMin || !conv.edadMax) {
        MySwal.fire({
          title: 'Error!',
          text: `Convocatoria ${i + 1}: Todos los campos son requeridos`,
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const eventoData = {
        ...evento,
        convocatorias: convocatorias
      };

      const response = await axios.post('http://localhost:5000/api/eventos', eventoData);
      if (response.status === 201) {
        MySwal.fire({
          title: 'Éxito!',
          text: 'El evento ha sido creado correctamente con todas sus convocatorias.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        
        // Resetear formularios
        setEvento({
          titulo: '',
          fecha: '',
          hora: '',
          lugar: '',
          descripcion: '',
        });
        setConvocatorias([
          {
            disciplina: '',
            categoria: '',
            edadMin: '',
            edadMax: '',
            genero: 'mixto',
          }
        ]);
        setShowConvocatoriasForm(false);
        
        // Recargar eventos después de crear uno nuevo
        await cargarEventos();
      }
    } catch (error) {
      console.error('Error al crear evento:', error);
      MySwal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Error al crear el evento',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerParticipantes = async (evento) => {
    setEventoSeleccionado(evento);
    setModalParticipantesOpen(true);
    setLoadingParticipantes(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/eventos/${evento.id}/participantes`);
      setParticipantes(response.data);
    } catch (error) {
      setParticipantes([]);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  const handleVerEvento = (evento) => {
    setEventoSeleccionado(evento);
    setModalEventoOpen(true);
  };

  const handleVerPDF = (evento) => {
    try {
      setPdfLoading(true);
      setEventoSeleccionado(evento);
      setModalPDFOpen(true);
    } catch (error) {
      console.error('Error al abrir modal PDF:', error);
      MySwal.fire({
        title: 'Error!',
        text: 'Error al abrir la convocatoria en PDF',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCerrarPDF = () => {
      setModalPDFOpen(false);
      setEventoSeleccionado(null);
  };

  const handleCerrarParticipantes = () => {
      setModalParticipantesOpen(false);
      setEventoSeleccionado(null);
  };

  const handleCerrarEvento = () => {
      setModalEventoOpen(false);
      setEventoSeleccionado(null);
  };

  const handleCerrarConvocatorias = () => {
      setModalConvocatoriasOpen(false);
      setEventoConvocatorias(null);
  };

  const obtenerColorEstado = (estado) => {
    return estado ? 'success' : 'error';
  };

  const obtenerTextoEstado = (estado) => {
    return estado ? 'Activo' : 'Cancelado';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para generar PDF del evento
  const generarPDFEvento = (evento) => {
    try {
      const doc = new jsPDF();
      
      // Variables para posicionamiento
      let y = 15;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - (2 * margin);
      
      // Función para agregar texto con wrap
      const addText = (text, x, y, maxWidth) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * 5);
      };
      
      // Función para agregar título centrado
      const addCenteredTitle = (text, y, fontSize = 16) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        return y + 8;
      };
      
      // Función para agregar subtítulo
      const addSubtitle = (text, y, fontSize = 12) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(128, 0, 32); // Color #800020 (marrón oscuro)
        doc.text(text, margin, y);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        return y + 6;
      };
      
      // Logo en la esquina superior izquierda
      if (logoUrl) {
        try {
          // Agregar logo circular en la esquina superior izquierda
          doc.addImage(logoUrl, 'JPEG', margin, y, 20, 20);
          y += 25; // Espacio después del logo
        } catch (logoError) {
          console.warn('No se pudo cargar el logo:', logoError);
        }
      }
      
      // Títulos del encabezado (centrados)
      y = addCenteredTitle('INSTITUTO VERACRUZANO DEL DEPORTE', y, 16);
      y = addCenteredTitle('Gobierno del Estado de Veracruz', y, 10);
      y = addCenteredTitle('CONVOCATORIA OFICIAL', y, 14);
      
      y += 10;
      
      // Línea horizontal marrón separando el encabezado
      doc.setDrawColor(128, 0, 32); // Color marrón #800020
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
      
      // Fecha
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Veracruz, Ver. a ${fechaActual}`, pageWidth - margin - doc.getTextWidth(`Veracruz, Ver. a ${fechaActual}`), y);
      doc.setFontSize(10);
      
      y += 10;
      
      // Introducción
      const introText = 'El Instituto Veracruzano del Deporte, a través de la presente convocatoria, invita a todos los atletas interesados a participar en el siguiente evento deportivo:';
      y = addText(introText, margin, y, contentWidth);
      
      y += 8;
      
      // Título del evento (centrado y en marrón)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 32); // Color marrón #800020
      const eventTitle = evento.titulo || 'Evento Deportivo';
      const eventTitleWidth = doc.getTextWidth(eventTitle);
      const eventTitleX = (pageWidth - eventTitleWidth) / 2;
      doc.text(eventTitle, eventTitleX, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      y += 10;
      
      // Información del evento
      y = addSubtitle('INFORMACIÓN DEL EVENTO:', y, 12);
      
      // Detalles del evento (más compactos)
      const detalles = [
        { label: 'Disciplina:', value: evento.disciplina || 'No especificada' },
        { label: 'Categoría:', value: evento.categoria || 'No especificada' },
        { label: 'Género:', value: evento.genero === 'mixto' ? 'Mixto (Masculino y Femenino)' : 
                                  evento.genero === 'masculino' ? 'Masculino' : 
                                  evento.genero === 'femenino' ? 'Femenino' : 'No especificado' },
        { label: 'Rango de Edad:', value: `De ${evento.edadMin || 'N/A'} a ${evento.edadMax || 'N/A'} años` },
        { label: 'Lugar:', value: evento.lugar || 'No especificado' },
        { label: 'Fecha del Evento:', value: evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
          }) : 'No especificada' },
        { label: 'Hora:', value: evento.hora || 'No especificada' },
        { label: 'Fecha Límite de Inscripción:', value: evento.fechaCierre ? new Date(evento.fechaCierre).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
          }) : 'No especificada' }
      ];
      
      detalles.forEach(detalle => {
        const labelText = `• ${detalle.label}`;
        const valueText = detalle.value;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(labelText, margin, y);
        doc.setFont('helvetica', 'normal');
        
        const labelWidth = doc.getTextWidth(labelText);
        const valueX = margin + labelWidth + 3;
        const valueWidth = contentWidth - labelWidth - 3;
        
        y = addText(valueText, valueX, y, valueWidth);
        y += 3;
      });
      
      // Descripción adicional si existe
      if (evento.descripcion) {
        y += 3;
        y = addSubtitle('INFORMACIÓN ADICIONAL:', y, 12);
        y = addText(evento.descripcion, margin, y, contentWidth);
      }
      
      y += 6;
      
      // Instrucciones
      y = addSubtitle('INSTRUCCIONES:', y, 12);
      
      const instrucciones = [
        'Los interesados deberán registrarse a través de la plataforma oficial del Instituto Veracruzano del Deporte.',
        'Es obligatorio presentar la convocatoria oficial el día del evento.',
        'Se recomienda llegar con 30 minutos de anticipación.',
        'Para mayor información, consultar la página web oficial o contactar a la dirección de deportes.'
      ];
      
      instrucciones.forEach(instruccion => {
        y = addText(`• ${instruccion}`, margin, y, contentWidth);
        y += 2;
      });
      
      // Pie de página
      y += 8;
      
      // Línea divisoria gris clara
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Esta convocatoria es oficial y ha sido emitida por el Instituto Veracruzano del Deporte.', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text(`Documento generado el ${fechaActual}`, pageWidth / 2, y, { align: 'center' });
      
      // Descargar el PDF
      const fileName = `Convocatoria_${evento.titulo || 'evento'}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el documento PDF. Intente de nuevo.');
    }
  };

  const handleVerConvocatorias = (evento) => {
    setEventoConvocatorias(evento);
    setModalConvocatoriasOpen(true);
  };

  const handleVerParticipantesConvocatoria = async (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalParticipantesOpen(true);
    setLoadingParticipantes(true);
    try {
              const response = await axios.get(`http://localhost:5000/api/eventos/${evento.id}/participantes&convocatoriaIndex=${index}`);
      setParticipantes(response.data);
    } catch (error) {
      setParticipantes([]);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  const handleVerEventoConvocatoria = (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalEventoOpen(true);
  };

  const handleVerPDFConvocatoria = (evento, convocatoria, index) => {
    try {
      setPdfLoading(true);
      setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
      setModalPDFOpen(true);
    } catch (error) {
      console.error('Error al abrir modal PDF:', error);
      MySwal.fire({
        title: 'Error!',
        text: 'Error al abrir la convocatoria en PDF',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Gestión de Eventos</h2>
      
      {/* Formulario para crear evento */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
          📝 Crear Nuevo Evento
        </Typography>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Título</label>
            <input
              type="text"
              name="titulo"
              value={evento.titulo}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Ej. Torneo Nacional Sub-18 2026"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Fecha</label>
            <input
              type="date"
              name="fecha"
              value={evento.fecha}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Hora</label>
            <input
              type="time"
              name="hora"
              value={evento.hora}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Lugar</label>
            <input
              type="text"
              name="lugar"
              value={evento.lugar}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Ej. Estadio Central"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Descripción</label>
            <textarea
              name="descripcion"
              value={evento.descripcion}
              onChange={handleChange}
              style={{ ...styles.input, height: '100px', resize: 'vertical' }}
              placeholder="Detalles del evento (opcional)"
            />
          </div>
          {/* Botón para mostrar/ocultar formulario de convocatorias */}
          <div style={styles.formGroup}>
            <Button
              variant="outlined"
              onClick={() => setShowConvocatoriasForm(!showConvocatoriasForm)}
              startIcon={<GestureIcon />}
              sx={{
                color: '#800020',
                borderColor: '#800020',
                '&:hover': {
                  borderColor: '#800020',
                  backgroundColor: 'rgba(128, 0, 32, 0.04)'
                }
              }}
            >
              {showConvocatoriasForm ? 'Ocultar Convocatorias' : 'Agregar Convocatorias'}
            </Button>
          </div>

          {/* Formulario de convocatorias */}
          <Collapse in={showConvocatoriasForm}>
            <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
              <Typography variant="h6" sx={{ color: '#800020', mb: 2 }}>
                🎯 Convocatorias del Evento
              </Typography>
              
              {convocatorias.map((convocatoria, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1, backgroundColor: 'white' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: '#800020', fontWeight: 'bold' }}>
                      Convocatoria {index + 1}
                    </Typography>
                    {convocatorias.length > 1 && (
                      <Tooltip title="Eliminar convocatoria">
                        <MuiIconButton
                          onClick={() => removeConvocatoria(index)}
                          color="error"
                          size="small"
                        >
                          <RemoveIcon />
                        </MuiIconButton>
                      </Tooltip>
                    )}
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <label style={styles.label}>Disciplina</label>
                      <select
                        name="disciplina"
                        value={convocatoria.disciplina}
                        onChange={(e) => handleConvocatoriaChange(index, e)}
                        required
                        style={styles.input}
                      >
                        <option value="">Seleccione una disciplina</option>
                        {disciplinas.map((disc, discIndex) => (
                          <option key={discIndex} value={disc}>{disc}</option>
                        ))}
                      </select>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <label style={styles.label}>Categoría</label>
                      <select
                        name="categoria"
                        value={convocatoria.categoria}
                        onChange={(e) => handleCategoriaChange(index, e)}
                        required
                        style={styles.input}
                      >
                        <option value="">Seleccione una categoría</option>
                        {categorias.map((cat, catIndex) => (
                          <option key={catIndex} value={cat.nombre}>{cat.nombre}</option>
                        ))}
                      </select>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <label style={styles.label}>Edad mínima</label>
                      <input
                        type="number"
                        name="edadMin"
                        value={convocatoria.edadMin}
                        onChange={(e) => handleConvocatoriaChange(index, e)}
                        min={12}
                        max={35}
                        required
                        style={styles.input}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <label style={styles.label}>Edad máxima</label>
                      <input
                        type="number"
                        name="edadMax"
                        value={convocatoria.edadMax}
                        onChange={(e) => handleConvocatoriaChange(index, e)}
                        min={convocatoria.edadMin || 12}
                        max={35}
                        required
                        style={styles.input}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <label style={styles.label}>Género</label>
                      <select
                        name="genero"
                        value={convocatoria.genero}
                        onChange={(e) => handleConvocatoriaChange(index, e)}
                        required
                        style={styles.input}
                      >
                        {generos.map((g, gIndex) => (
                          <option key={gIndex} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={addConvocatoria}
                  startIcon={<AddIcon />}
                  sx={{
                    color: '#800020',
                    borderColor: '#800020',
                    '&:hover': {
                      borderColor: '#800020',
                      backgroundColor: 'rgba(128, 0, 32, 0.04)'
                    }
                  }}
                >
                  Agregar Otra Convocatoria
                </Button>
              </Box>
            </Box>
          </Collapse>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Guardando...' : 'Crear Evento con Convocatorias'}
          </button>
        </form>
      </Paper>

      {/* Lista de eventos creados */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
          📋 Eventos Creados
        </Typography>
        
        {loadingEventos ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : eventos.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
            No hay eventos creados aún.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Evento</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Lugar</strong></TableCell>
                <TableCell><strong>Convocatorias</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eventos.map((evento) => (
                <TableRow key={evento._id}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {evento.titulo}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatearFecha(evento.fecha || evento.createdAt)}</TableCell>
                  <TableCell>{evento.lugar}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      onClick={() => handleVerConvocatorias(evento)}
                      startIcon={<PeopleIcon />}
                      size="small"
                      sx={{
                        color: '#800020',
                        borderColor: '#800020',
                        '&:hover': {
                          borderColor: '#800020',
                          backgroundColor: 'rgba(128, 0, 32, 0.04)'
                        }
                      }}
                    >
                      Ver Convocatorias ({evento.convocatorias ? evento.convocatorias.length : 0})
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Modal de Participantes */}
      <Dialog open={modalParticipantesOpen} onClose={handleCerrarParticipantes} maxWidth="sm" fullWidth>
        <DialogTitle>
          Participantes de "{eventoSeleccionado?.titulo}"
          {eventoSeleccionado?.convocatoriaSeleccionada && (
            <Typography variant="subtitle2" sx={{ color: '#800020', mt: 1 }}>
              Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingParticipantes ? (
            <CircularProgress />
          ) : participantes.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              No hay participantes inscritos en esta convocatoria.
            </Typography>
          ) : (
            <List>
              {participantes.map((p, idx) => (
                <ListItem key={idx} divider>
                  <ListItemText
                    primary={p.datosAtleta?.nombreCompleto || 'Nombre no disponible'}
                    secondary={
                      <>
                        <b>Edad:</b> {p.datosAtleta?.edad || 'N/A'} años <br />
                        <b>Género:</b> {p.datosAtleta?.genero || 'N/A'} <br />
                        <b>Fecha de Inscripción:</b> {formatearFecha(p.fechaInscripcion)} <br />
                        <b>Estado:</b> {p.validado ? 'Validado' : 'Pendiente'}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarParticipantes} color="secondary">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalles del Evento */}
      <Dialog open={modalEventoOpen} onClose={handleCerrarEvento} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            📋 Detalles del Evento
            {eventoSeleccionado?.convocatoriaSeleccionada && (
              <Typography variant="subtitle2" sx={{ color: '#800020', mt: 1 }}>
                Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {eventoSeleccionado && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ color: '#800020' }}>
                    {eventoSeleccionado.titulo}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>📅 Información General</Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Fecha:</strong> {formatearFecha(eventoSeleccionado.fecha || eventoSeleccionado.createdAt)}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Hora:</strong> {eventoSeleccionado.hora}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Lugar:</strong> {eventoSeleccionado.lugar}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Estado:</strong> 
                        <Chip 
                          label={obtenerTextoEstado(eventoSeleccionado.estado)} 
                          color={obtenerColorEstado(eventoSeleccionado.estado)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>🏃 Información Deportiva</Typography>
                      {eventoSeleccionado.convocatoriaSeleccionada ? (
                        <>
                          <Typography variant="body2" paragraph>
                            <strong>Disciplina:</strong> {eventoSeleccionado.convocatoriaSeleccionada.disciplina}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Categoría:</strong> {eventoSeleccionado.convocatoriaSeleccionada.categoria}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Rango de Edad:</strong> {eventoSeleccionado.convocatoriaSeleccionada.edadMin} - {eventoSeleccionado.convocatoriaSeleccionada.edadMax} años
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Género:</strong> {eventoSeleccionado.convocatoriaSeleccionada.genero === 'mixto' ? 'Mixto' : 
                                                      eventoSeleccionado.convocatoriaSeleccionada.genero === 'masculino' ? 'Masculino' : 'Femenino'}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" paragraph>
                            <strong>Disciplina:</strong> {eventoSeleccionado.disciplina || 'No especificada'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Categoría:</strong> {eventoSeleccionado.categoria || 'No especificada'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Rango de Edad:</strong> {eventoSeleccionado.edadMin || 'N/A'} - {eventoSeleccionado.edadMax || 'N/A'} años
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Género:</strong> {eventoSeleccionado.genero || 'No especificado'}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {eventoSeleccionado.descripcion && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>📝 Descripción</Typography>
                        <Typography variant="body2">
                          {eventoSeleccionado.descripcion}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>📊 Información Técnica</Typography>
                      <Typography variant="body2" paragraph>
                        <strong>ID del Evento:</strong> {eventoSeleccionado._id}
                      </Typography>
                      {eventoSeleccionado.convocatoriaSeleccionada && (
                        <Typography variant="body2" paragraph>
                          <strong>Índice de la Convocatoria:</strong> {eventoSeleccionado.convocatoriaIndex !== undefined ? eventoSeleccionado.convocatoriaIndex + 1 : 'N/A'}
                        </Typography>
                      )}
                      <Typography variant="body2" paragraph>
                        <strong>Fecha de Creación:</strong> {formatearFecha(eventoSeleccionado.createdAt)}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Fecha de Cierre:</strong> {formatearFecha(eventoSeleccionado.fechaCierre)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarEvento} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal PDF del Evento */}
      <Dialog 
        open={modalPDFOpen} 
        onClose={handleCerrarPDF} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            📄 Convocatoria Oficial en PDF - {eventoSeleccionado?.titulo}
            {eventoSeleccionado?.convocatoriaSeleccionada && (
              <Typography variant="subtitle2" sx={{ color: '#800020', mt: 1 }}>
                Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {eventoSeleccionado ? (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Haz clic en el botón para descargar la convocatoria oficial en formato PDF
                {eventoSeleccionado.convocatoriaSeleccionada && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    Esta convocatoria incluirá solo la información específica de la disciplina y categoría seleccionada.
                  </Typography>
                )}
              </Typography>
              <Button
                variant="contained"
                onClick={() => generarPDFEvento(eventoSeleccionado)}
                color="success"
                startIcon={pdfLoading ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                disabled={pdfLoading}
                sx={{
                  textDecoration: 'none',
                  padding: '12px 24px',
                  backgroundColor: '#800020',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  margin: '8px'
                }}
              >
                {pdfLoading ? 'Generando Convocatoria...' : '📥 Descargar Convocatoria Oficial'}
              </Button>
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  La convocatoria incluye toda la información oficial del evento con el logo del instituto y redacción profesional
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Cargando convocatoria...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarPDF} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Convocatorias */}
      <Dialog open={modalConvocatoriasOpen} onClose={handleCerrarConvocatorias} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#800020', fontWeight: 'bold' }}>
            🎯 Convocatorias del Evento: {eventoConvocatorias?.titulo}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {eventoConvocatorias && eventoConvocatorias.convocatorias ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Disciplina</strong></TableCell>
                  <TableCell><strong>Categoría</strong></TableCell>
                  <TableCell><strong>Rango de Edad</strong></TableCell>
                  <TableCell><strong>Género</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eventoConvocatorias.convocatorias.map((convocatoria, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {convocatoria.disciplina}
                      </Typography>
                    </TableCell>
                    <TableCell>{convocatoria.categoria}</TableCell>
                    <TableCell>{convocatoria.edadMin} - {convocatoria.edadMax} años</TableCell>
                    <TableCell>
                      <Chip 
                        label={convocatoria.genero === 'mixto' ? 'Mixto' : 
                               convocatoria.genero === 'masculino' ? 'Masculino' : 'Femenino'} 
                        color={convocatoria.genero === 'mixto' ? 'default' : 
                               convocatoria.genero === 'masculino' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={obtenerTextoEstado(eventoConvocatorias.estado)} 
                        color={obtenerColorEstado(eventoConvocatorias.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVerEventoConvocatoria(eventoConvocatorias, convocatoria, index)}
                          color="primary"
                          title="Ver detalles de la convocatoria"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVerPDFConvocatoria(eventoConvocatorias, convocatoria, index)}
                          color="success"
                          title="Ver convocatoria en PDF"
                          disabled={pdfLoading}
                        >
                          {pdfLoading ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVerParticipantesConvocatoria(eventoConvocatorias, convocatoria, index)}
                          color="secondary"
                          title="Ver participantes de esta convocatoria"
                        >
                          <PeopleIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              No hay convocatorias para este evento.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarConvocatorias} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#800020',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontWeight: '500',
    marginBottom: '5px',
    color: '#555',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#800020',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontWeight: 'bold',
  },
  'button:disabled': {
    backgroundColor: '#a0a0a0',
    cursor: 'not-allowed',
  },
};

export default AgregarEvento;