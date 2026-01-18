'use client';

import { useState, useEffect } from 'react';
import { Star, MessageCircle, User, Calendar, Send, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Rating {
  id: string;
  rating: number;
  comments: string;
  hiringManagerName: string;
  interviewStage: string;
  recommendation: string;
  company: string;
  createdDate: string;
}

interface CandidateRatingProps {
  candidateId: string;
  candidateName: string;
  hiringManagerId?: string;
  hiringManagerName?: string;
  company?: string;
  position?: string;
  userRole: 'admin' | 'hiring-manager' | 'candidate';
  readonly?: boolean;
}

export default function CandidateRating({
  candidateId,
  candidateName,
  hiringManagerId,
  hiringManagerName,
  company,
  position,
  userRole,
  readonly = false
}: CandidateRatingProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [currentRating, setCurrentRating] = useState(0);
  const [comments, setComments] = useState('');
  const [interviewStage, setInterviewStage] = useState('Initial Screening');
  const [recommendation, setRecommendation] = useState('Neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const interviewStages = [
    'Initial Screening',
    'Phone Interview',
    'Video Interview',
    'In-Person Interview',
    'Final Interview',
    'Reference Check',
    'Offer Extended',
    'Offer Accepted'
  ];

  const recommendations = ['Recommend', 'Neutral', 'Do Not Recommend'];

  useEffect(() => {
    fetchRatings();
  }, [candidateId, userRole]);

  const fetchRatings = async () => {
    if (!candidateId) return;

    try {
      setLoading(true);
      let url = `/api/candidate-ratings?candidateId=${candidateId}&userRole=${userRole}`;
      
      // Only add hiringManagerId for hiring managers, not for admin (admin should see ALL ratings)
      if (userRole === 'hiring-manager' && hiringManagerId) {
        url += `&hiringManagerId=${hiringManagerId}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
        setAverageRating(data.averageRating || 0);
        setTotalRatings(data.totalRatings || 0);

        // If hiring manager has existing rating, populate form
        // For admin, check if admin has existing rating
        if (userRole === 'hiring-manager' && data.userRating) {
          setCurrentRating(data.userRating.rating);
          setComments(data.userRating.comments || '');
          setInterviewStage(data.userRating.interviewStage || 'Initial Screening');
          setRecommendation(data.userRating.recommendation || 'Neutral');
        } else if (userRole === 'admin' && hiringManagerId === 'admin-user') {
          // Check if admin has an existing rating
          const adminRating = data.ratings?.find((r: any) => r.hiringManagerName === 'Admin');
          if (adminRating) {
            setCurrentRating(adminRating.rating);
            setComments(adminRating.comments || '');
            setInterviewStage(adminRating.interviewStage || 'Initial Screening');
            setRecommendation(adminRating.recommendation || 'Neutral');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setMessage('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!hiringManagerId || !hiringManagerName) {
      setMessage('Missing hiring manager information. Please refresh and try again.');
      return;
    }

    if (currentRating === 0) {
      setMessage('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/candidate-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          candidateName,
          hiringManagerId,
          hiringManagerName,
          company: company || '',
          position: position || '',
          rating: currentRating,
          comments,
          interviewStage,
          recommendation,
        }),
      });

      if (response.ok) {
        setMessage('✅ Rating submitted successfully!');
        setShowRatingForm(false);
        fetchRatings(); // Refresh ratings
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setMessage('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, interactive = false }: { rating: number; onRatingChange?: (rating: number) => void; interactive?: boolean }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.div
          key={star}
          whileHover={interactive ? { scale: 1.1 } : {}}
          whileTap={interactive ? { scale: 0.95 } : {}}
        >
          <Star
            className={`w-4 h-4 transition-all duration-300 ${
              star <= rating 
                ? 'text-amber-400 fill-amber-400 drop-shadow-sm' 
                : 'text-slate-300 hover:text-amber-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        </motion.div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-3 sm:p-4 shadow-md w-full mb-3">
        <div className="bg-blue-100 px-2 py-1 rounded-lg mb-2">
          <p className="text-xs font-bold text-blue-800">📊 RATING SECTION (Loading...)</p>
        </div>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
              <div className="h-2 bg-slate-200 rounded w-1/4"></div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="h-3 bg-slate-200 rounded w-1/4 mb-3"></div>
            <div className="h-12 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-3 sm:p-4 shadow-md w-full mb-3">
      <div className="bg-blue-100 px-2 py-1 rounded-lg mb-2">
        <p className="text-xs font-bold text-blue-800">📊 RATING SECTION</p>
      </div>
      
      {/* Compact Header Section */}
      <div className="flex flex-col space-y-3 mb-4">
        {/* Rating Display */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-lg font-bold text-slate-900">
                {averageRating > 0 ? `${averageRating.toFixed(1)}/5` : '0/5'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
            </p>
          </div>
        </div>

        {/* Compact Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {(userRole === 'hiring-manager' || userRole === 'admin') && !readonly && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowRatingForm(!showRatingForm)}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm font-medium text-xs"
            >
              <Star className="w-3 h-3" />
              <span>{userRole === 'admin' ? 'Admin Rate' : 'Rate'}</span>
            </motion.button>
          )}
          
          {(userRole === 'admin' || totalRatings > 0) && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowAllRatings(!showAllRatings)}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all duration-200 shadow-sm font-medium text-xs border border-slate-300/50"
            >
              {showAllRatings ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showAllRatings ? 'Hide' : 'View'}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Compact Rating Form */}
      <AnimatePresence>
        {showRatingForm && (userRole === 'hiring-manager' || userRole === 'admin') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-200/60 pt-4 mb-4"
          >
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-lg border border-blue-200/40 p-3 space-y-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {userRole === 'admin' ? 'Admin Rating' : 'Rate Candidate'}
                </h4>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Rating *
                </label>
                <div className="flex items-center space-x-2">
                  <StarRating 
                    rating={currentRating} 
                    onRatingChange={setCurrentRating}
                    interactive
                  />
                  {currentRating > 0 && (
                    <span className="text-sm font-semibold text-slate-700">
                      {currentRating}/5
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Stage
                  </label>
                  <select
                    value={interviewStage}
                    onChange={(e) => setInterviewStage(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300/60 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs font-medium text-slate-700"
                  >
                    {interviewStages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Recommend
                  </label>
                  <select
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300/60 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-xs font-medium text-slate-700"
                  >
                    {recommendations.map((rec) => (
                      <option key={rec} value={rec}>{rec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={2}
                    placeholder="Your feedback..."
                    className="w-full px-2 py-1.5 border border-slate-300/60 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none text-xs font-medium text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>

              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    message.includes('✅') || message.includes('successfully') 
                      ? 'text-green-700 bg-green-100' 
                      : 'text-red-700 bg-red-100'
                  }`}
                >
                  {message}
                </motion.p>
              )}

              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="flex-1 px-2 py-1.5 border border-slate-300/60 text-slate-700 rounded-md hover:bg-slate-100 transition-all duration-200 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRatingSubmit}
                  disabled={isSubmitting || currentRating === 0}
                  className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Manager Feedback Section */}
      <div className="border-t border-slate-200/60 pt-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-3 h-3 text-white" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            {userRole === 'admin' ? 'All Ratings & Feedback' : 'Manager Feedback'}
          </h4>
        </div>

        {ratings.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-lg border border-slate-200/60 p-3 text-center">
            <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-xs">No feedback available.</p>
            <p className="text-slate-500 text-xs mt-1">
              {userRole === 'hiring-manager' ? 'Be the first to rate!' : 'Ratings will appear here.'}
            </p>
          </div>
        ) : showAllRatings ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {ratings.map((rating, index) => (
              <motion.div 
                key={rating.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-white to-slate-50/50 rounded-lg border border-slate-200/60 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {userRole === 'candidate' ? 'Hiring Manager' : rating.hiringManagerName || 'Anonymous'}
                      </p>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <StarRating rating={rating.rating} />
                        <span className="text-xs font-semibold text-slate-700">{rating.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                    {new Date(rating.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                
                {rating.comments && (
                  <div className="bg-white rounded-md border border-slate-200/60 p-2 mb-2">
                    <p className="text-slate-700 text-xs leading-relaxed font-medium">{rating.comments}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    {rating.interviewStage && (
                      <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                        <Calendar className="w-2.5 h-2.5" />
                        <span className="truncate max-w-20">{rating.interviewStage}</span>
                      </div>
                    )}
                  </div>
                  {rating.recommendation && (
                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                      rating.recommendation.includes('Recommend') 
                        ? 'bg-green-100 text-green-800'
                        : rating.recommendation === 'Neutral'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rating.recommendation}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-lg border border-slate-200/60 p-3 text-center">
            <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-xs">Manager feedback is available</p>
            <p className="text-slate-500 text-xs mt-1">
              Click "<strong>View</strong>" to see feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}