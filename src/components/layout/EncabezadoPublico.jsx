import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";


const PRIMARY = "#720F3C";
const GOLD_LIGHT = "#DEDAD0";
const GOLD_LIGHT_ALT = "#DDDAD0";
const MUSTARD = "#AA983F";
const DARK_TEXT = "#49453C";
const MOBILE_BG = "#333333";
const MOBILE_ROW = "#49453C";
const MOBILE_ROW_HOVER = "#6b6767";

const LOGO_IVD =
  "https://res.cloudinary.com/dtnxbeqox/image/upload/v1782881553/IVD_TITULO_th3ydc.png";

const EncabezadoPublico = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);
  const menuRef = useRef(null);

  React.useEffect(() => {
    const cerrar = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenu(false);
      }
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const navegar = (ruta) => {
    navigate(ruta);
    setMobileMenu(false);
  };

  const menu = [
    { texto: "Inicio", ruta: "/" },
    { texto: "Eventos", ruta: "/eventos-publico" },
    { texto: "Resultados", ruta: "/resultados-publico" },
  ];

  const loginItem = { texto: "Iniciar Sesión", ruta: "/login" };

  const activo = (ruta) => location.pathname === ruta;

  React.useEffect(() => {
    document.body.style.overflow = mobileMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu]);

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
          padding: 7px 35px 7px;
          font-size: 1.064em;
          font-weight: 500;
          color: #ffffff;
          text-transform: uppercase;
          transition: .25s;
        }

        .ivd-item:hover {
          background: #800020;
        }

        .ivd-item.active {
          background: #800020;
        }

        .ivd-menu-close {
          display: none;
        }

        /* Botón hamburguesa: 3 líneas que se transforman en X */
        .mobile-button {
          display: none;
          position: relative;
          border: none;
          background: none;
          padding: 0;
          margin: 14px 20px;
          width: 28px;
          height: 22px;
          cursor: pointer;
          z-index: 1002;
        }

        .mobile-button span {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2.5px;
          background: #ffffff;
          border-radius: 2px;
          transition: transform .3s ease, opacity .3s ease, top .3s ease;
        }

        .mobile-button span:nth-child(1) { top: 0; }
        .mobile-button span:nth-child(2) { top: 9.5px; }
        .mobile-button span:nth-child(3) { top: 19px; }

        .mobile-button.open span:nth-child(1) {
          top: 9.5px;
          transform: rotate(45deg);
        }

        .mobile-button.open span:nth-child(2) {
          opacity: 0;
        }

        .mobile-button.open span:nth-child(3) {
          top: 9.5px;
          transform: rotate(-45deg);
        }

        /* Cuando el drawer está abierto, el botón de la barra desaparece
           (ya no compite en z-index con el contenido del drawer);
           el cierre se hace desde el botón × dentro del propio drawer */
        .mobile-button.open {
          opacity: 0;
          pointer-events: none;
        }

        /* Fondo oscuro detrás del drawer */
        .ivd-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          opacity: 0;
          pointer-events: none;
          transition: opacity .3s ease;
          z-index: 999;
        }

        .ivd-overlay.open {
          opacity: 1;
          pointer-events: auto;
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
            justify-content: flex-end;
          }

          .mobile-button {
            display: block;
          }

          /* Fila de cierre, primer elemento del drawer, en flujo normal:
             siempre queda arriba de "Inicio" sin importar coordenadas */
          .ivd-menu-close {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 14px 16px;
          }

          .ivd-menu-close button {
            background: none;
            border: none;
            color: #ffffff;
            font-size: 28px;
            line-height: 1;
            cursor: pointer;
            padding: 6px;
          }

          /* Drawer deslizante desde la derecha */
          .ivd-menu {
            position: fixed;
            top: 0;
            right: 0;
            height: 100vh;
            width: min(78vw, 320px);
            flex-direction: column;
            background: ${PRIMARY};
            box-shadow: -8px 0 24px rgba(0, 0, 0, .25);
            transform: translateX(100%);
            transition: transform .35s cubic-bezier(.4, 0, .2, 1);
            z-index: 1001;
            overflow-y: auto;
          }

          .ivd-menu.open {
            transform: translateX(0);
          }

          .ivd-item {
            width: 100%;
            border-top: 1px solid rgba(255, 255, 255, .08);
            opacity: 0;
            transform: translateX(24px);
            transition: opacity .3s ease, transform .3s ease;
          }

          .ivd-menu.open .ivd-item {
            opacity: 1;
            transform: translateX(0);
          }

          .ivd-menu.open .ivd-item:nth-child(2) { transition-delay: .08s; }
          .ivd-menu.open .ivd-item:nth-child(3) { transition-delay: .14s; }
          .ivd-menu.open .ivd-item:nth-child(4) { transition-delay: .20s; }
          .ivd-menu.open .ivd-item:nth-child(5) { transition-delay: .26s; }

          .ivd-link,
          .ivd-login-btn {
            padding: 16px 22px;
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
          <div className="ivd-logo-link" onClick={() => navegar("/")}>
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
            <ul className={`ivd-menu ${mobileMenu ? "open" : ""}`}>
              <li className="ivd-menu-close">
                <button
                  onClick={() => setMobileMenu(false)}
                  aria-label="Cerrar menú"
                >
                  ×
                </button>
              </li>

              {menu.map((item) => (
                <li
                  key={item.ruta}
                  className={`ivd-item ${activo(item.ruta) ? "active" : ""}`}
                  onClick={() => navegar(item.ruta)}
                >
                  <span className="ivd-link">{item.texto}</span>
                </li>
              ))}

              <li
                className={`ivd-item ivd-login-item ${activo(loginItem.ruta) ? "active" : ""}`}
                onClick={() => navegar(loginItem.ruta)}
              >
                <span className="ivd-login-btn">{loginItem.texto}</span>
              </li>
            </ul>

            <button
              className={`mobile-button ${mobileMenu ? "open" : ""}`}
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label={mobileMenu ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>

        <div
          className={`ivd-overlay ${mobileMenu ? "open" : ""}`}
          onClick={() => setMobileMenu(false)}
        />
      </header>
    </>
  );
};

export default EncabezadoPublico;