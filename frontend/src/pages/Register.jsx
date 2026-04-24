import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MdEmail, MdLock, MdPerson, MdPhone, MdHome } from "react-icons/md";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getRegisterErrorMessage } from "../utils/registerErrorMessage";
import "./Auth.css";

const ROLE_VALUES = ["PATIENT", "DOCTOR", "NURSE", "RECEPTIONIST"];

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [pendingInfo, setPendingInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "PATIENT",
  });

  const set = (k) => (e) => {
    setError("");
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPendingInfo(false);
    if (form.password !== form.confirmPassword) {
      setError(t("auth.passwordsMismatch"));
      return;
    }
    setLoading(true);
    try {
      const result = await register({
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.username,
        phone: form.phone,
        address: form.address,
        role: form.role,
      });
      if (result?.pendingApproval) {
        setPendingInfo(true);
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getRegisterErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-side">
        <div className="auth-form-sticky-top">
          <LanguageSwitcher variant="auth" />
        </div>
        <div className="logo-section">
          <div className="network-logo">
            <div className="logo-bars" aria-hidden>
              <span className="logo-bar" />
              <span className="logo-bar" />
              <span className="logo-bar" />
            </div>
            <span className="logo-text">HealthHub</span>
          </div>
          <h3 className="login-intro">{t("auth.registerTitle")}</h3>
        </div>

        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {t("auth.registerErrorTitle")}
            <br />
            {error}
          </div>
        )}

        {pendingInfo && (
          <div className="auth-info-success" role="status">
            <p className="auth-info-success__title">{t("auth.registerPendingTitle")}</p>
            <p className="auth-info-success__text">{t("auth.registerPendingBody")}</p>
            <Link to="/login" className="auth-info-success__link">
              {t("auth.loginNow")}
            </Link>
          </div>
        )}

        {!pendingInfo && (
        <form onSubmit={handleSubmit} className="login-form register-form">
          <div className="register-form-row">
            <div className="form-group">
              <label htmlFor="reg-username">{t("auth.userName")}</label>
              <div className="input-with-icon input-with-icon--end">
                <input
                  id="reg-username"
                  dir="auto"
                  value={form.username}
                  onChange={set("username")}
                  required
                  disabled={loading}
                  autoComplete="username"
                  placeholder={t("auth.phUsername")}
                />
                <span className="input-icon-box" aria-hidden>
                  <MdPerson size={20} />
                </span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">{t("auth.email")}</label>
              <div className="input-with-icon input-with-icon--end">
                <input
                  id="reg-email"
                  type="email"
                  dir="auto"
                  value={form.email}
                  onChange={set("email")}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
                <span className="input-icon-box" aria-hidden>
                  <MdEmail size={20} />
                </span>
              </div>
            </div>
          </div>
          <div className="register-form-row">
            <div className="form-group">
              <label htmlFor="reg-password">{t("auth.password")}</label>
              <div className="input-with-icon input-with-icon--end">
                <input
                  id="reg-password"
                  type="password"
                  dir="auto"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={4}
                  disabled={loading}
                  autoComplete="new-password"
                  placeholder={t("auth.phPassword")}
                />
                <span className="input-icon-box" aria-hidden>
                  <MdLock size={20} />
                </span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirm-password">{t("auth.confirmPassword")}</label>
              <div className="input-with-icon input-with-icon--end">
                <input
                  id="reg-confirm-password"
                  type="password"
                  dir="auto"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  required
                  minLength={4}
                  disabled={loading}
                  autoComplete="new-password"
                  placeholder={t("auth.phPassword")}
                />
                <span className="input-icon-box" aria-hidden>
                  <MdLock size={20} />
                </span>
              </div>
            </div>
          </div>
          <div className="register-form-row">
            <div className="form-group">
              <label htmlFor="reg-phone">{t("auth.phone")}</label>
              <div className="input-with-icon input-with-icon--end">
                <input
                  id="reg-phone"
                  dir="auto"
                  value={form.phone}
                  onChange={set("phone")}
                  required
                  disabled={loading}
                  autoComplete="tel"
                />
                <span className="input-icon-box" aria-hidden>
                  <MdPhone size={20} />
                </span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-address">{t("auth.address")}</label>
              <div className="input-with-icon input-with-icon--end">
                <input
                  id="reg-address"
                  dir="auto"
                  value={form.address}
                  onChange={set("address")}
                  required
                  disabled={loading}
                  autoComplete="street-address"
                />
                <span className="input-icon-box" aria-hidden>
                  <MdHome size={20} />
                </span>
              </div>
            </div>
          </div>
          <div className="register-form-row register-form-row--full">
            <div className="form-group">
              <label htmlFor="reg-role">{t("auth.role")}</label>
              <select
                id="reg-role"
                className="register-select"
                dir="auto"
                value={form.role}
                onChange={set("role")}
                required
                disabled={loading}
              >
                {ROLE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`roles.${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t("auth.pleaseWait") : t("auth.registerNow")}
          </button>
        </form>
        )}

        {!pendingInfo && (
        <p className="auth-footer-link">
          {t("auth.hasAccount")}{" "}
          <Link to="/login">{t("auth.loginNow")}</Link>
        </p>
        )}
      </div>

      <div className="auth-illustration-side">
        <img
          src={encodeURI("/Mobile login-pana 1 (1).svg")}
          alt={t("auth.illustration")}
          className="illustration-img"
        />
      </div>
    </div>
  );
}
