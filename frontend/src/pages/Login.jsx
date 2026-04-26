import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MdEmail, MdLock } from "react-icons/md";
import LanguageSwitcher from "../components/LanguageSwitcher";
import "./Auth.css";

const TEST_ADMIN_USER = "admin";
const TEST_ADMIN_PASSWORD = "admin123";

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError(t("auth.requiredCredentials"));
      setLoading(false);
      return;
    }

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "ACCOUNT_PENDING") {
        setError(t("auth.accountPending"));
      } else if (err.code === "ACCOUNT_DISABLED") {
        setError(t("auth.accountDisabled"));
      } else {
        const d = err.response?.data;
        const msg =
          typeof d === "string"
            ? d
            : d?.message && typeof d.message === "string"
              ? d.message
              : err.message || t("auth.loginFailed");
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const goRegister = () => navigate("/register");
  const handleForgotPassword = () => alert(t("auth.forgotPasswordAlert"));

  const fillTestAdmin = () => {
    setError("");
    setUsername(TEST_ADMIN_USER);
    setPassword(TEST_ADMIN_PASSWORD);
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
          <h3 className="login-intro">{t("auth.loginTitle")}</h3>
        </div>

        {import.meta.env.DEV && (
          <p className="auth-dev-hint" role="note">
            {t("auth.devLoginHint")}
          </p>
        )}

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t("auth.userName")}</label>
            <div className="input-with-icon input-with-icon--end">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                placeholder={t("auth.phUsername")}
                required
                autoComplete="username"
              />
              <span className="input-icon-box" aria-hidden>
                <MdEmail size={20} />
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("auth.password")}</label>
            <div className="input-with-icon input-with-icon--end">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder={t("auth.phPassword")}
                required
                autoComplete="current-password"
              />
              <span className="input-icon-box" aria-hidden>
                <MdLock size={20} />
              </span>
            </div>
            <button
              type="button"
              className="forgot-password"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              {t("auth.forgotPassword")}
            </button>
          </div>

          <button
            type="button"
            className="register-button auth-test-fill"
            onClick={fillTestAdmin}
            disabled={loading}
          >
            {t("auth.loginAsTest")}
          </button>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t("auth.loggingIn") : t("auth.loginNow")}
          </button>
        </form>

        <div className="or-separator">
          <hr />
          <span>{t("auth.or")}</span>
          <hr />
        </div>

        <button
          type="button"
          className="register-button"
          onClick={goRegister}
          disabled={loading}
        >
          {t("auth.registerNow")}
        </button>
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
};

export default Login;
