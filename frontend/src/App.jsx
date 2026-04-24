import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import ProtectedWithLayout from "./components/ProtectedWithLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Invoices from "./pages/Invoices";
import Departments from "./pages/Departments";
import Rooms from "./pages/Rooms";
import Staff from "./pages/Staff";
import Users from "./pages/Users";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedWithLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="patients"
              element={
                <PrivateRoute allowedRoles={["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]}>
                  <Patients />
                </PrivateRoute>
              }
            />
            <Route
              path="doctors"
              element={
                <PrivateRoute
                  allowedRoles={["ADMIN", "NURSE", "RECEPTIONIST", "PATIENT"]}
                >
                  <Doctors />
                </PrivateRoute>
              }
            />
            <Route
              path="appointments"
              element={
                <PrivateRoute>
                  <Appointments />
                </PrivateRoute>
              }
            />
            <Route
              path="invoices"
              element={
                <PrivateRoute
                  allowedRoles={["ADMIN", "RECEPTIONIST", "PATIENT", "DOCTOR"]}
                >
                  <Invoices />
                </PrivateRoute>
              }
            />
            <Route
              path="departments"
              element={
                <PrivateRoute allowedRoles={["ADMIN"]}>
                  <Departments />
                </PrivateRoute>
              }
            />
            <Route
              path="rooms"
              element={
                <PrivateRoute allowedRoles={["ADMIN", "NURSE", "RECEPTIONIST"]}>
                  <Rooms />
                </PrivateRoute>
              }
            />
            <Route
              path="staff"
              element={
                <PrivateRoute allowedRoles={["ADMIN"]}>
                  <Staff />
                </PrivateRoute>
              }
            />
            <Route
              path="users"
              element={
                <PrivateRoute allowedRoles={["ADMIN"]}>
                  <Users />
                </PrivateRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
