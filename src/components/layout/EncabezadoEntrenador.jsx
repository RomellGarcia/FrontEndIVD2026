import { perfilEmpresaAPI } from '../../api/index.js';
import React, { useState, useRef, useEffect } from 'react';
import { 
  AppstoreOutlined, LogoutOutlined, HomeOutlined, FileTextOutlined, 
  TeamOutlined, CalendarOutlined, BarChartOutlined, UserOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../common/AuthContext.jsx';
import Swal from 'sweetalert2';

const EncabezadoEntrenador = () => {
  const [active, setActive] = useState('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await perfilEmpresaAPI.get();
        const data = response.data.perfil;
        setNombreEmpresa(data.nombre_empresa || 'Nombre no disponible');
        setLogoUrl(data.logo || '');
      } catch (error) {
        console.error('Error al obtener datos del perfil:', error);
      }
    };

    fetchPerfil();
  }, []);

  const handleClick = (option) => {
    setActive(option);
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const handleMenuClick = async (key) => {
    switch (key) {
      case 'home':
        navigate('/entrenador');
        break;
      case 'perfil':
        navigate('/entrenador/perfil');
        break;
      case 'gestionarAtletas':
        navigate('/entrenador/gestionar-atletas');
        break;

      case 'eventos':
        navigate('/entrenador/eventos');
        break;
      case 'reportes':
        navigate('/entrenador/reportes');
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
        console.log('No se reconoce la acción del menú');
    }
  };



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <style>{`
        .header {
          background: #800020;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1000;
        }

        .logo {
          display: flex;
          align-items: center;
          color: #FFFFFF;
        }

        .logo img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 50%;
          border: 3px solid #F5E8C7;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-right: 15px;
        }

        .logo h3 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita */
        }

        .menu ul {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          align-items: center;
        }

        .menu ul li {
          margin: 0 15px;
          padding: 10px 15px;
          cursor: pointer;
          color: #FFFFFF;
          border-radius: 5px;
          transition: background-color 0.3s ease;
          position: relative;
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita */
        }

        .menu ul li:hover {
          background-color: #F5E8C7;
          color: #333333;
        }

        .menu ul li.active {
          background-color: #7A4069; /* Morado medio - Color activo estandarizado */
          color: #FFFFFF;
          border-radius: 5px;
        }

        .menu ul .dropdown {
          position: relative;
        }

        .menu ul .dropdown span {
          display: flex;
          align-items: center;
          color: #FFFFFF;
          border-radius: 5px;
        }

        .menu ul .dropdown-menu {
          display: ${openDropdown ? 'block' : 'none'};
          position: absolute;
          left: 0;
          top: 100%;
          background-color: #800020;
          list-style: none;
          padding: 10px;
          margin-top: 5px;
          border-radius: 5px;
          z-index: 10;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .menu ul .dropdown-menu li {
          padding: 8px 12px;
          cursor: pointer;
          color: #FFFFFF;
          font-family: 'Arial', 'Helvetica', sans-serif;
        }

        .menu ul .dropdown-menu li:hover {
          background-color: #F5E8C7;
          color: #333333;
        }

        .mobile-menu-icon {
          display: none;
          cursor: pointer;
          flex-direction: column;
          gap: 4px;
        }

        .hamburger {
          width: 25px;
          height: 3px;
          background-color: #FFFFFF;
          transition: background-color 0.3s ease;
        }

        @media (max-width: 768px) {
          .header {
            padding: 10px 15px;
          }
          .menu ul {
            display: none;
            flex-direction: column;
            position: fixed;
            top: 110px;
            left: 0;
            width: 70%;
            height: calc(100% - 110px);
            background-color: #800020;
            padding: 20px;
            transition: left 0.3s ease-in-out;
            box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
            z-index: 999;
          }

          .menu.menu-open ul {
            display: flex;
            left: 0;
          }

          .menu ul li {
            padding: 15px;
            border-bottom: 1px solid #F5E8C7;
            text-align: right;
            color: #FFFFFF;
            font-family: 'Arial', 'Helvetica', sans-serif;
          }

          .menu ul li:hover {
            background-color: #F5E8C7;
            color: #333333;
          }

          .mobile-menu-icon {
            display: flex;
          }

          .logo img {
            width: 80px;
            height: 80px;
            max-height: 80px;
            margin-right: 10px;
            border: none;
            box-shadow: none;
          }

          .logo h3 {
            font-size: 1.2rem;
            font-family: 'Arial', 'Helvetica', sans-serif;
          }
        }
      `}</style>

      <header className="header">
        <div className="logo">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo de la Empresa"
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
            <li onClick={() => handleMenuClick('home')}>
              <HomeOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Inicio
            </li>
            <li onClick={() => handleMenuClick('gestionarAtletas')}>
              <TeamOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Gestionar Atletas
            </li>

            <li onClick={() => handleMenuClick('eventos')}>
              <TrophyOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Eventos
            </li>
            <li onClick={() => handleMenuClick('reportes')}>
              <BarChartOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Reportes
            </li>
            <li onClick={() => handleMenuClick('perfil')}>
              <UserOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Perfil
            </li>
            <li onClick={() => handleMenuClick('cerrarSesion')}>
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

export default EncabezadoEntrenador;
