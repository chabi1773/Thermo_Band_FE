import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [temperatures, setTemperatures] = useState([]);
  const [deviceMac, setDeviceMac] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatientDetails() {
      setLoading(true);

      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from('Patient')
        .select('*')
        .eq('PatientID', id)
        .single();

      if (patientError || !patientData) {
        alert('Patient not found or error occurred');
        navigate('/dashboard');
        return;
      }
      setPatient(patientData);

      // Fetch temperature data for this patient
      const { data: tempData, error: tempError } = await supabase
        .from('DeviceTemp')
        .select('Temperature, DateTime')
        .eq('PatientID', id)
        .order('DateTime', { ascending: true });

      if (tempError) {
        alert('Failed to load temperature data');
        setTemperatures([]);
      } else {
        setTemperatures(
          tempData.map((t) => ({
            Temperature: t.Temperature,
            DateTime: new Date(t.DateTime).toLocaleString(),
          }))
        );
      }

      // Fetch device MAC address linked to patient (via backend API)
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/devicepatient/${id}`,
          {
            headers: {
              Authorization: `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
            },
          }
        );
        const data = await response.json();
        setDeviceMac(data.MacAddress || 'No device linked');
      } catch {
        setDeviceMac('Unable to fetch device info');
      }

      setLoading(false);
    }

    fetchPatientDetails();
  }, [id, navigate]);

  if (loading) return <p className="text-center mt-5">Loading patient details...</p>;

  return (
    <div className="container my-4">
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>Back</button>
      <h2>{patient.Name} (Age: {patient.Age})</h2>
      <p><strong>Linked Device MAC Address:</strong> {deviceMac}</p>

      <h4 className="mt-4">Temperature History</h4>
      {temperatures.length === 0 ? (
        <p>No temperature data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={temperatures}>
            <XAxis dataKey="DateTime" />
            <YAxis domain={[35, 42]} unit="°C" />
            <Tooltip />
            <Line type="monotone" dataKey="Temperature" stroke="#82ca9d" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
