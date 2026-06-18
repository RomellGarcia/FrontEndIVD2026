import { perfilEmpresaAPI } from '../../api/index.js';
import React, { useState } from 'react';
import axios from 'axios';
import { eventosAPI, atletasAPI } from '../../api/index.js';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Container,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
// import { PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import jsPDF from 'jspdf';

const ConvocatoriasAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convocatorias, setConvocatorias] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [inscribiendo, setInscribiendo] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState(null);
  const [yaInscritos, setYaInscritos] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Función para calcular edad
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) {
      console.log('❌ No hay fecha de nacimiento');
      return null;
    }
    
    try {
      const hoy = new Date();
      let nacimiento;
      
      if (typeof fechaNacimiento === 'string') {
        nacimiento = new Date(fechaNacimiento);
      } else if (fechaNacimiento instanceof Date) {
        nacimiento = fechaNacimiento;
      } else {
        console.log('❌ Formato de fecha no reconocido:', fechaNacimiento);
        return null;
      }
      
      if (isNaN(nacimiento.getTime())) {
        console.log('❌ Fecha de nacimiento inválida:', fechaNacimiento);
        return null;
      }
      
      if (nacimiento > hoy) {
        console.log('❌ Fecha de nacimiento es futura:', fechaNacimiento);
        return null;
      }
      
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      
      console.log('📅 Edad calculada:', edad, 'para fecha:', fechaNacimiento);
      return edad;
    } catch (error) {
      console.error('❌ Error al calcular edad:', error);
      return null;
    }
  };

  // Función para cargar convocatorias
  const fetchConvocatorias = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      console.log('👤 Datos del usuario:', user);
      
      const edad = calcularEdad(user.fecha_nacimiento);
      const genero = (user.genero || '').toLowerCase();
      
      console.log('📊 Datos calculados:', { edad, genero, fechaNacimiento: user.fecha_nacimiento, sexo: user.genero });
      
      if (edad === null || edad === undefined) {
        setErrorMessage('No se puede determinar tu edad. Verifica que tu fecha de nacimiento esté correcta en tu perfil.');
        setConvocatorias([]);
        return;
      }
      
      if (!genero || genero === '') {
        setErrorMessage('No se puede determinar tu género. Verifica que tu sexo esté registrado en tu perfil.');
        setConvocatorias([]);
        return;
      }
      
      if (edad < 0 || edad > 100) {
        setErrorMessage(`La edad calculada (${edad} años) no es válida. Verifica tu fecha de nacimiento.`);
        setConvocatorias([]);
        return;
      }
      
      console.log('🔍 Buscando convocatorias para:', { edad, genero });
      
      const response = await eventosAPI.getMisConvocatorias();
      
      console.log('📋 Convocatorias encontradas:', response.data);
      
      setConvocatorias(response.data);
      
      if (response.data.length === 0) {
        setErrorMessage(`No hay convocatorias disponibles para tu edad (${edad} años) y género (${genero}).`);
      }
      
    } catch (error) {
      console.error('❌ Error al obtener convocatorias:', error);
      if (error.response?.status === 400) {
        setErrorMessage(error.response.data.message || 'Error en los datos enviados.');
      } else {
        setErrorMessage('Error al cargar las convocatorias. Intente de nuevo.');
      }
      setConvocatorias([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar logo
  const fetchLogo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/perfil-empresa');
      setLogoUrl(response.data.perfil.logo || '');
    } catch (error) {
      setLogoUrl('');
    }
  };

  // Función para cargar inscripciones
  const fetchInscripciones = async () => {
    try {
      if (!user?.id) return;
      const response = await eventosAPI.getMisInscripciones();
      setYaInscritos(response.data.map(i => i.eventoId));
    } catch (error) {
      setYaInscritos([]);
    }
  };

  // Función para cargar todos los datos
  const cargarDatos = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await fetchConvocatorias();
      await fetchLogo();
      await fetchInscripciones();
      setDataLoaded(true);
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
    }
  };

  const handleInscribirse = (convocatoria) => {
    if (!convocatoria || !user) {
      setErrorMessage('Error: Datos insuficientes para la inscripción.');
      return;
    }
    
    // Verificar que el usuario tenga todos los datos necesarios
    if (!user.nombre || !user.curp || !user.fecha_nacimiento || !user.genero) {
      setErrorMessage('Error: Tu perfil debe estar completo para participar. Verifica que tengas nombre, CURP, fecha de nacimiento y sexo registrados.');
      return;
    }
    
    // Verificar que la convocatoria no haya cerrado
    if (new Date(convocatoria.fechaCierre) <= new Date()) {
      setErrorMessage('Error: Esta convocatoria ya ha cerrado las inscripciones.');
      return;
    }
    
    setConvocatoriaSeleccionada(convocatoria);
    setModalOpen(true);
  };

  const handleConfirmarInscripcion = async () => {
    if (!convocatoriaSeleccionada || !user) {
      setErrorMessage('Error: Datos insuficientes para la inscripción.');
      setModalOpen(false);
      return;
    }

    setInscribiendo(true);
    try {
      const response = await axios.post('http://localhost:5000/api/eventos/inscripciones', {
        eventoId: convocatoriaSeleccionada._id,
        atletaId: user.id,
        datosAtleta: {
          nombre: user.nombre,
          apellidopa: user.apellidopa,
          apellidoma: user.apellidoma,
          curp: user.curp,
          club: user.clubId || 'Independiente',
          sexo: user.genero,
          fechaNacimiento: user.fecha_nacimiento,
        },
      });
      
      setModalOpen(false);
      setInscribiendo(false);
      await fetchInscripciones();
      await fetchConvocatorias();
      
      const validaciones = response.data.validaciones;
      setErrorMessage(`✅ Inscripción exitosa! 
        Edad validada: ${validaciones.edad} años
        Género: ${validaciones.genero}
        Categoría: ${validaciones.categoria}`);
    } catch (error) {
      setInscribiendo(false);
      console.error('Error en inscripción:', error);
      setErrorMessage(error.response?.data?.message || 'Error al inscribirse. Intente de nuevo.');
    }
  };

  // Función para formatear fechas
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

  // PDF styles profesional (igual al administrador)
  /*
  const pdfStyles = StyleSheet.create({
    page: { 
      padding: 40, 
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff'
    },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 30,
      borderBottom: '2px solid #800020',
      paddingBottom: 20
    },
    logo: { 
      width: 80, 
      height: 80, 
      marginRight: 20 
    },
    headerText: {
      flex: 1
    },
    institutionTitle: { 
      fontSize: 18, 
      fontWeight: 'bold', 
      color: '#800020', 
      marginBottom: 4,
      textAlign: 'center'
    },
    institutionSubtitle: { 
      fontSize: 12, 
      color: '#666', 
      marginBottom: 8,
      textAlign: 'center'
    },
    documentTitle: { 
      fontSize: 16, 
      fontWeight: 'bold', 
      color: '#800020', 
      textAlign: 'center',
      textTransform: 'uppercase'
    },
    dateSection: {
      marginBottom: 20,
      textAlign: 'right'
    },
    dateText: {
      fontSize: 12,
      color: '#666',
      fontStyle: 'italic'
    },
    saludoSection: {
      marginBottom: 25
    },
    saludoText: {
      fontSize: 12,
      color: '#333',
      lineHeight: 1.5,
      textAlign: 'justify'
    },
    mainSection: {
      marginBottom: 25,
      textAlign: 'center'
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#800020',
      textTransform: 'uppercase',
      textAlign: 'center'
    },
    detailsSection: {
      marginBottom: 20
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#800020',
      marginBottom: 12,
      textTransform: 'uppercase'
    },
    detailRow: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'flex-start'
    },
    detailLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#333',
      width: 120,
      marginRight: 10
    },
    detailValue: {
      fontSize: 11,
      color: '#333',
      flex: 1
    },
    descriptionSection: {
      marginBottom: 20
    },
    descriptionText: {
      fontSize: 11,
      color: '#333',
      lineHeight: 1.4,
      textAlign: 'justify'
    },
    instructionsSection: {
      marginBottom: 25
    },
    instructionText: {
      fontSize: 10,
      color: '#333',
      marginBottom: 6,
      lineHeight: 1.3
    },
    footer: {
      marginTop: 30,
      paddingTop: 20,
      borderTop: '1px solid #ccc',
      textAlign: 'center'
    },
    footerText: {
      fontSize: 9,
      color: '#666',
      marginBottom: 4
    }
  });

  // Componente PDF profesional (igual al administrador)
  const ConvocatoriaPDF = ({ convocatoria, logoUrl }) => {
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const fechaEvento = convocatoria.fecha ? new Date(convocatoria.fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';
    
    const fechaCierre = convocatoria.fechaCierre ? new Date(convocatoria.fechaCierre).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    return (
      <Document>
        <Page size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.header}>
            {logoUrl && <Image src={logoUrl} style={pdfStyles.logo} />}
            <View style={pdfStyles.headerText}>
              <Text style={pdfStyles.institutionTitle}>INSTITUTO VERACRUZANO DEL DEPORTE</Text>
              <Text style={pdfStyles.institutionSubtitle}>Gobierno del Estado de Veracruz</Text>
              <Text style={pdfStyles.documentTitle}>CONVOCATORIA OFICIAL</Text>
            </View>
          </View>

          <View style={pdfStyles.dateSection}>
            <Text style={pdfStyles.dateText}>Veracruz, Ver. a {fechaActual}</Text>
          </View>

          <View style={pdfStyles.saludoSection}>
            <Text style={pdfStyles.saludoText}>
              El Instituto Veracruzano del Deporte, a través de la presente convocatoria, invita a todos los atletas interesados a participar en el siguiente evento deportivo:
            </Text>
          </View>

          <View style={pdfStyles.mainSection}>
            <Text style={pdfStyles.eventTitle}>{convocatoria.titulo}</Text>
          </View>

          <View style={pdfStyles.detailsSection}>
            <Text style={pdfStyles.sectionTitle}>INFORMACIÓN DEL EVENTO:</Text>
            
            <View style={pdfStyles.detailRow}>
              <Text style={pdfStyles.detailLabel}>• Disciplina:</Text>
              <Text style={pdfStyles.detailValue}>{convocatoria.disciplina}</Text>
            </View>
            
            <View style={pdfStyles.detailRow}>
              <Text style={pdfStyles.detailLabel}>• Categoría:</Text>
              <Text style={pdfStyles.detailValue}>{convocatoria.categoria}</Text>
            </View>
            
            <View style={pdfStyles.detailRow}>
              <Text style={pdfStyles.detailLabel}>• Género:</Text>
              <Text style={pdfStyles.detailValue}>{convocatoria.genero === 'mixto' ? 'Mixto (Masculino y Femenino)' : convocatoria.genero === 'masculino' ? 'Masculino' : 'Femenino'}</Text>
            </View>
            
            <View style={pdfStyles.detailRow}>
              <Text style={pdfStyles.detailLabel}>• Rango de Edad:</Text>
              <Text style={pdfStyles.detailValue}>De {convocatoria.edadMin} a {convocatoria.edadMax} años</Text>
            </View>
            
            <View style={pdfStyles.detailRow}>
              <Text style={pdfStyles.detailLabel}>• Lugar:</Text>
              <Text style={pdfStyles.detailValue}>{convocatoria.lugar}</Text>
            </View>
            
            <View style={pdfStyles.detailRow}>
              <Text style={pdfStyles.detailLabel}>• Fecha del Evento:</Text>
              <Text style={pdfStyles.detailValue}>{fechaEvento}</Text>
            </View>
            
            <View style={pdfStyles.detailRow}>
              <Text style={pdfStyles.detailLabel}>• Hora:</Text>
              <Text style={pdfStyles.detailValue}>{convocatoria.hora}</Text>
            </View>
            
            <View style={pdfStyles.detailRow}>
              <Text style={pdfStyles.detailLabel}>• Fecha Límite de Inscripción:</Text>
              <Text style={pdfStyles.detailValue}>{fechaCierre}</Text>
            </View>
          </View>

          {convocatoria.descripcion && (
            <View style={pdfStyles.descriptionSection}>
              <Text style={pdfStyles.sectionTitle}>INFORMACIÓN ADICIONAL:</Text>
              <Text style={pdfStyles.descriptionText}>{convocatoria.descripcion}</Text>
            </View>
          )}

          <View style={pdfStyles.instructionsSection}>
            <Text style={pdfStyles.sectionTitle}>INSTRUCCIONES:</Text>
            <Text style={pdfStyles.instructionText}>
              • Los interesados deberán registrarse a través de la plataforma oficial del Instituto Veracruzano del Deporte.
            </Text>
            <Text style={pdfStyles.instructionText}>
              • Es obligatorio presentar la convocatoria oficial el día del evento.
            </Text>
            <Text style={pdfStyles.instructionText}>
              • Se recomienda llegar con 30 minutos de anticipación.
            </Text>
            <Text style={pdfStyles.instructionText}>
              • Para mayor información, consultar la página web oficial o contactar a la dirección de deportes.
            </Text>
          </View>

          <View style={pdfStyles.footer}>
            <Text style={pdfStyles.footerText}>
              Esta convocatoria es oficial y ha sido emitida por el Instituto Veracruzano del Deporte.
            </Text>
            <Text style={pdfStyles.footerText}>
              Documento generado el {fechaActual}
            </Text>
          </View>
        </Page>
      </Document>
    );
  };
  */

  const handleViewDetails = (id) => {
    navigate(`/atleta/convocatorias/${id}`);
  };

  const handleDownload = (url) => {
    window.open(url, '_blank');
  };

  // Función para generar y descargar PDF de convocatoria
  const handleDescargarPDF = async (convocatoria) => {
    try {
      // Verificar que jsPDF esté disponible
      if (typeof jsPDF === 'undefined') {
        console.error('jsPDF no está definido');
        setErrorMessage('Error: La librería jsPDF no está disponible. Verifica que esté instalada correctamente.');
        return;
      }
      
      // Crear nuevo documento PDF
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
      const eventTitle = convocatoria.titulo || 'Evento Deportivo';
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
        { label: 'Disciplina:', value: convocatoria.disciplina || 'No especificada' },
        { label: 'Categoría:', value: convocatoria.categoria || 'No especificada' },
        { label: 'Género:', value: convocatoria.genero === 'mixto' ? 'Mixto (Masculino y Femenino)' : 
                                  convocatoria.genero === 'masculino' ? 'Masculino' : 
                                  convocatoria.genero === 'femenino' ? 'Femenino' : 'No especificado' },
        { label: 'Rango de Edad:', value: `De ${convocatoria.edadMin || 'N/A'} a ${convocatoria.edadMax || 'N/A'} años` },
        { label: 'Lugar:', value: convocatoria.lugar || 'No especificado' },
        { label: 'Fecha del Evento:', value: convocatoria.fecha ? new Date(convocatoria.fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'No especificada' },
        { label: 'Hora:', value: convocatoria.hora || 'No especificada' },
        { label: 'Fecha Límite de Inscripción:', value: convocatoria.fechaCierre ? new Date(convocatoria.fechaCierre).toLocaleDateString('es-ES', {
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
      if (convocatoria.descripcion) {
        y += 3;
        y = addSubtitle('INFORMACIÓN ADICIONAL:', y, 12);
        y = addText(convocatoria.descripcion, margin, y, contentWidth);
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
      const fileName = `Convocatoria_${convocatoria.titulo || 'evento'}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      console.error('Detalles del error:', error.message);
      setErrorMessage(`Error al generar el documento PDF: ${error.message}`);
    }
  };

  // Verificar si el usuario está autenticado
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
  <Box sx={{ bgcolor: '#F5E8C7', minHeight: '100vh', width: '100%' }}>
<Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold' }}>
        Convocatorias Disponibles
      </Typography>
      
      {/* Botón para cargar datos */}
      {!dataLoaded && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={cargarDatos}
            sx={{ background: '#800020', fontWeight: 'bold' }}
          >
            📋 Cargar Convocatorias
          </Button>
        </Box>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {errorMessage && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        </Box>
      )}

      {!loading && dataLoaded && (
        <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}>
          <Table sx={{ minWidth: 650 }} aria-label="convocatorias atleta table">
            <TableHead>
              <TableRow>
                {['Título', 'Fecha', 'Descripción', 'Acciones'].map((head) => (
                  <TableCell
                    key={head}
                    sx={{ fontWeight: 'bold', color: '#800020', fontSize: '1rem', padding: '16px' }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {convocatorias.map((convocatoria) => (
                <TableRow
                  key={convocatoria._id || convocatoria.id}
                  sx={{ '&:hover': { backgroundColor: '#FAFAFF' }, transition: 'background-color 0.3s' }}
                >
                  <TableCell sx={{ color: '#333333' }}>{convocatoria.titulo || 'Sin título'}</TableCell>
                  <TableCell sx={{ color: '#333333' }}>
                    {convocatoria.fecha ? new Date(convocatoria.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                  </TableCell>
                  <TableCell sx={{ color: '#333333' }}>{convocatoria.descripcion || 'Sin descripción'}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleDescargarPDF(convocatoria)}
                      sx={{ '&:hover': { backgroundColor: 'rgba(128, 0, 32, 0.1)' } }}
                      title="Descargar Convocatoria"
                    >
                      <DownloadIcon />
                    </IconButton>
                    {/* Botón Participar */}
                    {new Date(convocatoria.fechaCierre) > new Date() && !yaInscritos.includes(convocatoria._id) && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ ml: 1, background: '#800020', fontWeight: 'bold' }}
                        onClick={() => handleInscribirse(convocatoria)}
                        disabled={inscribiendo}
                      >
                        Participar
                      </Button>
                    )}
                    {yaInscritos.includes(convocatoria._id) && (
                      <Typography variant="caption" sx={{ color: '#7A4069', ml: 1 }}>
                        Ya inscrito
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {convocatorias.length === 0 && !loading && dataLoaded && !errorMessage && (
        <Typography variant="body1" align="center" sx={{ mt: 2, color: '#7A4069' }}>
          No hay convocatorias disponibles.
        </Typography>
      )}

      {/* Modal de confirmación de inscripción */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#800020', fontWeight: 'bold' }}>
          Confirmar Participación
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#800020' }}>
            {convocatoriaSeleccionada?.titulo}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            ¿Deseas participar en esta convocatoria?
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 2, borderColor: '#800020' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#800020' }}>
                📋 Datos del Atleta
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Nombre:</strong> {user?.nombre} {user?.apellidopa} {user?.apellidoma}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>CURP:</strong> {user?.curp}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Club:</strong> {user?.clubId ? user.clubId : 'Independiente'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Sexo:</strong> {user?.sexo}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Fecha de Nacimiento:</strong> {user?.fecha_nacimiento ? new Date(user.fecha_nacimiento).toLocaleDateString('es-ES') : 'No disponible'}
              </Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ borderColor: '#800020' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#800020' }}>
                🏃 Información de la Convocatoria
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Disciplina:</strong> {convocatoriaSeleccionada?.disciplina}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Categoría:</strong> {convocatoriaSeleccionada?.categoria}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Fecha:</strong> {convocatoriaSeleccionada?.fecha ? new Date(convocatoriaSeleccionada.fecha).toLocaleDateString('es-ES') : 'No disponible'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Lugar:</strong> {convocatoriaSeleccionada?.lugar}
              </Typography>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmarInscripcion} 
            color="primary" 
            variant="contained" 
            disabled={inscribiendo}
            sx={{ background: '#800020', fontWeight: 'bold' }}
          >
            {inscribiendo ? 'Procesando...' : 'Confirmar Participación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
};

export default ConvocatoriasAtleta;