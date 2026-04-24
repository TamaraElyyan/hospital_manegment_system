import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axios";
import {
  useIsAdminOrReceptionist,
  useCanEditPatient,
} from "../hooks/useRoleAccess";
import { AddListButton } from "../components/AddListButton";
import { IconEdit } from "../components/TableActionIcons";
import { tGender, tPatientRecordStatus } from "../i18n/labels";
import "./List.css";

const emptyPatient = {
  fullName: "",
  gender: "MALE",
  dateOfBirth: "",
  age: "",
  phone: "",
  email: "",
  address: "",
  bloodType: "",
  medicalHistory: "",
  allergies: "",
  emergencyContact: "",
  emergencyPhone: "",
  status: "ACTIVE",
};

const Patients = () => {
  const { t } = useTranslation();
  const canAdd = useIsAdminOrReceptionist();
  const canEdit = useCanEditPatient();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyPatient);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await axios.get("/patients");
      setPatients(response.data);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyPatient);
    setShowModal(true);
  };

  const openEdit = async (id) => {
    try {
      const { data } = await axios.get(`/patients/${id}`);
      setEditId(id);
      setForm({
        fullName: data.fullName || "",
        gender: data.gender || "MALE",
        dateOfBirth: data.dateOfBirth
          ? String(data.dateOfBirth).slice(0, 10)
          : "",
        age: data.age != null ? String(data.age) : "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        bloodType: data.bloodType || "",
        medicalHistory: data.medicalHistory || "",
        allergies: data.allergies || "",
        emergencyContact: data.emergencyContact || "",
        emergencyPhone: data.emergencyPhone || "",
        status: data.status || "ACTIVE",
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
    setForm(emptyPatient);
  };

  const buildPayload = () => {
    const ageNum =
      form.age !== "" && !Number.isNaN(Number(form.age))
        ? Number(form.age)
        : null;
    return {
      fullName: form.fullName.trim(),
      gender: form.gender,
      status: form.status,
      dateOfBirth: form.dateOfBirth || null,
      age: ageNum,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      bloodType: form.bloodType.trim() || null,
      medicalHistory: form.medicalHistory.trim() || null,
      allergies: form.allergies.trim() || null,
      emergencyContact: form.emergencyContact.trim() || null,
      emergencyPhone: form.emergencyPhone.trim() || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`/patients/${editId}`, buildPayload());
        alert(t("forms.changesSaved"));
      } else {
        const payload = buildPayload();
        const createBody = { ...payload };
        await axios.post("/patients", createBody);
        alert(t("forms.addSuccess"));
      }
      closeModal();
      loadPatients();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data
          ? String(err.response.data)
          : t(editId ? "forms.saveError" : "forms.addError")
      );
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="list-container">
      <div className="list-header list-header--actions list-page-head">
        <h1 className="list-page-title">{t("list.patients")}</h1>
        {canAdd && (
          <div className="list-header-actions">
            <AddListButton onClick={openAdd}>
              {t("forms.addPatient")}
            </AddListButton>
          </div>
        )}
      </div>

      <div className="list-actions">
        <input
          type="text"
          placeholder={t("list.searchPatients")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div>{t("loading")}</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("list.thPatientNumber")}</th>
                <th>{t("list.thName")}</th>
                <th>{t("list.thAge")}</th>
                <th>{t("list.thGender")}</th>
                <th>{t("list.thPhone")}</th>
                <th>{t("list.thBloodType")}</th>
                <th>{t("list.thStatus")}</th>
                {canEdit && <th>{t("list.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.patientNumber}</td>
                  <td>{patient.fullName}</td>
                  <td>{patient.age}</td>
                  <td>{tGender(t, patient.gender)}</td>
                  <td>{patient.phone}</td>
                  <td>
                    {patient.bloodType || t("list.notAvailable")}
                  </td>
                  <td>
                    <span
                      className={`status ${String(
                        patient.status || ""
                      ).toLowerCase()}`}
                    >
                      {tPatientRecordStatus(t, patient.status)}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="table-actions">
                      <div className="action-icon-group">
                        <IconEdit
                          onClick={() => openEdit(patient.id)}
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
          <div className="modal modal--lg">
            <h3>
              {editId
                ? `${t("forms.edit")} — ${t("list.patients")}`
                : t("forms.newPatient")}
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder={t("forms.fullName")}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="MALE">{t("forms.male")}</option>
                <option value="FEMALE">{t("forms.female")}</option>
                <option value="OTHER">{t("forms.other")}</option>
              </select>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
              />
              <input
                type="number"
                min={0}
                max={150}
                placeholder={t("forms.age")}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
              <input
                type="tel"
                placeholder={t("forms.phone")}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                type="email"
                placeholder={t("forms.email")}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="text"
                placeholder={t("auth.address")}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                type="text"
                placeholder={t("forms.bloodType")}
                value={form.bloodType}
                onChange={(e) =>
                  setForm({ ...form, bloodType: e.target.value })
                }
              />
              <input
                type="text"
                placeholder={t("forms.medicalHistory")}
                value={form.medicalHistory}
                onChange={(e) =>
                  setForm({ ...form, medicalHistory: e.target.value })
                }
              />
              <input
                type="text"
                value={form.allergies}
                onChange={(e) =>
                  setForm({ ...form, allergies: e.target.value })
                }
                placeholder={t("forms.allergies")}
              />
              <input
                type="text"
                value={form.emergencyContact}
                onChange={(e) =>
                  setForm({ ...form, emergencyContact: e.target.value })
                }
                placeholder={t("forms.emergencyContact")}
              />
              <input
                type="tel"
                value={form.emergencyPhone}
                onChange={(e) =>
                  setForm({ ...form, emergencyPhone: e.target.value })
                }
                placeholder={t("forms.emergencyPhone")}
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">{t("forms.patientActive")}</option>
                <option value="INACTIVE">{t("forms.patientInactive")}</option>
              </select>
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

export default Patients;
