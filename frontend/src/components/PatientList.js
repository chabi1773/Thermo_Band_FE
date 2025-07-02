import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatientList({ patients }) {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);

  if (!patients || patients.length === 0) {
    return <p className="text-muted">No patients found for the selected filter.</p>;
  }

  return (
    <ul className="list-group">
      {patients.map((patient) => (
        <li
          key={patient.patientid}
          className="list-group-item d-flex justify-content-between align-items-center"
        >
          <div>
            {patient.name} (Age: {patient.age})
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setLoadingId(patient.patientid);
              navigate(`/patients/${patient.patientid}`);
            }}
            disabled={loadingId === patient.patientid}
          >
            {loadingId === patient.patientid ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Loading...
              </>
            ) : (
              'Details'
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
