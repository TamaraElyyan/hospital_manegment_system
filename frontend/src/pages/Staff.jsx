import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axios";
import { useIsAdmin, useCanEditStaff } from "../hooks/useRoleAccess";
import { AddListButton } from "../components/AddListButton";
import { IconEdit } from "../components/TableActionIcons";
import "./List.css";

const initialStaff = {
  userId: "",
  position: "",
  shift: "Morning",
  schedule: "",
  qualifications: "",
  departmentId: "",
  active: true,
};

const Staff = () => {
  const { t } = useTranslation();
  const canAdd = useIsAdmin();
  const canEdit = useCanEditStaff();
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialStaff);

  useEffect(() => {
    loadData();
  }, [canAdd]);

  const loadData = async () => {
    try {
      const [sRes, uRes, dRes] = await Promise.all([
        axios.get("/staff"),
        canAdd ? axios.get("/users") : Promise.resolve({ data: [] }),
        axios.get("/departments"),
      ]);
      setStaff(sRes.data);
      setUsers(uRes.data || []);
      setDepartments(dRes.data);
    } catch (error) {
      console.error("Error loading staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const staffUserIds = useMemo(() => {
    const ids = new Set();
    staff.forEach((m) => {
      if (m.user?.id) ids.add(m.user.id);
    });
    return ids;
  }, [staff]);

  const availableUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          (u.role === "NURSE" || u.role === "RECEPTIONIST") &&
          u.id &&
          !staffUserIds.has(u.id)
      ),
    [users, staffUserIds]
  );

  const openAdd = () => {
    setEditId(null);
    setForm(initialStaff);
    setShowModal(true);
  };

  const openEdit = async (id) => {
    try {
      const { data: s } = await axios.get(`/staff/${id}`);
      setEditId(id);
      setForm({
        userId: "",
        position: s.position || "",
        shift: s.shift || "",
        schedule: s.schedule || "",
        qualifications: s.qualifications || "",
        departmentId: s.department?.id ? String(s.department.id) : "",
        active: s.active !== false,
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
    setForm(initialStaff);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.userId) {
      alert(t("forms.noStaffUser"));
      return;
    }
    try {
      const payload = {
        user: { id: Number(form.userId) },
        position: form.position.trim(),
        shift: form.shift.trim() || undefined,
        schedule: form.schedule.trim() || undefined,
        qualifications: form.qualifications.trim() || undefined,
        active: form.active,
        department: form.departmentId
          ? { id: Number(form.departmentId) }
          : undefined,
      };
      await axios.post("/staff", payload);
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
        position: form.position.trim(),
        shift: form.shift.trim() || undefined,
        schedule: form.schedule.trim() || undefined,
        qualifications: form.qualifications.trim() || undefined,
        active: form.active,
        department: form.departmentId
          ? { id: Number(form.departmentId) }
          : undefined,
      };
      await axios.put(`/staff/${editId}`, payload);
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
        <h1 className="list-page-title">{t("list.staff")}</h1>
        {canAdd && (
          <div className="list-header-actions">
            <AddListButton onClick={openAdd}>
              {t("forms.addStaff")}
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
                <th>{t("list.thPosition")}</th>
                <th>{t("list.thDepartment")}</th>
                <th>{t("list.thShift")}</th>
                <th>{t("list.thQualifications")}</th>
                <th>{t("list.thStatus")}</th>
                {canEdit && <th>{t("list.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td>
                    {member.user?.fullName || t("list.notAvailable")}
                  </td>
                  <td>{member.position}</td>
                  <td>
                    {member.department?.name || t("list.notAvailable")}
                  </td>
                  <td>{member.shift || t("list.notAvailable")}</td>
                  <td>
                    {member.qualifications || t("list.notAvailable")}
                  </td>
                  <td>
                    <span
                      className={`status ${
                        member.active ? "active" : "inactive"
                      }`}
                    >
                      {member.active
                        ? t("users.active")
                        : t("users.inactive")}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="table-actions">
                      <div className="action-icon-group">
                        <IconEdit
                          onClick={() => openEdit(member.id)}
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
            <h3>{t("forms.newStaff")}</h3>
            {availableUsers.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                {t("forms.noStaffUser")}
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
                    {u.fullName} ({u.username}) — {u.role}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t("forms.position")}
                value={form.position}
                onChange={(e) =>
                  setForm({ ...form, position: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.shift")}
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
              />
              <input
                type="text"
                placeholder={t("forms.schedule")}
                value={form.schedule}
                onChange={(e) =>
                  setForm({ ...form, schedule: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.qualifications")}
                value={form.qualifications}
                onChange={(e) =>
                  setForm({ ...form, qualifications: e.target.value })
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
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                {t("users.active")}
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
            <h3>{`${t("forms.edit")} — ${t("list.staff")}`}</h3>
            <form onSubmit={handleEdit}>
              <input
                type="text"
                placeholder={t("forms.position")}
                value={form.position}
                onChange={(e) =>
                  setForm({ ...form, position: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("forms.shift")}
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
              />
              <input
                type="text"
                placeholder={t("forms.schedule")}
                value={form.schedule}
                onChange={(e) =>
                  setForm({ ...form, schedule: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.qualifications")}
                value={form.qualifications}
                onChange={(e) =>
                  setForm({ ...form, qualifications: e.target.value })
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
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                {t("users.active")}
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

export default Staff;
