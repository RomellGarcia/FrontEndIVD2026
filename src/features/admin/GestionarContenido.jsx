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
  ContactMail as ContactMailIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Twitter as TwitterIcon,
} from '@mui/icons-material';
import { contenidoAPI, perfilEmpresaAPI } from '../../api/index.js';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import Swal from 'sweetalert2';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: '#8000202E',
  lineSoft: '#80002014',
};

const cardSx = {
  bgcolor: COLORS.paper,
  borderRadius: '10px',
  boxShadow: '0 2px 12px #80002012',
};

// Tipos de contenido institucional
const TIPOS = [
  { tipo: 'vision', label: 'Visión', icon: <VisibilityIcon sx={{ fontSize: 18 }} /> },
  { tipo: 'mision', label: 'Misión', icon: <FlagIcon sx={{ fontSize: 18 }} /> },
  { tipo: 'terminos', label: 'Términos y Condiciones', icon: <DescriptionIcon sx={{ fontSize: 18 }} /> },
  { tipo: 'politica', label: 'Política de Privacidad', icon: <GavelIcon sx={{ fontSize: 18 }} /> },
];

// Valores iniciales para el formulario de contacto
const PERFIL_VACIO = { facebook: '', instagram: '', twitter: '', telefono: '', correo: '', direccion: '' };

// Convierte el perfil de la API al formato del formulario
const perfilDesdeApi = (perfil) => ({
  facebook: perfil?.redes_sociales?.find((r) => r.plataforma === 'facebook')?.url || '',
  instagram: perfil?.redes_sociales?.find((r) => r.plataforma === 'instagram')?.url || '',
  twitter: perfil?.redes_sociales?.find((r) => r.plataforma === 'twitter')?.url || '',
  telefono: perfil?.telefono || '',
  correo: perfil?.correo || '',
  direccion: perfil?.direccion || '',
});

// Campos del formulario de contacto
const CAMPOS_CONTACTO = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/tu-pagina', icon: <FacebookIcon sx={{ fontSize: 18 }} /> },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/tu-cuenta', icon: <InstagramIcon sx={{ fontSize: 18 }} /> },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/tu-cuenta', icon: <TwitterIcon sx={{ fontSize: 18 }} /> },
  { key: 'telefono', label: 'WhatsApp / Teléfono *', placeholder: '7711234567 (exactamente 10 dígitos)', icon: <WhatsAppIcon sx={{ fontSize: 18 }} /> },
  { key: 'correo', label: 'Correo electrónico *', placeholder: 'contacto@ivd.gob.mx', icon: <EmailIcon sx={{ fontSize: 18 }} /> },
  { key: 'direccion', label: 'Dirección', placeholder: 'Calle, colonia, ciudad, estado', icon: <ContactMailIcon sx={{ fontSize: 18 }} /> },
];

