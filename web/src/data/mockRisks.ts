import type { Risk } from '../types'

export const projects = [
  { key: 'NOVA', name: 'Chiplet System' },
  { key: 'PULSE', name: 'Power Delivery' },
  { key: 'ORBIT', name: 'Connectivity Platform' },
]

export const mockSpaces = [
  { id: 'space-nova', key: 'NOVA', name: 'Chiplet System' },
  { id: 'space-pulse', key: 'PULSE', name: 'Power Delivery' },
  { id: 'space-orbit', key: 'ORBIT', name: 'Connectivity Platform' },
]

export const mockInitiatives = [
  { id: 'initiative-1', key: 'NOVA-10', name: 'Pre-Industrialization' },
  { id: 'initiative-2', key: 'NOVA-20', name: 'Chassis' },
  { id: 'initiative-3', key: 'NOVA-30', name: 'Industrialization' },
]

const base = {
  project: 'NOVA',
  description: 'Tracked from the project risk review.',
  category: 'Technical',
  treatment: 'Mitigate',
  status: 'Open' as const,
  rootCause: 'Dependency needs a preventive control.',
  effect: 'Delivery schedule or product quality may be affected.',
  treatmentPlan: 'Confirm action owner and review at the next risk meeting.',
}

export const mockRisks: Risk[] = [
  { ...base, id: '1', key: 'PJM-2', summary: 'Reliability failure due to mismatch of CTE of material (chiplet & manufacturing)', assignee: 'Unassigned', impact: 2, probability: 2, description: '' },
  { ...base, id: '2', key: 'PJM-3', summary: 'Interoperability risk between 3rd party vendor UCIe IP', assignee: 'Unassigned', impact: 4, probability: 2, impactedInitiatives: [mockInitiatives[0]] },
  { ...base, id: '3', key: 'PJM-4', summary: 'Delivery gap on signal integrity from vendor partner', assignee: 'Unassigned', impact: 4, probability: 3 },
  { ...base, id: '4', key: 'PJM-5', summary: 'Packaging vendor capacity cannot support the committed build', assignee: 'Unassigned', impact: 3, probability: 5, impactedInitiatives: [mockInitiatives[1]] },
  { ...base, id: '5', key: 'PJM-7', summary: 'USP proposal IP in comparison to Qualcomm and Nvidia', assignee: 'Unassigned', impact: 5, probability: 5 },
  { ...base, id: '6', key: 'PJM-8', summary: 'ACS will not meet target quality requirements in the field', assignee: 'Unassigned', impact: 3, probability: 3, impactedInitiatives: [mockInitiatives[2]] },
  { ...base, id: '7', key: 'PJM-18', summary: 'AI chiplet is not series-ready in time', assignee: 'Hy Nguyen', impact: 5, probability: 4, residualImpact: 3, residualProbability: 2, justification: 'Fallback IP package is validated; remaining exposure is limited to the final qualification cycle.', status: 'Treatment Confirmed', linkedTickets: [
    { id: '101', key: 'PJM-104', summary: 'Validate fallback IP package', status: 'In Progress', linkType: 'is treated by' },
    { id: '102', key: 'PJM-111', summary: 'Run final qualification cycle', status: 'To Do', linkType: 'is treated by' },
  ] },
  { ...base, id: '8', key: 'PJM-19', summary: 'Licensing terms delay partner integration', assignee: 'Maya Chen', impact: 3, probability: 4 },
  { ...base, id: '9', key: 'PJM-20', summary: 'Thermal envelope exceeds package capability', assignee: 'Lars Weber', impact: 4, probability: 4, project: 'PULSE' },
  { ...base, id: '10', key: 'PJM-21', summary: 'Test coverage is incomplete for corner cases', assignee: 'Hy Nguyen', impact: 2, probability: 3 },
  { ...base, id: '11', key: 'PJM-22', summary: 'Component traceability gaps in pilot lots', assignee: 'Maya Chen', impact: 2, probability: 2 },
  { ...base, id: '12', key: 'PJM-23', summary: 'Data exchange interface version mismatch', assignee: 'Unassigned', impact: 1, probability: 2 },
  { ...base, id: '13', key: 'PJM-24', summary: 'Qualification lab availability conflicts with launch', assignee: 'Lars Weber', impact: 4, probability: 5, project: 'PULSE' },
  { ...base, id: '14', key: 'PJM-25', summary: 'Regulatory evidence arrives after design freeze', assignee: 'Sofia Rossi', impact: 5, probability: 3, residualImpact: 2, residualProbability: 1, justification: 'The evidence package was accepted and no late regulatory dependency remains.', status: 'Cancelled', linkedTickets: [
    { id: '103', key: 'PJM-118', summary: 'Archive regulatory evidence package', status: 'Done', linkType: 'is treated by' },
  ] },
  { ...base, id: '15', key: 'PJM-26', summary: 'Supply allocation changes during ramp', assignee: 'Unassigned', impact: 3, probability: 2, project: 'ORBIT' },
  { ...base, id: '16', key: 'PJM-27', summary: 'Firmware regression impacts qualification', assignee: 'Daniel Kim', impact: 2, probability: 4 },
  { ...base, id: '17', key: 'PJM-28', summary: 'Reference architecture dependency is unstable', assignee: 'Maya Chen', impact: 3, probability: 1 },
  { ...base, id: '18', key: 'PJM-29', summary: 'Manufacturing yield remains below target', assignee: 'Sofia Rossi', impact: 4, probability: 4 },
  { ...base, id: '19', key: 'PJM-30', summary: 'Security review identifies an unresolved threat', assignee: 'Daniel Kim', impact: 5, probability: 5 },
  { ...base, id: '20', key: 'PJM-31', summary: 'Customer acceptance criteria are not fully aligned', assignee: 'Unassigned', impact: 3, probability: 4, residualImpact: 2, residualProbability: 2, justification: 'Customer acceptance criteria were consolidated and approved by both product and quality owners.', status: 'Treatment Confirmed' }
]
