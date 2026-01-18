'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Mail,
  ArrowRight,
  ArrowLeft,
  Check,
  Phone,
  MapPin,
  Linkedin,
  Award,
  Sparkles,
  Target,
  Zap,
  Star,
  ChevronRight,
  Shield,
  Clock,
  Users
} from 'lucide-react'
import Link from 'next/link'
import QualifyingQuestionsSection from '@/src/components/layout/QualifyingQuestionsSection'
import { QualifyingQuestions } from '@/src/components/layout/qualifyingQuestions'
import { LogisticsExperience } from '@/src/Utils/logisticsExperience'
import { formatLinkedInUrl } from '@/src/Utils/urlHelpers'


const parseResumeFile = async (file: File) => {
  const { parseResumeFile: parser } = await import('@/src/Utils/resumeParser');
  return parser(file);
};

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

interface CandidateData {
  personalInfo: PersonalInfo
  summary: string
  experience: Experience[]
  education: Education[]
  skills: string[]
  certifications: string[]
  qualifyingQuestions?: QualifyingQuestions
  logisticsExperience?: LogisticsExperience
}

export default function CandidateProfilePage() {
  const [currentStep, setCurrentStep] = useState(0) 
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [qualifyingData, setQualifyingData] = useState<QualifyingQuestions | null>(null)
  
  
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [nonMarketingConsent, setNonMarketingConsent] = useState(false)

  const [candidateData, setCandidateData] = useState<CandidateData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: []
  })

  const [accountData, setAccountData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  
  const handleQualifyingComplete = (data: QualifyingQuestions) => {
    setQualifyingData(data)
    
    setCandidateData(prev => ({
      ...prev,
      qualifyingQuestions: data
    }))
    
    setTimeout(() => {
      setCurrentStep(1) 
      setSuccess('Great! You meet our requirements. Please accept the terms below to continue.')
    }, 0)
  }

  
  const handleDisqualification = (reason: string) => {
    console.log('❌ Candidate disqualified:', reason)
    
    
  }

  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError('')

    try {
      
      const parsedData = await parseResumeFile(file)
      let base64Image = ''

      
      if (parsedData.isImageBased) {
        if (file.type.startsWith('image/')) {
          
          base64Image = await fileToBase64(file)
        } else if (file.type === 'application/pdf') {
          
          const { pdfPageToImage } = await import('@/src/Utils/resumeParser')
          base64Image = await pdfPageToImage(file)
        }
      }

      
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extractedText: parsedData.text,
          isImageBased: parsedData.isImageBased,
          fileName: parsedData.fileName,
          base64Image
        })
      })

      const data = await response.json()

      if (data.success) {
        setCandidateData(data.structuredData)
        setAccountData(prev => ({ ...prev, email: data.structuredData.personalInfo.email }))
        const method = data.processingMethod === 'ocr' ? 'OCR processing' : 'text extraction'
        setSuccess(`Resume processed successfully using ${method}! Please review and edit the extracted information.`)
        setCurrentStep(3)
      } else {
        setError(data.error || 'Failed to process resume')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload and process resume. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  
  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    
    const processedValue = field === 'linkedin' && value ? formatLinkedInUrl(value) : value
    
    setCandidateData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: processedValue
      }
    }))
  }

  const addExperience = () => {
    setCandidateData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', duration: '', description: '' }]
    }))
  }

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    setCandidateData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const removeExperience = (index: number) => {
    setCandidateData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const addEducation = () => {
    setCandidateData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', field: '', graduationYear: '', type: '' }]
    }))
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setCandidateData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (index: number) => {
    setCandidateData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const addSkill = (skill: string) => {
    if (skill && !candidateData.skills.includes(skill)) {
      setCandidateData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }
  }

  const removeSkill = (index: number) => {
    setCandidateData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  
  const handleLogisticsExperienceChange = (logisticsData: LogisticsExperience) => {
    setCandidateData(prev => ({
      ...prev,
      logisticsExperience: logisticsData
    }))
  }

  
  const validateLogisticsStep = (): boolean => {
    const logistics = candidateData.logisticsExperience
    if (!logistics) return false

    return !!(
      logistics.industry &&
      logistics.tradeLanes && logistics.tradeLanes.length > 0 &&
      logistics.salesRoleType &&
      logistics.annualRevenueGenerated !== null && logistics.annualRevenueGenerated !== undefined && logistics.annualRevenueGenerated > 0 &&
      logistics.bookOfBusiness !== undefined
    )
  }

  
  const handleStepNavigation = (targetStep: number) => {
    
    if (currentStep === 2 && targetStep > 2) {
      if (!validateLogisticsStep()) {
        setError('Please complete all required logistics experience fields before proceeding.')
        return
      }
    }

    setError('') 
    setCurrentStep(targetStep)
  }

  
  const handleRegistration = async () => {
    if (accountData.password !== accountData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!accountData.username && !accountData.email) {
      setError('Please provide either a username or email address')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: accountData.username,
          email: accountData.email,
          password: accountData.password,
          candidateData
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Account created successfully! Redirecting to dashboard...')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Terms & Consent', description: 'Accept terms and consent' },
    { number: 2, title: 'Upload Resume', description: 'Upload your resume for AI processing' },
    { number: 3, title: 'Review & Edit', description: 'Review and edit extracted information' },
    { number: 4, title: 'Create Account', description: 'Set up your account credentials' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcf9f4] via-[#faf7f2] to-[#f8f5f0] relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="square-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#001e4f" strokeWidth="0.5" opacity="0.1" />
              <rect x="0" y="0" width="40" height="40" fill="none" stroke="#001e4f" strokeWidth="0.2" opacity="0.05" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#square-grid)" />
        </svg>
      </div>

      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 animate-pulse"></div>

      {}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pt-24 sm:pt-28">
        {}
        <motion.div
          className="text-center mb-8 lg:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-xs sm:text-sm font-medium text-[#001e4f] mb-4 lg:mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            AI-Powered Profile Creation
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#001e4f] mb-4 lg:mb-6 leading-tight px-2">
            Create Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Dream </span>
            Profile
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
            Upload your resume and let our AI create a stunning professional profile.
            Get matched with top employers in logistics and SaaS industries.
          </p>
        </motion.div>

        {}
        <motion.div
          className="flex justify-center mb-8 lg:mb-16 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            {steps.map((step, index) => (
              <div key={`step-${step.number}-${index}`} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${currentStep >= step.number
                      ? 'bg-gradient-to-r from-[#001e4f] to-[#001a42] text-white shadow-lg'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}>
                    {currentStep > step.number ? <Check className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" /> : step.number}
                  </div>
                  <div className="mt-2 lg:mt-3 text-center">
                    <p className={`font-semibold text-xs sm:text-sm ${currentStep >= step.number ? 'text-[#001e4f]' : 'text-gray-400'
                      }`}>
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">{step.title.split(' ')[0]}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-16 sm:max-w-24 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 lg:w-16 h-0.5 mx-2 sm:mx-3 lg:mx-4 transition-all duration-300 ${currentStep > step.number ? 'bg-[#001e4f]' : 'bg-gray-300'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {}
            {currentStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
              >
                <QualifyingQuestionsSection
                  onComplete={handleQualifyingComplete}
                  onDisqualify={handleDisqualification}
                />
              </motion.div>
            )}

            {}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#001e4f] mb-2">Terms & Consent</h2>
                  <p className="text-lg text-slate-600">
                    Please accept the following terms to continue with your application
                  </p>
                </div>

                <div className="max-w-3xl mx-auto space-y-6">
                  {}
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
                    <label className="flex items-start space-x-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-1 w-5 h-5 text-[#001e4f] bg-gray-100 border-gray-300 rounded focus:ring-[#001e4f] focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-[#001e4f] mb-2">Marketing Consent</div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          I consent to receive marketing text messages from Amrecco at the phone number provided. 
                          Frequency may vary. Message & data rates may apply. Text HELP for assistance, reply STOP to opt out.
                        </p>
                      </div>
                    </label>
                  </div>

                  {}
                  <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100">
                    <label className="flex items-start space-x-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nonMarketingConsent}
                        onChange={(e) => setNonMarketingConsent(e.target.checked)}
                        className="mt-1 w-5 h-5 text-[#001e4f] bg-gray-100 border-gray-300 rounded focus:ring-[#001e4f] focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-[#001e4f] mb-2">Non-Marketing Consent</div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          I consent to receive non-marketing text messages from Amrecco about my job opportunity updates, 
                          appointment reminders etc. Message & data rates may apply.
                        </p>
                      </div>
                    </label>
                  </div>

                  {}
                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-100">
                    <div className="text-center">
                      <p className="text-sm text-gray-700 mb-4">
                        By continuing, you agree to our:
                      </p>
                      <div className="flex flex-wrap justify-center items-center gap-2">
                        <Link href="/terms" className="text-[#001e4f] hover:text-[#001e4f]/80 font-medium underline">
                          Terms of Service
                        </Link>
                        <span className="text-gray-500">&</span>
                        <Link href="/privacy" className="text-[#001e4f] hover:text-[#001e4f]/80 font-medium underline">
                          Privacy Policy
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="flex items-center px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (marketingConsent && nonMarketingConsent) {
                        setCurrentStep(2)
                        setSuccess('Terms accepted! You can now upload your resume.')
                      } else {
                        setError('Please accept both consent options to continue.')
                      }
                    }}
                    className={`flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      marketingConsent && nonMarketingConsent
                        ? 'bg-gradient-to-r from-[#001e4f] to-[#001a42] text-white hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!marketingConsent || !nonMarketingConsent}
                  >
                    Continue to Resume Upload
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {}
            {currentStep === 2 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 lg:p-12"
              >
                <div className="text-center mb-8 lg:mb-12">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-lg">
                    <Upload className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#001e4f] mb-3 lg:mb-4">Upload Your Resume</h2>
                  <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto px-4">
                    Our AI will analyze your resume and extract all relevant information to create your professional profile automatically.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-[#001e4f] transition-colors duration-300 bg-gradient-to-br from-gray-50 to-white">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="resume-upload"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="resume-upload"
                      className="cursor-pointer block"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-[#001e4f]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#001e4f] mb-2">
                        {isLoading ? 'Processing...' : 'Choose your resume file'}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Supports PDF, DOC, DOCX, and image files (JPG, PNG, WEBP) up to 10MB<br/>
                      </p>
                      <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#001e4f] to-[#001a42] text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Processing Resume...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mr-3" />
                            Upload Resume
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {}
                  <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-[#001e4f] mb-2">AI-Powered</h4>
                      <p className="text-sm text-gray-600">Advanced AI extracts and structures your information</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-[#001e4f] mb-2">Secure</h4>
                      <p className="text-sm text-gray-600">Your data is encrypted and protected</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-[#001e4f] mb-2">Fast</h4>
                      <p className="text-sm text-gray-600">Profile created in under 30 seconds</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {}
            {currentStep === 3 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#001e4f] mb-2">Review Your Profile</h2>
                  <p className="text-lg text-slate-600">
                    Review and edit the information extracted from your resume
                  </p>
                </div>

                <div className="space-y-8">
                  {}
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
                        <input
                          type="text"
                          value={candidateData.personalInfo.fullName}
                          onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={candidateData.personalInfo.email}
                          onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={candidateData.personalInfo.phone}
                          onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={candidateData.personalInfo.location}
                          onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn Profile</label>
                        <input
                          type="url"
                          value={candidateData.personalInfo.linkedin}
                          onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                          placeholder="https://www.linkedin.com/in/yourprofile"
                        />
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-100">
                    <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Target className="w-4 h-4 text-green-600" />
                      </div>
                      Sales Summary
                    </h3>
                    <textarea
                      value={candidateData.summary}
                      onChange={(e) => setCandidateData(prev => ({ ...prev, summary: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                      placeholder="Brief sales summary and achievements..."
                    />
                  </div>

                  {}
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
                        <select
                          value={candidateData.logisticsExperience?.industry || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              industry: e.target.value as 'Freight Forwarding' | 'Trucking' | '3PL' | 'SaaS Logistics' | ''
                            }
                          }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select Industry</option>
                          <option value="Freight Forwarding">Freight Forwarding</option>
                          <option value="Trucking">Trucking</option>
                          <option value="3PL">3PL</option>
                          <option value="SaaS Logistics">SaaS Logistics</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sales Role Type</label>
                        <select
                          value={candidateData.logisticsExperience?.salesRoleType || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              salesRoleType: e.target.value as 'Hunter/Outside Sales' | 'Farming/Inside Sales' | 'Both' | ''
                            }
                          }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select Role Type</option>
                          <option value="Hunter/Outside Sales">Hunter/Outside Sales</option>
                          <option value="Farming/Inside Sales">Farming/Inside Sales</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Annual Revenue Generated</label>
                        <input
                          type="number"
                          value={candidateData.logisticsExperience?.annualRevenueGenerated || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              annualRevenueGenerated: parseFloat(e.target.value) || 0
                            }
                          }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                          placeholder="e.g., 1500000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Book of Business</label>
                        <select
                          value={candidateData.logisticsExperience?.bookOfBusiness?.toString() || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              bookOfBusiness: e.target.value === 'true'
                            }
                          }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select Option</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Import/Export Focus</label>
                        <select
                          value={candidateData.logisticsExperience?.importExportFocus || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              importExportFocus: e.target.value as 'Imports' | 'Exports' | 'Both' | 'Not Specified' | ''
                            }
                          }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select Focus</option>
                          <option value="Imports">Imports</option>
                          <option value="Exports">Exports</option>
                          <option value="Both">Both</option>
                          <option value="Not Specified">Not Specified</option>
                        </select>
                      </div>
                    </div>

                    {}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Salary Min ($)</label>
                        <input
                          type="number"
                          value={candidateData.logisticsExperience?.salaryExpectationMin || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              salaryExpectationMin: parseFloat(e.target.value) || 0
                            }
                          }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                          placeholder="e.g., 80000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Salary Max ($)</label>
                        <input
                          type="number"
                          value={candidateData.logisticsExperience?.salaryExpectationMax || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              salaryExpectationMax: parseFloat(e.target.value) || 0
                            }
                          }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                          placeholder="e.g., 120000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Willing to Relocate</label>
                        <select
                          value={candidateData.logisticsExperience?.willingToRelocate || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              willingToRelocate: e.target.value as 'Yes' | 'No' | ''
                            }
                          }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select Option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate Preferences</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {['Remote', 'Sales Manager', 'Account Executive', 'Business Development', 'Inside Sales', 'Outside Sales', 'Hybrid Work', 'Full-time', 'Part-time', 'Contract'].map((pref) => (
                            <label key={pref} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={candidateData.logisticsExperience?.candidatePreferences?.includes(pref) || false}
                                onChange={(e) => {
                                  const currentPrefs = candidateData.logisticsExperience?.candidatePreferences || []
                                  const newPrefs = e.target.checked
                                    ? [...currentPrefs, pref]
                                    : currentPrefs.filter(p => p !== pref)
                                  setCandidateData(prev => ({
                                    ...prev,
                                    logisticsExperience: {
                                      ...prev.logisticsExperience,
                                      candidatePreferences: newPrefs
                                    }
                                  }))
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-slate-700">{pref}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Trade Lanes</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {['Transpacific US/Asia', 'Transatlantic US/Europe', 'Intra Asia', 'Europe/Middle East/India', 'US/Latin America', 'Intra Europe', 'Africa/Global', 'Domestic (Within US)'].map((lane) => (
                            <label key={lane} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={candidateData.logisticsExperience?.tradeLanes?.includes(lane) || false}
                                onChange={(e) => {
                                  const currentLanes = candidateData.logisticsExperience?.tradeLanes || []
                                  const newLanes = e.target.checked
                                    ? [...currentLanes, lane]
                                    : currentLanes.filter(l => l !== lane)
                                  setCandidateData(prev => ({
                                    ...prev,
                                    logisticsExperience: {
                                      ...prev.logisticsExperience,
                                      tradeLanes: newLanes
                                    }
                                  }))
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-slate-700">{lane}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Commodities</label>
                        <textarea
                          value={candidateData.logisticsExperience?.commodities || ''}
                          onChange={(e) => setCandidateData(prev => ({
                            ...prev,
                            logisticsExperience: {
                              ...prev.logisticsExperience,
                              commodities: e.target.value
                            }
                          }))}
                          rows={6}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent text-sm"
                          placeholder="e.g., Electronics, Apparel, Automotive parts..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Mode of Transportation</label>
                        <div className="space-y-2">
                          {['Air', 'Sea', 'Road'].map((mode) => (
                            <label key={mode} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={candidateData.logisticsExperience?.modesOfTransportation?.includes(mode) || false}
                                onChange={(e) => {
                                  const currentModes = candidateData.logisticsExperience?.modesOfTransportation || []
                                  const newModes = e.target.checked
                                    ? [...currentModes, mode]
                                    : currentModes.filter(m => m !== mode)
                                  setCandidateData(prev => ({
                                    ...prev,
                                    logisticsExperience: {
                                      ...prev.logisticsExperience,
                                      modesOfTransportation: newModes
                                    }
                                  }))
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-slate-700">{mode}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 border border-orange-100">
                    <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <Briefcase className="w-4 h-4 text-orange-600" />
                      </div>
                      Work Experience
                    </h3>
                    <div className="space-y-6">
                      {candidateData.experience.map((exp, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                                placeholder="Company name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                              <input
                                type="text"
                                value={exp.position}
                                onChange={(e) => updateExperience(index, 'position', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                                placeholder="Job title"
                              />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                            <input
                              type="text"
                              value={exp.duration}
                              onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                              placeholder="e.g., Jan 2020 - Present"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                              placeholder="Describe your responsibilities and achievements..."
                            />
                          </div>
                          <button
                            onClick={() => removeExperience(index)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove Experience
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addExperience}
                        className="w-full py-3 border-2 border-dashed border-orange-300 text-orange-600 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 font-medium"
                      >
                        + Add Work Experience
                      </button>
                    </div>
                  </div>

                  {}
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 border border-indigo-100">
                    <h3 className="text-xl font-bold text-[#001e4f] mb-6 flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                      </div>
                      Education
                    </h3>
                    <div className="space-y-6">
                      {candidateData.education.map((edu, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 border border-indigo-200 shadow-sm">
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Institution</label>
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                                placeholder="University/School name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Degree</label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
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
                                value={edu.field}
                                onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                                placeholder="e.g., Computer Science"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Graduation Year</label>
                              <input
                                type="text"
                                value={edu.graduationYear}
                                onChange={(e) => updateEducation(index, 'graduationYear', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                                placeholder="e.g., 2023"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeEducation(index)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove Education
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addEducation}
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
                      {candidateData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-[#001e4f] rounded-full text-sm font-medium"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Add a skill"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill(e.currentTarget.value)
                            e.currentTarget.value = ''
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
                      {candidateData.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-teal-100 to-green-100 text-[#001e4f] rounded-full text-sm font-medium"
                        >
                          {cert}
                          <button
                            onClick={() => setCandidateData(prev => ({
                              ...prev,
                              certifications: prev.certifications.filter((_, i) => i !== index)
                            }))}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Add a certification"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const cert = e.currentTarget.value.trim()
                            if (cert && !candidateData.certifications.includes(cert)) {
                              setCandidateData(prev => ({
                                ...prev,
                                certifications: [...prev.certifications, cert]
                              }))
                              e.currentTarget.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-12">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-[#001e4f] to-[#001a42] text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Continue to Account Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {}
            {currentStep === 4 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#001e4f] mb-2">Create Your Account</h2>
                  <p className="text-lg text-slate-600">
                    Set up your email and password to access your candidate dashboard
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                      <input
                        type="text"
                        placeholder="Enter username (optional)"
                        value={accountData.username}
                        onChange={(e) => setAccountData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        placeholder="Enter email (optional)"
                        value={accountData.email}
                        onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    <input
                      type="password"
                      placeholder="Create a password"
                      value={accountData.password ?? ''}
                      onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={accountData.confirmPassword ?? ''}
                      onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#001e4f] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Account Options:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Username only: Login with username + password</li>
                      <li>• Email only: Login with email + password</li>
                      <li>• Both: Login with either username or email + password</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between mt-12">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                  <button
                    onClick={handleRegistration}
                    disabled={isLoading}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-[#001e4f] to-[#001a42] text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </div>

        {}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="bg-gradient-to-r from-[#001e4f] to-[#001a42] rounded-3xl p-12 text-white shadow-2xl">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold mb-4">Ready to Get Hired?</h3>
              <p className="text-xl opacity-90 mb-8">
                Join thousands of professionals who found their dream jobs through our platform
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2">1000+</h4>
                  <p className="text-sm opacity-80">Active Candidates</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2">50+</h4>
                  <p className="text-sm opacity-80">Partner Companies</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2">95%</h4>
                  <p className="text-sm opacity-80">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
