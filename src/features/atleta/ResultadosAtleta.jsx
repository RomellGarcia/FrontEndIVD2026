import { resultadosAPI, perfilEmpresaAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, IconButton, Alert, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider, Pagination,
} from '@mui/material';
import {
  Visibility as ViewIcon, PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon, Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon, SportsScore as SportsIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
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

const tableHeadSx = {
  fontWeight: 700,
  color: '#fff',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  py: 2,
};

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
  const totalPruebas = resultados.reduce((acc, r) => acc + (r.pruebas?.length || 0), 0);
  const disciplinasDistintas = new Set(resultados.map((r) => getDisciplina(r.pruebas))).size;

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
      Swal.fire({ icon: 'success', title: 'PDF Generado', text: 'El reporte se descargó exitosamente', confirmButtonColor: COLORS.burgundy });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Error al generar el PDF: ${error.message}`, confirmButtonColor: COLORS.burgundy });
    }
  };

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
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Atleta
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Mis Resultados
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Historial de participaciones y marcas obtenidas
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>

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
            { icon: <SportsIcon sx={{ fontSize: 24 }} />, value: disciplinasDistintas, label: 'Disciplinas', accent: COLORS.purple },
            { icon: <BarChartIcon sx={{ fontSize: 24 }} />, value: totalPruebas, label: 'Pruebas Registradas', accent: COLORS.burgundy },
          ].map((s, i) => (
            <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.line}` : 'none' }}>
              <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 3, borderRadius: '8px' }}>
            {errorMessage}
          </Alert>
        )}

        {/* ── Contenido ── */}
        {resultados.length === 0 ? (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)', textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>Sin resultados registrados</Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5 }}>
              Los resultados aparecerán aquí una vez que participes en eventos.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                  {['Fecha', 'Evento', 'Disciplina', 'Marca', 'Categoría', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={tableHeadSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {resultadosPaginados.map((r, i) => (
                  <TableRow key={r.id || r._id || i} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                        {fmtCorta(r.fechaEvento || r.evento_fecha)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                        {r.nombreEvento || r.evento_titulo || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: .5, color: COLORS.ink }}>
                        <SportsIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                        {getDisciplina(r.pruebas)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip
                        label={getMarca(r.pruebas)}
                        size="small"
                        sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip
                        label={r.categoria || '—'}
                        size="small"
                        sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Box sx={{ display: 'flex', gap: .5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleVerDetalle(r)}
                          sx={{ color: COLORS.burgundy, '&:hover': { bgcolor: COLORS.lineSoft } }}
                          title="Ver detalles"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(r)}
                          sx={{ color: COLORS.purple, '&:hover': { bgcolor: COLORS.lineSoft } }}
                          title="Descargar PDF"
                        >
                          <PdfIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {resultados.length > porPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${COLORS.line}` }}>
                <Pagination
                  count={Math.ceil(resultados.length / porPagina)}
                  page={page} onChange={(e, v) => setPage(v)}
                  sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: COLORS.burgundy, color: '#fff' } }}
                />
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Detalle */}
      <Dialog open={modalOpen} onClose={handleCerrar} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff', py: 2 }}>
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
                  <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 32, height: 32 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: COLORS.burgundy }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: COLORS.burgundy, fontWeight: 700 }}>
                    Información del Evento
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pl: 5.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Evento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {seleccionado.nombreEvento || seleccionado.evento_titulo || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {fmt(seleccionado.fechaEvento || seleccionado.evento_fecha)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{seleccionado.categoria || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Año competitivo</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {seleccionado.añoCompetitivo || seleccionado.ano_competitivo || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ borderColor: COLORS.line }} />

              {/* Pruebas */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 32, height: 32 }}>
                    <TrophyIcon sx={{ fontSize: 18, color: COLORS.burgundy }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: COLORS.burgundy, fontWeight: 700 }}>
                    Pruebas y Marcas
                  </Typography>
                </Box>
                {seleccionado.pruebas?.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, pl: 5.5 }}>
                    {seleccionado.pruebas.map((p, i) => (
                      <Box key={i} sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}`, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>{p.nombre || `Prueba ${i + 1}`}</Typography>
                        <Typography variant="h5" sx={{ color: COLORS.burgundy, fontWeight: 800, mt: .5 }}>
                          {p.marca || '0'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.purple }}>{p.unidad || ''}</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: COLORS.purple, pl: 5.5 }}>Sin pruebas registradas</Typography>
                )}
              </Box>

              <Divider sx={{ borderColor: COLORS.line }} />

              {/* Info adicional */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 32, height: 32 }}>
                    <PersonIcon sx={{ fontSize: 18, color: COLORS.purple }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: COLORS.purple, fontWeight: 700 }}>
                    Información Adicional
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pl: 5.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Municipio</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {seleccionado.municipio || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Club</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {seleccionado.club || seleccionado.club_nombre || '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar de entrenamiento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {seleccionado.lugarEntrenamiento || seleccionado.lugar_entrenamiento || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCerrar}
            variant="outlined"
            sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 600 }}
          >
            Cerrar
          </Button>
          <Button
            onClick={() => handleDownloadPDF(seleccionado)}
            variant="contained"
            startIcon={<PdfIcon />}
            sx={{ bgcolor: COLORS.burgundy, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: COLORS.burgundyDark } }}
          >
            Descargar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultadosAtleta;