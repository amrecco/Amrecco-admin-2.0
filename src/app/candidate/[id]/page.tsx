'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  BarChart3,
  MessageCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import CandidateSidebar from '@/src/components/candidate/CandidateSidebar';
import ProfileContent from '@/src/components/candidate/ProfileContent';
import StatsContent from '@/src/components/candidate/StatsContent';
import { CandidateDetail } from '@/src/components/candidate//types';

// ADD THIS INTERFACE
interface CandidateDetailPageProps {
  token?: string;
  shared?: boolean;
}

// UPDATE THIS LINE - Add props with default empty object
export default function CandidateDetailPage({ token, shared }: CandidateDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  // ADD THIS LINE - Determine if this is a shared view
  const isSharedView = shared || false;

  // State management
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileTab, setProfileTab] = useState('overview');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAsHidden, setShareAsHidden] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [highlightAction, setHighlightAction] = useState<string | null>(null);
// In CandidateDetailPage.tsx - Add this state
const [visibleTabs, setVisibleTabs] = useState<string[]>([
  'overview', 
  'experience', 
  'summary',
  'video', 
  'availability'
]);
  // Navigation items for sidebar
  const navigationItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'activity', label: 'Activity', icon: MessageCircle },
  ];

  // Fetch candidate data
  // UPDATE THIS USEEFFECT - Add token and isSharedView to dependencies
  useEffect(() => {
    // ADD THIS CONDITION - Check for shared view
    if (isSharedView && token) {
      fetchSharedCandidate();
    } else if (candidateId) {
      fetchCandidate();
    } else {
      console.error('No candidate ID in params!');
      alert('No candidate ID provided');
      router.push('/admin');
    }
  }, [candidateId, token, isSharedView]); // ADD token and isSharedView

// In CandidateDetailPage.tsx
const fetchSharedCandidate = async () => {
  try {
    setLoading(true);
    const response = await fetch(`/api/profile-link/${token}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidate) {
      throw new Error('Invalid API response');
    }
    
    setCandidate(data.candidate);
    
    // ✅ ADD THIS: Store visible tabs from API response
    if (data.visibleTabs && Array.isArray(data.visibleTabs)) {
      setVisibleTabs(data.visibleTabs);
    }
  } catch (error) {
    console.error('❌ Fetch error:', error);
    alert(`Failed to load candidate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
};

  // KEEP YOUR ORIGINAL fetchCandidate FUNCTION - NO CHANGES
  const fetchCandidate = async () => {
    try {
      setLoading(true);
      
      const apiUrl = `/api/candidate/${candidateId}`;
      
      // Don't send Authorization header, just use cookies
      const response = await fetch(apiUrl, {
        credentials: 'include',  // This sends cookies automatically
      });

      if (response.status === 401) {
        alert('Your session has expired. Please login again.');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.candidate) {
        throw new Error('Invalid API response');
      }
      
      setCandidate(data.candidate);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      alert(`Failed to load candidate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // KEEP YOUR ORIGINAL handleSendToCompany - NO CHANGES
  const handleSendToCompany = async (data: {
    companyName: string;
    jobTitle: string;
    hiringManagerEmail: string;
    hidePersonalInfo: boolean;
  }) => {
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch('/api/send-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateId: candidate!.id,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send candidate');
      }

      const result = await response.json();
      
      setSuccessMessage(`Successfully sent ${candidate!.fullName} to ${data.companyName}!`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      setShowSendModal(false);
    } catch (error) {
      console.error('Error sending candidate:', error);
      alert('Failed to send candidate to company');
    }
  };

  // KEEP YOUR ORIGINAL handleGenerateShareLink - NO CHANGES
  const handleGenerateShareLink = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch('/api/share-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateId: candidate!.id,
          hidden: shareAsHidden
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      
      // Copy to clipboard
      navigator.clipboard.writeText(data.shareUrl);
      
      setSuccessMessage('Share link copied to clipboard!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      setShowShareModal(false);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    }
  };

  // UPDATE THIS FUNCTION - Add shared view handling
  const handleBackClick = () => {
    if (isSharedView) {
      window.close();
    } else {
      router.push('/');
    }
  };
  const handleEditProfile = () => {
    if (!candidateId) {
      console.error('Cannot edit: No candidate ID available');
      return;
    }
    // Pass the candidate ID in the route
    router.push(`/edit-profile/${candidateId}`);
  };


  // UPDATE THIS FUNCTION - Pass isSharedView to ProfileContent
  const renderContent = () => {
    if (!candidate) return null;

    switch (activeTab) {
// In renderContent() function
case 'profile':
  return (
    <ProfileContent
      candidate={candidate}
      profileTab={profileTab}
      setProfileTab={setProfileTab}
      isSharedView={isSharedView}
      visibleTabs={isSharedView ? visibleTabs : undefined} // ✅ ADD THIS
    />
  );
      case 'stats':
        return <StatsContent candidate={candidate} />;
      case 'activity':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Activity Coming Soon</h3>
            <p className="text-slate-600">Candidate activity and engagement metrics will be available here</p>
          </div>
        );
      default:
        return null;
    }
  };

  // KEEP YOUR ORIGINAL LOADING STATE - NO CHANGES
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  // KEEP YOUR ORIGINAL NOT FOUND STATE - NO CHANGES
  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Candidate Not Found</h2>
          <p className="text-slate-600 mb-4">The candidate you're looking for doesn't exist</p>
          <button
            onClick={handleBackClick}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Success Message */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3"
        >
          <CheckCircle className="w-6 h-6" />
          <span className="font-medium">{successMessage}</span>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Left Column */}
          <div className="lg:col-span-4">
            <CandidateSidebar
              candidate={candidate}
              onBackClick={handleBackClick}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              navigationItems={navigationItems}
              highlightAction={highlightAction}
              isSharedView={isSharedView} // ADD THIS LINE
              editprofile={handleEditProfile}        />
          </div>

          {/* Main Content - Right Column */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}