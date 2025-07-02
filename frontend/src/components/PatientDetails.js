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
  const [setIntervalLoading, setSetIntervalLoading] = useState(false);
  const [error, setError] = useState('');

  async function getToken() {
    const { data: { session }, error } = await supabase.auth.getSession();
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

  async function handleAssignDevice(e) {
    e.preventDefault();
    setError('');
    if (!selectedMac) {
      setError('Please select a device MAC address.');
      return;
    }
    setAssignLoading(true);

    const token = await getToken();
    if (!token) {
      setAssignLoading(false);
      return;
    }

    try {
      const res = await fetch(
        'https://thermoband-production.up.railway.app/patients/assign-device',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ patientId: id, macAddress: selectedMac }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to assign device');
        setAssignLoading(false);
        return;
      }

      setDeviceMac(selectedMac);
      alert('Device assigned successfully!');
    } catch (err) {
      setError('Failed to assign device');
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleResetDevice() {
    const confirmed = window.confirm(
      'Are you sure you want to reset the device? This will unassign it from the patient.'
    );
    if (!confirmed) return;

    setResetLoading(true);
    setError('');

    const token = await getToken();
    if (!token) {
      setResetLoading(false);
      return;
    }

    try {
      const res = await fetch(
        'https://thermoband-production.up.railway.app/patients/reset-device',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ macAddress: deviceMac, reset: true }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset device');
        setResetLoading(false);
        return;
      }

      alert('Device reset successfully! You can now assign a new device.');
      setDeviceMac('');
      setSelectedMac('');
      setInterval('300');
      const deviceList = await apiGet('/esp32/unassigned-devices');
      setDevices(deviceList);
      if (deviceList.length > 0) setSelectedMac(deviceList[0].macaddress);
    } catch (err) {
      setError('Failed to reset device');
    } finally {
      setResetLoading(false);
    }
  }

  async function handleDeletePatient() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this patient? This action cannot be undone and will erase all related data.'
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    setError('');

    const token = await getToken();
    if (!token) {
      setDeleteLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `https://thermoband-production.up.railway.app/patients/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete patient');
        setDeleteLoading(false);
        return;
      }

      alert('Patient deleted successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete patient');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSetInterval() {
    setError('');
    setSetIntervalLoading(true);
    const token = await getToken();
    if (!token || !interval || !deviceMac) {
      setSetIntervalLoading(false);
      return;
    }

    try {
      const res = await fetch(
        'https://thermoband-production.up.railway.app/patients/set-interval',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            macAddress: deviceMac,
            interval: parseInt(interval),
          }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to set interval');
        setSetIntervalLoading(false);
        return;
      }

      alert('Interval updated successfully!');
    } catch (err) {
      setError('Failed to set interval');
    } finally {
      setSetIntervalLoading(false);
    }
  }

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

  function renderButtonContent(isLoading, text) {
    return isLoading ? (
      <>
        <span
          className="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
        {text}
      </>
    ) : (
      text
    );
  }

  return (
    <div className="container px-4 py-3 position-relative" style={{ minHeight: '650px' }}>
      {/* Back button top-left */}
      <button
        className="btn btn-secondary position-absolute top-0 start-0 m-3"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* Centered patient details */}
      <div className="d-flex flex-column align-items-center mb-4">
        <h2 className="h4 mb-1 text-center">
          {patient.name} <span className="text-muted">(Age: {patient.age})</span>
        </h2>
        <div className="d-flex gap-4 flex-wrap justify-content-center">
          <span>
            <strong>MAC Address:</strong> {deviceMac || 'No device linked'}
          </span>
          {deviceMac && (
            <span>
              <strong>Interval:</strong> {interval ? `${interval / 60} min` : 'Not set'}
            </span>
          )}
        </div>
      </div>

      {!deviceMac ? (
        <form onSubmit={handleAssignDevice} className="mb-4">
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
            {renderButtonContent(assignLoading, 'Assign Device')}
          </button>
        </form>
      ) : (
        <>
          <h4 className="h5 mb-2">Temperature History (Last 6 hours)</h4>
          {temperatures.length === 0 ? (
            <p className="text-muted mb-3">No temperature data available.</p>
          ) : (
            <div className="card p-3 shadow mb-3">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={temperatures}>
                  <XAxis dataKey="DateTime" />
                  <YAxis domain={[35, 42]} unit="°C" />
                  <Tooltip />
                  <Line type="monotone" dataKey="Temperature" stroke="#16a34a" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mb-4">
            <label className="form-label fw-semibold">Set Device Interval:</label>
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
            <button
              onClick={handleSetInterval}
              disabled={!interval || setIntervalLoading}
              className="btn btn-warning mt-3 me-2"
            >
              {renderButtonContent(setIntervalLoading, 'Set Interval')}
            </button>
          </div>

          <button
            onClick={handleResetDevice}
            disabled={resetLoading}
            className="btn btn-danger position-absolute top-0 end-0 m-3"
            style={{ zIndex: 10 }}
          >
            {renderButtonContent(resetLoading, 'Reset Device')}
          </button>

          <button
            onClick={handleDeletePatient}
            disabled={deleteLoading}
            className="btn btn-dark position-absolute bottom-0 end-0 m-3"
          >
            {renderButtonContent(deleteLoading, 'Delete Patient')}
          </button>

          {error && <p className="text-danger mt-2">{error}</p>}
        </>
      )}
    </div>
  );
}
