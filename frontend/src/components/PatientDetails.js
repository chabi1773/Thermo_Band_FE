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
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper function to get JWT token from supabase
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
        // Fetch patient info
        const patientData = await apiGet(`/patients/${id}`);
        setPatient(patientData);

        // Fetch temperature history
        const tempData = await apiGet(`/temperatures/${id}`);
        setTemperatures(
          tempData.map((t) => ({
            Temperature: t.temperature,
            DateTime: new Date(t.datetime).toLocaleString(),
          }))
        );

        // Fetch linked device MAC
        const deviceData = await apiGet(`/devicepatient/${id}`);
        const currentMac = deviceData.macaddress || '';
        setDeviceMac(currentMac);

        // Fetch list of unassigned devices only if no device assigned
        if (!currentMac) {
          const unassignedDevices = await apiGet('/esp32/unassigned-devices');
          setDevices(unassignedDevices);
          if (unassignedDevices.length > 0) setSelectedMac(unassignedDevices[0].macaddress);
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
      // Reload unassigned devices
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

  if (loading) {
    return <p className="text-center text-gray-600 mt-6">Loading patient details...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        className="mb-4 text-sm text-blue-600 hover:underline"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h2 className="text-2xl font-semibold mb-2">
        {patient.name} <span className="text-gray-500">(Age: {patient.age})</span>
      </h2>

      <p className="mb-4">
        <strong className="text-gray-700">Linked Device MAC Address:</strong>{' '}
        <span className="text-gray-800">{deviceMac || 'No device linked'}</span>
      </p>

      {/* Assign Device Section */}
      {!deviceMac ? (
        <form onSubmit={handleAssignDevice} className="mb-6">
          <label className="block mb-2 font-semibold">Assign Device:</label>
          <select
            value={selectedMac}
            onChange={(e) => setSelectedMac(e.target.value)}
            className="border p-2 rounded w-full max-w-xs"
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
          {error && <p className="text-red-600 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={assignLoading || devices.length === 0}
            className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
          >
            {assignLoading ? 'Assigning...' : 'Assign Device'}
          </button>
        </form>
      ) : (
        <div className="mb-6">
          <button
            onClick={handleResetDevice}
            disabled={resetLoading}
            className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 mr-3"
          >
            {resetLoading ? 'Resetting...' : 'Reset Device'}
          </button>

          <button
            onClick={handleDeletePatient}
            disabled={deleteLoading}
            className="bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-900"
          >
            {deleteLoading ? 'Deleting...' : 'Delete Patient'}
          </button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      )}

      <h4 className="text-lg font-semibold mb-2">Temperature History</h4>

      {temperatures.length === 0 ? (
        <p className="text-gray-500">No temperature data available.</p>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow mt-4">
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
    </div>
  );
}
