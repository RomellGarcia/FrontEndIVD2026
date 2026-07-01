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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import ShieldIcon from '@mui/icons-material/Shield';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CampaignIcon from '@mui/icons-material/Campaign';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
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
  Tooltip,
  Alert,
  Checkbox,
  FormControlLabel,
  Avatar,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';

const MySwal = withReactContent(Swal);

// Base del backend (usada para armar la URL completa de imágenes y documentos subidos)
const API_BASE_URL = 'http://localhost:5000';

// Convierte una ruta relativa que devuelve el backend (ej. "/uploads/evento-1.jpg")
// en una URL completa y absoluta que el navegador pueda cargar.
const resolveArchivoUrl = (ruta) => {
  if (!ruta) return '';
  if (/^(https?:|blob:|data:)/i.test(ruta)) return ruta;
  return `${API_BASE_URL}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
};

// El backend podría devolver el campo de la imagen con distintos nombres
// según cómo se haya implementado el endpoint; probamos los más comunes.
const obtenerImagenEvento = (evento) => {
  if (!evento) return '';
  const posiblesCampos = ['imagen', 'imagenUrl', 'imagen_url', 'foto', 'flyer', 'banner', 'bannerUrl', 'imagePath', 'imagePath'];
  for (const campo of posiblesCampos) {
    if (evento[campo]) return evento[campo];
  }
  return '';
};

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

  // Zona de convocatoria: imagen del evento y documentos adjuntos
  const [imagenEvento, setImagenEvento] = useState(null); // File
  const [imagenPreview, setImagenPreview] = useState('');
  const [documentoConvocatoria, setDocumentoConvocatoria] = useState(null); // File (PDF/DOC de la convocatoria oficial)
  const [documentoDeslinde, setDocumentoDeslinde] = useState(null); // File (deslinde de responsabilidad firmado/anexo)
  const [aceptaDeslinde, setAceptaDeslinde] = useState(false); // checkbox de aceptación de riesgo

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
    const data = response.data;
    const listaEventos = Array.isArray(data)
      ? data
      : Array.isArray(data?.eventos)
        ? data.eventos
        : [];
    setEventos(listaEventos);
    if (listaEventos.length > 0) {
      // Ayuda a depurar: revisa en la consola del navegador qué campo
      // usa el backend para la imagen si las tarjetas no la muestran.
      console.log('Campos disponibles en un evento:', Object.keys(listaEventos[0]), listaEventos[0]);
    }
  } catch (error) {
    console.error('Error al cargar eventos:', error);
    setEventos([]);
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

  // Imagen del evento (banner/flyer)
  const handleImagenChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      MySwal.fire({ title: 'Error!', text: 'El archivo debe ser una imagen (jpg, png, webp).', icon: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      MySwal.fire({ title: 'Error!', text: 'La imagen no debe pesar más de 5MB.', icon: 'error' });
      return;
    }
    setImagenEvento(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const handleQuitarImagen = () => {
    setImagenEvento(null);
    setImagenPreview('');
  };

  // Documento oficial de la convocatoria (PDF/DOC)
  const handleDocumentoConvocatoriaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const permitido = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!permitido.includes(file.type)) {
      MySwal.fire({ title: 'Error!', text: 'El documento de convocatoria debe ser PDF o Word.', icon: 'error' });
      return;
    }
    setDocumentoConvocatoria(file);
  };

  // Documento de deslinde de responsabilidad (aviso de riesgo / consentimiento)
  const handleDocumentoDeslindeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const permitido = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (!permitido.includes(file.type)) {
      MySwal.fire({ title: 'Error!', text: 'El documento de deslinde debe ser PDF, Word o imagen.', icon: 'error' });
      return;
    }
    setDocumentoDeslinde(file);
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

    if (!aceptaDeslinde) {
      MySwal.fire({
        title: 'Falta el deslinde de responsabilidad',
        text: 'Debes aceptar el deslinde de responsabilidad (riesgo de lesión) para publicar el evento.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
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
      const formData = new FormData();
      Object.entries(evento).forEach(([key, value]) => formData.append(key, value));
      formData.append('convocatorias', JSON.stringify(convocatorias));
      formData.append('aceptaDeslinde', 'true');
      if (imagenEvento) formData.append('imagen', imagenEvento);
      if (documentoConvocatoria) formData.append('documentoConvocatoria', documentoConvocatoria);
      if (documentoDeslinde) formData.append('documentoDeslinde', documentoDeslinde);

      const response = await axios.post('http://localhost:5000/api/eventos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
        handleQuitarImagen();
        setDocumentoConvocatoria(null);
        setDocumentoDeslinde(null);
        setAceptaDeslinde(false);
        
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', my: { xs: 2, md: 4 }, px: { xs: 1.5, md: 2 } }}>
      {/* Formulario para crear evento */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, mb: 4, borderRadius: 3, border: '1px solid #eee' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ width: 6, height: 28, borderRadius: 1, backgroundColor: '#800020' }} />
          <Typography variant="h5" sx={{ color: '#800020', fontWeight: 800 }}>
            Crear Nuevo Evento
          </Typography>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                label="Título del evento"
                name="titulo"
                value={evento.titulo}
                onChange={handleChange}
                required
                placeholder="Ej. Torneo Nacional Sub-18 2026"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Lugar"
                name="lugar"
                value={evento.lugar}
                onChange={handleChange}
                required
                placeholder="Ej. Estadio Central"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: '#800020' }} fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha"
                name="fecha"
                value={evento.fecha}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon sx={{ color: '#800020' }} fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Hora"
                name="hora"
                value={evento.hora}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon sx={{ color: '#800020' }} fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Descripción"
                name="descripcion"
                value={evento.descripcion}
                onChange={handleChange}
                placeholder="Detalles del evento (opcional)"
              />
            </Grid>
          </Grid>

          {/* ===================== ZONA DE CONVOCATORIA ===================== */}
          <Box
            sx={{
              mt: 4,
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px dashed #c9a2ad',
              backgroundColor: '#fdf6f8',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <CampaignIcon sx={{ color: '#800020' }} />
              <Typography variant="h6" sx={{ color: '#800020', fontWeight: 800 }}>
                Zona de Convocatoria
              </Typography>
            </Stack>

            <Grid container spacing={2.5}>
              {/* Imagen del evento */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#555', fontWeight: 700 }}>
                  <ImageIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                  Imagen / Flyer del evento
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                  }}
                >
                  {imagenPreview ? (
                    <>
                      <Box
                        component="img"
                        src={imagenPreview}
                        alt="Vista previa del evento"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <MuiIconButton
                        size="small"
                        onClick={handleQuitarImagen}
                        sx={{
                          position: 'absolute', top: 6, right: 6,
                          backgroundColor: 'rgba(0,0,0,0.55)',
                          color: '#fff',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </MuiIconButton>
                    </>
                  ) : (
                    <Button
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      sx={{ color: '#800020' }}
                    >
                      Subir imagen
                      <input hidden type="file" accept="image/*" onChange={handleImagenChange} />
                    </Button>
                  )}
                </Box>
                {imagenPreview && (
                  <Button
                    component="label"
                    size="small"
                    sx={{ mt: 1, color: '#800020' }}
                    startIcon={<CloudUploadIcon fontSize="small" />}
                  >
                    Cambiar imagen
                    <input hidden type="file" accept="image/*" onChange={handleImagenChange} />
                  </Button>
                )}
              </Grid>

              {/* Documento de convocatoria oficial */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#555', fontWeight: 700 }}>
                  <DescriptionIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                  Documento de convocatoria
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    height: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  {documentoConvocatoria ? (
                    <>
                      <InsertDriveFileIcon sx={{ fontSize: 34, color: '#800020', mb: 1 }} />
                      <Typography variant="caption" sx={{ wordBreak: 'break-all', mb: 1 }}>
                        {documentoConvocatoria.name}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button component="label" size="small" sx={{ color: '#800020' }}>
                          Cambiar
                          <input hidden type="file" accept=".pdf,.doc,.docx" onChange={handleDocumentoConvocatoriaChange} />
                        </Button>
                        <Button size="small" color="error" onClick={() => setDocumentoConvocatoria(null)}>
                          Quitar
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Button component="label" startIcon={<CloudUploadIcon />} sx={{ color: '#800020' }}>
                      Subir documento
                      <input hidden type="file" accept=".pdf,.doc,.docx" onChange={handleDocumentoConvocatoriaChange} />
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  PDF o Word con las bases oficiales del evento.
                </Typography>
              </Grid>

              {/* Deslinde de responsabilidad */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#555', fontWeight: 700 }}>
                  <ShieldIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                  Deslinde de responsabilidad
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    height: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  {documentoDeslinde ? (
                    <>
                      <InsertDriveFileIcon sx={{ fontSize: 34, color: '#800020', mb: 1 }} />
                      <Typography variant="caption" sx={{ wordBreak: 'break-all', mb: 1 }}>
                        {documentoDeslinde.name}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button component="label" size="small" sx={{ color: '#800020' }}>
                          Cambiar
                          <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleDocumentoDeslindeChange} />
                        </Button>
                        <Button size="small" color="error" onClick={() => setDocumentoDeslinde(null)}>
                          Quitar
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Button component="label" startIcon={<CloudUploadIcon />} sx={{ color: '#800020' }}>
                      Subir documento
                      <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleDocumentoDeslindeChange} />
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Aviso de riesgo / consentimiento firmado (opcional).
                </Typography>
              </Grid>
            </Grid>

            <Alert
              severity="warning"
              icon={<ShieldIcon />}
              sx={{ mt: 3, alignItems: 'flex-start', backgroundColor: '#fff4e5' }}
            >
              <FormControlLabel
                sx={{ alignItems: 'flex-start', m: 0 }}
                control={
                  <Checkbox
                    checked={aceptaDeslinde}
                    onChange={(e) => setAceptaDeslinde(e.target.checked)}
                    sx={{ color: '#800020', '&.Mui-checked': { color: '#800020' } }}
                  />
                }
                label={
                  <Typography variant="body2">
                    Confirmo que los participantes serán informados de que la práctica deportiva implica riesgo de
                    lesión u otros daños, y que el evento se publica bajo el deslinde de responsabilidad correspondiente.
                  </Typography>
                }
              />
            </Alert>
          </Box>
          {/* =================== FIN ZONA DE CONVOCATORIA =================== */}

          {/* Botón para mostrar/ocultar formulario de convocatorias */}
          <Box sx={{ mt: 3 }}>
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
          </Box>

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
                      <TextField
                        select
                        fullWidth
                        label="Disciplina"
                        name="disciplina"
                        value={convocatoria.disciplina}
                        onChange={(e) => handleConvocatoriaChange(index, e)}
                        required
                        SelectProps={{ native: true }}
                        InputLabelProps={{ shrink: true }}
                      >
                        <option value="">Seleccione una disciplina</option>
                        {disciplinas.map((disc, discIndex) => (
                          <option key={discIndex} value={disc}>{disc}</option>
                        ))}
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Categoría"
                        name="categoria"
                        value={convocatoria.categoria}
                        onChange={(e) => handleCategoriaChange(index, e)}
                        required
                        SelectProps={{ native: true }}
                        InputLabelProps={{ shrink: true }}
                      >
                        <option value="">Seleccione una categoría</option>
                        {categorias.map((cat, catIndex) => (
                          <option key={catIndex} value={cat.nombre}>{cat.nombre}</option>
                        ))}
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Edad mínima"
                        name="edadMin"
                        value={convocatoria.edadMin}
                        onChange={(e) => handleConvocatoriaChange(index, e)}
                        inputProps={{ min: 12, max: 35 }}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Edad máxima"
                        name="edadMax"
                        value={convocatoria.edadMax}
                        onChange={(e) => handleConvocatoriaChange(index, e)}
                        inputProps={{ min: convocatoria.edadMin || 12, max: 35 }}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Género"
                        name="genero"
                        value={convocatoria.genero}
                        onChange={(e) => handleConvocatoriaChange(index, e)}
                        required
                        SelectProps={{ native: true }}
                        InputLabelProps={{ shrink: true }}
                      >
                        {generos.map((g, gIndex) => (
                          <option key={gIndex} value={g.value}>{g.label}</option>
                        ))}
                      </TextField>
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <EventIcon />}
            sx={{
              mt: 4,
              py: 1.4,
              fontWeight: 800,
              fontSize: '1rem',
              borderRadius: 2,
              backgroundColor: '#800020',
              boxShadow: '0 6px 18px rgba(128,0,32,0.3)',
              '&:hover': { backgroundColor: '#5c0017' },
            }}
          >
            {loading ? 'Guardando...' : 'Crear Evento con Convocatorias'}
          </Button>
        </form>
      </Paper>

      {/* Lista de eventos creados */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, border: '1px solid #eee' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ width: 6, height: 28, borderRadius: 1, backgroundColor: '#800020' }} />
          <Typography variant="h5" sx={{ color: '#800020', fontWeight: 800 }}>
            Eventos Creados
          </Typography>
        </Stack>

        {loadingEventos ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : eventos.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
            No hay eventos creados aún.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2.5,
              alignItems: 'stretch',
            }}
          >
            {eventos.map((evento) => (
              <Card
                key={evento._id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow .2s, transform .2s',
                  '&:hover': { boxShadow: '0 10px 24px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' },
                }}
              >
                  {obtenerImagenEvento(evento) ? (
                    <Box
                      component="img"
                      src={resolveArchivoUrl(obtenerImagenEvento(evento))}
                      alt={evento.titulo}
                      sx={{ width: '100%', height: 150, objectFit: 'cover', display: 'block', flexShrink: 0 }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%', height: 150, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: '#fdf6f8', color: '#c9a2ad'
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 42 }} />
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{
                        color: '#800020',
                        mb: 0.5,
                        minHeight: '2.6em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {evento.titulo}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mb: 1.5, color: 'text.secondary' }}>
                      <Stack direction="row" spacing={0.7} alignItems="center">
                        <EventIcon fontSize="inherit" />
                        <Typography variant="body2">{formatearFecha(evento.fecha || evento.createdAt)}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.7} alignItems="center">
                        <PlaceIcon fontSize="inherit" />
                        <Typography variant="body2" noWrap>{evento.lugar}</Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, rowGap: 1, minHeight: 24 }}>
                      {evento.documentoConvocatoria && (
                        <Chip
                          size="small"
                          icon={<DescriptionIcon />}
                          label="Convocatoria"
                          component="a"
                          href={resolveArchivoUrl(evento.documentoConvocatoria)}
                          target="_blank"
                          clickable
                          sx={{ color: '#800020' }}
                        />
                      )}
                      {evento.documentoDeslinde && (
                        <Chip
                          size="small"
                          icon={<ShieldIcon />}
                          label="Deslinde"
                          component="a"
                          href={resolveArchivoUrl(evento.documentoDeslinde)}
                          target="_blank"
                          clickable
                        />
                      )}
                    </Stack>

                    <Box sx={{ mt: 'auto' }}>
                      <Divider sx={{ mb: 1.5 }} />
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleVerConvocatorias(evento)}
                          startIcon={<PeopleIcon />}
                          sx={{
                            color: '#800020',
                            borderColor: '#800020',
                            '&:hover': { borderColor: '#800020', backgroundColor: 'rgba(128, 0, 32, 0.04)' }
                          }}
                        >
                          Convocatorias ({evento.convocatorias ? evento.convocatorias.length : 0})
                        </Button>
                        <Tooltip title="Ver detalles del evento">
                          <MuiIconButton size="small" onClick={() => handleVerEvento(evento)} sx={{ color: '#800020' }}>
                            <VisibilityIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                        <Tooltip title="Descargar convocatoria en PDF">
                          <MuiIconButton size="small" onClick={() => handleVerPDF(evento)} sx={{ color: '#2e7d32' }}>
                            <PictureAsPdfIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
            ))}
          </Box>
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
                {obtenerImagenEvento(eventoSeleccionado) && (
                  <Grid item xs={12}>
                    <Box
                      component="img"
                      src={resolveArchivoUrl(obtenerImagenEvento(eventoSeleccionado))}
                      alt={eventoSeleccionado.titulo}
                      sx={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 2 }}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ color: '#800020' }}>
                    {eventoSeleccionado.titulo}
                  </Typography>
                  {(eventoSeleccionado.documentoConvocatoria || eventoSeleccionado.documentoDeslinde) && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
                      {eventoSeleccionado.documentoConvocatoria && (
                        <Chip
                          icon={<DownloadIcon />}
                          label="Descargar convocatoria"
                          component="a"
                          href={resolveArchivoUrl(eventoSeleccionado.documentoConvocatoria)}
                          target="_blank"
                          clickable
                          sx={{ color: '#800020' }}
                        />
                      )}
                      {eventoSeleccionado.documentoDeslinde && (
                        <Chip
                          icon={<ShieldIcon />}
                          label="Deslinde de responsabilidad"
                          component="a"
                          href={resolveArchivoUrl(eventoSeleccionado.documentoDeslinde)}
                          target="_blank"
                          clickable
                        />
                      )}
                    </Stack>
                  )}
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
    </Box>
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