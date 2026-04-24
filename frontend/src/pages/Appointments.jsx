import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axios";
import {
  useIsAdminOrReceptionist,
  useCanEditAppointment,
} from "../hooks/useRoleAccess";
import { AddListButton } from "../components/AddListButton";
import { IconEdit } from "../components/TableActionIcons";
import { tAppointmentStatus } from "../i18n/labels";
import "./List.css";

const initialApt = {
  patientId: "",
  doctorId: "",
  appointmentDate: "",
  reason: "",
  notes: "",
};

const initialEditApt = {
  appointmentDate: "",
  status: "SCHEDULED",
  reason: "",
  notes: "",
  diagnosis: "",
  prescription: "",
};

const toLocalDateTime = (dtLocal) => {
  if (!dtLocal) return null;
  if (dtLocal.length === 16) return `${dtLocal}:00`;
  return dtLocal;
};

const isoToDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(
    d.getDate()
  )}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const Appointments = () => {
  const { t, i18n } = useTranslation();
  const canAdd = useIsAdminOrReceptionist();
  const canEdit = useCanEditAppointment();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialApt);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(initialEditApt);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [aRes, pRes, dRes] = await Promise.all([
        axios.get("/appointments"),
        axios.get("/patients"),
        axios.get("/doctors"),
      ]);
      setAppointments(aRes.data);
      setPatients(pRes.data);
      setDoctors(dRes.data);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(initialApt);
    setShowModal(true);
  };

  const openEdit = async (id) => {
    try {
      const { data: a } = await axios.get(`/appointments/${id}`);
      setEditId(id);
      setEditForm({
        appointmentDate: isoToDatetimeLocal(a.appointmentDate),
        status: a.status || "SCHEDULED",
        reason: a.reason || "",
        notes: a.notes || "",
        diagnosis: a.diagnosis || "",
        prescription: a.prescription || "",
      });
      setShowModal(true);
    } catch (e) {
      console.error(e);
      alert(t("forms.saveError"));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(initialApt);
    setEditForm(initialEditApt);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const appointmentDate = toLocalDateTime(form.appointmentDate);
      if (!appointmentDate) {
        alert(t("forms.addError"));
        return;
      }
      await axios.post("/appointments", {
        patient: { id: Number(form.patientId) },
        doctor: { id: Number(form.doctorId) },
        appointmentDate,
        reason: form.reason.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      alert(t("forms.addSuccess"));
      closeModal();
      loadData();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data
          ? String(err.response.data)
          : t("forms.addError")
      );
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const appointmentDate = toLocalDateTime(editForm.appointmentDate);
      if (!appointmentDate) {
        alert(t("forms.saveError"));
        return;
      }
      await axios.put(`/appointments/${editId}`, {
        appointmentDate,
        status: editForm.status,
        reason: editForm.reason.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
        diagnosis: editForm.diagnosis.trim() || undefined,
        prescription: editForm.prescription.trim() || undefined,
      });
      alert(t("forms.changesSaved"));
      closeModal();
      loadData();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data
          ? String(err.response.data)
          : t("forms.saveError")
      );
    }
  };

  const fmt = (d) => {
    if (!d) return "";
    const loc = i18n.language?.startsWith("ar") ? "ar-SA" : "en-US";
    return new Date(d).toLocaleString(loc);
  };

  return (
    <div className="list-container">
      <div className="list-header list-header--actions list-page-head">
        <h1 className="list-page-title">{t("list.appointments")}</h1>
        {canAdd && (
          <div className="list-header-actions">
            <AddListButton onClick={openAdd}>
              {t("forms.addAppointment")}
            </AddListButton>
          </div>
        )}
      </div>

      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("list.thPatient")}</th>
                <th>{t("list.thDoctor")}</th>
                <th>{t("list.thDateTime")}</th>
                <th>{t("list.thReason")}</th>
                <th>{t("list.thStatus")}</th>
                {canEdit && <th>{t("list.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    {appointment.patient?.fullName || t("list.notAvailable")}
                  </td>
                  <td>
                    {appointment.doctor?.user?.fullName ||
                      t("list.notAvailable")}
                  </td>
                  <td>{fmt(appointment.appointmentDate)}</td>
                  <td>
                    {appointment.reason || t("list.notAvailable")}
                  </td>
                  <td>
                    <span
                      className={`status ${String(
                        appointment.status
                      ).toLowerCase()}`}
                    >
                      {tAppointmentStatus(t, appointment.status)}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="table-actions">
                      <div className="action-icon-group">
                        <IconEdit
                          onClick={() => openEdit(appointment.id)}
                          label={t("forms.edit")}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && canAdd && !editId && (
        <div className="modal-overlay">
          <div className="modal modal--lg">
            <h3>{t("forms.newAppointment")}</h3>
            <form onSubmit={handleAdd}>
              <select
                value={form.patientId}
                onChange={(e) =>
                  setForm({ ...form, patientId: e.target.value })
                }
                required
              >
                <option value="">{t("forms.selectPatient")}</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.patientNumber})
                  </option>
                ))}
              </select>
              <select
                value={form.doctorId}
                onChange={(e) =>
                  setForm({ ...form, doctorId: e.target.value })
                }
                required
              >
                <option value="">{t("forms.selectDoctor")}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.fullName || d.licenseNumber}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={form.appointmentDate}
                onChange={(e) =>
                  setForm({ ...form, appointmentDate: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.reason")}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
              <input
                type="text"
                placeholder={t("forms.notes")}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="modal-buttons">
                <button type="submit">{t("forms.save")}</button>
                <button type="button" onClick={closeModal}>
                  {t("users.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && canEdit && editId && (
        <div className="modal-overlay">
          <div className="modal modal--lg">
            <h3>{`${t("forms.edit")} — ${t("list.appointments")}`}</h3>
            <form onSubmit={handleEdit}>
              <input
                type="datetime-local"
                value={editForm.appointmentDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, appointmentDate: e.target.value })
                }
                required
              />
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
              >
                <option value="SCHEDULED">
                  {t("status.appointment.SCHEDULED")}
                </option>
                <option value="COMPLETED">
                  {t("status.appointment.COMPLETED")}
                </option>
                <option value="CANCELLED">
                  {t("status.appointment.CANCELLED")}
                </option>
                <option value="NO_SHOW">
                  {t("status.appointment.NO_SHOW")}
                </option>
              </select>
              <input
                type="text"
                placeholder={t("forms.reason")}
                value={editForm.reason}
                onChange={(e) =>
                  setEditForm({ ...editForm, reason: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.notes")}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.diagnosis")}
                value={editForm.diagnosis}
                onChange={(e) =>
                  setEditForm({ ...editForm, diagnosis: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.prescription")}
                value={editForm.prescription}
                onChange={(e) =>
                  setEditForm({ ...editForm, prescription: e.target.value })
                }
              />
              <div className="modal-buttons">
                <button type="submit">{t("forms.save")}</button>
                <button type="button" onClick={closeModal}>
                  {t("users.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
