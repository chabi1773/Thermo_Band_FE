import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import PatientDetails from './components/PatientDetails';
import AddPatient from './components/AddPatient';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#c2cbb3' }}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <PrivateRoute>
                  <PatientDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-patient"
              element={
                <PrivateRoute>
                  <AddPatient />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Login />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
