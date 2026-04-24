import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axios";
import { useIsAdmin, useCanEditRoom } from "../hooks/useRoleAccess";
import { AddListButton } from "../components/AddListButton";
import { IconEdit } from "../components/TableActionIcons";
import "./List.css";

const initialRoom = {
  roomNumber: "",
  roomType: "GENERAL",
  floor: "",
  capacity: "",
  status: "AVAILABLE",
  chargesPerDay: "",
  facilities: "",
  departmentId: "",
  currentPatientId: "",
};

const roomStatusText = (status, t) => {
  const s = String(status || "").toUpperCase();
  if (s === "AVAILABLE") return t("forms.roomAvailable");
  if (s === "OCCUPIED") return t("forms.roomOccupied");
  return status || t("list.notAvailable");
};

const Rooms = () => {
  const { t, i18n } = useTranslation();
  const canAdd = useIsAdmin();
  const canEdit = useCanEditRoom();
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialRoom);

  useEffect(() => {
    const prev = document.title;
    document.title = `${t("list.rooms")} — ${t("app.title")}`;
    return () => {
      document.title = prev;
    };
  }, [i18n.language, t]);

  useEffect(() => {
    loadRooms();
  }, [canAdd, canEdit]);

  const loadRooms = async () => {
    try {
      const [rRes, dRes, pRes] = await Promise.all([
        axios.get("/rooms"),
        axios.get("/departments"),
        canAdd || canEdit
          ? axios.get("/patients")
          : Promise.resolve({ data: [] }),
      ]);
      setRooms(rRes.data);
      setDepartments(dRes.data);
      setPatients(pRes.data || []);
    } catch (error) {
      console.error("Error loading rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildBody = (includePatient) => {
    const body = {
      roomNumber: form.roomNumber.trim(),
      roomType: form.roomType.trim(),
      status: form.status,
      floor: form.floor.trim() || undefined,
      facilities: form.facilities.trim() || undefined,
      capacity:
        form.capacity !== "" && !Number.isNaN(Number(form.capacity))
          ? Number(form.capacity)
          : undefined,
      chargesPerDay:
        form.chargesPerDay !== "" && !Number.isNaN(Number(form.chargesPerDay))
          ? Number(form.chargesPerDay)
          : undefined,
      department: form.departmentId
        ? { id: Number(form.departmentId) }
        : undefined,
    };
    if (includePatient && form.currentPatientId) {
      body.currentPatient = { id: Number(form.currentPatientId) };
    } else if (includePatient && !form.currentPatientId) {
      body.currentPatient = null;
    }
    return body;
  };

  const openAdd = () => {
    setEditId(null);
    setForm(initialRoom);
    setShowModal(true);
  };

  const openEdit = async (id) => {
    try {
      const { data: r } = await axios.get(`/rooms/${id}`);
      setEditId(id);
      setForm({
        roomNumber: r.roomNumber || "",
        roomType: r.roomType || "",
        floor: r.floor || "",
        capacity: r.capacity != null ? String(r.capacity) : "",
        status: r.status || "AVAILABLE",
        chargesPerDay:
          r.chargesPerDay != null ? String(r.chargesPerDay) : "",
        facilities: r.facilities || "",
        departmentId: r.department?.id ? String(r.department.id) : "",
        currentPatientId: r.currentPatient?.id
          ? String(r.currentPatient.id)
          : "",
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
    setForm(initialRoom);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const body = buildBody(!!form.currentPatientId);
      if (!form.currentPatientId) {
        delete body.currentPatient;
      }
      await axios.post("/rooms", body);
      alert(t("forms.addSuccess"));
      closeModal();
      loadRooms();
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
      const body = buildBody(true);
      await axios.put(`/rooms/${editId}`, body);
      alert(t("forms.changesSaved"));
      closeModal();
      loadRooms();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data
          ? String(err.response.data)
          : t("forms.saveError")
      );
    }
  };

  const roomFormFields = (showPatient) => (
    <>
      <input
        type="text"
        placeholder={t("forms.roomNumber")}
        value={form.roomNumber}
        onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder={t("forms.roomType")}
        value={form.roomType}
        onChange={(e) => setForm({ ...form, roomType: e.target.value })}
        required
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
      <input
        type="text"
        placeholder={t("forms.floor")}
        value={form.floor}
        onChange={(e) => setForm({ ...form, floor: e.target.value })}
      />
      <input
        type="number"
        min={1}
        placeholder={t("forms.capacity")}
        value={form.capacity}
        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
      />
      <input
        type="number"
        min={0}
        step="0.01"
        placeholder={t("forms.chargesPerDay")}
        value={form.chargesPerDay}
        onChange={(e) =>
          setForm({ ...form, chargesPerDay: e.target.value })
        }
      />
      <select
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
      >
        <option value="AVAILABLE">{t("forms.roomAvailable")}</option>
        <option value="OCCUPIED">{t("forms.roomOccupied")}</option>
      </select>
      <input
        type="text"
        placeholder={t("forms.facilities")}
        value={form.facilities}
        onChange={(e) => setForm({ ...form, facilities: e.target.value })}
      />
      {showPatient && (
        <select
          value={form.currentPatientId}
          onChange={(e) =>
            setForm({ ...form, currentPatientId: e.target.value })
          }
        >
          <option value="">{t("forms.currentPatientOptional")}</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName} ({p.patientNumber})
            </option>
          ))}
        </select>
      )}
    </>
  );

  return (
    <div className="list-container">
      <div className="list-header list-header--actions list-page-head">
        <h1 className="list-page-title">{t("list.rooms")}</h1>
        {canAdd && (
          <div className="list-header-actions">
            <AddListButton onClick={openAdd}>
              {t("forms.addRoom")}
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
                <th>{t("list.thRoomNumber")}</th>
                <th>{t("list.thRoomType")}</th>
                <th>{t("list.thDepartment")}</th>
                <th>{t("list.thFloor")}</th>
                <th>{t("list.thCapacity")}</th>
                <th>{t("list.thChargesPerDay")}</th>
                <th>{t("list.thStatus")}</th>
                {canEdit && <th>{t("list.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.roomNumber}</td>
                  <td>{room.roomType}</td>
                  <td>
                    {room.department?.name || t("list.notAvailable")}
                  </td>
                  <td>{room.floor || t("list.notAvailable")}</td>
                  <td>{room.capacity ?? t("list.notAvailable")}</td>
                  <td>${room.chargesPerDay || 0}</td>
                  <td>
                    <span className={`status ${String(room.status).toLowerCase()}`}>
                      {roomStatusText(room.status, t)}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="table-actions">
                      <div className="action-icon-group">
                        <IconEdit
                          onClick={() => openEdit(room.id)}
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
            <h3>{t("forms.newRoom")}</h3>
            <form onSubmit={handleAdd}>
              {roomFormFields(false)}
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
            <h3>{`${t("forms.edit")} — ${t("list.rooms")}`}</h3>
            <form onSubmit={handleEdit}>
              {roomFormFields(true)}
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

export default Rooms;
