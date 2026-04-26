import { useState, useEffect, useMemo, useRef, createElement } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  MdMenu,
  MdClose,
  MdSpaceDashboard,
  MdPeople,
  MdLocalHospital,
  MdEvent,
  MdReceipt,
  MdBusiness,
  MdMeetingRoom,
  MdBadge,
  MdManageAccounts,
  MdLogout,
  MdEmail,
} from "react-icons/md";
import "./AppLayout.css";

const NAV_DEF = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: MdSpaceDashboard, roles: null },
  {
    to: "/patients",
    labelKey: "nav.patients",
    icon: MdPeople,
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    to: "/doctors",
    labelKey: "nav.doctors",
    icon: MdLocalHospital,
    roles: ["ADMIN", "NURSE", "RECEPTIONIST", "PATIENT"],
  },
  { to: "/appointments", labelKey: "nav.appointments", icon: MdEvent, roles: null },
  {
    to: "/invoices",
    labelKey: "nav.invoices",
    icon: MdReceipt,
    roles: ["ADMIN", "RECEPTIONIST", "PATIENT", "DOCTOR"],
  },
  { to: "/departments", labelKey: "nav.departments", icon: MdBusiness, roles: ["ADMIN"] },
  { to: "/rooms", labelKey: "nav.rooms", icon: MdMeetingRoom, roles: ["ADMIN", "NURSE", "RECEPTIONIST"] },
  { to: "/staff", labelKey: "nav.staff", icon: MdBadge, roles: ["ADMIN"] },
  { to: "/users", labelKey: "nav.users", icon: MdManageAccounts, roles: ["ADMIN"] },
];

export default function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userBlocRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = (e) => {
      if (userBlocRef.current && !userBlocRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRole =
    user?.role == null
      ? undefined
      : typeof user.role === "string"
        ? user.role
        : user.role?.name;

  const items = useMemo(
    () =>
      NAV_DEF.filter((item) => !item.roles || (userRole && item.roles.includes(userRole))).map(
        (item) => ({ ...item, label: t(item.labelKey) })
      ),
    [userRole, t]
  );
  const displayName = (user?.fullName || user?.username || "").trim() || t("app.userFallback");
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-left">
          <button
            type="button"
            className="app-menu-toggle"
            aria-label={menuOpen ? t("app.closeMenu") : t("app.openMenu")}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
          <div className="app-brand" aria-label="HealthHub">
            <div className="app-brand-bars" aria-hidden>
              <span className="app-brand-bar" />
              <span className="app-brand-bar" />
              <span className="app-brand-bar" />
            </div>
            <div className="app-brand-text-wrap">
              <span className="app-brand-text">HealthHub</span>
              <span className="app-brand-tagline">{t("app.brandTagline")}</span>
            </div>
          </div>
        </div>
        <div className="app-topbar-right">
          <LanguageSwitcher variant="toolbar" />
          <div className="app-user-bloc" ref={userBlocRef}>
            <div className="app-user-menu-wrap">
              <button
                type="button"
                className={`app-user-avatar-btn${userMenuOpen ? " app-user-avatar-btn--open" : ""}`}
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label={t("app.userMenu")}
                title={displayName}
              >
                <span className="app-user-avatar-inner" aria-hidden>
                  {avatarLetter}
                </span>
              </button>
              {userMenuOpen && (
                <div className="app-user-dropdown" role="menu" aria-label={t("app.userMenu")}>
                  <div className="app-user-dropdown__head" role="none">
                    <strong className="app-user-dropdown__name">{displayName}</strong>
                    <span className="app-user-dropdown__role">{user?.role}</span>
                  </div>
                  {user?.email && (
                    <div className="app-user-dropdown__email" role="none">
                      <span className="app-user-dropdown__email-icon" aria-hidden>
                        <MdEmail size={18} />
                      </span>
                      <span className="app-user-dropdown__email-text">{user.email}</span>
                    </div>
                  )}
                  <div className="app-user-dropdown__footer" role="none">
                    <button
                      type="button"
                      className="app-user-dropdown__logout"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <MdLogout size={20} aria-hidden />
                      <span>{t("app.logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="app-body">
        {menuOpen && (
          <button
            type="button"
            className="app-sidebar-backdrop"
            aria-label={t("app.closeOverlay")}
            onClick={() => setMenuOpen(false)}
          />
        )}
        <aside className={`app-sidebar ${menuOpen ? "app-sidebar--open" : ""}`}>
          <nav className="app-nav" aria-label={t("app.mainNav")}>
            <span className="app-nav-section-label">{t("nav.section")}</span>
            {items.map(({ to, label, icon }) => (
              <button
                key={to}
                type="button"
                className={`app-nav-item ${location.pathname === to ? "app-nav-item--active" : ""}`}
                onClick={() => navigate(to)}
              >
                {createElement(icon, { className: "app-nav-icon", size: 19 })}
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="app-main">
          <div className="app-main-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
