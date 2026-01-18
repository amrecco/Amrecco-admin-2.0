export interface LogisticsExperience {
  salesExperienceWithinLogistics?: boolean
  industry?: 'Freight Forwarding' | 'Trucking' | '3PL' | 'SaaS Logistics' | ''
  tradeLanes?: string[]
  salesRoleType?: 'Hunter/Outside Sales' | 'Farming/Inside Sales' | 'Both' | ''
  annualRevenueGenerated?: number | null 
  commodities?: string
  bookOfBusiness?: boolean 
  modesOfTransportation?: string[]
  importExportFocus?: 'Imports' | 'Exports' | 'Both' | 'Not Specified' | ''
  salaryExpectationMin?: number
  salaryExpectationMax?: number
  candidatePreferences?: string[]
  willingToRelocate?: 'Yes' | 'No' | ''
}

export interface LogisticsValidationResult {
  isValid: boolean
  errors: Record<string, string>
  completionPercentage: number
}

export interface LogisticsProgress {
  completedFields: string[]
  totalRequiredFields: number
  isComplete: boolean
  progressPercentage: number
}

export const LOGISTICS_OPTIONS = {
  industries: [
    'Freight Forwarding',
    'Trucking',
    '3PL',
    'SaaS Logistics'
  ] as const,

  tradeLanes: [
    'Transpacific US/Asia',
    'Transatlantic US/Europe',
    'Intra Asia',
    'Europe/Middle East/India',
    'US/Latin America',
    'Intra Europe',
    'Africa/Global',
    'Domestic (Within US)'
  ] as const,

  salesRoleTypes: [
    'Hunter/Outside Sales',
    'Farming/Inside Sales',
    'Both'
  ] as const,

  importExportFocus: [
    'Imports',
    'Exports', 
    'Both',
    'Not Specified'
  ] as const,

  modesOfTransportation: [
    'Air',
    'Sea',
    'Road'
  ] as const
}

export function validateLogisticsExperience(data: Partial<LogisticsExperience>): LogisticsValidationResult {
  const errors: Record<string, string> = {}

  if (!data.industry ) {
    errors.industry = 'Please select your industry experience'
  } else if (!LOGISTICS_OPTIONS.industries.includes(data.industry as any)) {
    errors.industry = 'Please select a valid industry'
  }

  if (!data.tradeLanes || data.tradeLanes.length === 0) {
    errors.tradeLanes = 'Please select at least one trade lane you have experience with'
  } else {
    
    const invalidTradeLanes = data.tradeLanes.filter(tl =>
      !LOGISTICS_OPTIONS.tradeLanes.includes(tl as any)
    )
    if (invalidTradeLanes.length > 0) {
      errors.tradeLanes = 'Some selected trade lanes are invalid'
    }
  }

  if (!data.salesRoleType ) {
    errors.salesRoleType = 'Please select your sales role type'
  } else if (!LOGISTICS_OPTIONS.salesRoleTypes.includes(data.salesRoleType as any)) {
    errors.salesRoleType = 'Please select a valid sales role type'
  }

  if (data.annualRevenueGenerated === undefined || data.annualRevenueGenerated === null) {
    errors.annualRevenueGenerated = 'Please enter your annual revenue generated'
  } else if (data.annualRevenueGenerated < 0) {
    errors.annualRevenueGenerated = 'Annual revenue cannot be negative'
  } else if (data.annualRevenueGenerated === 0) {
    errors.annualRevenueGenerated = 'Please enter a valid revenue amount'
  }

  if (data.bookOfBusiness === undefined || data.bookOfBusiness === null) {
    errors.bookOfBusiness = 'Please indicate if you have a book of business'
  }

  if (data.commodities && data.commodities.length > 500) {
    errors.commodities = 'Commodities description must be 500 characters or less'
  }

  const completionPercentage = calculateCompletionPercentage(data)

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    completionPercentage
  }
}

