import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else navigate('/dashboard'); // Redirect to dashboard after successful login
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ maxWidth: '400px', width: '100%', borderRadius: '12px' }}>
        <h3 className="text-center mb-4 fw-bold">Log In</h3>
        <form onSubmit={handleLogin}>
          <input
            className="form-control mb-3 py-2"
            type="email"
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            autoFocus
            style={{ fontSize: '1rem' }}
          />
          <input
            className="form-control mb-4 py-2"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
            style={{ fontSize: '1rem' }}
          />
          <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold fs-5">
            Log In
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/forgot-password" className="text-decoration-none small">
            Forgot Password?
          </Link>
        </div>

        <hr className="my-4" />

        <div className="text-center">
          <p className="mb-2">Don't have an account?</p>
          <Link to="/signup" className="btn btn-outline-primary w-100 py-2 fw-semibold fs-5">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
