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
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  SportsScore as SportsIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { resultadosAPI, clubesAPI, perfilEmpresaAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

// --- Paleta institucional IVD (misma que las páginas principales) ---
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)',
  lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = {
  bgcolor: COLORS.paper,
  borderRadius: '10px',
  boxShadow: '0 2px 12px rgba(128,0,32,0.07)',
};

const tableHeadSx = {
  fontWeight: 700,
  color: '#fff',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  py: 2,
};

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

      const clubRes = await clubesAPI.getAll();
      let clubes = clubRes.data.clubes || clubRes.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const club = clubes.find(c => c.email === user.email);
      const clubId = club?.id || club?._id;
      if (!clubId) {
        setError('No se encontró un club asociado a este usuario.');
        setLoading(false);
        return;
      }

      const response = await resultadosAPI.getByClub(clubId);
      let data = response.data.resultados || response.data || [];
      if (!Array.isArray(data)) data = [data];

      const sorted = data.sort((a, b) => {
        const fechaA = a.fechaEvento ? new Date(a.fechaEvento) : new Date(0);
        const fechaB = b.fechaEvento ? new Date(b.fechaEvento) : new Date(0);
        return fechaB - fechaA;
      });

      setResultados(sorted);
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
      const response = await perfilEmpresaAPI.get();
      setLogoUrl(response.data.perfil?.logo || '');
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error.message);
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

      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 'JPEG', margin, y, 20, 20);
          y += 25;
        } catch (e) { /* continuar sin logo */ }
      }

      y = addCenteredTitle('INSTITUTO VERACRUZANO DEL DEPORTE', y, 16);
      y = addCenteredTitle('Gobierno del Estado de Veracruz', y, 10);
      y = addCenteredTitle('REPORTE DE RESULTADOS DEL CLUB', y, 14);
      y += 10;

      doc.setDrawColor(128, 0, 32);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      const fechaActual = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
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
        confirmButtonColor: COLORS.burgundy,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al generar el PDF: ${error.message}`,
        confirmButtonColor: COLORS.burgundy,
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
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

  const disciplinasDistintas = new Set(resultados.map((r) => getDisciplinaPrincipal(r.pruebas))).size;
  const atletasDistintos = new Set(resultados.map((r) => r.nombreAtleta).filter(Boolean)).size;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>

      {/* ── Franja de bienvenida ── */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="xl" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Club
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Resultados de Nuestros Atletas
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Historial de marcas y participaciones del club
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>

        {/* ── Stat-strip flotante ── */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 4,
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: resultados.length, label: 'Resultados', accent: COLORS.burgundy },
            { icon: <PersonIcon sx={{ fontSize: 24 }} />, value: atletasDistintos, label: 'Atletas', accent: COLORS.purple },
            { icon: <SportsIcon sx={{ fontSize: 24 }} />, value: disciplinasDistintas, label: 'Disciplinas', accent: COLORS.burgundy },
          ].map((s, i) => (
            <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.line}` : 'none' }}>
              <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {resultados.length === 0 ? (
          <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>No hay resultados registrados aún</Typography>
          </Box>
        ) : (
          <Box sx={{ ...cardSx, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                    <TableCell sx={tableHeadSx}>Fecha</TableCell>
                    <TableCell sx={tableHeadSx}>Evento</TableCell>
                    <TableCell sx={tableHeadSx}>Atleta</TableCell>
                    <TableCell sx={tableHeadSx}>Disciplina</TableCell>
                    <TableCell sx={tableHeadSx}>Marca</TableCell>
                    <TableCell sx={tableHeadSx}>Categoría</TableCell>
                    <TableCell sx={tableHeadSx} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultados.map((r) => (
                    <TableRow key={r._id || r.id} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{formatDate(r.fechaEvento)}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                          {r.nombreEvento || 'Sin nombre'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{r.nombreAtleta || 'Sin nombre'}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{getDisciplinaPrincipal(r.pruebas)}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Chip
                          label={getMejorMarca(r.pruebas)}
                          size="small"
                          sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Chip
                          label={obtenerNombre(r.categoria)}
                          size="small"
                          sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }} align="center">
                        <IconButton
                          onClick={() => handleViewDetails(r)}
                          sx={{ color: COLORS.burgundy }}
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
          </Box>
        )}
      </Container>

      {/* Modal de Detalles */}
      <Dialog open={modalDetallesOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Detalles del Resultado</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {resultadoSeleccionado && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Información del Atleta */}
              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" /> Información del Atleta
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Nombre</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.nombreAtleta}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{obtenerNombre(resultadoSeleccionado.categoria)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Sexo</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {resultadoSeleccionado.sexo === 'masculino' ? 'Masculino' :
                       resultadoSeleccionado.sexo === 'femenino' ? 'Femenino' : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Municipio</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.municipio || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Información del Evento */}
              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon fontSize="small" /> Información del Evento
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Evento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.nombreEvento}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatDate(resultadoSeleccionado.fechaEvento)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Convocatoria</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>#{parseInt(resultadoSeleccionado.convocatoriaIndex) + 1}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Año Competitivo</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.añoCompetitivo || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Pruebas y Marcas */}
              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon fontSize="small" /> Pruebas y Marcas
                </Typography>
                {resultadoSeleccionado.pruebas && resultadoSeleccionado.pruebas.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                    {resultadoSeleccionado.pruebas.map((p, idx) => (
                      <Box key={idx} sx={{ p: 1.5, borderRadius: '8px', border: `1px solid ${COLORS.line}`, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Prueba {idx + 1}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{obtenerNombre(p.nombre)}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.burgundy }}>
                          {p.marca || '0'} {p.unidad || ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: COLORS.purple }}>No hay pruebas registradas</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
          <Button
            onClick={() => handleDownloadPDF(resultadoSeleccionado)}
            variant="contained"
            startIcon={<PdfIcon />}
            sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
          >
            Descargar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Resultados;