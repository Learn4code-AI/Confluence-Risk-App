import { describe, expect, it } from 'vitest'
import { defaultMappings, createJiraFields, mockJiraFields } from './mapping'
import { mockRisks } from '../data/mockRisks'

describe('Jira field mapping', () => {
  it('maps standard and custom risk values by Jira field ID', () => {
    const risk = mockRisks[0]
    const fields = createJiraFields(risk, defaultMappings)

    expect(fields.summary).toBe(risk.summary)
    expect(fields.customfield_rootcause).toBe(risk.rootCause)
    expect(fields.customfield_preimpact).toBe(risk.impact)
    expect(fields.customfield_riskcategory).toEqual({ value: risk.category })
    expect(fields).not.toHaveProperty('customfield_projectimpact')
  })

  it('uses the mapped Jira option value for select fields', () => {
    const risk = { ...mockRisks[0], impact: 2, probability: 3 }
    const fields = createJiraFields(risk, defaultMappings, mockJiraFields)

    expect(fields.customfield_preimpact).toEqual({ value: '2 - Minor' })
    expect(fields.customfield_preprobability).toEqual({ value: '3 - Possible' })
    expect(fields.customfield_riskcategory).toEqual({ value: risk.category })
    expect(fields).not.toHaveProperty('customfield_projectimpact')
  })

  it('omits unselected field mappings', () => {
    const risk = mockRisks[0]
    const mappings = { ...defaultMappings, treatmentPlan: '' }
    const fields = createJiraFields(risk, mappings)

    expect(fields).not.toHaveProperty('customfield_treatmentplan')
  })
})
