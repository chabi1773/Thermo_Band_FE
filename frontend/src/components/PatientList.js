import React from 'react';
import { Link } from 'react-router-dom';

export default function PatientList({ patients }) {
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
          <Link
            to={`/patients/${patient.patientid}`}
            className="text-primary text-decoration-none"
          >
            {patient.name} (Age: {patient.age})
          </Link>
        </li>
      ))}
    </ul>
  );
}