export function calculateCompletionPercentage(data: Partial<LogisticsExperience>): number {
  const requiredFields = [
    'industry',
    'tradeLanes',
    'salesRoleType',
    'annualRevenueGenerated',
    'bookOfBusiness'
  ]

  let completedCount = 0

  if (data.industry ) completedCount++
  if (data.tradeLanes && data.tradeLanes.length > 0) completedCount++
  if (data.salesRoleType ) completedCount++
  if (data.annualRevenueGenerated && data.annualRevenueGenerated > 0) completedCount++
  if (data.bookOfBusiness !== undefined && data.bookOfBusiness !== null) completedCount++

  return Math.round((completedCount / requiredFields.length) * 100)
}

export function calculateLogisticsProgress(data: Partial<LogisticsExperience>): LogisticsProgress {
  const requiredFields = [
    'industry',
    'tradeLanes',
    'salesRoleType',
    'annualRevenueGenerated',
    'bookOfBusiness'
  ]

  const completedFields: string[] = []

  if (data.industry) completedFields.push('industry')
  if (data.tradeLanes && data.tradeLanes.length > 0) completedFields.push('tradeLanes')
  if (data.salesRoleType) completedFields.push('salesRoleType')
  if (data.annualRevenueGenerated && data.annualRevenueGenerated > 0) completedFields.push('annualRevenueGenerated')
  if (data.bookOfBusiness !== undefined && data.bookOfBusiness !== null) completedFields.push('bookOfBusiness')

  const isComplete = completedFields.length === requiredFields.length
  const progressPercentage = Math.round((completedFields.length / requiredFields.length) * 100)

  return {
    completedFields,
    totalRequiredFields: requiredFields.length,
    isComplete,
    progressPercentage
  }
}

export function createDefaultLogisticsExperience(): LogisticsExperience {
  return {
    salesExperienceWithinLogistics: true, 
    industry: '',
    tradeLanes: [],
    salesRoleType: '',
    annualRevenueGenerated: null, 
    commodities: '',
    bookOfBusiness: undefined, 
    modesOfTransportation: [],
    salaryExpectationMin: undefined,
    salaryExpectationMax: undefined,
    candidatePreferences: [],
    willingToRelocate: ''
  }
}

export function isLogisticsExperienceComplete(data: Partial<LogisticsExperience>): boolean {
  const validation = validateLogisticsExperience(data)
  return validation.isValid
}

export function formatRevenue(amount: number | null): string {
    if (amount === null || amount === undefined) return '$0';
    if (amount === 0) return '$0'

    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`
    } else {
        return `$${amount.toLocaleString()}`
    }
}

export function prepareLogisticsForSubmission(data: LogisticsExperience): LogisticsExperience {
  return {
    salesExperienceWithinLogistics: data.salesExperienceWithinLogistics,
    industry: data.industry,
    tradeLanes: data.tradeLanes,
    salesRoleType: data.salesRoleType,
    
    annualRevenueGenerated: data.annualRevenueGenerated ?? 0,
    commodities: data.commodities || '',
    
    bookOfBusiness: data.bookOfBusiness ?? false
  }
}

export function mergeLogisticsWithCandidateData(
  logisticsExperience: LogisticsExperience,
  existingData: any
): any {
  return {
    ...existingData,
    logisticsExperience: prepareLogisticsForSubmission(logisticsExperience)
  }
}

export const LOGISTICS_EXPERIENCE_STORAGE_KEY = 'logistics_experience_temp'

export function storeLogisticsExperience(data: Partial<LogisticsExperience>): void {
  try {
    const dataWithTimestamp = {
      ...data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) 
    }
    localStorage.setItem(LOGISTICS_EXPERIENCE_STORAGE_KEY, JSON.stringify(dataWithTimestamp))
  } catch (error) {
    console.warn('Failed to store logistics experience data:', error)
  }
}

export function getStoredLogisticsExperience(): Partial<LogisticsExperience> | null {
  try {
    const stored = localStorage.getItem(LOGISTICS_EXPERIENCE_STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored)

    if (data.expiresAt && Date.now() > data.expiresAt) {
      clearStoredLogisticsExperience()
      return null
    }

    const { timestamp, expiresAt, ...logisticsData } = data
    return logisticsData
  } catch (error) {
    console.warn('Failed to retrieve logistics experience data:', error)
    return null
  }
}

export function clearStoredLogisticsExperience(): void {
  try {
    localStorage.removeItem(LOGISTICS_EXPERIENCE_STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear logistics experience data:', error)
  }
}