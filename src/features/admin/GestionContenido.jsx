import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, Button, TextField, Alert,
  CircularProgress, Divider, Chip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Flag as FlagIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  Save as SaveIcon,
  UploadFile as UploadFileIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { contenidoAPI } from '../../api/index.js';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import Swal from 'sweetalert2';

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

// Los 4 tipos de contenido, con el `tipo` exacto que espera /api/contenido/:tipo
const TIPOS = [
  { tipo: 'vision', label: 'Visión', icon: <VisibilityIcon sx={{ fontSize: 18 }} /> },
  { tipo: 'mision', label: 'Misión', icon: <FlagIcon sx={{ fontSize: 18 }} /> },
  { tipo: 'terminos', label: 'Términos y Condiciones', icon: <DescriptionIcon sx={{ fontSize: 18 }} /> },
  { tipo: 'politica', label: 'Política de Privacidad', icon: <GavelIcon sx={{ fontSize: 18 }} /> },
];

const formatFecha = (fecha) => {
  if (!fecha) return null;
  try {
    return new Date(fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return null; }
};

// Si el archivo trae las etiquetas "Título:" / "Contenido:" cada una SOLA en
// su propio renglón (como las pone la plantilla descargable), separa ambos
// campos. Exigir que la etiqueta esté sola en su línea evita que se confunda
// con una mención de esas mismas palabras dentro de una oración (como la de
// las instrucciones de la propia plantilla).
const parsearPlantilla = (texto) => {
  const lineas = texto.split('\n');
  const esEtiqueta = (linea, palabra) => new RegExp(`^${palabra}:\\s*$`, 'i').test(linea.trim());

  const idxTitulo = lineas.findIndex((l) => esEtiqueta(l, 'T[ií]tulo'));
  const idxContenido = lineas.findIndex((l) => esEtiqueta(l, 'Contenido'));

  if (idxTitulo === -1 && idxContenido === -1) {
    return { titulo: '', contenido: texto.trim() };
  }

  let titulo = '';
  if (idxTitulo !== -1) {
    const finTitulo = idxContenido !== -1 && idxContenido > idxTitulo ? idxContenido : lineas.length;
    titulo = lineas.slice(idxTitulo + 1, finTitulo).map((l) => l.trim()).filter(Boolean).join(' ');
  }

  let contenido = '';
  if (idxContenido !== -1) {
    contenido = lineas.slice(idxContenido + 1)
      .map((l) => l.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return { titulo, contenido };
};

const GestionContenido = () => {
  const [tabActivo, setTabActivo] = useState('vision');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Un registro por tipo: { titulo, contenido, updatedAt }
  const [contenidos, setContenidos] = useState({});
  const [form, setForm] = useState({ titulo: '', contenido: '' });

  useEffect(() => { cargarTodo(); }, []);

  useEffect(() => {
    const actual = contenidos[tabActivo];
    setForm({ titulo: actual?.titulo || '', contenido: actual?.contenido || '' });
  }, [tabActivo, contenidos]);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const resultados = await Promise.all(
        TIPOS.map(async ({ tipo }) => {
          try {
            const res = await contenidoAPI.get(tipo);
            const data = res.data?.contenido || res.data || {};
            return [tipo, data];
          } catch {
            // Todavía no existe contenido para este tipo — no es un error real.
            return [tipo, null];
          }
        })
      );
      setContenidos(Object.fromEntries(resultados));
    } catch (err) {
      console.error('Error al cargar contenido institucional:', err);
      setError('Error al cargar el contenido institucional.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'El título y el contenido son obligatorios.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    try {
      setGuardando(true);
      await contenidoAPI.update(tabActivo, { titulo: form.titulo.trim(), contenido: form.contenido.trim() });
      await cargarTodo();
      Swal.fire({ icon: 'success', title: 'Guardado', text: 'El contenido se actualizó correctamente.', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('Error al guardar:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'No se pudo guardar el contenido.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setGuardando(false);
    }
  };

  const handleArchivoSeleccionado = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true);
    try {
      const extension = file.name.split('.').pop().toLowerCase();
      const buffer = await file.arrayBuffer();
      let textoExtraido = '';

      if (extension === 'docx') {
        const resultado = await mammoth.extractRawText({ arrayBuffer: buffer });
        textoExtraido = resultado.value;
      } else {
        Swal.fire({ icon: 'error', title: 'Formato no soportado', text: 'Solo se aceptan archivos .docx.', confirmButtonColor: COLORS.burgundy });
        return;
      }

      if (!textoExtraido.trim()) {
        Swal.fire({ icon: 'warning', title: 'Archivo vacío', text: 'No se encontró texto en el archivo.', confirmButtonColor: COLORS.burgundy });
        return;
      }

      const { titulo, contenido } = parsearPlantilla(textoExtraido);
      setForm((prev) => ({
        titulo: titulo || prev.titulo,
        contenido: contenido || textoExtraido.trim(),
      }));
      Swal.fire({ icon: 'success', title: 'Texto importado', text: 'Revisa el contenido antes de guardar.', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('Error al leer el archivo:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo leer el archivo. Verifica que no esté dañado.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDescargarPlantillaWord = async () => {
    try {
      const tituloActual = registroActivo?.titulo || `Escribe aquí el título de ${tipoActivo?.label}`;
      const contenidoActual = registroActivo?.contenido || 'Escribe aquí el contenido completo. Puedes usar varios párrafos.';

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: `Plantilla — ${tipoActivo?.label}`, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({
              children: [new TextRun({
                text: 'No borres las etiquetas "Título:" y "Contenido:" — el sistema las usa para separar ambos campos al volver a subir este archivo.',
                italics: true,
              })],
              spacing: { after: 300 },
            }),
            new Paragraph({ children: [new TextRun({ text: 'Título:', bold: true })] }),
            new Paragraph({ text: tituloActual, spacing: { after: 300 } }),
            new Paragraph({ children: [new TextRun({ text: 'Contenido:', bold: true })] }),
            ...contenidoActual.split('\n').map((linea) => new Paragraph({ text: linea })),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Plantilla_${tabActivo}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al generar la plantilla Word:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar la plantilla de Word.', confirmButtonColor: COLORS.burgundy });
    }
  };

  const tipoActivo = TIPOS.find((t) => t.tipo === tabActivo);
  const registroActivo = contenidos[tabActivo];

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
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, md: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel Administrativo
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Contenido Institucional
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Visión, misión, términos y política de privacidad del sitio
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 }, pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 7 } }}>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError('')}>{error}</Alert>}

        {/* ── Selector de tipo (tabs) ── */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {TIPOS.map(({ tipo, label, icon }) => (
            <Button
              key={tipo}
              onClick={() => setTabActivo(tipo)}
              startIcon={icon}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                px: 2,
                bgcolor: tabActivo === tipo ? COLORS.burgundy : COLORS.paper,
                color: tabActivo === tipo ? '#fff' : COLORS.ink,
                border: `1px solid ${tabActivo === tipo ? COLORS.burgundy : COLORS.line}`,
                boxShadow: tabActivo === tipo ? '0 2px 8px rgba(128,0,32,0.25)' : 'none',
                '&:hover': { bgcolor: tabActivo === tipo ? COLORS.burgundyDark : COLORS.lineSoft },
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.3fr' }, gap: 3 }}>

          {/* ── Vista previa del contenido actual ── */}
          <Box sx={{ ...cardSx, p: 3 }}>
            <Typography sx={{ color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
              Contenido actual
            </Typography>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
              {tipoActivo?.label}
            </Typography>
            <Divider sx={{ mb: 2, borderColor: COLORS.line }} />

            {!registroActivo ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                Todavía no hay contenido guardado para "{tipoActivo?.label}".
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1 }}>{registroActivo.titulo}</Typography>
                <Typography variant="body2" sx={{ color: COLORS.ink, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {registroActivo.contenido}
                </Typography>
                {formatFecha(registroActivo.updatedAt) && (
                  <Chip
                    icon={<HistoryIcon sx={{ fontSize: 14, color: `${COLORS.purple} !important` }} />}
                    label={`Última actualización: ${formatFecha(registroActivo.updatedAt)}`}
                    size="small"
                    sx={{ mt: 2, bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.purple, fontSize: '0.7rem' }}
                  />
                )}
              </>
            )}
          </Box>

          {/* ── Formulario de edición ── */}
          <Box sx={{ ...cardSx, p: 3 }}>
            <Typography sx={{ color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
              Editar
            </Typography>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
              {tipoActivo?.label}
            </Typography>
            <Divider sx={{ mb: 2, borderColor: COLORS.line }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Título"
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                size="small"
              />
              <TextField
                fullWidth
                label="Contenido"
                value={form.contenido}
                onChange={(e) => setForm((p) => ({ ...p, contenido: e.target.value }))}
                multiline
                minRows={8}
                placeholder="Escribe el contenido aquí, o impórtalo desde un archivo Word o Excel abajo."
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDescargarPlantillaWord}
                  sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }}
                >
                  Plantilla Word
                </Button>
              </Box>
              <Typography variant="caption" sx={{ color: COLORS.purple, opacity: 0.8, mt: -1 }}>
                La plantilla trae precargado el contenido actual (o instrucciones si aún no hay nada) — edítala y vuelve a subirla abajo.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  hidden
                  onChange={handleArchivoSeleccionado}
                />
                <Button
                  variant="outlined"
                  startIcon={importando ? <CircularProgress size={16} /> : <UploadFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importando}
                  sx={{ color: COLORS.purple, borderColor: COLORS.purple, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }}
                >
                  Importar desde Word
                </Button>
                <Typography variant="caption" sx={{ color: COLORS.purple, opacity: 0.8 }}>
                  Reemplaza el contenido de arriba con el texto del archivo — revísalo antes de guardar.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleGuardar}
                  disabled={guardando}
                  sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none' }}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default GestionContenido;