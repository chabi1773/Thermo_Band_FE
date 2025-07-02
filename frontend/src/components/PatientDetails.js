import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../apiClient';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [temperatures, setTemperatures] = useState([]);
  const [deviceMac, setDeviceMac] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedMac, setSelectedMac] = useState('');
  const [interval, setInterval] = useState('300');
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  // getToken and handlers remain unchanged ...

  if (loading) {
    return <p className="text-center text-muted mt-4">Loading patient details...</p>;
  }

  return (
    <div className="container px-4 py-5 position-relative">
      <button
        className="btn btn-link mb-4 text-decoration-none"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* Reset button top-right */}
      {deviceMac && (
        <button
          onClick={handleResetDevice}
          disabled={resetLoading}
          className="btn btn-danger position-absolute top-0 end-0 m-3"
        >
          {resetLoading ? 'Resetting...' : 'Reset Device'}
        </button>
      )}

      <h2 className="h4 mb-2">
        {patient.name} <span className="text-muted">(Age: {patient.age})</span>
      </h2>

      <p className="mb-2">
        <strong>Linked Device MAC Address:</strong>{' '}
        <span>{deviceMac || 'No device linked'}</span>
      </p>

      <h4 className="h5 mb-3">Temperature History (Last 6 hours)</h4>

      {temperatures.length === 0 ? (
        <p className="text-muted">No temperature data available.</p>
      ) : (
        <div className="card p-4 shadow mb-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={temperatures}>
              <XAxis dataKey="DateTime" />
              <YAxis domain={[35, 42]} unit="°C" />
              <Tooltip />
              <Line type="monotone" dataKey="Temperature" stroke="#16a34a" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Move interval controls below chart */}
      {deviceMac && (
        <>
          <p className="mb-2">
            <strong>Current Interval:</strong> {interval ? `${interval / 60} min` : 'Not set'}
          </p>
          <div className="mb-4">
            <label className="form-label fw-semibold">Set Device Interval:</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="form-select w-auto d-inline-block me-2"
            >
              <option value="">Select Interval</option>
              <option value="300">5 minutes</option>
              <option value="900">15 minutes</option>
              <option value="1800">30 minutes</option>
              <option value="3600">1 hour</option>
              <option value="21600">6 hours</option>
            </select>
            <button
              onClick={handleSetInterval}
              disabled={!interval}
              className="btn btn-warning"
            >
              Set Interval
            </button>
          </div>
        </>
      )}

      {!deviceMac ? (
        <form onSubmit={handleAssignDevice} className="mb-5">
          <label className="form-label fw-semibold">Assign Device:</label>
          <select
            value={selectedMac}
            onChange={(e) => setSelectedMac(e.target.value)}
            className="form-select w-auto"
          >
            {devices.length === 0 ? (
              <option disabled>No unassigned devices available</option>
            ) : (
              devices.map((device) => (
                <option key={device.macaddress} value={device.macaddress}>
                  {device.macaddress}
                </option>
              ))
            )}
          </select>
          {error && <p className="text-danger mt-2">{error}</p>}
          <button
            type="submit"
            disabled={assignLoading || devices.length === 0}
            className="btn btn-primary mt-3"
          >
            {assignLoading ? 'Assigning...' : 'Assign Device'}
          </button>
        </form>
      ) : null}

      {/* Delete button bottom-right */}
      <button
        onClick={handleDeletePatient}
        disabled={deleteLoading}
        className="btn btn-dark position-absolute bottom-0 end-0 m-3"
      >
        {deleteLoading ? 'Deleting...' : 'Delete Patient'}
      </button>

      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  );
}
