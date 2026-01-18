export interface QualifyingQuestions {
  isUSBased: boolean
  hasLogisticsSalesExperience: boolean
  yearsOfExperience?: string
  currentlyEmployed?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  isDisqualified: boolean
  disqualificationReason?: string
}

export interface QualifyingProgress {
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  isComplete: boolean
  progressPercentage: number
}

export const QUALIFYING_QUESTIONS_STORAGE_KEY = 'qualifying_questions_temp'

export function validateQualifyingQuestions(data: Partial<QualifyingQuestions>): ValidationResult {
  const errors: Record<string, string> = {}
  let isDisqualified = false
  let disqualificationReason: string | undefined

  if (data.isUSBased === undefined) {
    errors.isUSBased = 'Please indicate if you are US-based'
  } else if (data.isUSBased === false) {
    isDisqualified = true
    disqualificationReason = 'non-us-based'
  }

  if (data.hasLogisticsSalesExperience === undefined) {
    errors.hasLogisticsSalesExperience = 'Please indicate if you have logistics sales experience'
  } else if (data.hasLogisticsSalesExperience === false) {
    isDisqualified = true
    disqualificationReason = 'no-logistics-experience'
  }

  return {
    isValid: Object.keys(errors).length === 0 && !isDisqualified,
    errors,
    isDisqualified,
    disqualificationReason
  }
}

export function isQualified(data: QualifyingQuestions): boolean {
  return data.isUSBased && data.hasLogisticsSalesExperience
}

export function getDisqualificationMessage(reason: string): {
  title: string
  message: string
  suggestions: string[]
} {
  switch (reason) {
    case 'non-us-based':
      return {
        title: 'Currently US-Based Candidates Only',
        message: 'Thank you for your interest! Our platform currently serves candidates based in the United States. We\'re working on expanding to other regions in the future.',
        suggestions: [
          'Follow us on LinkedIn for updates on international expansion',
          'Check back in the future as we expand our services',
          'Connect with us for logistics industry insights'
        ]
      }
    case 'no-logistics-experience':
      return {
        title: 'Logistics Sales Experience Required',
        message: 'Our platform specializes in connecting logistics sales professionals with top employers. We recommend gaining relevant experience in the logistics industry before applying.',
        suggestions: [
          'Look for entry-level positions at freight forwarders, 3PLs, or trucking companies',
          'Consider logistics SaaS companies that need sales professionals',
          'Network with logistics professionals on LinkedIn',
          'Gain experience in supply chain or transportation sales'
        ]
      }
    default:
      return {
        title: 'Requirements Not Met',
        message: 'Unfortunately, you don\'t meet the current requirements for our platform.',
        suggestions: [
          'Review our requirements and apply again when eligible',
          'Follow us for updates on expanded criteria'
        ]
      }
  }
}

export function calculateProgress(data: Partial<QualifyingQuestions>, currentStepIndex?: number): QualifyingProgress {
  const requiredFields: (keyof QualifyingQuestions)[] = ['isUSBased', 'hasLogisticsSalesExperience']
  const optionalFields: (keyof QualifyingQuestions)[] = ['yearsOfExperience', 'currentlyEmployed']
  
  const completedRequired = requiredFields.filter(field => data[field] !== undefined)
  const completedOptional = optionalFields.filter(field => data[field] !== undefined)
  const completedSteps = [...completedRequired, ...completedOptional]
  
  const totalSteps = requiredFields.length
  const isComplete = completedRequired.length === requiredFields.length

  const currentStep = currentStepIndex !== undefined ? currentStepIndex : completedRequired.length
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  return {
    currentStep,
    totalSteps,
    completedSteps,
    isComplete,
    progressPercentage
  }
}

export function storeQualifyingQuestions(data: Partial<QualifyingQuestions>): void {
  try {
    const dataWithTimestamp = {
      ...data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) 
    }
    localStorage.setItem(QUALIFYING_QUESTIONS_STORAGE_KEY, JSON.stringify(dataWithTimestamp))
  } catch (error) {
    console.warn('Failed to store qualifying questions data:', error)
  }
}

export function getStoredQualifyingQuestions(): Partial<QualifyingQuestions> | null {
  try {
    const stored = localStorage.getItem(QUALIFYING_QUESTIONS_STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored)

    if (data.expiresAt && Date.now() > data.expiresAt) {
      clearStoredQualifyingQuestions()
      return null
    }

    const { timestamp, expiresAt, ...qualifyingData } = data
    return qualifyingData
  } catch (error) {
    console.warn('Failed to retrieve qualifying questions data:', error)
    return null
  }
}

export function clearStoredQualifyingQuestions(): void {
  try {
    localStorage.removeItem(QUALIFYING_QUESTIONS_STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear qualifying questions data:', error)
  }
}

export interface NavigationControls {
  canGoNext: boolean
  canGoPrevious: boolean
  nextStep: () => void
  previousStep: () => void
  currentStepIndex: number
  totalSteps: number
}

export function createNavigationControls(
  currentStepIndex: number,
  totalSteps: number,
  onNext: () => void,
  onPrevious: () => void,
  data: Partial<QualifyingQuestions>,
  questions: (keyof QualifyingQuestions)[] 
): NavigationControls {
  
  const currentQuestionKey = questions[currentStepIndex];
  const isCurrentStepComplete = data[currentQuestionKey] !== undefined;

  return {
    
    canGoNext: isCurrentStepComplete && currentStepIndex < totalSteps - 1,
    canGoPrevious: currentStepIndex > 0,
    nextStep: onNext,
    previousStep: onPrevious,
    currentStepIndex,
    totalSteps
  }
}

export function prepareForSubmission(data: QualifyingQuestions): QualifyingQuestions {
  return {
    isUSBased: data.isUSBased,
    hasLogisticsSalesExperience: data.hasLogisticsSalesExperience,
    yearsOfExperience: data.yearsOfExperience || undefined,
    currentlyEmployed: data.currentlyEmployed || undefined
  }
}

export function mergeWithCandidateData(
  qualifyingQuestions: QualifyingQuestions,
  existingData: any
): any {
  return {
    ...existingData,
    qualifyingQuestions: prepareForSubmission(qualifyingQuestions)
  }
}