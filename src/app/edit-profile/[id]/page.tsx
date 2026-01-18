// File: app/edit-profile/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  GraduationCap,
  Briefcase,
  ArrowLeft,
  Target,
  Award,
  Save,
  X,
  MessageCircle
} from 'lucide-react'
import { formatLinkedInUrl } from '@/src/Utils/urlHelpers'

interface Experience {
  company: string
  position: string
  duration: string
  description: string
}

interface Education {
  institution: string
  degree: string
  field: string
  graduationYear: string
  type: string
}

interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin: string
}

interface CandidateDetail {
  id: string
  fullName: string
  email: string
  phone: string
  location: string
  linkedin: string
  summary: string
  experience: Experience[] | string
  education: Education[] | string
  skills: string[] | string
  certifications: string[] | string
  industry: string
  salesRoleType: string
  annualRevenue: number
  bookOfBusiness: boolean
  importExportFocus: string
  salaryExpectationMin: number
  salaryExpectationMax: number
  willingToRelocate: string
  candidatePreferences: string[]
  tradeLanes: string[]
  commodities: string
  modeOfTransportation: string[]
  InterviewSummary?: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const candidateId = params?.id as string
  
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!candidateId) {
      setError('No candidate ID provided')
      setLoading(false)
      return
    }
    fetchCandidateDetail()
  }, [candidateId])

  const fetchCandidateDetail = async () => {
    if (!candidateId) return
    
    try {
      setLoading(true)
      setError('')
      
      const apiUrl = `/api/candidate/${candidateId}`
      const response = await fetch(apiUrl, { credentials: 'include' })
      
      if (response.status === 401) {
        setError('Session expired. Please login again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }
      
      if (response.status === 404) {
        setError('Candidate profile not found')
        return
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      const candidateData = data.user || data.candidate
      
      if (!candidateData) {
        throw new Error('Invalid API response: missing candidate data')
      }
      
      setCandidate(candidateData)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    if (!candidate) return
    const processedValue = field === 'linkedin' && value ? formatLinkedInUrl(value) : value
    setCandidate(prev => prev ? { ...prev, [field]: processedValue } : null)
  }

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true
    const digitsOnly = phone.replace(/\D/g, '')
    const phoneRegex = /^[\d\s\-\(\)\+]+$/
    return phoneRegex.test(phone) && digitsOnly.length >= 10
  }

  const handleSave = async () => {
    if (!candidate || !candidateId) {
      setError('Cannot save: Missing candidate data')
      return
    }

    if (candidate.phone && !validatePhoneNumber(candidate.phone)) {
      setError('Please enter a valid phone number')
      return
    }
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const updateData = {
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        linkedin: candidate.linkedin,
        summary: candidate.summary,
        experience: candidate.experience,
        education: candidate.education,
        skills: candidate.skills,
        certifications: candidate.certifications,
        industry: candidate.industry,
        salesRoleType: candidate.salesRoleType,
        annualRevenue: candidate.annualRevenue,
        bookOfBusiness: candidate.bookOfBusiness,
        importExportFocus: candidate.importExportFocus,
        salaryExpectationMin: candidate.salaryExpectationMin,
        salaryExpectationMax: candidate.salaryExpectationMax,
        willingToRelocate: candidate.willingToRelocate,
        candidatePreferences: candidate.candidatePreferences,
        tradeLanes: candidate.tradeLanes,
        commodities: candidate.commodities,
        modeOfTransportation: candidate.modeOfTransportation,
        InterviewSummary: candidate.InterviewSummary || ''
      }
      
      const response = await fetch(`/api/candidate/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })
      
      if (response.status === 401) {
        setError('Session expired. Please log in again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update: ${response.status}`)
      }
      
      setSuccess('Profile updated successfully!')
      setTimeout(() => router.push(`/candidate/${candidateId}`), 1500)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/candidate/${candidateId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001e4f] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fcf9f4] via-[#faf7f2] to-[#f8f5f0] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-red-900 mb-4">Profile Not Found</h1>
            {error && <p className="text-red-700 mb-4">{error}</p>}
            <button onClick={handleCancel} className="inline-flex items-center px-6 py-3 bg-[#001e4f] text-white rounded-xl hover:bg-[#001a42]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcf9f4] via-[#faf7f2] to-[#f8f5f0] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="square-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#001e4f" strokeWidth="0.5" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#square-grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pt-24 sm:pt-28">
        {/* Header */}
        <motion.div className="text-center mb-8 lg:mb-12" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#001e4f] mb-4 lg:mb-6 leading-tight px-2">
            Edit Profile
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
            Update professional information for {candidate.fullName}
          </p>
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="space-y-8">
              
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100">
                <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input type="text" value={candidate.fullName || ''} onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input type="email" value={candidate.email || ''} onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input type="tel" value={candidate.phone || ''} onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-200 ${
                        candidate.phone && !validatePhoneNumber(candidate.phone) ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-[#001e4f]'
                      }`} />
                    {candidate.phone && !validatePhoneNumber(candidate.phone) && (
                      <p className="mt-1 text-sm text-red-600">Please enter a valid phone number (minimum 10 digits)</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                    <input type="text" value={candidate.location || ''} onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn Profile</label>
                    <input type="url" value={candidate.linkedin || ''} onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                      placeholder="https://linkedin.com/in/your-profile" />
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-100">
                <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  Professional Summary
                </h3>
                <textarea value={candidate.summary || ''} onChange={(e) => setCandidate(prev => prev ? { ...prev, summary: e.target.value } : null)}
                  rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                  placeholder="Brief professional summary and key achievements..." />
              </div>

              {/* Interview Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100">
                <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  Interview Summary
                </h3>
                <textarea value={candidate.InterviewSummary || ''} 
                  onChange={(e) => setCandidate(prev => prev ? { ...prev, InterviewSummary: e.target.value } : null)}
                  rows={6} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                  placeholder="Interview notes, feedback, and key observations..." />
              </div>

              {/* Sales Details */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100">
                <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  Sales Details
                </h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Industry</label>
                    <select value={candidate.industry || ''} onChange={(e) => setCandidate(prev => prev ? { ...prev, industry: e.target.value } : null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200">
                      <option value="">Select Industry</option>
                      <option value="Freight Forwarding">Freight Forwarding</option>
                      <option value="Trucking">Trucking</option>
                      <option value="3PL">3PL</option>
                      <option value="SaaS Logistics">SaaS Logistics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sales Role Type</label>
                    <select value={candidate.salesRoleType || ''} onChange={(e) => setCandidate(prev => prev ? { ...prev, salesRoleType: e.target.value } : null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200">
                      <option value="">Select Role Type</option>
                      <option value="Hunter/Outside Sales">Hunter/Outside Sales</option>
                      <option value="Farming/Inside Sales">Farming/Inside Sales</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Annual Revenue Generated</label>
                    <input type="number" value={candidate.annualRevenue || ''} 
                      onChange={(e) => setCandidate(prev => prev ? { ...prev, annualRevenue: parseFloat(e.target.value) || 0 } : null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                      placeholder="e.g., 1500000" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Book of Business</label>
                    <select value={candidate.bookOfBusiness?.toString() || ''} 
                      onChange={(e) => setCandidate(prev => prev ? { ...prev, bookOfBusiness: e.target.value === 'true' } : null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200">
                      <option value="">Select Option</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Import/Export Focus</label>
                    <select value={candidate.importExportFocus || ''} 
                      onChange={(e) => setCandidate(prev => prev ? { ...prev, importExportFocus: e.target.value } : null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200">
                      <option value="">Select Focus</option>
                      <option value="Imports">Imports</option>
                      <option value="Exports">Exports</option>
                      <option value="Both">Both</option>
                      <option value="Not Specified">Not Specified</option>
                    </select>
                  </div>
                </div>

                {/* Salary & Preferences */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Salary Min ($)</label>
                    <input type="number" value={candidate.salaryExpectationMin || ''} 
                      onChange={(e) => setCandidate(prev => prev ? { ...prev, salaryExpectationMin: parseFloat(e.target.value) || 0 } : null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                      placeholder="e.g., 80000" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Salary Max ($)</label>
                    <input type="number" value={candidate.salaryExpectationMax || ''} 
                      onChange={(e) => setCandidate(prev => prev ? { ...prev, salaryExpectationMax: parseFloat(e.target.value) || 0 } : null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                      placeholder="e.g., 120000" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Willing to Relocate</label>
                    <select value={candidate.willingToRelocate || ''} 
                      onChange={(e) => setCandidate(prev => prev ? { ...prev, willingToRelocate: e.target.value } : null)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200">
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Preferences, Trade Lanes, Commodities, Transportation */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate Preferences</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-white p-3 rounded-lg border border-slate-200">
                      {['Remote', 'Sales Manager', 'Account Executive', 'Business Development', 'Inside Sales', 'Outside Sales', 'Hybrid Work', 'Full-time', 'Part-time', 'Contract'].map((pref) => (
                        <label key={pref} className="flex items-center hover:bg-slate-50 p-1 rounded cursor-pointer">
                          <input type="checkbox" 
                            checked={Array.isArray(candidate.candidatePreferences) ? candidate.candidatePreferences.includes(pref) : false}
                            onChange={(e) => {
                              const currentPrefs = Array.isArray(candidate.candidatePreferences) ? candidate.candidatePreferences : []
                              const newPrefs = e.target.checked ? [...currentPrefs, pref] : currentPrefs.filter(p => p !== pref)
                              setCandidate(prev => prev ? { ...prev, candidatePreferences: newPrefs } : null)
                            }}
                            className="mr-2 rounded border-slate-300 text-[#001e4f] focus:ring-[#001e4f]" />
                          <span className="text-sm text-slate-700">{pref}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Trade Lanes</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-white p-3 rounded-lg border border-slate-200">
                      {['Transpacific US/Asia', 'Transatlantic US/Europe', 'Intra Asia', 'Europe/Middle East/India', 'US/Latin America', 'Intra Europe', 'Africa/Global', 'Domestic (Within US)'].map((lane) => (
                        <label key={lane} className="flex items-center hover:bg-slate-50 p-1 rounded cursor-pointer">
                          <input type="checkbox" 
                            checked={Array.isArray(candidate.tradeLanes) ? candidate.tradeLanes.includes(lane) : false}
                            onChange={(e) => {
                              const currentLanes = Array.isArray(candidate.tradeLanes) ? candidate.tradeLanes : []
                              const newLanes = e.target.checked ? [...currentLanes, lane] : currentLanes.filter(l => l !== lane)
                              setCandidate(prev => prev ? { ...prev, tradeLanes: newLanes } : null)
                            }}
                            className="mr-2 rounded border-slate-300 text-[#001e4f] focus:ring-[#001e4f]" />
                          <span className="text-sm text-slate-700">{lane}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mode of Transportation</label>
                    <div className="space-y-2 mb-4">
                      {['Air', 'Sea', 'Road'].map((mode) => (
                        <label key={mode} className="flex items-center hover:bg-slate-50 p-2 rounded cursor-pointer">
                          <input type="checkbox" 
                            checked={Array.isArray(candidate.modeOfTransportation) ? candidate.modeOfTransportation.includes(mode) : false}
                            onChange={(e) => {
                              const currentModes = Array.isArray(candidate.modeOfTransportation) ? candidate.modeOfTransportation : []
                              const newModes = e.target.checked ? [...currentModes, mode] : currentModes.filter(m => m !== mode)
                              setCandidate(prev => prev ? { ...prev, modeOfTransportation: newModes } : null)
                            }}
                            className="mr-2 rounded border-slate-300 text-[#001e4f] focus:ring-[#001e4f]" />
                          <span className="text-sm text-slate-700">{mode}</span>
                        </label>
                      ))}
                    </div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Commodities</label>
                    <textarea value={candidate.commodities || ''} 
                      onChange={(e) => setCandidate(prev => prev ? { ...prev, commodities: e.target.value } : null)}
                      rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent text-sm"
                      placeholder="Electronics, Apparel, Automotive parts..." />
                  </div>
                </div>
              </div>

              {/* Work Experience */}
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 border border-orange-100">
                <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Briefcase className="w-4 h-4 text-orange-600" />
                  </div>
                  Work Experience
                </h3>
                <div className="space-y-6">
                  {Array.isArray(candidate.experience) && candidate.experience.map((exp, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                          <input
                            type="text"
                            value={exp.company || ''}
                            onChange={(e) => {
                              const currentExp = Array.isArray(candidate.experience) ? candidate.experience : []
                              setCandidate(prev => prev ? {
                                ...prev,
                                experience: currentExp.map((item, i) =>
                                  i === index ? { ...item, company: e.target.value } : item
                                )
                              } : null)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                          <input
                            type="text"
                            value={exp.position || ''}
                            onChange={(e) => {
                              const currentExp = Array.isArray(candidate.experience) ? candidate.experience : []
                              setCandidate(prev => prev ? {
                                ...prev,
                                experience: currentExp.map((item, i) =>
                                  i === index ? { ...item, position: e.target.value } : item
                                )
                              } : null)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                            placeholder="Job title"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                        <input
                          type="text"
                          value={exp.duration || ''}
                          onChange={(e) => {
                            const currentExp = Array.isArray(candidate.experience) ? candidate.experience : []
                            setCandidate(prev => prev ? {
                              ...prev,
                              experience: currentExp.map((item, i) =>
                                i === index ? { ...item, duration: e.target.value } : item
                              )
                            } : null)
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                          placeholder="e.g., Jan 2020 - Present"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea
                          value={exp.description || ''}
                          onChange={(e) => {
                            const currentExp = Array.isArray(candidate.experience) ? candidate.experience : []
                            setCandidate(prev => prev ? {
                              ...prev,
                              experience: currentExp.map((item, i) =>
                                i === index ? { ...item, description: e.target.value } : item
                              )
                            } : null)
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                          placeholder="Describe responsibilities and achievements..."
                        />
                      </div>
                      <button
                        onClick={() => {
                          const currentExp = Array.isArray(candidate.experience) ? candidate.experience : []
                          setCandidate(prev => prev ? {
                            ...prev,
                            experience: currentExp.filter((_, i) => i !== index)
                          } : null)
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove Experience
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const currentExp = Array.isArray(candidate.experience) ? candidate.experience : []
                      setCandidate(prev => prev ? {
                        ...prev,
                        experience: [...currentExp, { company: '', position: '', duration: '', description: '' }]
                      } : null)
                    }}
                    className="w-full py-3 border-2 border-dashed border-orange-300 text-orange-600 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 font-medium"
                  >
                    + Add Work Experience
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 border border-indigo-100">
                <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                  </div>
                  Education
                </h3>
                <div className="space-y-6">
                  {Array.isArray(candidate.education) ? candidate.education.map((edu, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-indigo-200 shadow-sm">
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Institution</label>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => {
                              const currentEdu = Array.isArray(candidate.education) ? candidate.education : []
                              setCandidate(prev => prev ? {
                                ...prev,
                                education: currentEdu.map((item, i) =>
                                  i === index ? { ...item, institution: e.target.value } : item
                                )
                              } : null)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                            placeholder="University/School name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Degree</label>
                          <input
                            type="text"
                            value={edu.degree || ''}
                            onChange={(e) => {
                              const currentEdu = Array.isArray(candidate.education) ? candidate.education : []
                              setCandidate(prev => prev ? {
                                ...prev,
                                education: currentEdu.map((item, i) =>
                                  i === index ? { ...item, degree: e.target.value } : item
                                )
                              } : null)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                            placeholder="e.g., Bachelor's, Master's"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Field of Study</label>
                          <input
                            type="text"
                            value={edu.field || ''}
                            onChange={(e) => {
                              const currentEdu = Array.isArray(candidate.education) ? candidate.education : []
                              setCandidate(prev => prev ? {
                                ...prev,
                                education: currentEdu.map((item, i) =>
                                  i === index ? { ...item, field: e.target.value } : item
                                )
                              } : null)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                            placeholder="e.g., Computer Science"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Graduation Year</label>
                          <input
                            type="text"
                            value={edu.graduationYear || ''}
                            onChange={(e) => {
                              const currentEdu = Array.isArray(candidate.education) ? candidate.education : []
                              setCandidate(prev => prev ? {
                                ...prev,
                                education: currentEdu.map((item, i) =>
                                  i === index ? { ...item, graduationYear: e.target.value } : item
                                )
                              } : null)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                            placeholder="e.g., 2023"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const currentEdu = Array.isArray(candidate.education) ? candidate.education : []
                          setCandidate(prev => prev ? {
                            ...prev,
                            education: currentEdu.filter((_, i) => i !== index)
                          } : null)
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove Education
                      </button>
                    </div>
                  )) : null}
                  <button
                    onClick={() => {
                      const currentEdu = Array.isArray(candidate.education) ? candidate.education : []
                      setCandidate(prev => prev ? {
                        ...prev,
                        education: [...currentEdu, { institution: '', degree: '', field: '', graduationYear: '', type: '' }]
                      } : null)
                    }}
                    className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 font-medium"
                  >
                    + Add Education
                  </button>
                </div>
              </div>

              {}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100">
                <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(candidate.skills) ? candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-[#001e4f] rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        onClick={() => {
                          const currentSkills = Array.isArray(candidate.skills) ? candidate.skills : []
                          setCandidate(prev => prev ? {
                            ...prev,
                            skills: currentSkills.filter((_, i) => i !== index)
                          } : null)
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  )) : null}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a skill"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const skill = e.currentTarget.value.trim()
                        if (skill) {
                          const currentSkills = Array.isArray(candidate.skills) ? candidate.skills : []
                          if (!currentSkills.includes(skill)) {
                            setCandidate(prev => prev ? {
                              ...prev,
                              skills: [...currentSkills, skill]
                            } : null)
                            e.currentTarget.value = ''
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {}
              <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-8 border border-teal-100">
                <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <Award className="w-4 h-4 text-teal-600" />
                  </div>
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(candidate.certifications) ? candidate.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-teal-100 to-green-100 text-[#001e4f] rounded-full text-sm font-medium"
                    >
                      {cert}
                      <button
                        onClick={() => {
                          const currentCerts = Array.isArray(candidate.certifications) ? candidate.certifications : []
                          setCandidate(prev => prev ? {
                            ...prev,
                            certifications: currentCerts.filter((_, i) => i !== index)
                          } : null)
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  )) : null}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a certification"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const cert = e.currentTarget.value.trim()
                        if (cert) {
                          const currentCerts = Array.isArray(candidate.certifications) ? candidate.certifications : []
                          if (!currentCerts.includes(cert)) {
                            setCandidate(prev => prev ? {
                              ...prev,
                              certifications: [...currentCerts, cert]
                            } : null)
                            e.currentTarget.value = ''
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {}
            <div className="flex justify-between mt-12">
              <button
                onClick={() => router.push('/hiringmanager-dashboard')}
                className="flex items-center px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-[#001e4f] to-[#001a42] text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}