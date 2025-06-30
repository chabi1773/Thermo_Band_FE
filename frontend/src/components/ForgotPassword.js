import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/update-password', // change to your deployed domain
    });
    if (error) alert(error.message);
    else alert('Password reset email sent!');
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow-lg" style={{ minWidth: '350px' }}>
        <h3 className="text-center mb-3">Reset Password</h3>
        <form onSubmit={handleReset}>
          <input
            className="form-control mb-3"
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn btn-warning w-100">Send Reset Email</button>
        </form>
      </div>
    </div>
  );
}
