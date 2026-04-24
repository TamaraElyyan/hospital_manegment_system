import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axios";
import {
  useIsAdminOrReceptionist,
  useCanEditInvoice,
} from "../hooks/useRoleAccess";
import { AddListButton } from "../components/AddListButton";
import { IconEdit } from "../components/TableActionIcons";
import { tPaymentStatus } from "../i18n/labels";
import "./List.css";

const initialInv = {
  patientId: "",
  appointmentId: "",
  consultationFee: "0",
  medicationCost: "0",
  testsCost: "0",
  roomCharges: "0",
  otherCharges: "0",
  paidAmount: "0",
  paymentStatus: "UNPAID",
  description: "",
};

const Invoices = () => {
  const { t, i18n } = useTranslation();
  const canAdd = useIsAdminOrReceptionist();
  const canEdit = useCanEditInvoice();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialInv);
  const [editId, setEditId] = useState(null);
  const [editPatientName, setEditPatientName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [iRes, pRes, aRes] = await Promise.all([
        axios.get("/invoices"),
        axios.get("/patients"),
        axios.get("/appointments"),
      ]);
      setInvoices(iRes.data);
      setPatients(pRes.data);
      setAppointments(aRes.data || []);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const openAdd = () => {
    setEditId(null);
    setEditPatientName("");
    setForm(initialInv);
    setShowModal(true);
  };

  const openEdit = async (id) => {
    try {
      const { data: inv } = await axios.get(`/invoices/${id}`);
      setEditId(id);
      setEditPatientName(
        inv.patient?.fullName
          ? `${inv.patient.fullName} (#${inv.patient.patientNumber || inv.patient.id})`
          : "—"
      );
      setForm({
        patientId: inv.patient?.id ? String(inv.patient.id) : "",
        appointmentId:
          inv.appointment?.id != null ? String(inv.appointment.id) : "",
        consultationFee: inv.consultationFee != null ? String(inv.consultationFee) : "0",
        medicationCost: inv.medicationCost != null ? String(inv.medicationCost) : "0",
        testsCost: inv.testsCost != null ? String(inv.testsCost) : "0",
        roomCharges: inv.roomCharges != null ? String(inv.roomCharges) : "0",
        otherCharges: inv.otherCharges != null ? String(inv.otherCharges) : "0",
        paidAmount: inv.paidAmount != null ? String(inv.paidAmount) : "0",
        paymentStatus: inv.paymentStatus || "UNPAID",
        description: inv.description || "",
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
    setEditPatientName("");
    setForm(initialInv);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const body = {
        patient: { id: Number(form.patientId) },
        consultationFee: num(form.consultationFee),
        medicationCost: num(form.medicationCost),
        testsCost: num(form.testsCost),
        roomCharges: num(form.roomCharges),
        otherCharges: num(form.otherCharges),
        paidAmount: num(form.paidAmount),
        paymentStatus: form.paymentStatus,
        description: form.description.trim() || undefined,
      };
      if (form.appointmentId) {
        body.appointment = { id: Number(form.appointmentId) };
      }
      await axios.post("/invoices", body);
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
      await axios.put(`/invoices/${editId}`, {
        consultationFee: num(form.consultationFee),
        medicationCost: num(form.medicationCost),
        testsCost: num(form.testsCost),
        roomCharges: num(form.roomCharges),
        otherCharges: num(form.otherCharges),
        paidAmount: num(form.paidAmount),
        paymentStatus: form.paymentStatus,
        description: form.description.trim() || undefined,
        appointment: form.appointmentId
          ? { id: Number(form.appointmentId) }
          : { id: null },
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

  const appointmentsForPatient = useMemo(() => {
    if (!form.patientId) return [];
    const pid = Number(form.patientId);
    if (!Number.isFinite(pid)) return [];
    return appointments.filter((a) => a.patient?.id === pid);
  }, [appointments, form.patientId]);

  const formFields = (includePatient, showAppointment) => (
    <>
      {includePatient && (
        <select
          value={form.patientId}
          onChange={(e) => {
            const v = e.target.value;
            setForm((f) => ({
              ...f,
              patientId: v,
              appointmentId: "",
            }));
          }}
          required
        >
          <option value="">{t("forms.selectPatient")}</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName} ({p.patientNumber})
            </option>
          ))}
        </select>
      )}
      {showAppointment && form.patientId && (
        <select
          value={form.appointmentId}
          onChange={(e) =>
            setForm({ ...form, appointmentId: e.target.value })
          }
        >
          <option value="">{t("forms.noAppointment")}</option>
          {appointmentsForPatient.map((a) => (
            <option key={a.id} value={a.id}>
              {a.appointmentDate
                ? new Date(a.appointmentDate).toLocaleString(
                    i18n.language?.startsWith("ar") ? "ar-SA" : "en-US"
                  )
                : `#${a.id}`}{" "}
              {a.status ? `· ${a.status}` : ""}
            </option>
          ))}
        </select>
      )}
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder={t("forms.consultationFee")}
        value={form.consultationFee}
        onChange={(e) =>
          setForm({ ...form, consultationFee: e.target.value })
        }
        required
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder={t("forms.medicationCost")}
        value={form.medicationCost}
        onChange={(e) =>
          setForm({ ...form, medicationCost: e.target.value })
        }
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder={t("forms.testsCost")}
        value={form.testsCost}
        onChange={(e) => setForm({ ...form, testsCost: e.target.value })}
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder={t("forms.roomCharges")}
        value={form.roomCharges}
        onChange={(e) =>
          setForm({ ...form, roomCharges: e.target.value })
        }
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder={t("forms.otherCharges")}
        value={form.otherCharges}
        onChange={(e) =>
          setForm({ ...form, otherCharges: e.target.value })
        }
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder={t("forms.paidAmount")}
        value={form.paidAmount}
        onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
      />
      <select
        value={form.paymentStatus}
        onChange={(e) =>
          setForm({ ...form, paymentStatus: e.target.value })
        }
      >
        <option value="UNPAID">{t("forms.unpaid")}</option>
        <option value="PAID">{t("forms.paid")}</option>
        <option value="PENDING">{t("forms.pending")}</option>
      </select>
      <input
        type="text"
        placeholder={t("forms.description")}
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />
    </>
  );

  const loc = i18n.language?.startsWith("ar") ? "ar-SA" : "en-US";

  return (
    <div className="list-container">
      <div className="list-header list-header--actions list-page-head">
        <h1 className="list-page-title">{t("list.invoices")}</h1>
        {canAdd && (
          <div className="list-header-actions">
            <AddListButton onClick={openAdd}>
              {t("forms.addInvoice")}
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
                <th>{t("list.thInvoiceNo")}</th>
                <th>{t("list.thPatient")}</th>
                <th>{t("list.thLinkedAppointment")}</th>
                <th>{t("list.thTotalAmount")}</th>
                <th>{t("list.thPaidAmount")}</th>
                <th>{t("list.thBalance")}</th>
                <th>{t("list.thStatus")}</th>
                <th>{t("list.thDate")}</th>
                {canEdit && <th>{t("list.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>
                    {invoice.patient?.fullName || t("list.notAvailable")}
                  </td>
                  <td>
                    {invoice.appointment?.appointmentDate
                      ? new Date(
                          invoice.appointment.appointmentDate
                        ).toLocaleString(loc)
                      : "—"}
                  </td>
                  <td>${invoice.totalAmount}</td>
                  <td>${invoice.paidAmount || 0}</td>
                  <td>${invoice.balanceAmount || invoice.totalAmount}</td>
                  <td>
                    <span
                      className={`status ${String(
                        invoice.paymentStatus
                      ).toLowerCase()}`}
                    >
                      {tPaymentStatus(t, invoice.paymentStatus)}
                    </span>
                  </td>
                  <td>
                    {invoice.issuedDate
                      ? new Date(invoice.issuedDate).toLocaleDateString(
                          loc
                        )
                      : "—"}
                  </td>
                  {canEdit && (
                    <td className="table-actions">
                      <div className="action-icon-group">
                        <IconEdit
                          onClick={() => openEdit(invoice.id)}
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
            <h3>{t("forms.newInvoice")}</h3>
            <form onSubmit={handleAdd}>
              {formFields(true, true)}
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
            <h3>{`${t("forms.edit")} — ${t("list.invoices")}`}</h3>
            <p style={{ margin: "0 0 0.75rem", color: "#64748b" }}>
              {t("list.patients")}: {editPatientName}
            </p>
            <form onSubmit={handleEdit}>
              {formFields(false, true)}
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

export default Invoices;
