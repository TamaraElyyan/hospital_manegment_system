import { useAuth } from "../context/AuthContext";

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === "ADMIN";
}

export function useIsAdminOrReceptionist() {
  const { user } = useAuth();
  const r = user?.role;
  return r === "ADMIN" || r === "RECEPTIONIST";
}

export function useIsAdminOrDoctor() {
  const { user } = useAuth();
  const r = user?.role;
  return r === "ADMIN" || r === "DOCTOR";
}

export function useCanEditPatient() {
  const { user } = useAuth();
  const r = user?.role;
  return (
    r === "ADMIN" ||
    r === "DOCTOR" ||
    r === "NURSE" ||
    r === "RECEPTIONIST"
  );
}

export function useCanEditDepartment() {
  const { user } = useAuth();
  return user?.role === "ADMIN";
}

export function useCanEditRoom() {
  const { user } = useAuth();
  const r = user?.role;
  return r === "ADMIN" || r === "NURSE" || r === "RECEPTIONIST";
}

export function useCanEditDoctor() {
  return useIsAdminOrDoctor();
}

export function useCanEditStaff() {
  const { user } = useAuth();
  return user?.role === "ADMIN";
}

export function useCanEditAppointment() {
  const { user } = useAuth();
  const r = user?.role;
  return r === "ADMIN" || r === "DOCTOR" || r === "RECEPTIONIST";
}

export function useCanEditInvoice() {
  return useIsAdminOrReceptionist();
}
