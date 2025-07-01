import React from 'react';
import { Link } from 'react-router-dom';

export default function PatientList({ patients }) {
  if (!patients || patients.length === 0) {
    return <p className="text-gray-500">No patients found for the selected filter.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200 border border-gray-300 rounded-md">
      {patients.map((patient) => (
        <li
          key={patient.PatientID}
          className="px-4 py-3 hover:bg-indigo-50 transition-colors"
        >
          <Link
            to={`/patient/${patient.PatientID}`}
            className="text-indigo-600 hover:underline"
          >
            {patient.Name} (Age: {patient.Age})
          </Link>
        </li>
      ))}
    </ul>
  );
}
