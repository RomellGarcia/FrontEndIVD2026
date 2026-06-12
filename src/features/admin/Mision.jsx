import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Mision = () => {
  const [mision, setMision] = useState({ titulo: '', contenido: '' });
  const [misiones, setMisiones] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMisiones();
  }, []);

  const fetchMisiones = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/contenido/mision');
      const formattedMisiones = response.data.map(m => ({
        _id: m._id,
        titulo: m.titulo || '',
        contenido: m.contenido || '',
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        updatedAt: m.updatedAt ? new Date(m.updatedAt) : null
      }));
      setMisiones(formattedMisiones);
    } catch (err) {
      setError('Error al cargar las misiones. Verifica tu conexión o el servidor.');
      console.error('Error al obtener misiones:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'titulo' && value.length > 255) return;
    if (name === 'contenido' && value.length > 2000) return;
    setMision({ ...mision, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mision.titulo.trim() || !mision.contenido.trim()) {
      MySwal.fire({
        title: '¡Error!',
        text: 'El título y el contenido son obligatorios.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#800020',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { titulo: mision.titulo.trim(), contenido: mision.contenido.trim() };
      let response;

      if (editingId) {
        response = await axios.put(`http://localhost:5000/api/contenido/mision/${editingId}`, payload);
        if (response.status === 200 || response.status === 201) {
          MySwal.fire({
            title: '¡Éxito!',
            text: 'Misión actualizada correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#7A4069',
          });
          // Actualizar la misión en el estado local con verificación de datos
          const misionActualizada = {
            _id: response.data._id,
            titulo: response.data.titulo || '',
            contenido: response.data.contenido || '',
            createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
          };
          setMisiones(misiones.map(m => m._id.toString() === editingId ? misionActualizada : m));
        } else {
          throw new Error(response.data?.message || 'Error desconocido');
        }
      } else {
        response = await axios.post('http://localhost:5000/api/contenido/mision', payload);
        MySwal.fire({
          title: '¡Éxito!',
          text: 'Misión creada correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#7A4069',
        });
        // Como solo puede haber una misión, reemplazar completamente el array
        const nuevaMision = {
          _id: response.data._id,
          titulo: response.data.titulo || '',
          contenido: response.data.contenido || '',
          createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
        };
        setMisiones([nuevaMision]);
      }
      setMision({ titulo: '', contenido: '' });
      setEditingId(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'No se pudo guardar la misión. Intenta de nuevo.';
      MySwal.fire({
        title: '¡Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#800020',
      });
      console.error('Error al guardar misión:', err.response ? err.response.data : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la misión actual y no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#7A4069',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await axios.delete(`http://localhost:5000/api/contenido/mision/${id}`);
        // Limpiar completamente el array de misiones
        setMisiones([]);
        MySwal.fire({
          title: '¡Éxito!',
          text: 'Misión eliminada correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#7A4069',
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'No se pudo eliminar la misión.';
        MySwal.fire({
          title: '¡Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#800020',
        });
        console.error('Error al eliminar misión:', err.response ? err.response.data : err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (mision) => {
    setMision({ titulo: mision.titulo, contenido: mision.contenido });
    setEditingId(mision._id.toString());
  };

  const handleCancel = () => {
    setMision({ titulo: '', contenido: '' });
    setEditingId(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gestión de Misión</h1>
      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          <strong>Nota:</strong> Solo puede existir una misión activa en el sistema. 
          Al crear una nueva misión, se eliminará automáticamente la anterior. 
          Esta misión se mostrará en la sección correspondiente del sitio.
        </p>
      </div>
      {loading && <p style={styles.loading}>Cargando...</p>}
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.flexContainer}>
        <section style={styles.gestionMisionesContainer}>
          <h2 style={styles.subtitle}>Gestionar Misión</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Título (máx. 255 caracteres)</label>
                <input
                  type="text"
                  name="titulo"
                  placeholder="Título de la misión"
                  value={mision.titulo}
                  onChange={handleChange}
                  maxLength={255}
                  required
                  style={styles.input}
                />
                <span style={styles.charCount}>{mision.titulo.length}/255</span>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contenido (máx. 2000 caracteres)</label>
                <textarea
                  name="contenido"
                  placeholder="Contenido de la misión (usa saltos de línea para separar puntos)"
                  value={mision.contenido}
                  onChange={handleChange}
                  maxLength={2000}
                  required
                  style={{ ...styles.input, height: '150px', resize: 'vertical' }}
                />
                <span style={styles.charCount}>{mision.contenido.length}/2000</span>
              </div>
            </div>
            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.editButton} disabled={loading}>
                {editingId ? 'Actualizar Misión' : 'Crear Misión'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} style={styles.cancelButton} disabled={loading}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={styles.misionesGuardadasContainer}>
          <h2 style={styles.subtitle}>Misión Actual</h2>
          {misiones.length === 0 && !loading && <p>No hay misiones guardadas. Crea la primera misión del sistema.</p>}
          {misiones.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Contenido</th>
                  <th style={styles.th}>Fecha de Creación</th>
                  <th style={styles.th}>Última Actualización</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {misiones.map((mision) => (
                  <tr key={mision._id} style={styles.tr}>
                    <td style={styles.td}>{mision.titulo}</td>
                    <td style={styles.td}>
                      <ul style={styles.contentList}>
                        {mision.contenido ? mision.contenido.split('\n').map((item, index) => (
                          item.trim() && <li key={index} style={styles.contentItem}>{item.trim()}</li>
                        )) : <li style={styles.contentItem}>Sin contenido</li>}
                      </ul>
                    </td>
                    <td style={styles.td}>{mision.createdAt.toLocaleString()}</td>
                    <td style={styles.td}>{mision.updatedAt ? mision.updatedAt.toLocaleString() : 'N/A'}</td>
                    <td style={styles.td}>
                      <div style={styles.buttonGroup}>
                        <button
                          style={styles.editButton}
                          onClick={() => handleEdit(mision)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDelete(mision._id.toString())}
                          disabled={loading}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

// Estilos para el componente (sin cambios)
const styles = {
  container: {
    maxWidth: '1100px',
    margin: '30px auto',
    padding: '30px',
    background: '#F5E8C7',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    fontFamily: "'Arial', 'Helvetica', sans-serif",
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '30px',
    textAlign: 'center',
    color: '#800020',
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#800020',
  },
  flexContainer: {
    display: 'flex',
    gap: '25px',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gestionMisionesContainer: {
    flex: '1 1 45%',
    padding: '20px',
    background: '#FFFFFF',
    borderRadius: '15px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.3s ease',
    cursor: 'default',
  },
  misionesGuardadasContainer: {
    flex: '1 1 50%',
    padding: '20px',
    background: '#FFFFFF',
    borderRadius: '15px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontWeight: '700',
    marginBottom: '8px',
    color: '#7A4069',
    fontSize: '15px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '2px solid #D3D0F7',
    backgroundColor: '#FAFAFF',
    transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
    outline: 'none',
    fontWeight: '500',
    color: '#333333',
  },
  charCount: {
    fontSize: '12px',
    color: '#7A4069',
    textAlign: 'right',
    marginTop: '4px',
  },
  buttonGroup: {
    marginTop: '28px',
    display: 'flex',
    gap: '18px',
    justifyContent: 'flex-start',
  },
  editButton: {
    background: '#800020',
    color: '#FFFFFF',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    boxShadow: '0 4px 10px rgba(128, 0, 32, 0.3)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  cancelButton: {
    background: '#7A4069',
    color: '#FFFFFF',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    boxShadow: '0 4px 10px rgba(122, 64, 105, 0.3)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  deleteButton: {
    background: '#D32F2F',
    color: '#FFFFFF',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    boxShadow: '0 4px 10px rgba(211, 47, 47, 0.3)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#800020',
    color: '#FFFFFF',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #F5E8C7',
  },
  tr: {
    borderBottom: '1px solid #EEEEEE',
  },
  td: {
    padding: '12px',
    verticalAlign: 'top',
  },
  contentList: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    margin: '10px 0',
  },
  contentItem: {
    margin: '5px 0',
    color: '#333333',
  },
  loading: {
    textAlign: 'center',
    color: '#7A4069',
    fontSize: '18px',
  },
  error: {
    textAlign: 'center',
    color: '#D32F2F',
    fontSize: '18px',
  },
  infoBox: {
    background: '#E3F2FD',
    border: '2px solid #2196F3',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
  },
  infoText: {
    margin: '0',
    color: '#1976D2',
    fontSize: '14px',
    lineHeight: '1.5',
  },
};

export default Mision;