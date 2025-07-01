import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/update-password', // update for production
    });
    if (error) alert(error.message);
    else alert('Password reset email sent!');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h3 className="text-center text-2xl font-semibold mb-6">Reset Password</h3>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-md transition"
          >
            Send Reset Email
          </button>
        </form>
      </div>
    </div>
  );
}
