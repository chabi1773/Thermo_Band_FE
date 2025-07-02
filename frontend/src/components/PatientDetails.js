import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../apiClient';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientDetails() {
  // ... all your state and functions unchanged ...

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
      {/* Back button */}
      <button
        className="btn btn-secondary mb-4"
        onClick={() => navigate(-1)}
        disabled={loading}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Loading...
          </>
        ) : (
          '← Back'
        )}
      </button>

      {/* Reset device button top right */}
      {deviceMac && (
        <button
          onClick={handleResetDevice}
          disabled={resetLoading}
          className="btn btn-danger position-absolute top-0 end-0 m-3"
          style={{ zIndex: 10 }}
        >
          {resetLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Resetting...
            </>
          ) : (
            'Reset Device'
          )}
        </button>
      )}

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
            {assignLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Assigning...
              </>
            ) : (
              'Assign Device'
            )}
          </button>
        </form>
      ) : (
        <>
          {/* Set Interval and Current Interval below chart later */}

          <h4 className="h5 mb-3">Temperature History (Last 6 hours)</h4>

          {temperatures.length === 0 ? (
            <p className="text-muted">No temperature data available.</p>
          ) : (
            <div className="card p-4 shadow mb-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temperatures}>
                  <XAxis dataKey="DateTime" />
                  <YAxis domain={[35, 42]} unit="°C" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="Temperature"
                    stroke="#16a34a"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Interval controls below chart */}
          <div className="mb-5">
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
              disabled={!interval}
              className="btn btn-warning mt-3 me-2"
            >
              {false /* replace with your interval loading state if you have one */ ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Setting...
                </>
              ) : (
                'Set Interval'
              )}
            </button>
          </div>

          {/* Delete Patient button bottom right */}
          <button
            onClick={handleDeletePatient}
            disabled={deleteLoading}
            className="btn btn-dark position-absolute bottom-0 end-0 m-3"
          >
            {deleteLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Deleting...
              </>
            ) : (
              'Delete Patient'
            )}
          </button>

          {error && <p className="text-danger mt-2">{error}</p>}
        </>
      )}
    </div>
  );
}
