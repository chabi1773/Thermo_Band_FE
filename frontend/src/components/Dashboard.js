import React, { useEffect, useState } from 'react';
import PatientList from './PatientList';
import { supabase } from '../supabaseClient';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const [temperatureData, setTemperatureData] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('No active session or token:', sessionError);
      return;
    }

    const token = session.access_token;

    try {
      const tempRes = await fetch(
        'https://thermoband-production.up.railway.app/temperatures',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const tempData = await tempRes.json();

      const patientRes = await fetch(
        'https://thermoband-production.up.railway.app/patients',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const patientData = await patientRes.json();

      setTemperatureData(tempData);
      setPatients(patientData);
      setFilteredPatients(patientData);
    } catch (err) {
      console.error('Fetch error:', err);
    }
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
      high: [39.0, 50],
    }[filter];

    const filtered = patients.filter((patient) => {
      const patientTemps = temperatureData.filter(
        (t) => t.patientid === patient.patientid
      );
      return patientTemps.some(
        (t) => t.temperature >= range[0] && t.temperature <= range[1]
      );
    });

    setFilteredPatients(filtered);
  };

  const chartData = temperatureData.map((t) => ({
    ...t,
    DateTime: new Date(t.datetime).toLocaleString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    patientName: t.name || 'Unknown',
  }));

  return (
    <div 
        className="max-w-6xl mx-auto px-4 py-6"
        style={{ backgroundColor: '#f8f5ee' }} >
      <h2 className="text-2xl font-semibold text-center mb-6">
        Patient Temperature Dashboard
      </h2>

      <div className="mb-6">
        <label
          htmlFor="filter"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Filter by Temperature Range:
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-64 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All</option>
          <option value="low">Low (below 37.5°C)</option>
          <option value="moderate">Moderate (37.5°C - 38.9°C)</option>
          <option value="high">High (39°C and above)</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow mb-8">
        <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <XAxis dataKey="DateTime" label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} />
              <YAxis domain={[35, 42]} unit="°C" />
              <Tooltip
                formatter={(value, name, props) => {
                  const { payload } = props;
                  return [`${value}°C`, payload.patientName];
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter
                data={chartData}
                dataKey="temperature"
                fill="#4f46e5"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
      </div>

      <h4 className="text-lg font-semibold mb-2">Patients</h4>
      <PatientList patients={filteredPatients} />
    </div>
  );
}
