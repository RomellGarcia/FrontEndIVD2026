import { resultadosAPI, perfilEmpresaAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Paper, Container, Button, IconButton, Alert, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider, Pagination,
} from '@mui/material';
import {
  Visibility as ViewIcon, PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon, Person as PersonIcon,
  CalendarToday as CalendarIcon, LocationOn as LocationIcon,
  Close as CloseIcon, SportsScore as SportsIcon,
  Group as GroupIcon, FitnessCenter as FitnessIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e3e4e5';
const GREEN = '#2E7D32';

const ResultadosAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [page, setPage] = useState(1);
  const porPagina = 8;

  useEffect(() => {
    if (!user) navigate('/login');
    else { fetchResultados(); fetchLogo(); }
  }, [user, navigate]);

  const fetchResultados = async () => {
    try {
      setLoading(true);
      const response = await resultadosAPI.getByAtleta(user.id);
      const data = response.data.resultados || [];
      setResultados(data.sort((a, b) => new Date(b.evento_fecha || b.fechaEvento) - new Date(a.evento_fecha || a.fechaEvento)));
    } catch { setErrorMessage('Error al cargar los resultados.'); }
    finally { setLoading(false); }
  };

  const fetchLogo = async () => {
    try {
      const response = await perfilEmpresaAPI.get();
      setLogoUrl(response.data.perfil?.logo || '');
    } catch { /* silenciar */ }
  };

  const fmt = (fecha) => {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
  };

  const fmtCorta = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDisciplina = (pruebas) => pruebas?.[0]?.nombre || 'Sin disciplina';
  const getMarca = (pruebas) => {
    if (!pruebas?.length) return '—';
    return `${pruebas[0]?.marca || '0'} ${pruebas[0]?.unidad || ''}`;
  };

  const handleVerDetalle = (r) => { setSeleccionado(r); setModalOpen(true); };
  const handleCerrar = () => { setModalOpen(false); setSeleccionado(null); };

  const resultadosPaginados = resultados.slice((page - 1) * porPagina, page * porPagina);

  /* ── Generar PDF ── */
  const handleDownloadPDF = async (resultado) => {
    try {
      const doc = new jsPDF();
      let y = 15;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - (2 * margin);

      const addText = (text, x, yPos, maxWidth) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return yPos + (lines.length * 5);
      };

      const addCenteredTitle = (text, yPos, fontSize = 16) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(text, pageWidth / 2, yPos, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        return yPos + 8;
      };

      const addSubtitle = (text, yPos) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(128, 0, 32);
        doc.text(text, margin, yPos);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        return yPos + 6;
      };

      // Logo
      if (logoUrl) {
        try { doc.addImage(logoUrl, 'JPEG', margin, y, 20, 20); y += 25; } catch { /* sin logo */ }
      }

      y = addCenteredTitle('INSTITUTO VERACRUZANO DEL DEPORTE', y, 16);
      y = addCenteredTitle('Gobierno del Estado de Veracruz', y, 10);
      y = addCenteredTitle('REPORTE DE RESULTADOS', y, 14);
      y += 10;

      doc.setDrawColor(128, 0, 32);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      const fechaActual = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFontSize(9);
      doc.text(`Veracruz, Ver. a ${fechaActual}`, pageWidth - margin, y, { align: 'right' });
      doc.setFontSize(10);
      y += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      doc.text(resultado.nombreEvento || 'Evento Deportivo', pageWidth / 2, y, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 10;

      // Info atleta
      y = addSubtitle('INFORMACIÓN DEL ATLETA:', y);
      const infoAtleta = [
        ['Nombre Completo:', resultado.nombreAtleta || '—'],
        ['Categoría:', resultado.categoria || '—'],
        ['Sexo:', resultado.sexo === 'masculino' ? 'Masculino' : resultado.sexo === 'femenino' ? 'Femenino' : '—'],
        ['Municipio:', resultado.municipio || '—'],
        ['Club:', resultado.club || '—'],
        ['Año Competitivo:', resultado.añoCompetitivo || resultado.ano_competitivo || '—'],
      ];

      infoAtleta.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const lbl = `• ${label}`;
        doc.text(lbl, margin, y);
        doc.setFont('helvetica', 'normal');
        const lw = doc.getTextWidth(lbl);
        y = addText(value, margin + lw + 3, y, contentWidth - lw - 3);
        y += 3;
      });

      y += 5;
      y = addSubtitle('INFORMACIÓN DEL EVENTO:', y);
      const infoEvento = [
        ['Fecha del Evento:', fmt(resultado.fechaEvento || resultado.evento_fecha)],
        ['Lugar de Entrenamiento:', resultado.lugarEntrenamiento || resultado.lugar_entrenamiento || '—'],
      ];

      infoEvento.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const lbl = `• ${label}`;
        doc.text(lbl, margin, y);
        doc.setFont('helvetica', 'normal');
        const lw = doc.getTextWidth(lbl);
        y = addText(value, margin + lw + 3, y, contentWidth - lw - 3);
        y += 3;
      });

      y += 5;
      y = addSubtitle('PRUEBAS Y MARCAS:', y);
      if (resultado.pruebas?.length > 0) {
        resultado.pruebas.forEach((p) => {
          if (p.nombre && p.marca) {
            y = addText(`• ${p.nombre}: ${p.marca} ${p.unidad || ''}`, margin, y, contentWidth);
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

      doc.save(`Resultado_${resultado.nombreAtleta || 'atleta'}_${resultado.nombreEvento || 'evento'}.pdf`);
      Swal.fire({ icon: 'success', title: 'PDF Generado', text: 'El reporte se descargó exitosamente', confirmButtonColor: BURGUNDY });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Error al generar el PDF: ${error.message}`, confirmButtonColor: BURGUNDY });
    }
  };

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
          Mis Resultados
        </Typography>
        <Typography variant="body1" sx={{ color: PURPLE, textAlign: 'center', mb: 4, opacity: .8 }}>
          Historial de participaciones y marcas obtenidas
        </Typography>

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 3, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {/* ── Contenido ── */}
        {resultados.length === 0 ? (
          <Paper sx={{ borderRadius: 3, textAlign: 'center', py: 6, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <Avatar sx={{ bgcolor: `${PURPLE}14`, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: PURPLE }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: PURPLE }}>Sin resultados registrados</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: .5 }}>
              Los resultados aparecerán aquí una vez que participes en eventos
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: BURGUNDY }}>
                  {['Fecha', 'Evento', 'Disciplina', 'Marca', 'Categoría', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', py: 2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {resultadosPaginados.map((r, i) => (
                  <TableRow key={r.id || r._id || i} hover sx={{ '&:hover': { bgcolor: `${CREAM}66` } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {fmtCorta(r.fechaEvento || r.evento_fecha)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                        {r.nombreEvento || r.evento_titulo || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                        <SportsIcon sx={{ fontSize: 16, color: BURGUNDY }} />
                        {getDisciplina(r.pruebas)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getMarca(r.pruebas)}
                        size="small"
                        sx={{ bgcolor: `${GREEN}14`, color: GREEN, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.categoria || '—'}
                        size="small"
                        sx={{ bgcolor: `${PURPLE}14`, color: PURPLE, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: .5 }}>
                        <IconButton size="small" onClick={() => handleVerDetalle(r)}
                          sx={{ color: BURGUNDY, '&:hover': { bgcolor: `${BURGUNDY}08` } }}
                          title="Ver detalles">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDownloadPDF(r)}
                          sx={{ color: GREEN, '&:hover': { bgcolor: `${GREEN}08` } }}
                          title="Descargar PDF">
                          <PdfIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {resultados.length > porPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #eee' }}>
                <Pagination
                  count={Math.ceil(resultados.length / porPagina)}
                  page={page} onChange={(e, v) => setPage(v)}
                  sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: BURGUNDY, color: '#fff' } }}
                />
              </Box>
            )}
          </Paper>
        )}
      </Container>

      {/* Detalle */}
      <Dialog open={modalOpen} onClose={handleCerrar} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: BURGUNDY, color: '#fff', py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Detalle del Resultado</Typography>
            </Box>
            <IconButton onClick={handleCerrar} size="small" sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {seleccionado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

              {/* Evento */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${BURGUNDY}14`, width: 32, height: 32 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: BURGUNDY }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: BURGUNDY, fontWeight: 700 }}>
                    Información del Evento
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pl: 5.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Evento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {seleccionado.nombreEvento || seleccionado.evento_titulo || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Fecha</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {fmt(seleccionado.fechaEvento || seleccionado.evento_fecha)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Categoría</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{seleccionado.categoria || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Año competitivo</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {seleccionado.añoCompetitivo || seleccionado.ano_competitivo || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Pruebas */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${GREEN}14`, width: 32, height: 32 }}>
                    <TrophyIcon sx={{ fontSize: 18, color: GREEN }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: GREEN, fontWeight: 700 }}>
                    Pruebas y Marcas
                  </Typography>
                </Box>
                {seleccionado.pruebas?.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, pl: 5.5 }}>
                    {seleccionado.pruebas.map((p, i) => (
                      <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#888' }}>{p.nombre || `Prueba ${i + 1}`}</Typography>
                        <Typography variant="h5" sx={{ color: BURGUNDY, fontWeight: 800, mt: .5 }}>
                          {p.marca || '0'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: PURPLE }}>{p.unidad || ''}</Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#999', pl: 5.5 }}>Sin pruebas registradas</Typography>
                )}
              </Box>

              <Divider />

              {/* Info adicional */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${PURPLE}14`, width: 32, height: 32 }}>
                    <PersonIcon sx={{ fontSize: 18, color: PURPLE }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: PURPLE, fontWeight: 700 }}>
                    Información Adicional
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pl: 5.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Municipio</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {seleccionado.municipio || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Club</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {seleccionado.club || seleccionado.club_nombre || '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" sx={{ color: '#888' }}>Lugar de entrenamiento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {seleccionado.lugarEntrenamiento || seleccionado.lugar_entrenamiento || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCerrar} variant="outlined"
            sx={{ color: BURGUNDY, borderColor: BURGUNDY, textTransform: 'none', fontWeight: 600 }}>
            Cerrar
          </Button>
          <Button onClick={() => handleDownloadPDF(seleccionado)} variant="contained" startIcon={<PdfIcon />}
            sx={{ bgcolor: BURGUNDY, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#600018' } }}>
            Descargar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultadosAtleta;