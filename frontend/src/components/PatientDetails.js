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
  const [notification, setNotification] = useState({ message: '', type: '' });

  async function getToken() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      showNotification('You must be logged in', 'error');
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
        showNotification('Failed to load patient details', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  function showNotification(msg, type = 'success') {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  }

  async function handleAssignDevice(e) {
    e.preventDefault();
    if (!selectedMac) {
      showNotification('Please select a device MAC address.', 'error');
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ patientId: id, macAddress: selectedMac }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        showNotification(data.error || 'Failed to assign device', 'error');
        setAssignLoading(false);
        return;
      }

      setDeviceMac(selectedMac);
      showNotification('Device assigned successfully!', 'success');
    } catch (err) {
      showNotification('Failed to assign device', 'error');
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleResetDevice() {
    if (!window.confirm('Are you sure you want to reset the device?')) return;

    setResetLoading(true);
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ macAddress: deviceMac, reset: true }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        showNotification(data.error || 'Failed to reset device', 'error');
        setResetLoading(false);
        return;
      }

      showNotification('Device reset successfully!', 'success');
      setDeviceMac('');
      setSelectedMac('');
      setInterval('300');
      const deviceList = await apiGet('/esp32/unassigned-devices');
      setDevices(deviceList);
      if (deviceList.length > 0) setSelectedMac(deviceList[0].macaddress);
    } catch (err) {
      showNotification('Failed to reset device', 'error');
    } finally {
      setResetLoading(false);
    }
  }

  async function handleDeletePatient() {
    if (!window.confirm('Are you sure you want to delete this patient? This cannot be undone.')) return;

    setDeleteLoading(true);
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (!res.ok) {
        showNotification(data.error || 'Failed to delete patient', 'error');
        setDeleteLoading(false);
        return;
      }

      showNotification('Patient deleted successfully!', 'success');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      showNotification('Failed to delete patient', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSetInterval() {
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ macAddress: deviceMac, interval: parseInt(interval) }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        showNotification(data.error || 'Failed to set interval', 'error');
        setSetIntervalLoading(false);
        return;
      }

      showNotification('Interval updated successfully!', 'success');
    } catch (err) {
      showNotification('Failed to set interval', 'error');
    } finally {
      setSetIntervalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  function renderButtonContent(isLoading, text) {
    return isLoading ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {text}
      </>
    ) : text;
  }

  return (
    <div className="container px-4 py-3 position-relative" style={{ minHeight: '650px' }}>
      {/* Custom Notification */}
      {notification.message && (
        <div
          className={`position-fixed top-0 start-50 translate-middle-x p-3 shadow rounded-4 ${
            notification.type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'
          }`}
          style={{
            zIndex: 9999,
            marginTop: '20px',
            backdropFilter: 'blur(6px)',
            opacity: 0.95,
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Back button */}
      <button
        className="btn btn-secondary position-absolute top-0 start-0 m-3 rounded-pill"
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

      {/* Rest of the content... */}
      {/* (Device assignment form, chart, interval selector, reset/delete buttons) */}
    </div>
  );
}
