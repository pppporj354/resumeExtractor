/**
 * Represents a link to a social or professional profile.
 */
export interface ResumeLink {
  linkedin?: string
  github?: string
  portfolio?: string
  other_links?: string[]
}

/**
 * Represents the location details of a candidate.
 */
export interface ResumeLocation {
  city?: string
  state?: string
  country?: string
  postal_code?: string
}

/**
 * Represents the personal information extracted from a resume.
 */
export interface ResumePersonalInfo {
  full_name?: string
  email?: string
  phone?: string
  location?: ResumeLocation
  linkedin?: string
  github?: string
  portfolio?: string
  other_links?: string[]
}

/**
 * Represents a professional summary section.
 */
export interface ResumeProfessionalSummary {
  title?: string
  summary?: string
  total_years_experience?: number
  current_role?: string
  current_company?: string
}

/**
 * Represents a single skill with proficiency and experience.
 */
export interface ResumeSkill {
  name: string
  proficiency_level?: string
  years_experience?: number
}

/**
 * Represents a category of technical skills.
 */
export interface ResumeSkillCategory {
  category: string
  skills: ResumeSkill[]
}

/**
 * Represents a certification.
 */
export interface ResumeCertification {
  name: string
  issuer: string
  date_obtained?: string
  expiry_date?: string
  credential_id?: string
}

/**
 * Represents all skills, soft skills, and certifications.
 */
export interface ResumeSkills {
  technical_skills: ResumeSkillCategory[]
  soft_skills: string[]
  certifications: ResumeCertification[]
}

/**
 * Represents a single work experience entry.
 */
export interface ResumeWorkExperience {
  company: string
  position: string
  start_date: string
  end_date?: string | null
  duration_years?: number
  location?: string
  description?: string
  key_achievements?: string[]
  technologies_used?: string[]
}

/**
 * Represents a single education entry.
 */
export interface ResumeEducation {
  institution: string
  degree: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  gpa?: string
  honors?: string[]
}

/**
 * Represents a single project entry.
 */
export interface ResumeProject {
  name: string
  description?: string
  technologies?: string[]
  url?: string
  start_date?: string
  end_date?: string
}

/**
 * Represents a language proficiency entry.
 */
export interface ResumeLanguage {
  language: string
  proficiency: string
}

/**
 * Represents the main structured resume data.
 */
export interface ResumeData {
  personal_info?: ResumePersonalInfo
  professional_summary?: ResumeProfessionalSummary
  skills?: ResumeSkills
  work_experience?: ResumeWorkExperience[]
  education?: ResumeEducation[]
  projects?: ResumeProject[]
  languages?: ResumeLanguage[]
}

/**
 * Represents the metadata for a parsed resume.
 */
export interface ResumeMetadata {
  parsed_at: string
  file_info: {
    original_filename: string
    file_size_bytes: number
    file_type: string
    pages_count?: number
  }
  confidence_scores?: {
    personal_info?: number
    skills_extraction?: number
    experience_parsing?: number
    overall?: number
  }
  processing_time_ms?: number
  warnings?: string[]
  api_version: string
}

/**
 * Represents the result of a successful resume parsing operation.
 */
export interface ResumeParseSuccessResponse {
  success: true
  data: ResumeData
  metadata: ResumeMetadata
}

/**
 * Represents the result of a failed resume parsing operation.
 */
export interface ResumeParseErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: string
    suggestions?: string[]
  }
  metadata?: ResumeMetadata
}

/**
 * Union type for all possible resume parse responses.
 */
export type ResumeParseResponse =
  | ResumeParseSuccessResponse
  | ResumeParseErrorResponse
