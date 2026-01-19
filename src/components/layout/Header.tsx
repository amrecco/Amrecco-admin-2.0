'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, UserPlus, Users, Building2, Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Logout failed');
      }

      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo and Dashboard Info */}
          <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              )}
            </button>

            {/* Logo */}
            <Logo />

            {/* Dashboard Info - Hidden on mobile, visible on tablet+ */}
            <div className="hidden md:flex items-center gap-3 pl-3 sm:pl-6 border-l border-gray-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <a href="/" className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  Admin Dashboard
                </a>
                <p className="text-xs sm:text-sm text-gray-500 truncate hidden lg:block">
                  Manage candidates and accelerate placements
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
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

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-2 border-t border-gray-200 pt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Dashboard Info for Mobile */}
            <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <a href="/" className="text-base font-semibold text-gray-900">
                  Admin Dashboard
                </a>
                <p className="text-xs text-gray-500 truncate">
                  Manage candidates and accelerate placements
                </p>
              </div>
            </div>

            <Link
              href="/add-candidate"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-medium">Add Candidate</p>
                <p className="text-xs text-green-600">Create new candidate profile</p>
              </div>
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">{loading ? 'Logging out...' : 'Logout'}</p>
                <p className="text-xs text-red-600">End your session</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;