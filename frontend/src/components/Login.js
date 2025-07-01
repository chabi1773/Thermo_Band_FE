import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      // Save access token for API auth
      localStorage.setItem('supabaseToken', data.session.access_token);
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h3 className="text-center text-2xl font-bold mb-6">Log In</h3>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
          >
            Log In
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <hr className="my-6 border-gray-300" />

        <div className="text-center">
          <p className="mb-2 text-gray-700">Don't have an account?</p>
          <Link
            to="/signup"
            className="inline-block border border-indigo-600 text-indigo-600 font-semibold py-2 px-4 rounded-md hover:bg-indigo-50 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
