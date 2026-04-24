import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axios";
import { useIsAdmin, useCanEditDoctor } from "../hooks/useRoleAccess";
import { AddListButton } from "../components/AddListButton";
import { IconEdit } from "../components/TableActionIcons";
import "./List.css";

const initialDoctor = {
  userId: "",
  licenseNumber: "",
  specialization: "",
  qualifications: "",
  experienceYears: "0",
  consultationFee: "50.00",
  schedule: "Mon–Fri: 9–17",
  departmentId: "",
  available: true,
};

const Doctors = () => {
  const { t } = useTranslation();
  const canAdd = useIsAdmin();
  const canEdit = useCanEditDoctor();
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialDoctor);

  useEffect(() => {
    loadData();
  }, [canAdd]);

  const loadData = async () => {
    try {
      const [dRes, uRes, deptRes] = await Promise.all([
        axios.get("/doctors"),
        canAdd ? axios.get("/users") : Promise.resolve({ data: [] }),
        axios.get("/departments"),
      ]);
      setDoctors(dRes.data);
      setUsers(uRes.data || []);
      setDepartments(deptRes.data);
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const doctorUserIds = useMemo(() => {
    const s = new Set();
    doctors.forEach((d) => {
      if (d.user?.id) s.add(d.user.id);
    });
    return s;
  }, [doctors]);

  const availableUsers = useMemo(
    () =>
      users.filter(
        (u) => u.role === "DOCTOR" && u.id && !doctorUserIds.has(u.id)
      ),
    [users, doctorUserIds]
  );

  const openAdd = () => {
    setEditId(null);
    setForm(initialDoctor);
    setShowModal(true);
  };

  const openEdit = async (id) => {
    try {
      const { data: d } = await axios.get(`/doctors/${id}`);
      setEditId(id);
      setForm({
        userId: "",
        licenseNumber: d.licenseNumber || "",
        specialization: d.specialization || "",
        qualifications: d.qualifications || "",
        experienceYears:
          d.experienceYears != null ? String(d.experienceYears) : "0",
        consultationFee: d.consultationFee != null ? String(d.consultationFee) : "0",
        schedule: d.schedule || "",
        departmentId: d.department?.id ? String(d.department.id) : "",
        available: d.available !== false,
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
    setForm(initialDoctor);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.userId) {
      alert(t("forms.noDoctorUser"));
      return;
    }
    try {
      const payload = {
        user: { id: Number(form.userId) },
        licenseNumber: form.licenseNumber.trim(),
        specialization: form.specialization.trim(),
        qualifications: form.qualifications.trim() || undefined,
        experienceYears: Number(form.experienceYears) || 0,
        consultationFee: String(form.consultationFee).trim() || "0",
        schedule: form.schedule.trim() || undefined,
        available: form.available,
        department: form.departmentId
          ? { id: Number(form.departmentId) }
          : undefined,
      };
      await axios.post("/doctors", payload);
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
      const payload = {
        licenseNumber: form.licenseNumber.trim(),
        specialization: form.specialization.trim(),
        qualifications: form.qualifications.trim() || undefined,
        experienceYears: Number(form.experienceYears) || 0,
        consultationFee: String(form.consultationFee).trim() || "0",
        schedule: form.schedule.trim() || undefined,
        available: form.available,
        department: form.departmentId
          ? { id: Number(form.departmentId) }
          : undefined,
      };
      await axios.put(`/doctors/${editId}`, payload);
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

  return (
    <div className="list-container">
      <div className="list-header list-header--actions list-page-head">
        <h1 className="list-page-title">{t("list.doctors")}</h1>
        {canAdd && (
          <div className="list-header-actions">
            <AddListButton onClick={openAdd}>
              {t("forms.addDoctor")}
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
                <th>{t("list.thName")}</th>
                <th>{t("list.thLicenseNumber")}</th>
                <th>{t("list.thSpecialization")}</th>
                <th>{t("list.thExperience")}</th>
                <th>{t("list.thDepartment")}</th>
                <th>{t("list.thConsultationFee")}</th>
                <th>{t("list.thStatus")}</th>
                {canEdit && <th>{t("list.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>
                    {doctor.user?.fullName || t("list.notAvailable")}
                  </td>
                  <td>{doctor.licenseNumber}</td>
                  <td>{doctor.specialization}</td>
                  <td>
                    {t("list.yearsCount", {
                      count: doctor.experienceYears ?? 0,
                    })}
                  </td>
                  <td>
                    {doctor.department?.name || t("list.notAvailable")}
                  </td>
                  <td>${doctor.consultationFee}</td>
                  <td>
                    <span
                      className={`status ${
                        doctor.available ? "active" : "inactive"
                      }`}
                    >
                      {doctor.available
                        ? t("forms.available")
                        : t("forms.unavailable")}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="table-actions">
                      <div className="action-icon-group">
                        <IconEdit
                          onClick={() => openEdit(doctor.id)}
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
            <h3>{t("forms.newDoctor")}</h3>
            {availableUsers.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                {t("forms.noDoctorUser")}
              </p>
            ) : null}
            <form onSubmit={handleAdd}>
              <select
                value={form.userId}
                onChange={(e) =>
                  setForm({ ...form, userId: e.target.value })
                }
                required={availableUsers.length > 0}
                disabled={availableUsers.length === 0}
              >
                <option value="">{t("forms.selectUser")}</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.username})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t("forms.licenseNumber")}
                value={form.licenseNumber}
                onChange={(e) =>
                  setForm({ ...form, licenseNumber: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.specialization")}
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.qualifications")}
                value={form.qualifications}
                onChange={(e) =>
                  setForm({ ...form, qualifications: e.target.value })
                }
              />
              <input
                type="number"
                min={0}
                placeholder={t("forms.experienceYears")}
                value={form.experienceYears}
                onChange={(e) =>
                  setForm({ ...form, experienceYears: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.consultationFee")}
                value={form.consultationFee}
                onChange={(e) =>
                  setForm({ ...form, consultationFee: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.schedule")}
                value={form.schedule}
                onChange={(e) =>
                  setForm({ ...form, schedule: e.target.value })
                }
              />
              <select
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
                }
              >
                <option value="">{t("forms.selectDepartment")}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) =>
                    setForm({ ...form, available: e.target.checked })
                  }
                />
                {t("forms.available")}
              </label>
              <div className="modal-buttons">
                <button
                  type="submit"
                  disabled={availableUsers.length === 0}
                >
                  {t("forms.save")}
                </button>
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
            <h3>{`${t("forms.edit")} — ${t("list.doctors")}`}</h3>
            <form onSubmit={handleEdit}>
              <input
                type="text"
                placeholder={t("forms.licenseNumber")}
                value={form.licenseNumber}
                onChange={(e) =>
                  setForm({ ...form, licenseNumber: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.specialization")}
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.qualifications")}
                value={form.qualifications}
                onChange={(e) =>
                  setForm({ ...form, qualifications: e.target.value })
                }
              />
              <input
                type="number"
                min={0}
                placeholder={t("forms.experienceYears")}
                value={form.experienceYears}
                onChange={(e) =>
                  setForm({ ...form, experienceYears: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.consultationFee")}
                value={form.consultationFee}
                onChange={(e) =>
                  setForm({ ...form, consultationFee: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.schedule")}
                value={form.schedule}
                onChange={(e) =>
                  setForm({ ...form, schedule: e.target.value })
                }
              />
              <select
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
                }
              >
                <option value="">{t("forms.selectDepartment")}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) =>
                    setForm({ ...form, available: e.target.checked })
                  }
                />
                {t("forms.available")}
              </label>
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

export default Doctors;
