'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Briefcase, 
  Clock,
  ExternalLink,
  BookOpen,
  Users
} from 'lucide-react'
import { QualifyingQuestions } from './qualifyingQuestions'
import { useQualifyingQuestions } from './useQualifyingQuestions'

interface QualifyingQuestionsProps {
  onComplete: (data: QualifyingQuestions) => void
  onDisqualify: (reason: string) => void
}

interface Question {
  id: keyof QualifyingQuestions
  title: string
  subtitle: string
  icon: React.ReactNode
  options: {
    value: any
    label: string
    description?: string
    isDisqualifying?: boolean
  }[]
}

export default function QualifyingQuestionsSection({ 
  onComplete, 
  onDisqualify 
}: QualifyingQuestionsProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDisqualification, setShowDisqualification] = useState(false)
  const [disqualificationReason, setDisqualificationReason] = useState('')

  // Memoize the disqualify handler to prevent unnecessary re-renders
  const handleDisqualify = useCallback((reason: string) => {
    setDisqualificationReason(reason)
    setShowDisqualification(true)
    onDisqualify(reason)
  }, [onDisqualify])

  // Use the qualifying questions hook for state management
  const {
    data: answers,
    currentStepIndex: currentQuestionIndex,
    progress,
    navigation,
    updateAnswer,
    isDisqualified
  } = useQualifyingQuestions({
    onComplete,
    onDisqualify: handleDisqualify
  })

  const questions: Question[] = [
    {
      id: 'isUSBased',
      title: 'Are you currently based in the United States?',
      subtitle: 'We currently serve US-based candidates only',
      icon: <MapPin className="w-6 h-6" />,
      options: [
        {
          value: true,
          label: 'Yes, I am US-based',
          description: 'I am currently located in the United States'
        },
        {
          value: false,
          label: 'No, I am not US-based',
          description: 'I am located outside the United States',
          isDisqualifying: true
        }
      ]
    },
    {
      id: 'hasLogisticsSalesExperience',
      title: 'Do you have sales experience in the logistics industry?',
      subtitle: 'Our platform specializes in logistics sales roles',
      icon: <Briefcase className="w-6 h-6" />,
      options: [
        {
          value: true,
          label: 'Yes, I have logistics sales experience',
          description: 'I have worked in freight, 3PL, trucking, or logistics SaaS sales'
        },
        {
          value: false,
          label: 'No, I don\'t have logistics sales experience',
          description: 'My sales experience is in other industries',
          isDisqualifying: true
        }
      ]
    }
  ]

  const currentQuestion = questions[currentQuestionIndex]
  const progressPercentage = progress.progressPercentage

  const handleAnswer = async (value: any) => {
    if (isAnimating) return

    // Check if this answer is disqualifying
    const selectedOption = currentQuestion.options.find(opt => opt.value === value)
    if (selectedOption?.isDisqualifying) {
      setIsAnimating(true)
      
      // Update the answer first
      updateAnswer(currentQuestion.id, value)
      
      // Show disqualification message after a brief delay
      setTimeout(() => {
        setIsAnimating(false)
      }, 800)
      return
    }

    // Update answer and move to next question
    setIsAnimating(true)
    updateAnswer(currentQuestion.id, value)
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        navigation.nextStep()
      } else {
        navigation.nextStep() // This should trigger completion
      }
      setIsAnimating(false)
    }, 300)
  }

  const handlePrevious = () => {
    if (navigation.canGoPrevious && !isAnimating) {
      setIsAnimating(true)
      setTimeout(() => {
        navigation.previousStep()
        setIsAnimating(false)
      }, 300)
    }
  }

  // Touch gesture handlers for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isRightSwipe && currentQuestionIndex > 0) {
      handlePrevious()
    }
  }

  if (showDisqualification) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center max-w-2xl mx-auto"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-orange-600" />
        </div>
        
        {disqualificationReason === 'non-us-based' ? (
          <>
            <h2 className="text-2xl font-bold text-[#001e4f] mb-4">
              Currently US-Based Candidates Only
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Thank you for your interest! Our platform currently serves candidates based in the United States. 
              We're working on expanding to other regions in the future.
            </p>
            <div className="bg-blue-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-[#001e4f] mb-3 flex items-center justify-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Stay Connected
              </h3>
              <p className="text-slate-600 text-sm">
                Follow us on LinkedIn for updates on international expansion and logistics industry insights.
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-[#001e4f] mb-4">
              Logistics Sales Experience Required
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Our platform specializes in connecting logistics sales professionals with top employers. 
              We recommend gaining relevant experience in the logistics industry before applying.
            </p>
            <div className="bg-green-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-[#001e4f] mb-4 flex items-center justify-center">
                <Users className="w-5 h-5 mr-2" />
                Get Started in Logistics Sales
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Look for entry-level positions at freight forwarders, 3PLs, or trucking companies</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Consider logistics SaaS companies that need sales professionals</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Network with logistics professionals on LinkedIn</span>
                </div>
              </div>
            </div>
          </>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              try {
                window.location.href = '/candidates';
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
            className="px-6 py-3 bg-[#001e4f] text-white rounded-xl font-semibold hover:bg-[#001a42] transition-all duration-300 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          <button
            onClick={() => window.open('https://linkedin.com/company/amrecco', '_blank')}
            className="px-6 py-3 border-2 border-[#001e4f] text-[#001e4f] rounded-xl font-semibold hover:bg-[#001e4f] hover:text-white transition-all duration-300 flex items-center justify-center"
          >
            Follow Us
            <ExternalLink className="w-4 h-4 ml-2" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div 
      className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 max-w-3xl mx-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-slate-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-[#001e4f]">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-[#001e4f] to-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Question Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-[#001e4f]">
                {currentQuestion.icon}
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#001e4f] mb-3 leading-tight">
              {currentQuestion.title}
            </h2>
            <p className="text-lg text-slate-600">
              {currentQuestion.subtitle}
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={`${currentQuestion.id}-${index}`}
                onClick={() => handleAnswer(option.value)}
                disabled={isAnimating}
                className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] min-h-[80px] ${
                  option.isDisqualifying
                    ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:border-orange-300 hover:bg-orange-50'
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300 hover:bg-blue-50'
                } ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                whileHover={{ scale: isAnimating ? 1 : 1.02 }}
                whileTap={{ scale: isAnimating ? 1 : 0.98 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#001e4f] text-lg mb-2">
                      {option.label}
                    </h3>
                    {option.description && (
                      <p className="text-slate-600 text-sm">
                        {option.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {option.isDisqualifying ? (
                      <XCircle className="w-6 h-6 text-orange-500" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isAnimating}
              className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                currentQuestionIndex === 0 || isAnimating
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-[#001e4f] hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="text-center">
              <p className="text-sm text-slate-500">
                Swipe left/right on mobile to navigate
              </p>
            </div>

            <div className="w-24"></div> {/* Spacer for alignment */}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}