import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../apiClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [temperatures, setTemperatures] = useState([]);
  const [deviceMac, setDeviceMac] = useState('');
  const [loading, setLoading] = useState(true);

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
        setDeviceMac(deviceData.macaddress || 'No device linked');
      } catch (err) {
        console.error(err.message);
        alert('Failed to load patient details');
        //navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id, navigate]);

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
        <span className="text-gray-800">{deviceMac}</span>
      </p>

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
