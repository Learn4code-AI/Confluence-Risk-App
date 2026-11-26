import { describe, expect, it } from 'vitest'
import { mockRisks } from '../data/mockRisks'
import { effectiveExposure, getMatrixCounts, riskLevel, riskScore, sortRisksByExposure } from './risk'

describe('risk scoring', () => {
  it('multiplies impact and probability', () => {
    expect(riskScore(4, 3)).toBe(12)
  })

  it('classifies score bands consistently', () => {
    expect(riskLevel(1, 2)).toBe('Low')
    expect(riskLevel(2, 3)).toBe('Low Med')
    expect(riskLevel(3, 4)).toBe('Med High')
    expect(riskLevel(5, 4)).toBe('High')
  })

  it('uses residual exposure only when both residual values are available', () => {
    const initial = mockRisks[0]
    expect(effectiveExposure({ ...initial, impact: 4, probability: 5, residualImpact: 2, residualProbability: undefined })).toEqual({
      impact: 4, probability: 5, score: 20, source: 'Initial',
    })
    expect(effectiveExposure({ ...initial, impact: 4, probability: 5, residualImpact: 2, residualProbability: 3 })).toEqual({
      impact: 2, probability: 3, score: 6, source: 'Residual',
    })
  })

  it('places risks in effective exposure matrix cells', () => {
    const treated = { ...mockRisks[0], id: 'treated', impact: 4, probability: 5, residualImpact: 2, residualProbability: 3 }
    const counts = getMatrixCounts([mockRisks[0], treated])
    expect(counts['2-2']).toBe(1)
    expect(counts['2-3']).toBe(1)
    expect(counts['4-5']).toBeUndefined()
  })

  it('sorts effective exposure from highest to lowest', () => {
    const initialHigh = { ...mockRisks[0], id: 'high', key: 'HIGH-1', impact: 4, probability: 5 }
    const residualLower = { ...mockRisks[1], id: 'lower', key: 'LOW-1', impact: 4, probability: 5, residualImpact: 2, residualProbability: 3 }
    expect(sortRisksByExposure([residualLower, initialHigh]).map((risk) => risk.key)).toEqual(['HIGH-1', 'LOW-1'])
  })
})
