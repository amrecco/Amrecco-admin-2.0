'use client';

import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  Linkedin, 
  Star, 
  MessageCircle, 
  Target, 
  ArrowLeft,
  Share2,
  MapPin
} from 'lucide-react';
import { CandidateDetail } from './types';
import CandidateRating from '@/src/components/layout/CandidateRating';
import ExpandableSkillsBadges from '@/src/components/layout/ExpandableSkillsBadges';
import { formatLinkedInUrl, getLinkedInDisplayText } from '@/src/Utils/urlHelpers';

interface CandidateSidebarProps {
  candidate: CandidateDetail;
  onBackClick: () => void;
  activeTab: string;
  editprofile: () => void;
  setActiveTab: (tab: string) => void;
  navigationItems: Array<{ id: string; label: string; icon: any }>;
  highlightAction?: string | null;
  isSharedView?: boolean;
}

export default function CandidateSidebar({ 
  candidate, 
  onBackClick,
   editprofile, 
  activeTab, 
  setActiveTab, 
  navigationItems,
  highlightAction,
  isSharedView = false
}: CandidateSidebarProps) {
  const initials = candidate.fullName ? candidate.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  const skillsArray = candidate.skills ? candidate.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Hide personal info if this is a shared view with hidePersonalInfo flag
  const shouldHidePersonalInfo = isSharedView ;

  return (
    <div className="space-y-4">
        {/* Enhanced Profile Card */}
        <div className="relative bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <button 
            onClick={onBackClick}
            className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md"
            title={isSharedView ? "Close" : "Back to Admin Dashboard"}
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          <div className="flex flex-col items-center space-y-4 mt-8">
            {/* Enhanced Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300">
                {initials}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-3 border-white shadow-md"></div>
            </div>
            
            {/* Enhanced User Info */}
            <div className="text-center w-full space-y-3">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{candidate.fullName}</h2>
              <p className="text-sm text-slate-600 break-all font-medium">
                {shouldHidePersonalInfo ? 'Hidden' : candidate.email}
              </p>
              {candidate.location && (
                <div className="flex items-center justify-center text-sm text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="font-medium">{candidate.location}</span>
                </div>
              )}
            </div>

            {/* Enhanced Status Badge */}
            <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm border ${
              candidate.status === 'Active' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300/50' :
              candidate.status === 'New' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300/50' :
              candidate.status === 'Under Review' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300/50' :
              'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300/50'
            }`}>
              {candidate.status || 'Active'}
            </div>
 {!isSharedView &&(<button
            type="button"
            onClick={editprofile}
            className={`w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 text-sm font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
              highlightAction === 'send' ? 'ring-4 ring-yellow-300 ring-opacity-60 animate-pulse' : ''
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Edit Profile
          </button>
        )}
      
          </div>

          {/* Enhanced Contact Info - Hide if shouldHidePersonalInfo */}
          {!shouldHidePersonalInfo && (
            <div className="mt-6 pt-4 border-t border-slate-200/60 space-y-3">
              {candidate.phone && (
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                  <Phone className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="truncate font-medium">{candidate.phone}</span>
                </div>
              )}
              {candidate.linkedin && (
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                  <Linkedin className="w-4 h-4 mr-3 text-slate-500" />
                  <a href={formatLinkedInUrl(candidate.linkedin)} target="_blank" rel="noopener noreferrer" className="hover:text-[#001e4f] transition-colors truncate font-medium">
                    {getLinkedInDisplayText(candidate.linkedin)}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Manager Rating - Only show for non-shared views */}
          {!isSharedView && (
            <div className="mt-6 pt-4 border-t border-slate-200/60">
              <CandidateRating 
                candidateId={candidate.id}
                candidateName={candidate.fullName}
                hiringManagerId="admin-user"
                hiringManagerName="Admin"
                company="AMRECCO"
                userRole="admin"
              />
            </div>
          )}

          {/* Enhanced Skills */}
          {skillsArray.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200/60">
              <h4 className="font-bold mb-3 text-slate-900 flex items-center text-sm">
                <Target className="w-4 h-4 mr-2 text-slate-600" />
                Top Skills
              </h4>
              <ExpandableSkillsBadges skills={skillsArray} maxInitialSkills={4} />
            </div>
          )}
        </div>

        {/* Enhanced Navigation */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-bold shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-[#001e4f] to-[#001a42] text-white shadow-md transform scale-105'
                      : 'text-slate-600 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 hover:text-[#001e4f] hover:shadow-md'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
    </div>
  );
}