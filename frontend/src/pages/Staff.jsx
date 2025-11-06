import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './List.css';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await axios.get('/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Staff Management</h2>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div>Loading staff...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Qualifications</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td>{member.user?.fullName || 'N/A'}</td>
                  <td>{member.position}</td>
                  <td>{member.department?.name || 'N/A'}</td>
                  <td>{member.shift || 'N/A'}</td>
                  <td>{member.qualifications || 'N/A'}</td>
                  <td>
                    <span className={`status ${member.active ? 'active' : 'inactive'}`}>
                      {member.active ? 'Active' : 'Inactive'}
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

export default Staff;
