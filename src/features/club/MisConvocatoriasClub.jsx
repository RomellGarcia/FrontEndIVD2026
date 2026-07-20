import React, { useState, useEffect } from 'react';
import { eventosAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, Alert, CircularProgress, Chip, Avatar, Pagination,
} from '@mui/material';
import {
  Event as EventIcon, HowToReg as InscritoIcon, ListAlt as ListAltIcon,
  Groups as GroupsIcon, ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
};

const tableHeadSx = { fontWeight: 700, color: '#fff', fontSize: '0.72rem', textTransform: 'uppercase', py: 2 };

const MisConvocatoriasClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const porPagina = 10;

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    cargarDatos();
  }, [user, navigate]);

  const cargarDatos = async () => {
    try {
      setLoading(true); setErrorMessage('');
      const response = await eventosAPI.getMisInscripcionesClub();
      const data = response.data.inscripciones || response.data || [];
      setInscripciones(data);
      if (data.length === 0) setErrorMessage('Aún no has inscrito a ningún atleta en convocatorias.');
    } catch (err) {
      console.error('Error al cargar inscripciones del club:', err);
      setErrorMessage('Error al cargar las inscripciones de tu club.');
    } finally { setLoading(false); }
  };

  const fmtCorta = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const nombreAtleta = (i) => [i.nombre, i.apellido_paterno, i.apellido_materno].filter(Boolean).join(' ');

  const esProxima = (i) => i.fecha && new Date(i.fecha) >= new Date();
  const totalProximas = inscripciones.filter(esProxima).length;
  const atletasDistintos = new Set(inscripciones.map((i) => i.atleta_id)).size;

  const inscripcionesPaginadas = inscripciones.slice((page - 1) * porPagina, page * porPagina);

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
            IVD · Panel de Club
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Inscripciones de mi Club
          </Typography>
          <Button
            onClick={() => navigate('/club/convocatoria')}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
            sx={{ mt: 2, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', textTransform: 'none', fontWeight: 700 }}
          >
            Ver convocatorias disponibles
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>

        {/* ── Stat-strip ── */}
        <Box sx={{ mt: -6, mb: 4, bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.14)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><ListAltIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{inscripciones.length}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Inscripciones totales</Typography>
          </Box>
          <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><GroupsIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{atletasDistintos}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Atletas distintos</Typography>
          </Box>
          <Box sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{totalProximas}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Eventos próximos</Typography>
          </Box>
        </Box>

        {errorMessage && <Alert severity="info" sx={{ mb: 3 }}>{errorMessage}</Alert>}

        {inscripciones.length === 0 ? (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}><InscritoIcon sx={{ fontSize: 32, color: COLORS.purple }} /></Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>Sin inscripciones registradas</Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5, mb: 3 }}>
              Explora las convocatorias disponibles e inscribe a tus atletas.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/club/convocatoria')}
              sx={{ bgcolor: COLORS.burgundy, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: COLORS.burgundyDark } }}>
              Ver convocatorias disponibles
            </Button>
          </Box>
        ) : (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                  {['Atleta', 'Evento', 'Disciplina', 'Categoría', 'Fecha', 'Estado'].map((h) => (
                    <TableCell key={h} sx={tableHeadSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {inscripcionesPaginadas.map((i) => (
                  <TableRow key={i.id} hover>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{nombreAtleta(i)}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{i.titulo}</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.purple }}>{i.lugar}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{i.disciplina}</TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip label={i.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, bgcolor: 'transparent', color: COLORS.purple }} />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{fmtCorta(i.fecha)}</TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip
                        icon={<InscritoIcon sx={{ fontSize: 16 }} />}
                        label={i.validado ? 'Validado' : 'Inscrito'}
                        size="small"
                        sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {inscripciones.length > porPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={Math.ceil(inscripciones.length / porPagina)} page={page} onChange={(e, v) => setPage(v)} />
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default MisConvocatoriasClub;