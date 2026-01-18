export type   KanbanStage =
  | "Initial Screening"
  | "Interviewed"
  | "Profile Shared"
  | "Final Decision";

export type CandidateStatus =
  | "Active"
  | "Under Review"
  | "Hired"
  | "Rejected"
  | "On Hold"
  | string;

export type Candidate = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;

  summary?: string;
  experience?: string;
  education?: string;
  skills?: string;
  certifications?: string;

  status: CandidateStatus;
  managerRating?: number;
  industry?: string;
  salesRoleType?: string;

  annualRevenue?: number;
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;

  bookOfBusiness?: boolean;
  tradeLanes?: string[];
  commodities?: string;
  importExportFocus?: string;
  willingToRelocate?: string;

  candidatePreferences?: string[];
  modeOfTransportation?: string[];

  requestDate?: string;
  requestStatus?: string;
  jobTitle?: string;

  hidePersonalInfo?: boolean;

  // ✅ Needed for Kanban
  stage: KanbanStage;
};
