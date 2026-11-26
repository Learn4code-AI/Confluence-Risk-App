export type RiskLevel = 'Low' | 'Low Med' | 'Medium' | 'Med High' | 'High'

export interface SpaceOption {
  id: string
  key: string
  name: string
}

export interface MeetingContext {
  pageId: string
  title?: string
}

export interface InitiativeOption {
  id: string
  key: string
  name: string
  jiraUrl?: string
}

export interface LinkedTicket {
  id: string
  key: string
  summary: string
  status: string
  linkType: string
  jiraUrl?: string
}

export interface Risk {
  id: string
  key: string
  summary: string
  description: string
  project: string
  assignee: string
  impact: number
  probability: number
  residualImpact?: number
  residualProbability?: number
  justification?: string
  linkedTickets?: LinkedTicket[]
  impactedInitiatives?: InitiativeOption[]
  category: string
  treatment: string
  status: 'Open' | 'Monitoring' | 'Closed' | 'Cancelled' | 'Treatment Confirmed'
  createdAt?: string
  meetingPageId?: string
  rootCause?: string
  effect?: string
  treatmentPlan?: string
  jiraUrl?: string
}

export interface JiraField {
  id: string
  name: string
  type: 'string' | 'number' | 'option' | 'user' | 'array' | 'unknown'
  allowedValues?: string[]
  required?: boolean
  sampleValue?: string
}

export type RiskFieldKey =
  | 'summary'
  | 'description'
  | 'assignee'
  | 'rootCause'
  | 'effect'
  | 'category'
  | 'treatment'
  | 'treatmentPlan'
  | 'impact'
  | 'probability'
  | 'residualImpact'
  | 'residualProbability'
  | 'justification'

export type FieldMappings = Record<RiskFieldKey, string>
