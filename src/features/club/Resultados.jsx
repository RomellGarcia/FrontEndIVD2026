import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Table,
  TableContainer,
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
  CardContent,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  SportsScore as SportsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e4e4e5';
const GREEN = '#2E7D32';

// Componente de sección reutilizable
const SectionCard = ({ icon, title, color, children }) => (
  <Card sx={{
    borderRadius: 3,
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    bgcolor: '#fff',
    mb: 3,
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Avatar sx={{ bgcolor: color, width: 36, height: 36 }}>{icon}</Avatar>
        <Typography variant="h6" sx={{ color: color, fontWeight: 'bold' }}>{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

// Función para extraer nombre de disciplina/categoría
const obtenerNombre = (item) => {
  if (!item) return 'N/A';
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item.nombre) return item.nombre;
  return 'N/A';
};

const Resultados = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');

  // Obtener token
  const getAuthHeaders = () => {
    const token = user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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

      // Obtener clubId numérico primero
      const clubRes = await axios.get('http://localhost:5000/api/clubes', { headers: getAuthHeaders() });
      let clubes = clubRes.data.clubes || clubRes.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const club = clubes.find(c => c.email === user.email);
      const clubId = club?.id || club?._id;
      if (!clubId) {
        setError('No se encontró un club asociado a este usuario.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/resultados/club/${clubId}`, {
        headers: getAuthHeaders(),
      });
      
      // Normalizar: puede ser objeto con propiedad resultados o array directo
      let data = response.data.resultados || response.data || [];
      if (!Array.isArray(data)) data = [data];
      
      // Ordenar por fecha descendente
      const sorted = data.sort((a, b) => {
        const fechaA = a.fechaEvento ? new Date(a.fechaEvento) : new Date(0);
        const fechaB = b.fechaEvento ? new Date(b.fechaEvento) : new Date(0);
        return fechaB - fechaA;
      });
      
      setResultados(sorted);
      console.log('Resultados cargados:', sorted.length);
    } catch (error) {
      console.error('Error al obtener resultados:', error);
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
      const response = await axios.get('http://localhost:5000/api/configuracion/logo', {
        headers: getAuthHeaders(),
      });
      if (response.data && response.data.perfil?.logoUrl) {
        setLogoUrl(response.data.perfil.logoUrl);
      }
    } catch (error) {
      // Solo warning, no romper la app
      console.warn('⚠️ No se pudo cargar el logo:', error.message);
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
      if (typeof jsPDF === 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La librería jsPDF no está disponible.',
          confirmButtonColor: BURGUNDY,
        });
        return;
      }

      const doc = new jsPDF();
      let y = 15;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - 2 * margin;

      const addText = (text, x, y, maxWidth) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * 5;
      };

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

      const addSubtitle = (text, y, fontSize = 12) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(128, 0, 32);
        doc.text(text, margin, y);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        return y + 6;
      };

      // Logo
      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 'JPEG', margin, y, 20, 20);
          y += 25;
        } catch (e) {
          // continuar sin logo
        }
      }

      y = addCenteredTitle('INSTITUTO VERACRUZANO DEL DEPORTE', y, 16);
      y = addCenteredTitle('Gobierno del Estado de Veracruz', y, 10);
      y = addCenteredTitle('REPORTE DE RESULTADOS DEL CLUB', y, 14);
      y += 10;

      doc.setDrawColor(128, 0, 32);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.setFontSize(9);
      doc.text(`Veracruz, Ver. a ${fechaActual}`, pageWidth - margin - doc.getTextWidth(`Veracruz, Ver. a ${fechaActual}`), y);
      doc.setFontSize(10);
      y += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      const eventTitle = resultado.nombreEvento || 'Evento Deportivo';
      const eventTitleWidth = doc.getTextWidth(eventTitle);
      doc.text(eventTitle, (pageWidth - eventTitleWidth) / 2, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 10;

      y = addSubtitle('INFORMACIÓN DEL ATLETA:', y, 12);
      const infoAtleta = [
        { label: 'Nombre:', value: resultado.nombreAtleta || 'No especificado' },
        { label: 'Categoría:', value: obtenerNombre(resultado.categoria) },
        { label: 'Sexo:', value: resultado.sexo === 'masculino' ? 'Masculino' : resultado.sexo === 'femenino' ? 'Femenino' : 'No especificado' },
        { label: 'Municipio:', value: resultado.municipio || 'No especificado' },
        { label: 'Club:', value: resultado.club || 'No especificado' },
        { label: 'Año Competitivo:', value: resultado.añoCompetitivo || 'No especificado' },
      ];
      infoAtleta.forEach((detalle) => {
        const labelText = `• ${detalle.label}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(labelText, margin, y);
        doc.setFont('helvetica', 'normal');
        const labelWidth = doc.getTextWidth(labelText);
        const valueX = margin + labelWidth + 3;
        y = addText(detalle.value, valueX, y, contentWidth - labelWidth - 3);
        y += 3;
      });

      y += 5;
      y = addSubtitle('INFORMACIÓN DEL EVENTO:', y, 12);
      const infoEvento = [
        { label: 'Fecha:', value: resultado.fechaEvento ? new Date(resultado.fechaEvento).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No especificada' },
        { label: 'Convocatoria:', value: `#${parseInt(resultado.convocatoriaIndex) + 1}` },
        { label: 'Lugar de Entrenamiento:', value: resultado.lugarEntrenamiento || 'No especificado' },
      ];
      infoEvento.forEach((detalle) => {
        const labelText = `• ${detalle.label}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(labelText, margin, y);
        doc.setFont('helvetica', 'normal');
        const labelWidth = doc.getTextWidth(labelText);
        const valueX = margin + labelWidth + 3;
        y = addText(detalle.value, valueX, y, contentWidth - labelWidth - 3);
        y += 3;
      });

      y += 5;
      y = addSubtitle('PRUEBAS Y MARCAS:', y, 12);
      if (resultado.pruebas && resultado.pruebas.length > 0) {
        resultado.pruebas.forEach((prueba) => {
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
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Este reporte es oficial y ha sido emitido por el Instituto Veracruzano del Deporte.', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text(`Documento generado el ${fechaActual}`, pageWidth / 2, y, { align: 'center' });

      const fileName = `Resultado_${resultado.nombreAtleta || 'atleta'}_${resultado.nombreEvento || 'evento'}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'PDF Generado',
        text: 'El reporte de resultados se ha descargado exitosamente',
        confirmButtonColor: BURGUNDY,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al generar el PDF: ${error.message}`,
        confirmButtonColor: BURGUNDY,
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getDisciplinaPrincipal = (pruebas) => {
    if (!pruebas || pruebas.length === 0) return 'Sin disciplina';
    const p = pruebas[0];
    return obtenerNombre(p.nombre) || 'Sin disciplina';
  };

  const getMejorMarca = (pruebas) => {
    if (!pruebas || pruebas.length === 0) return 'Sin marca';
    const p = pruebas[0];
    return `${p.marca || '0'} ${p.unidad || ''}`;
  };

  if (loading) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <CircularProgress size={60} sx={{ color: '#800020' }} />
    </Box>
  );
}

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', width: '100%', py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ color: BURGUNDY, fontWeight: 800, mb: 4 }}
        >
          Resultados de Nuestros Atletas
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <SectionCard
          icon={<TrophyIcon sx={{ fontSize: 20 }} />}
          title="Resultados Registrados"
          color={BURGUNDY}
        >
          {resultados.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
              No hay resultados registrados aún.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: BURGUNDY }}>
                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Evento</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Atleta</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Disciplina</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Marca</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Categoría</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#fff' }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultados.map((r) => (
                    <TableRow key={r._id || r.id} hover>
                      <TableCell>{formatDate(r.fechaEvento)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: BURGUNDY }}>
                          {r.nombreEvento || 'Sin nombre'}
                        </Typography>
                      </TableCell>
                      <TableCell>{r.nombreAtleta || 'Sin nombre'}</TableCell>
                      <TableCell>{getDisciplinaPrincipal(r.pruebas)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getMejorMarca(r.pruebas)}
                          size="small"
                          sx={{ bgcolor: GREEN, color: '#fff', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={obtenerNombre(r.categoria)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewDetails(r)}
                          sx={{ color: BURGUNDY }}
                          title="Ver detalles"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>
      </Container>

      {/* Modal de Detalles */}
      <Dialog
        open={modalDetallesOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: BURGUNDY, color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Detalles del Resultado</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {resultadoSeleccionado && (
            <Box sx={{ pt: 1 }}>
              {/* Información del Atleta */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ color: BURGUNDY, fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" /> Información del Atleta
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="textSecondary">Nombre</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{resultadoSeleccionado.nombreAtleta}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="textSecondary">Categoría</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{obtenerNombre(resultadoSeleccionado.categoria)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="textSecondary">Sexo</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {resultadoSeleccionado.sexo === 'masculino' ? 'Masculino' :
                         resultadoSeleccionado.sexo === 'femenino' ? 'Femenino' : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="textSecondary">Municipio</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{resultadoSeleccionado.municipio || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Información del Evento */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ color: BURGUNDY, fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" /> Información del Evento
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="textSecondary">Evento</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{resultadoSeleccionado.nombreEvento}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="textSecondary">Fecha</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(resultadoSeleccionado.fechaEvento)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="textSecondary">Convocatoria</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>#{parseInt(resultadoSeleccionado.convocatoriaIndex) + 1}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="textSecondary">Año Competitivo</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{resultadoSeleccionado.añoCompetitivo || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Pruebas y Marcas */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" sx={{ color: BURGUNDY, fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SportsIcon fontSize="small" /> Pruebas y Marcas
                  </Typography>
                  {resultadoSeleccionado.pruebas && resultadoSeleccionado.pruebas.length > 0 ? (
                    <Grid container spacing={1}>
                      {resultadoSeleccionado.pruebas.map((p, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                          <Card variant="outlined" sx={{ p: 1.5, bgcolor: '#fafafa' }}>
                            <Typography variant="caption" color="textSecondary">Prueba {idx + 1}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{obtenerNombre(p.nombre)}</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: BURGUNDY }}>
                              {p.marca || '0'} {p.unidad || ''}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#999' }}>No hay pruebas registradas</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cerrar
          </Button>
          <Button
            onClick={() => handleDownloadPDF(resultadoSeleccionado)}
            variant="contained"
            startIcon={<PdfIcon />}
            sx={{ bgcolor: BURGUNDY, '&:hover': { bgcolor: '#600018' } }}
          >
            Descargar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Resultados;