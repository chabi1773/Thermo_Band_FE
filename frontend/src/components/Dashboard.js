import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientList from './PatientList';
import { supabase } from '../supabaseClient';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Modal, Button } from 'react-bootstrap';
import { QRCodeCanvas } from 'qrcode.react';

export default function Dashboard() {
  const navigate = useNavigate();

  const [temperatureData, setTemperatureData] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [hospitalID, setHospitalID] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('No active session or token:', sessionError);
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  }

  const handleAddDevice = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      setHospitalID(session.user.id);
      setShowDeviceModal(true);
    } else {
      console.error('No session or user ID found');
    }
  };

  const latestTempsByPatient = {};
  temperatureData.forEach((t) => {
    const current = latestTempsByPatient[t.patientid];
    if (!current || new Date(t.datetime) > new Date(current.datetime)) {
      latestTempsByPatient[t.patientid] = t;
    }
  });

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
      const latestTemp = latestTempsByPatient[patient.patientid];
      if (!latestTemp) return false;
      return latestTemp.temperature >= range[0] && latestTemp.temperature <= range[1];
    });

    setFilteredPatients(filtered);
  };

  useEffect(() => {
    filterPatients();
  }, [filter, temperatureData]);

  const chartData = Object.values(latestTempsByPatient).map((t) => ({
    ...t,
    DateTime: new Date(t.datetime).toLocaleString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    patientName: t.name || 'Unknown',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.patientName}</p>
          <p style={{ margin: 0 }}>Temp: {data.temperature}°C</p>
          <p style={{ margin: 0 }}>Time: {data.DateTime}</p>
        </div>
      );
    }
    return null;
  };

  const copyHospitalID = () => {
    navigator.clipboard.writeText(hospitalID)
      .then(() => alert('Hospital ID copied to clipboard!'))
      .catch((err) => console.error('Copy failed:', err));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <h3>Loading dashboard data...</h3>
      </div>
    );
  }

  return (
    <div className="container-fluid d-flex flex-column" style={{ height: '100vh', padding: '1.5rem' }}>
      <h2 className="text-center mb-4 title">Patient Temperature Dashboard</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="mb-4" style={{ width: '50%', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="filter" className="form-label fw-semibold">
            Filter by Temperature Range:
          </label>
          <select
            id="filter"
            style={{ width: '40%', borderRadius: '4px', padding: '10px 16px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All</option>
            <option value="low">Low (below 37.5°C)</option>
            <option value="moderate">Moderate (37.5°C - 38.9°C)</option>
            <option value="high">High (39°C and above)</option>
          </select>
        </div>
        <div className="mb-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/add-patient')}
            style={{ borderRadius: '4px', padding: '10px 16px' }}
          >
            Add Patient
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleAddDevice}
            style={{ borderRadius: '4px', padding: '10px 16px' }}
          >
            Add Device
          </button>
        </div>
      </div>

      {/* Modal for Device QR + instructions */}
      <Modal show={showDeviceModal} onHide={() => setShowDeviceModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Device Setup Info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Scan the QR code below to configure your device.</li>
            <li>
              After scanning, it will redirect to{' '}
              <a href="http://192.168.4.1" target="_blank" rel="noopener noreferrer">
                http://192.168.4.1
              </a>{' '}
              for final setup.
            </li>
          </ul>
          <div className="text-center mb-3">
            <QRCodeCanvas value="http://192.168.4.1" size={180} />
          </div>
          <p
            style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '0.95rem',
            }}
          >
            Device ID: <strong>{hospitalID}</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={copyHospitalID}>
            Copy Hospital ID
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Temperature Chart */}
      <div
        className="p-3 rounded mb-5 overflow-hidden shadow-sm"
        style={{
          padding: '4dvh 6dvw',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px rgba(115, 115, 115, 0.5) solid',
          backgroundColor: '#f1f1f4',
        }}
      >
        <h5 className="text-center mb-3">Latest Patient Temperatures</h5>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis
              dataKey="patientName"
              label={{ value: 'Patient', position: 'insideBottomRight', offset: -5 }}
              type="category"
            />
            <YAxis domain={[35, 40]} unit="°C" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                {/*<ReferenceLine y={36.1} stroke="orange" strokeWidth={2} /> */}
            <ReferenceLine y={38} stroke="red" strokeWidth={2} />
            <Scatter data={chartData} dataKey="temperature" fill="#011f4d" shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 rounded flex-grow-1 overflow-auto patientList shadow-sm"
        style={{
          marginTop: '-1.5rem',
          border: '1px rgba(115, 115, 115, 0.5) solid',
        }}
      >
        <h4 className="mb-3 fw-semibold">Patients</h4>
        <PatientList patients={filteredPatients} />
      </div>
    </div>
  );
}
