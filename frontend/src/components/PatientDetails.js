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

  async function getToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) {
      alert('You must be logged in');
      return null;
    }
    return session.access_token;
  }

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const patientData = await apiGet(`/patients/${id}`);
        setPatient(patientData);

        const tempData = await apiGet(`/temperatures/${id}`);
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

        const filteredTemps = tempData
          .filter((t) => new Date(t.datetime) > sixHoursAgo)
          .map((t) => ({
            Temperature: t.temperature,
            DateTime: new Date(t.datetime).toLocaleTimeString(),
          }));

        setTemperatures(filteredTemps);

        const deviceData = await apiGet(`/devicepatient/${id}`);
        const currentMac = deviceData.macaddress || '';
        setDeviceMac(currentMac);

        if (deviceData.interval) {
          setInterval(deviceData.interval.toString());
        }

        if (!currentMac) {
          const unassignedDevices = await apiGet('/esp32/unassigned-devices');
          setDevices(unassignedDevices);
          if (unassignedDevices.length > 0) {
            setSelectedMac(unassignedDevices[0].macaddress);
          }
        }
      } catch (err) {
        console.error(err.message);
        alert('Failed to load patient details');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  // Your handlers unchanged...

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '300px' }}
      >
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: '3rem', height: '3rem' }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-5 position-relative" style={{ minHeight: '600px' }}>
      {/* Reset Device button top right */}
      {deviceMac && (
        <button
          onClick={handleResetDevice}
          disabled={resetLoading}
          className="btn btn-danger position-absolute"
          style={{ top: '1rem', right: '1rem' }}
        >
          {resetLoading ? 'Resetting...' : 'Reset Device'}
        </button>
      )}

      <button
        className="btn btn-link mb-4 text-decoration-none"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h2 className="h4 mb-2">
        {patient.name} <span className="text-muted">(Age: {patient.age})</span>
      </h2>

      <p className="mb-2">
        <strong>Linked Device MAC Address:</strong>{' '}
        <span>{deviceMac || 'No device linked'}</span>
      </p>

      {deviceMac && (
        <p className="mb-4">
          <strong>Current Interval:</strong>{' '}
          {interval ? `${interval / 60} min` : 'Not set'}
        </p>
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
      ) : (
        <>
          {/* Chart */}
          <div className="card p-4 shadow mb-3">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temperatures}>
                <XAxis dataKey="DateTime" />
                <YAxis domain={[35, 42]} unit="°C" />
                <Tooltip />
                <Line type="monotone" dataKey="Temperature" stroke="#16a34a" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Below chart: interval controls */}
          <div className="d-flex align-items-center mb-5 gap-3">
            <div>
              <label className="form-label fw-semibold mb-1">Set Device Interval:</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="form-select w-auto"
              >
                <option value="">Select Interval</option>
                <option value="300">5 minutes</option>
                <option value="900">15 minutes</option>
                <option value="1800">30 minutes</option>
                <option value="3600">1 hour</option>
                <option value="21600">6 hours</option>
              </select>
            </div>
            <button
              onClick={handleSetInterval}
              disabled={!interval}
              className="btn btn-warning"
            >
              Set Interval
            </button>
            <p className="mb-0 ms-3">
              <strong>Current Interval:</strong> {interval ? `${interval / 60} min` : 'Not set'}
            </p>
          </div>
        </>
      )}

      <button
        onClick={handleDeletePatient}
        disabled={deleteLoading}
        className="btn btn-dark position-absolute"
        style={{ bottom: '1rem', right: '1rem' }}
      >
        {deleteLoading ? 'Deleting...' : 'Delete Patient'}
      </button>

      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  );
}
