'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Send } from 'lucide-react';

interface SendToCompanyModalProps {
  showModal: boolean;
  onClose: () => void;
  onSend: (data: {
    companyName: string;
    jobTitle: string;
    hiringManagerEmail: string;
    hidePersonalInfo: boolean;
  }) => void;
  candidateName: string;
}

export default function SendToCompanyModal({ 
  showModal, 
  onClose, 
  onSend, 
  candidateName 
}: SendToCompanyModalProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    hiringManagerEmail: ''
  });
  const [hidePersonalInfo, setHidePersonalInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hiringManagers, setHiringManagers] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    if (showModal) {
      fetchCompanies();
    }
  }, [showModal]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await fetch('/api/hiring-managers');
      if (response.ok) {
        const data = await response.json();
        const hiringManagers = data.hiringManagers.map((hm: any) => ({
          name: `${hm.fullName} (${hm.companyName})`,
          companyName: hm.companyName,
          email: hm.email,
          fullName: hm.fullName
        }));
        setHiringManagers(hiringManagers);
      }
    } catch (error) {
      console.error('Error fetching hiring managers:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) return;

    setIsSubmitting(true);
    try {
      await onSend({
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        hiringManagerEmail: formData.hiringManagerEmail,
        hidePersonalInfo
      });
      setFormData({
        companyName: '',
        jobTitle: '',
        hiringManagerEmail: ''
      });
      setHidePersonalInfo(false);
      onClose();
    } catch (error) {
      console.error('Error sending candidate:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If company name is selected, auto-populate hiring manager email
    if (name === 'companyName' && value) {
      const selectedHM = hiringManagers.find(hm => hm.companyName === value);
      if (selectedHM) {
        setFormData(prev => ({
          ...prev,
          companyName: value,
          hiringManagerEmail: selectedHM.email
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Send to Hiring Manager</h3>
                <p className="text-sm text-gray-600">Send {candidateName} to a hiring manager</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hiring Manager *
              </label>
              {loadingCompanies ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                  Loading hiring managers...
                </div>
              ) : (
                <select
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a hiring manager</option>
                  {hiringManagers.map((hm, index) => (
                    <option key={index} value={hm.companyName} data-email={hm.email}>
                      {hm.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title (Optional)
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="e.g., Sales Manager, Account Executive"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify the role if different from candidate's current position
              </p>
            </div>

            {/* Privacy Option */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="hidePersonalInfo"
                  checked={hidePersonalInfo}
                  onChange={(e) => setHidePersonalInfo(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="hidePersonalInfo" className="text-sm font-medium text-blue-900 cursor-pointer">
                    Hide Personal Information
                  </label>
                  <p className="text-xs text-blue-700 mt-1">
                    When enabled, the hiring manager won't see email and phone number in the candidate profile
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.companyName.trim() || isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to Hiring Manager
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}