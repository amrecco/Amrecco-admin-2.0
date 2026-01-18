'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  QualifyingQuestions,
  ValidationResult,
  QualifyingProgress,
  NavigationControls,
  validateQualifyingQuestions,
  calculateProgress,
  storeQualifyingQuestions,
  getStoredQualifyingQuestions,
  clearStoredQualifyingQuestions,
  createNavigationControls,
  isQualified
} from '@/src/components/layout/qualifyingQuestions'

interface UseQualifyingQuestionsOptions {
  autoSave?: boolean
  onComplete?: (data: QualifyingQuestions) => void
  onDisqualify?: (reason: string) => void
}

interface UseQualifyingQuestionsReturn {
  
  data: Partial<QualifyingQuestions>
  currentStepIndex: number
  validation: ValidationResult
  progress: QualifyingProgress
  navigation: NavigationControls
  isLoading: boolean

  updateAnswer: (field: keyof QualifyingQuestions, value: any) => void
  nextStep: () => void
  previousStep: () => void
  reset: () => void
  complete: () => void

  isComplete: boolean
  isDisqualified: boolean
  canProceed: boolean
}

export function useQualifyingQuestions(
  options: UseQualifyingQuestionsOptions = {}
): UseQualifyingQuestionsReturn {
  const { autoSave = true, onComplete, onDisqualify } = options

  const [data, setData] = useState<Partial<QualifyingQuestions>>({})
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    clearStoredQualifyingQuestions()
    setData({})
  }, [])

  useEffect(() => {
    if (autoSave && Object.keys(data).length > 0) {
      storeQualifyingQuestions(data)
    }
  }, [data, autoSave])

  const validation = validateQualifyingQuestions(data)
  const progress = calculateProgress(data, currentStepIndex)
  const isComplete = progress.isComplete && validation.isValid && !validation.isDisqualified
  const isDisqualified = validation.isDisqualified
  const canProceed = !validation.isDisqualified

  const questions: (keyof QualifyingQuestions)[] = [
    'isUSBased',
    'hasLogisticsSalesExperience'
  ]

  const totalSteps = questions.length

  const updateAnswer = useCallback((field: keyof QualifyingQuestions, value: any) => {
    setData(prev => {
      const newData = { ...prev, [field]: value }

      const isDisqualifyingAnswer = 
        (field === 'isUSBased' && value === false) ||
        (field === 'hasLogisticsSalesExperience' && value === false)
      
      if (isDisqualifyingAnswer && onDisqualify) {
        const validation = validateQualifyingQuestions(newData)
        setTimeout(() => {
          onDisqualify(validation.disqualificationReason!)
        }, 500)
      }
      
      return newData
    })
  }, [onDisqualify])

  const nextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      
      setTimeout(() => {
        setData(currentData => {
          const currentValidation = validateQualifyingQuestions(currentData)
          const currentProgress = calculateProgress(currentData, currentStepIndex)
          const currentIsComplete = currentProgress.isComplete && currentValidation.isValid && !currentValidation.isDisqualified
          
          if (currentIsComplete && onComplete) {
            onComplete(currentData as QualifyingQuestions)
          } else if (currentValidation.isDisqualified && onDisqualify) {
            onDisqualify(currentValidation.disqualificationReason!)
          }
          
          return currentData
        })
      }, 0)
    }
  }, [currentStepIndex, totalSteps, onComplete, onDisqualify])

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  const reset = useCallback(() => {
    setData({})
    setCurrentStepIndex(0)
    clearStoredQualifyingQuestions()
  }, [])

  const complete = useCallback(() => {
    if (isComplete) {
      
      const finalValidation = validateQualifyingQuestions(data)
      if (finalValidation.isDisqualified && onDisqualify) {
        onDisqualify(finalValidation.disqualificationReason!)
        return
      }
      
      if (onComplete) {
        setIsLoading(true)
        try {
          onComplete(data as QualifyingQuestions)
          clearStoredQualifyingQuestions()
        } finally {
          setIsLoading(false)
        }
      }
    }
  }, [isComplete, data, onComplete, onDisqualify])

  const navigation = createNavigationControls(
    currentStepIndex,
    totalSteps,
    nextStep,
    previousStep,
    data,
    questions 
  )

  return {
    
    data,
    currentStepIndex,
    validation,
    progress,
    navigation,
    isLoading,

    updateAnswer,
    nextStep,
    previousStep,
    reset,
    complete,

    isComplete,
    isDisqualified,
    canProceed
  }
}

export function useQualifyingQuestionsFlow() {
  const [showQualifyingQuestions, setShowQualifyingQuestions] = useState(true)
  const [qualifyingData, setQualifyingData] = useState<QualifyingQuestions | null>(null)
  const [disqualificationReason, setDisqualificationReason] = useState<string | null>(null)

  const handleComplete = useCallback((data: QualifyingQuestions) => {
    setQualifyingData(data)
    setShowQualifyingQuestions(false)
    clearStoredQualifyingQuestions()
  }, [])

  const handleDisqualify = useCallback((reason: string) => {
    setDisqualificationReason(reason)
    setShowQualifyingQuestions(false)
  }, [])

  const restart = useCallback(() => {
    setQualifyingData(null)
    setDisqualificationReason(null)
    setShowQualifyingQuestions(true)
    clearStoredQualifyingQuestions()
  }, [])

  return {
    showQualifyingQuestions,
    qualifyingData,
    disqualificationReason,
    isQualified: qualifyingData ? isQualified(qualifyingData) : false,
    handleComplete,
    handleDisqualify,
    restart
  }
}