import React from 'react';
import { Link } from 'react-router-dom';

export default function PatientList({ patients }) {
  if (!patients || patients.length === 0) {
    return <p>No patients found for the selected filter.</p>;
  }

  return (
    <ul className="list-group">
      {patients.map((patient) => (
        <li key={patient.PatientID} className="list-group-item">
          <Link to={`/patient/${patient.PatientID}`}>
            {patient.Name} (Age: {patient.Age})
          </Link>
        </li>
      ))}
    </ul>
  );
}