// Formatea fecha para mostrarla
const formatearFecha = (fecha) => {
  if (!fecha) return null;
  try {
    return new Date(fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return null; }
};

// Parsea el texto de la plantilla separando título y contenido
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
  const [pestaniaActiva, setPestaniaActiva] = useState('vision');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState('');
  const inputArchivoRef = useRef(null);

  // Contenido guardado por tipo
  const [contenidos, setContenidos] = useState({});
  const [formulario, setFormulario] = useState({ titulo: '', contenido: '' });

  // Pestaña de contacto (independiente)
  const [pestaniaContacto, setPestaniaContacto] = useState(false);
  const [formularioPerfil, setFormularioPerfil] = useState({ ...PERFIL_VACIO });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  useEffect(() => { cargarContenido(); cargarPerfilEmpresa(); }, []);

  useEffect(() => {
    const actual = contenidos[pestaniaActiva];
    setFormulario({ titulo: actual?.titulo || '', contenido: actual?.contenido || '' });
  }, [pestaniaActiva, contenidos]);

  // Carga el contenido institucional desde el backend
  const cargarContenido = async () => {
    try {
      setCargando(true);
      const resultados = await Promise.all(
        TIPOS.map(async ({ tipo }) => {
          try {
            const res = await contenidoAPI.get(tipo);
            const data = res.data?.contenido || res.data || {};
            return [tipo, data];
          } catch {
            return [tipo, null];
          }
        })
      );
      setContenidos(Object.fromEntries(resultados));
    } catch (err) {
      console.error('Error al cargar contenido institucional:', err);
      setError('Error al cargar el contenido institucional.');
    } finally {
      setCargando(false);
    }
  };

  // Carga el perfil de la empresa (contacto y redes sociales)
  const cargarPerfilEmpresa = async () => {
    try {
      const res = await perfilEmpresaAPI.get();
      setFormularioPerfil(perfilDesdeApi(res.data?.perfil));
    } catch (err) {
      console.error('Error al cargar el perfil de contacto:', err);
      // Si no hay perfil, se deja el formulario vacío
    }
  };

  // Guarda el contenido institucional
  const manejarGuardarContenido = async () => {
    if (!formulario.titulo.trim() || !formulario.contenido.trim()) {
      Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'El título y el contenido son obligatorios.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    try {
      setGuardando(true);
      await contenidoAPI.update(pestaniaActiva, { titulo: formulario.titulo.trim(), contenido: formulario.contenido.trim() });
      await cargarContenido();
      Swal.fire({ icon: 'success', title: 'Guardado', text: 'El contenido se actualizó correctamente.', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('Error al guardar:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'No se pudo guardar el contenido.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setGuardando(false);
    }
  };

  // Guarda el perfil de contacto y redes sociales
  const manejarGuardarContacto = async () => {
    if (!formularioPerfil.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formularioPerfil.correo.trim())) {
      Swal.fire({ icon: 'warning', title: 'Correo inválido', text: 'Escribe un correo electrónico válido — es obligatorio.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    const telefonoLimpio = formularioPerfil.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length !== 10) {
      Swal.fire({ icon: 'warning', title: 'Teléfono inválido', text: 'El teléfono/WhatsApp debe tener exactamente 10 dígitos — es obligatorio.', confirmButtonColor: COLORS.burgundy });
      return;
    }

    try {
      setGuardandoPerfil(true);
      const redes = [
        { plataforma: 'facebook', url: formularioPerfil.facebook.trim() },
        { plataforma: 'instagram', url: formularioPerfil.instagram.trim() },
        { plataforma: 'twitter', url: formularioPerfil.twitter.trim() },
      ].filter((r) => r.url);

      await perfilEmpresaAPI.update({
        redes,
        telefono: telefonoLimpio,
        correo: formularioPerfil.correo.trim(),
        direccion: formularioPerfil.direccion.trim(),
        mostrar_whatsapp: true,
      });
      await cargarPerfilEmpresa();
      // Notifica a cualquier componente de pie de página que los datos cambiaron
      window.dispatchEvent(new Event('perfilEmpresaActualizado'));
      Swal.fire({ icon: 'success', title: 'Guardado', text: 'Los datos de contacto se actualizaron correctamente.', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('Error al guardar contacto:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'No se pudo guardar la información de contacto.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // Maneja la selección de archivo para importar desde Word
  const manejarArchivoSeleccionado = async (e) => {
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
      setFormulario((prev) => ({
        titulo: titulo || prev.titulo,
        contenido: contenido || textoExtraido.trim(),
      }));
      Swal.fire({ icon: 'success', title: 'Texto importado', text: 'Revisa el contenido antes de guardar.', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('Error al leer el archivo:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo leer el archivo. Verifica que no esté dañado.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setImportando(false);
      if (inputArchivoRef.current) inputArchivoRef.current.value = '';
    }
  };

  // Descarga la plantilla Word con el contenido actual
  const manejarDescargarPlantillaWord = async () => {
    try {
      const tipoActivo = TIPOS.find((t) => t.tipo === pestaniaActiva);
      const registroActivo = contenidos[pestaniaActiva];
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
      a.download = `Plantilla_${pestaniaActiva}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al generar la plantilla Word:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar la plantilla de Word.', confirmButtonColor: COLORS.burgundy });
    }
  };

  const tipoActivo = TIPOS.find((t) => t.tipo === pestaniaActiva);
  const registroActivo = contenidos[pestaniaActiva];

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      {/* Cabecera superior */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, md: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel Administrativo
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Contenido Institucional
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Visión, misión, términos y política de privacidad del sitio
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 }, pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 7 } }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError('')}>{error}</Alert>}

        {/* Selector de pestañas */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {TIPOS.map(({ tipo, label, icon }) => (
            <Button
              key={tipo}
              onClick={() => { setPestaniaActiva(tipo); setPestaniaContacto(false); }}
              startIcon={icon}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                px: 2,
                bgcolor: !pestaniaContacto && pestaniaActiva === tipo ? COLORS.burgundy : COLORS.paper,
                color: !pestaniaContacto && pestaniaActiva === tipo ? '#fff' : COLORS.ink,
                border: `1px solid ${!pestaniaContacto && pestaniaActiva === tipo ? COLORS.burgundy : COLORS.line}`,
                boxShadow: !pestaniaContacto && pestaniaActiva === tipo ? '0 2px 8px #80002040' : 'none',
                '&:hover': { bgcolor: !pestaniaContacto && pestaniaActiva === tipo ? COLORS.burgundyDark : COLORS.lineSoft },
              }}
            >
              {label}
            </Button>
          ))}
          <Button
            onClick={() => setPestaniaContacto(true)}
            startIcon={<ContactMailIcon sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              px: 2,
              bgcolor: pestaniaContacto ? COLORS.burgundy : COLORS.paper,
              color: pestaniaContacto ? '#fff' : COLORS.ink,
              border: `1px solid ${pestaniaContacto ? COLORS.burgundy : COLORS.line}`,
              boxShadow: pestaniaContacto ? '0 2px 8px #80002040' : 'none',
              '&:hover': { bgcolor: pestaniaContacto ? COLORS.burgundyDark : COLORS.lineSoft },
            }}
          >
            Contacto y Redes Sociales
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.3fr' }, gap: { xs: 2, md: 3 } }}>
          {/* Vista previa del contenido actual */}
          <Box sx={{ ...cardSx, p: { xs: 2, sm: 3 } }}>
            <Typography sx={{ color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
              Contenido actual
            </Typography>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
              {pestaniaContacto ? 'Contacto y Redes Sociales' : tipoActivo?.label}
            </Typography>
            <Divider sx={{ mb: 2, borderColor: COLORS.line }} />

            {pestaniaContacto ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {CAMPOS_CONTACTO.map(({ key, label, icon }) => {
                  const valor = formularioPerfil[key];
                  return (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ color: COLORS.burgundy, display: 'flex' }}>{icon}</Box>
                      <Typography variant="caption" sx={{ color: COLORS.purple, fontWeight: 700, minWidth: 110 }}>{label}</Typography>
                      <Typography variant="body2" sx={{ color: valor ? COLORS.ink : COLORS.purple, opacity: valor ? 1 : 0.6 }}>
                        {valor || 'Sin definir'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : !registroActivo ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                Todavía no hay contenido guardado para "{tipoActivo?.label}".
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1 }}>{registroActivo.titulo}</Typography>
                <Typography variant="body2" sx={{ color: COLORS.ink, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {registroActivo.contenido}
                </Typography>
                {formatearFecha(registroActivo.updatedAt) && (
                  <Chip
                    icon={<HistoryIcon sx={{ fontSize: 14, color: `${COLORS.purple} !important` }} />}
                    label={`Última actualización: ${formatearFecha(registroActivo.updatedAt)}`}
                    size="small"
                    sx={{ mt: 2, bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.purple, fontSize: '0.7rem' }}
                  />
                )}
              </>
            )}
          </Box>

          {/* Formulario de edición */}
          <Box sx={{ ...cardSx, p: { xs: 2, sm: 3 } }}>
            <Typography sx={{ color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
              Editar
            </Typography>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
              {pestaniaContacto ? 'Contacto y Redes Sociales' : tipoActivo?.label}
            </Typography>
            <Divider sx={{ mb: 2, borderColor: COLORS.line }} />

            {pestaniaContacto ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {CAMPOS_CONTACTO.map(({ key, label, placeholder, icon }) => (
                  <TextField
                    key={key}
                    fullWidth
                    size="small"
                    label={label}
                    placeholder={placeholder}
                    value={formularioPerfil[key]}
                    onChange={(e) => setFormularioPerfil((p) => ({ ...p, [key]: e.target.value }))}
                    slotProps={{ input: { startAdornment: <Box sx={{ color: COLORS.burgundy, mr: 1, display: 'flex' }}>{icon}</Box> } }}
                  />
                ))}
                <Typography variant="caption" sx={{ color: COLORS.purple, opacity: 0.8 }}>
                  Los campos con * son obligatorios. En Facebook/Instagram/Twitter, deja el campo vacío para que ese ícono no aparezca en el pie de página.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={manejarGuardarContacto}
                    disabled={guardandoPerfil}
                    sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none' }}
                  >
                    {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Título"
                  value={formulario.titulo}
                  onChange={(e) => setFormulario((p) => ({ ...p, titulo: e.target.value }))}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Contenido"
                  value={formulario.contenido}
                  onChange={(e) => setFormulario((p) => ({ ...p, contenido: e.target.value }))}
                  multiline
                  minRows={8}
                  placeholder="Escribe el contenido aquí, o impórtalo desde un archivo Word o Excel abajo."
                />

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={manejarDescargarPlantillaWord}
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
                    ref={inputArchivoRef}
                    type="file"
                    accept=".docx"
                    hidden
                    onChange={manejarArchivoSeleccionado}
                  />
                  <Button
                    variant="outlined"
                    startIcon={importando ? <CircularProgress size={16} /> : <UploadFileIcon />}
                    onClick={() => inputArchivoRef.current?.click()}
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
                    onClick={manejarGuardarContenido}
                    disabled={guardando}
                    sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none' }}
                  >
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default GestionContenido;