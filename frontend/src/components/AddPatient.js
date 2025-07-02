import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AddPatient() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Step 1: Add patient, Step 2: Assign device
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [patientId, setPatientId] = useState(null);
  const [macAddress, setMacAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to get token
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

  async function handleAddPatient(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !age.trim()) {
      setError('Please enter name and age.');
      return;
    }
    setLoading(true);

    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Decode userId from JWT token payload
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const userId = decodedPayload.sub || decodedPayload.user_id || decodedPayload.id;

      const res = await fetch(
        'https://thermoband-production.up.railway.app/patients/add',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, name, age: Number(age) }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add patient');
        setLoading(false);
        return;
      }

      setPatientId(data.patient.patientid);
      setStep(2);
    } catch (err) {
      setError('Failed to add patient');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignDevice(e) {
    e.preventDefault();
    setError('');
    if (!macAddress.trim()) {
      setError('Please enter MAC address.');
      return;
    }
    setLoading(true);

    const token = await getToken();
    if (!token) {
      setLoading(false);
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
          body: JSON.stringify({ patientId, macAddress }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to assign device');
        setLoading(false);
        return;
      }

      alert('Patient added and device assigned successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to assign device');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      {step === 1 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Add New Patient</h2>
          <form onSubmit={handleAddPatient}>
            <label className="block mb-2">
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border p-2 rounded mt-1"
              />
            </label>
            <label className="block mb-4">
              Age:
              <input
                type="number"
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border p-2 rounded mt-1"
              />
            </label>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
            >
              {loading ? 'Adding...' : 'Add Patient'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Assign Device to Patient</h2>
          <p className="mb-4">
            Patient ID: <span className="font-mono">{patientId}</span>
          </p>
          <form onSubmit={handleAssignDevice}>
            <label className="block mb-4">
              Device MAC Address:
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                className="w-full border p-2 rounded mt-1"
                placeholder="e.g. 12:34:56:78:90"
              />
            </label>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
            >
              {loading ? 'Assigning...' : 'Assign Device'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
