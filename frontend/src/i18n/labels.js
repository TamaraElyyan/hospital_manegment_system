/**
 * Map backend enum values to i18n keys under `status.*`
 */

const up = (s) => String(s == null ? "" : s).toUpperCase().replace(/-/g, "_");

export function tAppointmentStatus(t, raw) {
  const k = up(raw);
  if (!k) return t("list.notAvailable");
  return t(`status.appointment.${k}`, { defaultValue: String(raw) });
}

export function tPaymentStatus(t, raw) {
  const k = up(raw);
  if (!k) return t("list.notAvailable");
  return t(`status.payment.${k}`, { defaultValue: String(raw) });
}

export function tPatientRecordStatus(t, raw) {
  const k = up(raw);
  if (!k) return t("list.notAvailable");
  return t(`status.patientRecord.${k}`, { defaultValue: String(raw) });
}

export function tGender(t, raw) {
  const k = up(raw);
  if (!k) return t("list.notAvailable");
  return t(`status.gender.${k}`, { defaultValue: String(raw) });
}
