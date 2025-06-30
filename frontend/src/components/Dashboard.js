import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PatientList from './PatientList';

export default function Dashboard() {
  const [temperatureData, setTemperatureData] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // Fetch temperatures for current user's patients
    const { data: tempData, error: tempError } = await supabase
      .from('DeviceTemp')
      .select('Temperature, DateTime, PatientID')
      .order('DateTime', { ascending: true });

    const { data: patientData, error: patientError } = await supabase
      .from('Patient')
      .select('*');

    if (tempError || patientError) {
      console.error(tempError || patientError);
      return;
    }

    setTemperatureData(tempData);
    setPatients(patientData);
    setFilteredPatients(patientData);
  }

  useEffect(() => {
    filterPatients();
  }, [filter, temperatureData]);

  const filterPatients = () => {
    if (filter === 'all') {
      setFilteredPatients(patients);
      return;
    }

    const range = {
      low: [0, 37.4],
      moderate: [37.5, 38.9],
      high: [39.0, 50]
    }[filter];

    const filtered = patients.filter((patient) => {
      const patientTemps = temperatureData.filter(t => t.PatientID === patient.PatientID);
      return patientTemps.some(t => t.Temperature >= range[0] && t.Temperature <= range[1]);
    });

    setFilteredPatients(filtered);
  };

  return (
    <div className="container my-4">
      <h2 className="mb-4 text-center">Patient Temperature Dashboard</h2>

      <div className="mb-4">
        <label htmlFor="filter" className="form-label">Filter by Temperature Range:</label>
        <select
          className="form-select"
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="low">Low (below 37.5°C)</option>
          <option value="moderate">Moderate (37.5°C - 38.9°C)</option>
          <option value="high">High (39°C and above)</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={temperatureData.map(t => ({ ...t, DateTime: new Date(t.DateTime).toLocaleString() }))}
        >
          <XAxis dataKey="DateTime" />
          <YAxis domain={[35, 42]} unit="°C" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Temperature" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <h4 className="mt-5">Patients</h4>
      <PatientList patients={filteredPatients} />
    </div>
  );
}
