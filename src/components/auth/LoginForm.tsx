'use client';

import { FormEvent } from "react";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from "lucide-react";
export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    router.refresh();
    router.replace('/');
  } catch (err: any) {
    setError(err.message || 'An error occurred during login');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

      {/* Heading */}
      <h1 className="text-2xl font-semibold text-center text-gray-900">
        Admin Login
      </h1>
      <p className="text-sm text-center text-gray-500 mt-2">
        Access the admin dashboard
      </p>

      {/* Divider */}
      <div className="mt-6 mb-8 border-t border-gray-200" />

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
       <input
  name="username"
  type="text"
  required
  value={formData.username}
  onChange={(e) =>
    setFormData({ ...formData, username: e.target.value })
  }
  placeholder="Enter your username"
  className="w-full h-11 rounded-lg border border-gray-300 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A2458] focus:border-transparent"
/>

          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
       <input
  name="password"
  type="password"
  required
  value={formData.password}
  onChange={(e) =>
    setFormData({ ...formData, password: e.target.value })
  }
  placeholder="Enter your password"
  className="w-full h-11 rounded-lg border border-gray-300 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A2458] focus:border-transparent"
/>

          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-[#0A2458] text-white text-sm font-semibold
                     hover:bg-[#081E47] transition shadow-sm disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Amrecco. All rights reserved.
      </p>
    </div>
  );
}