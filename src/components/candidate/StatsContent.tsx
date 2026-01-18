'use client';

import { motion } from 'framer-motion';
import { Briefcase, Star, User, Calendar, Eye } from 'lucide-react';
import { CandidateDetail } from './types';

interface StatsContentProps {
  candidate: CandidateDetail;
}

export default function StatsContent({ candidate }: StatsContentProps) {
  return (
    <div className="space-y-12">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <motion.div
          className="bg-white rounded-xl border border-slate-200 p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-700 mb-2">{candidate.applicationCount}</p>
            <p className="text-slate-600 font-semibold">Applications</p>
          </div>
        </motion.div>
        
        <motion.div
          className="bg-white rounded-xl border border-slate-200 p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-700 mb-2">{candidate.managerRating}/5</p>
            <p className="text-slate-600 font-semibold">Manager Rating</p>
          </div>
        </motion.div>
        
        <motion.div
          className="bg-white rounded-xl border border-slate-200 p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-700 mb-2">{candidate.profileCreated ? 'Yes' : 'No'}</p>
            <p className="text-slate-600 font-semibold">Profile Complete</p>
          </div>
        </motion.div>
        
        <motion.div
          className="bg-white rounded-xl border border-slate-200 p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-purple-700 mb-2">
              {new Date(candidate.createdDate).toLocaleDateString()}
            </p>
            <p className="text-slate-600 font-semibold">Joined Date</p>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <motion.div
        className="bg-white rounded-xl border border-slate-200 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center mr-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
            <p className="text-slate-600 text-sm">Account details and activity status</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <div className="flex items-center mb-4">
              <Eye className="w-5 h-5 text-blue-600 mr-2" />
              <label className="text-sm font-semibold text-slate-700">Profile Visibility</label>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {candidate.profileVisibility || 'Public'}
            </p>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-green-600 mr-2" />
              <label className="text-sm font-semibold text-slate-700">Last Login</label>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {candidate.lastLogin ? new Date(candidate.lastLogin).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}