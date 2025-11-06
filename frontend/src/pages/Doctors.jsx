import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './List.css';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await axios.get('/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Doctors Management</h2>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div>Loading doctors...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>License Number</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Department</th>
                <th>Consultation Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>{doctor.user?.fullName || 'N/A'}</td>
                  <td>{doctor.licenseNumber}</td>
                  <td>{doctor.specialization}</td>
                  <td>{doctor.experienceYears} years</td>
                  <td>{doctor.department?.name || 'N/A'}</td>
                  <td>${doctor.consultationFee}</td>
                  <td>
                    <span className={`status ${doctor.available ? 'active' : 'inactive'}`}>
                      {doctor.available ? 'Available' : 'Unavailable'}
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

export default Doctors;
