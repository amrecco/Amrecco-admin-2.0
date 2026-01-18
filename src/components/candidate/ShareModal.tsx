'use client';

import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

interface ShareModalProps {
  showShareModal: boolean;
  shareAsHidden: boolean;
  setShareAsHidden: (value: boolean) => void;
  onClose: () => void;
  onGenerateLink: () => void;
}

export default function ShareModal({ 
  showShareModal, 
  shareAsHidden, 
  setShareAsHidden, 
  onClose, 
  onGenerateLink 
}: ShareModalProps) {
  if (!showShareModal) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-8 max-w-lg w-full mx-4 overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Elegant background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-indigo-300/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-pink-300/20 rounded-full blur-2xl transform -translate-x-12 translate-y-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl mr-4">
              <Share2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Share Profile</h3>
              <p className="text-slate-500 font-medium">Generate a secure sharing link</p>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg mb-8">
            <label className="flex items-start space-x-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={shareAsHidden}
                  onChange={(e) => setShareAsHidden(e.target.checked)}
                  className="w-5 h-5 text-[#001e4f] border-slate-300 rounded-lg focus:ring-[#001e4f] focus:ring-2"
                />
                {shareAsHidden && (
                  <div className="absolute inset-0 bg-[#001e4f] rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <div>
                <span className="font-bold text-slate-800 group-hover:text-[#001e4f] transition-colors">
                  Hide Profile Before Sharing
                </span>
                <p className="text-sm text-slate-600 mt-1 font-medium">
                  Limited details with masked personal information
                </p>
              </div>
            </label>
            
            <div className={`mt-4 p-4 rounded-xl border-2 transition-all duration-300 ${
              shareAsHidden
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-800'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  shareAsHidden ? 'bg-amber-500' : 'bg-blue-500'
                }`}></div>
                <p className="font-bold text-sm">
                  {shareAsHidden
                    ? 'Profile will be shared with masked personal information'
                    : 'Profile will be shared with full details'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-white/70 backdrop-blur-sm border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-white/90 hover:border-slate-300 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Cancel
            </button>
            <button
              onClick={onGenerateLink}
              className="group flex-1 px-6 py-4 bg-gradient-to-r from-[#001e4f] via-blue-700 to-indigo-700 text-white rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative flex items-center justify-center">
                <Share2 className="w-5 h-5 mr-2" />
                Generate Link
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}