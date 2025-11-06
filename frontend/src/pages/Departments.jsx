import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './List.css';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await axios.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Departments Management</h2>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div>Loading departments...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Head of Department</th>
                <th>Location</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.name}</td>
                  <td>{dept.description || 'N/A'}</td>
                  <td>{dept.headOfDepartment || 'N/A'}</td>
                  <td>{dept.location || 'N/A'}</td>
                  <td>{dept.phone || 'N/A'}</td>
                  <td>
                    <span className={`status ${dept.active ? 'active' : 'inactive'}`}>
                      {dept.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Departments;
