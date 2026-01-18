'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, UserPlus, Users, Building2 } from 'lucide-react';
import Logo from './Logo';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onLogout?: () => void;
}

 
const Header: React.FC<HeaderProps> = () => {

   const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Logout failed');
      }

      // Redirect to login page
      router.push('/login');
      router.refresh(); // clears server components cache
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Dashboard Title */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Logo/>
            {/* Dashboard Info */}
            <div className="flex items-center gap-3 pl-6 border-l border-gray-300">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Manage candidates and accelerate placements
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/add-candidate"
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <UserPlus className="w-5 h-5" />
              <span>Candidate</span>
            </Link>

          
             

           
             <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors duration-200"
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;