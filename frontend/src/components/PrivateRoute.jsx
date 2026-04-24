import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div>{t("loading")}</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
