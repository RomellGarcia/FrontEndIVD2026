import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

const Resultados = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    fetchResultados();
    fetchLogo();
  }, [user, navigate]);

  const fetchResultados = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Club ID:', user.id);
      console.log('🔍 Usuario:', user);
      
      // Obtener resultados del club específico
              const response = await axios.get(`http://localhost:5000/api/resultados/club/${user.id}`);
      console.log('📊 Respuesta de la API:', response.data);
      
      const sortedResultados = response.data.sort((a, b) => new Date(b.fechaEvento) - new Date(a.fechaEvento));
      setResultados(sortedResultados);
      console.log('✅ Resultados cargados exitosamente:', sortedResultados.length);
    } catch (error) {
      console.error('❌ Error al obtener resultados:', error);
      console.error('❌ Detalles del error:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        setError('Club no encontrado. Verifique su información.');
      } else if (error.response?.status === 500) {
        setError('Error del servidor. Intente de nuevo más tarde.');
      } else {
        setError(`Error al cargar los resultados: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLogo = async () => {
    try {
              const response = await axios.get('http://localhost:5000/api/configuracion/logo');
      if (response.data && response.data.perfil.logoUrl) {
        console.log('✅ Logo cargado exitosamente:', response.data.perfil.logoUrl);
        setLogoUrl(response.data.perfil.logoUrl);
      } else {
        console.warn('⚠️ No se encontró URL del logo en la respuesta');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo cargar el logo:', error);
    }
  };

  const handleViewDetails = (resultado) => {
    setResultadoSeleccionado(resultado);
    setModalDetallesOpen(true);
  };

  const handleCloseModal = () => {
    setModalDetallesOpen(false);
    setResultadoSeleccionado(null);
  };

  const handleDownloadPDF = async (resultado) => {
    try {
      // Verificar que jsPDF esté disponible
      if (typeof jsPDF === 'undefined') {
        console.error('jsPDF no está definido');
        setError('Error: La librería jsPDF no está disponible.');
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
          console.log('🖼️ Intentando agregar logo:', logoUrl);
          doc.addImage(logoUrl, 'JPEG', margin, y, 20, 20);
          y += 25;
          console.log('✅ Logo agregado exitosamente al PDF');
        } catch (logoError) {
          console.warn('⚠️ No se pudo agregar el logo al PDF:', logoError);
          // Continuar sin logo
        }
      } else {
        console.warn('⚠️ No hay logo disponible para agregar al PDF');
      }

      // Títulos del encabezado (centrados)
      y = addCenteredTitle('INSTITUTO VERACRUZANO DEL DEPORTE', y, 16);
      y = addCenteredTitle('Gobierno del Estado de Veracruz', y, 10);
      y = addCenteredTitle('REPORTE DE RESULTADOS DEL CLUB', y, 14);
      
      y += 10;
      
      // Línea horizontal marrón separando el encabezado
      doc.setDrawColor(128, 0, 32);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
      
      // Fecha del reporte
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

      // Título del evento (centrado y en marrón)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      const eventTitle = resultado.nombreEvento || 'Evento Deportivo';
      const eventTitleWidth = doc.getTextWidth(eventTitle);
      const eventTitleX = (pageWidth - eventTitleWidth) / 2;
      doc.text(eventTitle, eventTitleX, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      y += 10;

      // Información del Atleta
      y = addSubtitle('INFORMACIÓN DEL ATLETA:', y, 12);
      
      const infoAtleta = [
        { label: 'Nombre Completo:', value: resultado.nombreAtleta || 'No especificado' },
        { label: 'Categoría:', value: resultado.categoria || 'No especificada' },
        { label: 'Sexo:', value: resultado.sexo === 'masculino' ? 'Masculino' : 
                                  resultado.sexo === 'femenino' ? 'Femenino' : 'No especificado' },
        { label: 'Municipio:', value: resultado.municipio || 'No especificado' },
        { label: 'Club:', value: resultado.club || 'No especificado' },
        { label: 'Año Competitivo:', value: resultado.añoCompetitivo || 'No especificado' }
      ];
      
      infoAtleta.forEach(detalle => {
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

      y += 5;

      // Información del Evento
      y = addSubtitle('INFORMACIÓN DEL EVENTO:', y, 12);
      
      const infoEvento = [
        { label: 'Fecha del Evento:', value: resultado.fechaEvento ? new Date(resultado.fechaEvento).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'No especificada' },
        { label: 'Convocatoria:', value: `#${parseInt(resultado.convocatoriaIndex) + 1}` },
        { label: 'Lugar de Entrenamiento:', value: resultado.lugarEntrenamiento || 'No especificado' }
      ];
      
      infoEvento.forEach(detalle => {
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

      y += 5;

      // Pruebas y Marcas
      y = addSubtitle('PRUEBAS Y MARCAS:', y, 12);
      
      if (resultado.pruebas && resultado.pruebas.length > 0) {
        resultado.pruebas.forEach((prueba, index) => {
          if (prueba.nombre && prueba.marca) {
            const pruebaText = `• ${prueba.nombre}: ${prueba.marca} ${prueba.unidad || ''}`;
            y = addText(pruebaText, margin, y, contentWidth);
            y += 3;
          }
        });
      } else {
        y = addText('No hay pruebas registradas', margin, y, contentWidth);
      }

      y += 8;

      // Pie de página
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Este reporte es oficial y ha sido emitido por el Instituto Veracruzano del Deporte.', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text(`Documento generado el ${fechaActual}`, pageWidth / 2, y, { align: 'center' });
      
      // Descargar el PDF
      const fileName = `Resultado_Club_${resultado.nombreAtleta || 'atleta'}_${resultado.nombreEvento || 'evento'}.pdf`;
      doc.save(fileName);

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: 'PDF Generado',
        text: 'El reporte de resultados se ha descargado exitosamente',
        confirmButtonColor: '#800020'
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al generar el PDF: ${error.message}`,
        confirmButtonColor: '#800020'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDisciplinaPrincipal = (pruebas) => {
    if (!pruebas || pruebas.length === 0) return 'Sin disciplina';
    return pruebas[0]?.nombre || 'Sin disciplina';
  };

  const getMejorMarca = (pruebas) => {
    if (!pruebas || pruebas.length === 0) return 'Sin marca';
    const primeraPrueba = pruebas[0];
    return `${primeraPrueba?.marca || '0'} ${primeraPrueba?.unidad || ''}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh', textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#800020' }}>
          Cargando resultados...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: '#F5E8C7', minHeight: '100vh', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: '#800020', fontWeight: 'bold', mb: 4, fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
        Resultados de Nuestros Atletas
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Box>
      )}

      {resultados.length === 0 ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
            No hay resultados registrados aún
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Los resultados aparecerán aquí una vez que tus atletas participen en eventos
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#800020' }}>
                {['Fecha', 'Evento', 'Atleta', 'Disciplina', 'Mejor Marca', 'Categoría', 'Acciones'].map((head) => (
                  <TableCell
                    key={head}
                    sx={{ fontWeight: 'bold', color: '#FFFFFF', fontSize: '1rem', padding: '16px' }}
                  >
                    {head}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
              {resultados.map((resultado) => (
                <TableRow
                  key={resultado._id}
                  sx={{ '&:hover': { backgroundColor: '#FAFAFF' }, transition: 'background-color 0.3s' }}
                >
                  <TableCell sx={{ color: '#333333' }}>
                    {formatDate(resultado.fechaEvento)}
                  </TableCell>
                  <TableCell sx={{ color: '#333333', maxWidth: 200 }}>
                    <Typography variant="body2" noWrap>
                      {resultado.nombreEvento || 'Sin nombre'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#333333' }}>
                    {resultado.nombreAtleta || 'Sin nombre'}
                  </TableCell>
                  <TableCell sx={{ color: '#333333' }}>
                    {getDisciplinaPrincipal(resultado.pruebas)}
                  </TableCell>
                  <TableCell sx={{ color: '#333333' }}>
                    {getMejorMarca(resultado.pruebas)}
                  </TableCell>
                  <TableCell sx={{ color: '#333333' }}>
                    <Chip 
                      label={resultado.categoria || 'Sin categoría'} 
                      size="small" 
                      sx={{ backgroundColor: '#E3F2FD', color: '#1976D2' }}
                    />
                  </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDetails(resultado)}
                        sx={{ '&:hover': { backgroundColor: 'rgba(128, 0, 32, 0.1)' } }}
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                  </IconButton>
                    </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      )}

      {/* Modal de Detalles */}
      <Dialog 
        open={modalDetallesOpen} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#800020', color: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon />
            Detalles del Resultado
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {resultadoSeleccionado && (
            <Grid container spacing={3}>
              {/* Información del Atleta */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#800020', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon />
                      Información del Atleta
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Nombre:</Typography>
                        <Typography variant="body1">{resultadoSeleccionado.nombreAtleta}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Categoría:</Typography>
                        <Typography variant="body1">{resultadoSeleccionado.categoria}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Sexo:</Typography>
                        <Typography variant="body1">{resultadoSeleccionado.sexo}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Municipio:</Typography>
                        <Typography variant="body1">{resultadoSeleccionado.municipio}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Información del Evento */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#800020', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon />
                      Información del Evento
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Evento:</Typography>
                        <Typography variant="body1">{resultadoSeleccionado.nombreEvento}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Fecha:</Typography>
                        <Typography variant="body1">{formatDate(resultadoSeleccionado.fechaEvento)}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Convocatoria:</Typography>
                        <Typography variant="body1">#{parseInt(resultadoSeleccionado.convocatoriaIndex) + 1}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Año Competitivo:</Typography>
                        <Typography variant="body1">{resultadoSeleccionado.añoCompetitivo}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pruebas y Marcas */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#800020', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrophyIcon />
                      Pruebas y Marcas
                    </Typography>
                    <Grid container spacing={2}>
                      {resultadoSeleccionado.pruebas && resultadoSeleccionado.pruebas.map((prueba, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <Card variant="outlined" sx={{ p: 2, backgroundColor: '#FAFAFA' }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Prueba {index + 1}:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {prueba.nombre || 'Sin nombre'}
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#800020' }}>
                              {prueba.marca || '0'} {prueba.unidad || ''}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Información Adicional */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#800020', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon />
                      Información Adicional
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Club:</Typography>
                        <Typography variant="body1">{resultadoSeleccionado.club}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Lugar de Entrenamiento:</Typography>
                        <Typography variant="body1">{resultadoSeleccionado.lugarEntrenamiento}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Fecha de Registro:</Typography>
                        <Typography variant="body1">{formatDate(resultadoSeleccionado.fechaRegistro)}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseModal}
            variant="outlined"
            sx={{ color: '#800020', borderColor: '#800020' }}
          >
            Cerrar
              </Button>
              <Button
            onClick={() => handleDownloadPDF(resultadoSeleccionado)}
                variant="contained"
            startIcon={<PdfIcon />}
            sx={{ backgroundColor: '#800020', '&:hover': { backgroundColor: '#600018' } }}
          >
            Descargar PDF
              </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Resultados;