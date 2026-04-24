import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "./AppLayout";

export default function ProtectedWithLayout() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-spinner" />
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}
