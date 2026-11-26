import type { FieldMappings, JiraField, Risk, RiskFieldKey } from '../types'

export const fieldMappingLabels: Record<RiskFieldKey, string> = {
  summary: 'Summary',
  description: 'Description',
  assignee: 'Assignee',
  rootCause: 'Root cause',
  effect: 'Effect',
  category: 'Risk category',
  treatment: 'Treatment',
  treatmentPlan: 'Treatment plan',
  impact: 'Init Impact',
  probability: 'Init Probability',
  residualImpact: 'Residual Impact',
  residualProbability: 'Residual Probability',
  justification: 'Residual justification',
}

export const fieldMappingDescriptions: Partial<Record<RiskFieldKey, string>> = {
  description: 'Long description stored on the Jira ticket when a risk is created.',
  category: 'Selectable risk classification. New Risk options are loaded from this mapped Jira field.',
  impact: 'Calculation-only field. Initial impact used when residual impact and probability are not both available.',
  probability: 'Calculation-only field. Initial probability used with Init Impact for the initial risk score.',
  residualImpact: 'Calculation-only field. Used by the matrix when Residual Impact and Residual Probability are both available.',
  residualProbability: 'Calculation-only field. Used with Residual Impact to calculate the displayed residual score.',
  justification: 'Supporting explanation shown in the Closed risks view for the final exposure assessment.',
}

export const defaultMappings: FieldMappings = {
  summary: 'summary',
  description: 'description',
  assignee: 'assignee',
  rootCause: 'customfield_rootcause',
  effect: 'customfield_effect',
  category: 'customfield_riskcategory',
  treatment: 'customfield_treatment',
  treatmentPlan: 'customfield_treatmentplan',
  impact: 'customfield_preimpact',
  probability: 'customfield_preprobability',
  residualImpact: 'customfield_residualimpact',
  residualProbability: 'customfield_residualprobability',
  justification: 'customfield_residualjustification',
}

export const mockJiraFields: JiraField[] = [
  { id: 'summary', name: 'Summary', type: 'string' },
  { id: 'description', name: 'Description', type: 'string' },
  { id: 'assignee', name: 'Assignee', type: 'user' },
  { id: 'customfield_rootcause', name: 'Root Cause', type: 'string' },
  { id: 'customfield_effect', name: 'Effect', type: 'string' },
  { id: 'customfield_riskcategory', name: 'Risk Category', type: 'option', allowedValues: ['Technical', 'Quality and Security', 'Supply Chain and Vendor', 'Financial and Cost', 'Human and Resource'] },
  { id: 'customfield_treatment', name: 'Treatment', type: 'option', allowedValues: ['Mitigate', 'Avoid', 'Transfer', 'Accept'] },
  { id: 'customfield_treatmentplan', name: 'Treatment Plan', type: 'string' },
  { id: 'customfield_preimpact', name: 'Init Impact', type: 'option', allowedValues: ['1 - Negligible', '2 - Minor', '3 - Moderate', '4 - Significant', '5 - Severe'] },
  { id: 'customfield_preprobability', name: 'Init Probability', type: 'option', allowedValues: ['1 - Very Unlikely', '2 - Unlikely', '3 - Possible', '4 - Likely', '5 - Very Likely'] },
  { id: 'customfield_residualimpact', name: 'Residual Impact', type: 'option', allowedValues: ['1 - Negligible', '2 - Minor', '3 - Moderate', '4 - Significant', '5 - Severe'] },
  { id: 'customfield_residualprobability', name: 'Residual Probability', type: 'option', allowedValues: ['1 - Very Unlikely', '2 - Unlikely', '3 - Possible', '4 - Likely', '5 - Very Likely'] },
  { id: 'customfield_residualjustification', name: 'Residual Justification', type: 'string' },
]

export function createJiraFields(
  risk: Omit<Risk, 'id' | 'key' | 'jiraUrl'>,
  mappings: FieldMappings,
  jiraFields: JiraField[] = [],
) {
  const fieldsById = new Map(jiraFields.map((field) => [field.id, field]))
  const optionValue = (key: RiskFieldKey, value: unknown) => {
    const field = fieldsById.get(mappings[key])
    const domainOption = key === 'category' || key === 'treatment'
    if (!field && !domainOption) return value
    if (field && field.type !== 'option') return value
    if (key === 'impact' || key === 'probability' || key === 'residualImpact' || key === 'residualProbability') {
      const matchingOption = field?.allowedValues?.find((option) => Number(option.match(/\d+/)?.[0]) === Number(value))
      return value == null ? null : { value: matchingOption ?? String(value) }
    }
    return value == null || value === '' ? null : { value: String(value) }
  }
  const values: Record<RiskFieldKey, unknown> = {
    summary: risk.summary,
    description: risk.description,
    assignee: risk.assignee ? { accountId: risk.assignee } : null,
    rootCause: risk.rootCause ?? '',
    effect: risk.effect ?? '',
    category: optionValue('category', risk.category),
    treatment: optionValue('treatment', risk.treatment),
    treatmentPlan: risk.treatmentPlan ?? '',
    impact: optionValue('impact', risk.impact),
    probability: optionValue('probability', risk.probability),
    residualImpact: optionValue('residualImpact', risk.residualImpact),
    residualProbability: optionValue('residualProbability', risk.residualProbability),
    justification: risk.justification ?? '',
  }

  return (Object.keys(mappings) as RiskFieldKey[]).reduce<Record<string, unknown>>((fields, key) => {
    const jiraFieldId = mappings[key]
    if (jiraFieldId) fields[jiraFieldId] = values[key]
    return fields
  }, {})
}
