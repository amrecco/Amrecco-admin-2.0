import { KanbanStage } from "@/src/types/kanban.types";
import { ReactNode } from "react";

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
  type: string;
}

export interface CandidateDetail {
  
  currentTitle: ReactNode;
  currentCompany: ReactNode;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  status: string;
  industry: string;
  tradeLanes: string[];
  salesRoleType: string;
  annualRevenue: number;
  bookOfBusiness: boolean;
  usBasedStatus: boolean;
  logisticsSalesExperience: boolean;
  salesExperienceWithinLogistics: boolean;
  profileVisibility: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  experienceText: string;
  educationText: string;
  skills: string;
  certifications: string;
  commodities: string;
  importExportFocus: string;
  modeOfTransportation: string[];
  managerComments: string;
  salaryExpectationMin: number;
  salaryExpectationMax: number;
  candidatePreferences: string[];
  willingToRelocate: string;
  createdDate: string;
  lastLogin: string;
  applicationCount: number;
  managerRating: number;
  profileCreated: boolean;
  InterviewSummary :string;
}