import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../common/AuthContext.jsx'; // Importa useAuth
import Swal from 'sweetalert2';

const PRIMARY = "#720F3C";
const GOLD_LIGHT = "#DEDAD0";

const LOGO_IVD =
  "https://res.cloudinary.com/dtnxbeqox/image/upload/v1782881553/IVD_TITULO_th3ydc.png";

const EncabezadoAdministrativo = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const { logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClick = async (key) => {
    switch (key) {
      case 'home':
        navigate('/administrador');
        break;
      case 'gestionClubes':
        navigate('/administrador/gestion-clubes');
        break;
      case 'gestionUsuarios':
        navigate('/administrador/gestionar-atletas');
        break;
      case 'gestionEventos':
        navigate('/administrador/evento');
        break;
      case 'gestionResultados':
        navigate('/administrador/resultados');
        break;
      case 'reportes':
        navigate('/administrador/reportes');
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
            logout();
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');

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

            navigate('/login', { replace: true });
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            logout();
            navigate('/login', { replace: true });
          }
        }
        break;
      default:
        console.log('Opción no reconocida:', key);
    }
  };

  const handleItemClick = (item) => {
    setIsMobileMenuOpen(false);
    handleMenuClick(item.key);
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

  const menu = [
    { texto: 'Inicio', key: 'home', ruta: '/administrador' },
    { texto: 'Gestión de Clubes', key: 'gestionClubes', ruta: '/administrador/gestion-clubes' },
    { texto: 'Gestión de Usuarios', key: 'gestionUsuarios', ruta: '/administrador/gestionar-atletas' },
    { texto: 'Gestión de Eventos', key: 'gestionEventos', ruta: '/administrador/evento' },
    { texto: 'Gestión de Resultados', key: 'gestionResultados', ruta: '/administrador/resultados' },
    { texto: 'Reportes', key: 'reportes', ruta: '/administrador/reportes' },
  ];

  const cerrarSesionItem = { texto: 'Cerrar Sesión', key: 'cerrarSesion', ruta: null };

  const activo = (ruta) => ruta && location.pathname === ruta;

  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        * {
          box-sizing: border-box;
        }

        .ivd-header {
          width: 100%;
          background: #ffffff;
          font-family: "Ubuntu", Arial, Helvetica, sans-serif;
        }

        /* Franja superior dorada, al estilo de ivd.gob.mx / veracruz.gob.mx */
        .ivd-top {
          background-color: ${GOLD_LIGHT};
          background-repeat: repeat-x;
          padding: 15px 0;
        }

        .ivd-brand {
          max-width: 1200px;
          margin: auto;
          display: flex;
          align-items: center;
          padding: 6px 30px;
        }

        .ivd-logo-link {
          display: inline-block;
          margin-right: 40px;
          margin-top: 15px;
          margin-bottom: 15px;
          cursor: pointer;
        }

        .ivd-logo {
          max-width: 500px;
          width: 100%;
          height: auto;
          display: block;
        }

        .ivd-nav {
          background: ${PRIMARY};
          width: 100%;
        }

        .ivd-nav-container {
          max-width: 1280px;
          margin: auto;
          display: flex;
          justify-content: center;
          position: relative;
        }

        .ivd-menu {
          display: flex;
          list-style: none;
          padding: 0px;
          margin: 0;
        }

        .ivd-item {
          cursor: pointer;
          padding: 3px;
        }

        .ivd-link,
        .ivd-login-btn {
          display: block;
          padding: 7px 24px 7px;
          font-size: 1.02em;
          font-weight: 500;
          color: #ffffff;
          text-transform: uppercase;
          transition: .25s;
          white-space: nowrap;
        }

        .ivd-item:hover {
          background: #800020;
        }

        .ivd-item.active {
          background: #800020;
        }

        .mobile-button {
          display: none;
          border: none;
          background: none;
          color: white;
          font-size: 22px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 14px 20px;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }

        /* RESPONSIVE */

        @media (max-width: 992px) {
          .ivd-brand {
            padding: 18px 20px;
            flex-direction: column;
            gap: 16px;
          }

          .ivd-brand-left {
            justify-content: center;
          }

          .ivd-right {
            justify-content: center;
          }

          .ivd-nav-container {
            justify-content: flex-start;
          }

          .mobile-button {
            display: block;
          }

          .ivd-menu {
            display: none;
            flex-direction: column;
            width: 100%;
            background: ${PRIMARY};
          }

          .ivd-menu.open {
            display: flex;
          }

          .ivd-item {
            width: 100%;
            border-top: 1px solid rgba(255, 255, 255, .08);
          }

          .ivd-link,
          .ivd-login-btn {
            padding: 16px 22px;
            white-space: normal;
          }
        }

        @media (max-width: 600px) {
          .ivd-logo {
            max-width: 280px;
          }

          .ivd-social {
            font-size: 21px;
          }
        }
      `}</style>

      <header className="ivd-header" ref={menuRef}>
        {/* Franja superior */}
        <div className="ivd-top"></div>

        {/* Logo */}
        <div className="ivd-brand">
          <div className="ivd-logo-link" onClick={() => handleMenuClick('home')}>
            <img
              src={LOGO_IVD}
              alt="Instituto Veracruzano del Deporte"
              className="ivd-logo"
            />
          </div>
        </div>

        {/* Menú */}
        <nav className="ivd-nav">
          <div className="ivd-nav-container">
            <ul className={`ivd-menu ${isMobileMenuOpen ? "open" : ""}`}>
              {menu.map((item) => (
                <li
                  key={item.key}
                  className={`ivd-item ${activo(item.ruta) ? "active" : ""}`}
                  onClick={() => handleItemClick(item)}
                >
                  <span className="ivd-link">{item.texto}</span>
                </li>
              ))}

              <li
                className="ivd-item ivd-login-item"
                onClick={() => handleItemClick(cerrarSesionItem)}
              >
                <span className="ivd-login-btn">{cerrarSesionItem.texto}</span>
              </li>
            </ul>

            <button
              className="mobile-button"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? "Cerrar" : "Menú"}
            </button>
          </div>
        </nav>
      </header>
    </>
  );
};

export default EncabezadoAdministrativo;