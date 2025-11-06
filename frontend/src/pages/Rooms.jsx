import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './List.css';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await axios.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Rooms Management</h2>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div>Loading rooms...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Type</th>
                <th>Department</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Charges/Day</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.roomNumber}</td>
                  <td>{room.roomType}</td>
                  <td>{room.department?.name || 'N/A'}</td>
                  <td>{room.floor || 'N/A'}</td>
                  <td>{room.capacity}</td>
                  <td>${room.chargesPerDay || 0}</td>
                  <td>
                    <span className={`status ${room.status.toLowerCase()}`}>
                      {room.status}
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

export default Rooms;
