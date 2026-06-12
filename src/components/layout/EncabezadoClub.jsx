import { perfilEmpresaAPI } from '../../api/index.js';
import React, { useState, useRef, useEffect } from 'react';
import { 
  HomeOutlined, 
  LogoutOutlined, 
  UserOutlined, 
  ShopOutlined, 
  ProfileOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  TrophyOutlined
} from '@ant-design/icons';
import { Sports as SportsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../common/AuthContext.jsx'; // Ajusta la ruta
import Swal from 'sweetalert2';

const EncabezadoClub = () => {
  const { user, logout } = useAuth(); // Integración con autenticación
  const [active, setActive] = useState('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await perfilEmpresaAPI.get();
        const data = response.data.perfil;
        setNombreEmpresa(data.nombre_empresa || 'Club no disponible');
        setLogoUrl(data.logo || '');
      } catch (error) {
        console.error('Error al obtener datos del perfil:', error);
        setNombreEmpresa('Club no disponible');
        setLogoUrl('');
      }
    };

    fetchPerfil();
  }, []);

  const handleClick = (option) => {
    setActive(option);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClick = async (key) => {
    switch (key) {
      case 'inicio':
        navigate('/club');
        break;
      case 'gestionAtletas':
        navigate('/club/gestionAtletas');
        break;
      case 'eventos':
        navigate('/club/eventos');
        break;
      case 'resultados':
        navigate('/club/resultados');
        break;
      case 'perfil':
        navigate('/club/perfil');
        break;

      case 'cerrarSesion':
        const result = await Swal.fire({
          title: '¿Confirmar cierre de sesión?',
          text: '¿Estás seguro de que deseas cerrar sesión?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#800020',
          cancelButtonColor: '#7A4069',
          confirmButtonText: 'Sí, cerrar sesión',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          try {
            // Primero hacer logout del contexto para limpiar el estado inmediatamente
            logout();
            
            // Luego limpiar el almacenamiento (usar sessionStorage para ser consistente con AuthContext)
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
            
            // Finalmente intentar hacer logout del servidor
            try {
              await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
            } catch (serverError) {
              console.log('Error del servidor al cerrar sesión (no crítico):', serverError);
            }
            
            // Redirigir inmediatamente
            navigate('/login', { replace: true });
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Asegurar que el logout se complete incluso si hay error
            logout();
            navigate('/login', { replace: true });
          }
        }
        break;
      default:
        console.log('Opción no reconocida:', key);
    }
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <style>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #800020; /* Granada/vino */
          color: #FFFFFF; /* Blanco */
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía aplicada al header */
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .logo {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .logo img {
          width: 100px; /* Aumentado para mejor visibilidad */
          height: 100px; /* Aumentado para mejor visibilidad */
          max-width: 100%; /* Ajuste dinámico */
          max-height: 100px; /* Límite máximo */
          margin-right: 10px; /* Espacio ajustado */
          object-fit: contain; /* Asegura que no se corte */
          border: none; /* Eliminamos el borde */
          box-shadow: none; /* Eliminamos la sombra */
        }

        .logo h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #FFFFFF; /* Blanco */
          margin: 0;
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita */
        }

        .menu ul {
          display: flex;
          gap: 15px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .menu ul li {
          font-size: 1rem;
          cursor: pointer;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #FFFFFF; /* Blanco */
          transition: background-color 0.3s ease;
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita */
        }

        .menu ul li:hover {
          background-color: #F5E8C7; /* Beige claro */
          color: #333333; /* Gris oscuro */
          border-radius: 5px;
        }

        .menu ul li.active {
          background-color: #7A4069; /* Morado medio */
          color: #FFFFFF; /* Blanco */
          border-radius: 5px;
        }

        .mobile-menu-icon {
          display: none;
          flex-direction: column;
          cursor: pointer;
          gap: 4px;
        }

        .hamburger {
          width: 25px;
          height: 3px;
          background-color: #FFFFFF; /* Blanco */
          transition: background-color 0.3s ease;
        }

        @media (max-width: 768px) {
          .menu ul {
            display: none;
            flex-direction: column;
            position: fixed;
            top: 110px; /* Ajustado para el logo más grande */
            left: -100%;
            width: 70%;
            height: calc(100% - 110px); /* Ajustado para el logo */
            background-color: #800020; /* Granada/vino */
            padding: 20px;
            transition: left 0.3s ease-in-out;
            box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
            z-index: 999;
          }

          .menu.menu-open ul {
            display: flex;
            left: 0;
          }

          .mobile-menu-icon {
            display: flex;
          }

          .logo img {
            width: 80px; /* Ajustado para móvil */
            height: 80px; /* Ajustado para móvil */
            max-height: 80px; /* Límite máximo */
            margin-right: 10px; /* Espacio ajustado */
            border: none; /* Eliminamos el borde */
            box-shadow: none; /* Eliminamos la sombra */
          }

          .logo h3 {
            font-size: 1rem; /* Ajustado para móvil */
            font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita en móvil */
          }
        }
      `}</style>

      <header className="header">
        <div className="logo">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo del Club"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '3px solid #800020',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginRight: '10px',
              }}
            />
          )}
          <h3>{nombreEmpresa}</h3>
        </div>
        <nav className={`menu ${isMobileMenuOpen ? 'menu-open' : ''}`} ref={menuRef}>
          <ul>
            <li
              className={active === 'inicio' ? 'active' : ''}
              onClick={() => {
                handleClick('inicio');
                handleMenuClick('inicio');
              }}
            >
              <HomeOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Inicio
            </li>
            <li
              className={active === 'gestionAtletas' ? 'active' : ''}
              onClick={() => {
                handleClick('gestionAtletas');
                handleMenuClick('gestionAtletas');
              }}
            >
              <TeamOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Gestionar
            </li>
            <li
              className={active === 'eventos' ? 'active' : ''}
              onClick={() => {
                handleClick('eventos');
                handleMenuClick('eventos');
              }}
            >
              <CalendarOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Eventos
            </li>
            <li
              className={active === 'resultados' ? 'active' : ''}
              onClick={() => {
                handleClick('resultados');
                handleMenuClick('resultados');
              }}
            >
              <TrophyOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Resultados
            </li>
            <li
              className={active === 'perfil' ? 'active' : ''}
              onClick={() => {
                handleClick('perfil');
                handleMenuClick('perfil');
              }}
            >
              <ProfileOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Perfil
            </li>

            <li
              className={active === 'cerrarSesion' ? 'active' : ''}
              onClick={() => {
                handleClick('cerrarSesion');
                handleMenuClick('cerrarSesion');
              }}
            >
              <LogoutOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Cerrar Sesión
            </li>
          </ul>
        </nav>
        <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
          <div className="hamburger"></div>
          <div className="hamburger"></div>
          <div className="hamburger"></div>
        </div>
      </header>
    </>
  );
};

export default EncabezadoClub;