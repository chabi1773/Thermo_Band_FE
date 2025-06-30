import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) alert(error.message);
    else alert('Password updated!');
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow-lg" style={{ minWidth: '350px' }}>
        <h3 className="text-center mb-3">Update Password</h3>
        <form onSubmit={handleUpdate}>
          <input
            className="form-control mb-3"
            type="password"
            placeholder="New Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn btn-primary w-100">Update Password</button>
        </form>
      </div>
    </div>
  );
}
