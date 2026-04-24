import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axios";
import { useIsAdmin } from "../hooks/useRoleAccess";
import { AddListButton } from "../components/AddListButton";
import { IconApprove, IconDelete, IconEdit, IconUserToggle } from "../components/TableActionIcons";
import "./List.css";

const emptyAdd = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  phone: "",
  role: "PATIENT",
  address: "",
};

const Users = () => {
  const { t, i18n } = useTranslation();
  const isAdmin = useIsAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(emptyAdd);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert(t("users.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/users", formData);
      alert(t("users.addSuccess"));
      setShowAddModal(false);
      setFormData(emptyAdd);
      loadUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.response?.data || t("users.addError"));
    }
  };

  const openEdit = (u) => {
    setEdit({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone || "",
      address: u.address || "",
      role: u.role,
      active: u.active,
      newPassword: "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!edit) return;
    try {
      const body = {
        email: edit.email,
        fullName: edit.fullName,
        phone: edit.phone,
        address: edit.address,
        role: edit.role,
        active: edit.active,
      };
      if (edit.newPassword && edit.newPassword.trim()) {
        body.newPassword = edit.newPassword;
      }
      await axios.put(`/users/${edit.id}`, body);
      alert(t("forms.changesSaved"));
      setEdit(null);
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert(error.response?.data || t("forms.saveError"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("users.deleteConfirm"))) {
      try {
        await axios.delete(`/users/${id}`);
        alert(t("users.deleteSuccess"));
        loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert(t("users.deleteError"));
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.patch(`/users/${id}/toggle-active`);
      alert(t("users.toggleSuccess"));
      loadUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      alert(t("users.toggleError"));
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`/users/${id}/approve`);
      alert(t("users.approveSuccess"));
      loadUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      alert(
        error.response?.data
          ? String(error.response.data)
          : t("users.approveError")
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("list.notAvailable");
    const locale = i18n.language?.startsWith("ar") ? "ar-SA" : "en-US";
    return new Date(dateString).toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /** شارة الحالة: موافقة + نشاط */
  const userStatus = (u) => {
    if (u.approvalStatus === "PENDING") {
      return { className: "status pending-approval", text: t("users.statusPendingApproval") };
    }
    if (!u.active) {
      return { className: "status inactive", text: t("users.inactive") };
    }
    return { className: "status active", text: t("users.active") };
  };

  return (
    <div className="list-container list-container--users">
      <div className="list-header list-header--actions">
        <h1 className="list-page-title">{t("users.title")}</h1>
        <div className="list-header-actions">
          {isAdmin && (
            <AddListButton
              onClick={() => {
                setFormData(emptyAdd);
                setShowAddModal(true);
              }}
            >
              {t("users.addUser")}
            </AddListButton>
          )}
        </div>
      </div>

      {loading ? (
        <div>{t("users.loading")}</div>
      ) : (
        <div className="table-container table-container--users">
          <table>
            <thead>
              <tr>
                <th>{t("users.thUsername")}</th>
                <th>{t("users.thFullName")}</th>
                <th>{t("users.thEmail")}</th>
                <th>{t("users.thPhone")}</th>
                <th>{t("users.thRole")}</th>
                <th>{t("users.thStatus")}</th>
                <th>{t("users.thCreated")}</th>
                <th>{t("users.thUpdated")}</th>
                <th>{t("users.thActions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const st = userStatus(user);
                return (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td className="td-wrap">{user.email}</td>
                  <td>{user.phone || t("users.notSpecified")}</td>
                  <td>{user.role}</td>
                  <td className="td-status">
                    <span className={st.className} title={st.text}>
                      {st.text}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.updatedAt)}</td>
                  <td className="table-actions">
                    <div className="action-icon-group">
                      {isAdmin && (
                        <IconEdit
                          onClick={() => openEdit(user)}
                          label={t("users.editUser")}
                        />
                      )}
                      {isAdmin && user.approvalStatus === "PENDING" && (
                        <IconApprove
                          onClick={() => handleApprove(user.id)}
                          label={t("users.approveUser")}
                        />
                      )}
                      <IconUserToggle
                        onClick={() => handleToggleActive(user.id)}
                        isActive={user.active}
                        activateLabel={t("users.activate")}
                        deactivateLabel={t("users.deactivate")}
                      />
                      <IconDelete
                        onClick={() => handleDelete(user.id)}
                        label={t("users.delete")}
                      />
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{t("users.addModalTitle")}</h3>
            <form onSubmit={handleAddSubmit}>
              <input
                type="text"
                placeholder={t("users.thUsername")}
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder={t("auth.email")}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder={t("auth.password")}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("users.thFullName")}
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
              <input
                type="tel"
                placeholder={t("auth.phone")}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                required
              >
                <option value="PATIENT">{t("roles.PATIENT")}</option>
                <option value="DOCTOR">{t("roles.DOCTOR")}</option>
                <option value="NURSE">{t("roles.NURSE")}</option>
                <option value="RECEPTIONIST">{t("roles.RECEPTIONIST")}</option>
                <option value="ADMIN">{t("roles.ADMIN")}</option>
              </select>
              <input
                type="text"
                placeholder={t("auth.address")}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              <div className="modal-buttons">
                <button type="submit">{t("users.add")}</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData(emptyAdd);
                  }}
                >
                  {t("users.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {edit && isAdmin && (
        <div className="modal-overlay">
          <div className="modal modal--lg">
            <h3>{t("users.editModalTitle")}</h3>
            <p
              style={{
                margin: "0 0 0.75rem",
                color: "#64748b",
                fontSize: "0.9rem",
              }}
            >
              {t("users.thUsername")}: {edit.username}
            </p>
            <form onSubmit={handleEditSubmit}>
              <input
                type="email"
                placeholder={t("auth.email")}
                value={edit.email}
                onChange={(e) =>
                  setEdit({ ...edit, email: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder={t("users.thFullName")}
                value={edit.fullName}
                onChange={(e) =>
                  setEdit({ ...edit, fullName: e.target.value })
                }
                required
              />
              <input
                type="tel"
                placeholder={t("auth.phone")}
                value={edit.phone}
                onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
              />
              <input
                type="text"
                placeholder={t("auth.address")}
                value={edit.address}
                onChange={(e) =>
                  setEdit({ ...edit, address: e.target.value })
                }
              />
              <select
                value={edit.role}
                onChange={(e) =>
                  setEdit({ ...edit, role: e.target.value })
                }
                required
              >
                <option value="PATIENT">{t("roles.PATIENT")}</option>
                <option value="DOCTOR">{t("roles.DOCTOR")}</option>
                <option value="NURSE">{t("roles.NURSE")}</option>
                <option value="RECEPTIONIST">{t("roles.RECEPTIONIST")}</option>
                <option value="ADMIN">{t("roles.ADMIN")}</option>
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
                  checked={Boolean(edit.active)}
                  onChange={(e) =>
                    setEdit({ ...edit, active: e.target.checked })
                  }
                />
                {t("users.active")}
              </label>
              <input
                type="password"
                placeholder={t("forms.newPasswordOptional")}
                value={edit.newPassword}
                onChange={(e) =>
                  setEdit({ ...edit, newPassword: e.target.value })
                }
                autoComplete="new-password"
              />
              <div className="modal-buttons">
                <button type="submit">{t("forms.save")}</button>
                <button type="button" onClick={() => setEdit(null)}>
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

export default Users;
