import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axios";
import { useIsAdmin, useCanEditDepartment } from "../hooks/useRoleAccess";
import { AddListButton } from "../components/AddListButton";
import { IconEdit } from "../components/TableActionIcons";
import "./List.css";

const initialDept = {
  name: "",
  description: "",
  headOfDepartment: "",
  location: "",
  phone: "",
  active: true,
};

const Departments = () => {
  const { t } = useTranslation();
  const canAdd = useIsAdmin();
  const canEdit = useCanEditDepartment();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialDept);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await axios.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error loading departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(initialDept);
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditId(dept.id);
    setForm({
      name: dept.name || "",
      description: dept.description || "",
      headOfDepartment: dept.headOfDepartment || "",
      location: dept.location || "",
      phone: dept.phone || "",
      active: Boolean(dept.active),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(initialDept);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      headOfDepartment: form.headOfDepartment.trim() || undefined,
      location: form.location.trim() || undefined,
      phone: form.phone.trim() || undefined,
      active: form.active,
    };
    try {
      if (editId) {
        await axios.put(`/departments/${editId}`, body);
        alert(t("forms.changesSaved"));
      } else {
        await axios.post("/departments", body);
        alert(t("forms.addSuccess"));
      }
      closeModal();
      loadDepartments();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data
          ? String(err.response.data)
          : t(editId ? "forms.saveError" : "forms.addError")
      );
    }
  };

  return (
    <div className="list-container">
      <div className="list-header list-header--actions list-page-head">
        <h1 className="list-page-title">{t("list.departments")}</h1>
        {canAdd && (
          <div className="list-header-actions">
            <AddListButton onClick={openAdd}>
              {t("forms.addDepartment")}
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
                <th>{t("list.thDescription")}</th>
                <th>{t("list.thHeadOfDepartment")}</th>
                <th>{t("list.thLocation")}</th>
                <th>{t("list.thPhone")}</th>
                <th>{t("list.thStatus")}</th>
                {canEdit && <th>{t("list.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.name}</td>
                  <td>{dept.description || t("list.notAvailable")}</td>
                  <td>{dept.headOfDepartment || t("list.notAvailable")}</td>
                  <td>{dept.location || t("list.notAvailable")}</td>
                  <td>{dept.phone || t("list.notAvailable")}</td>
                  <td>
                    <span
                      className={`status ${
                        dept.active ? "active" : "inactive"
                      }`}
                    >
                      {dept.active ? t("users.active") : t("users.inactive")}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="table-actions">
                      <div className="action-icon-group">
                        <IconEdit
                          onClick={() => openEdit(dept)}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {editId
                ? `${t("forms.edit")} — ${t("list.departments")}`
                : t("forms.newDepartment")}
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder={t("forms.name")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder={t("forms.description")}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.headOfDepartment")}
                value={form.headOfDepartment}
                onChange={(e) =>
                  setForm({ ...form, headOfDepartment: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.location")}
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
              <input
                type="tel"
                placeholder={t("forms.phone")}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
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
                {t("forms.activeDept")}
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

export default Departments;
