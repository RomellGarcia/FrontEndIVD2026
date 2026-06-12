import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:5000';

const VerificarCodigo = () => {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { gmail } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/recuperar/verify-code`, { gmail, code: codigo });
      Swal.fire({
        icon: 'success',
        title: 'Código verificado',
        text: 'El código es correcto. Ahora puedes restablecer tu contraseña.',
      });
      navigate('/restablecer-password', { state: { gmail, code: codigo } });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'El código es incorrecto o expiró.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', background: '#F5E8C7', padding: 24, borderRadius: 12, fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
      <h2 style={{ color: '#800020', textAlign: 'center', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>Verificar Código</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Código de recuperación"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          required
          style={{ width: '100%', padding: 12, borderRadius: 6, border: '1.5px solid #7A4069', marginBottom: 16, fontFamily: "'Arial', 'Helvetica', sans-serif" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', background: '#800020', color: '#fff', padding: 12, border: 'none', borderRadius: 6, fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}
        >
          {loading ? 'Verificando...' : 'Verificar Código'}
        </button>
      </form>
    </div>
  );
};

export default VerificarCodigo; 