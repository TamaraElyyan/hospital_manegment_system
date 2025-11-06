import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "./List.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "PATIENT",
    address: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     await axios.post('/auth/register', formData);
  //     alert('User added successfully');
  //     setShowModal(false);
  //     setFormData({
  //       username: '',
  //       email: '',
  //       password: '',
  //       fullName: '',
  //       phone: '',
  //       role: 'PATIENT',
  //       address: ''
  //     });
  //     loadUsers();
  //   } catch (error) {
  //     console.error('Error creating user:', error);
  //     alert(error.response?.data || 'Failed to add user');
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("/auth/register", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("User added successfully");
      setShowModal(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        fullName: "",
        phone: "",
        role: "PATIENT",
        address: "",
      });
      loadUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.response?.data || "Failed to add user");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/users/${id}`);
        alert("User deleted successfully");
        loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await axios.patch(`/users/${id}/toggle-active`);
      alert("User status updated");
      loadUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>User Management</h2>
        <div>
          <button onClick={() => setShowModal(true)} className="add-btn">
            Add New User
          </button>
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "Not specified"}</td>
                  <td>{user.role}</td>
                  <td>
                    <span
                      className={`status ${user.active ? "active" : "inactive"}`}
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.updatedAt)}</td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(user.id, user.active)}
                      className="toggle-btn"
                    >
                      {user.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New User</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
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
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              <div className="modal-buttons">
                <button type="submit">Add</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
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
