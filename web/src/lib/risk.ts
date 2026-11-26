import type { Risk, RiskLevel } from '../types'

export const impactLabels = ['Negligible', 'Minor', 'Moderate', 'Significant', 'Severe']
export const probabilityLabels = ['Very Unlikely', 'Unlikely', 'Possible', 'Likely', 'Very Likely']

export function riskScore(impact: number, probability: number) {
  return Math.max(1, impact) * Math.max(1, probability)
}

export function effectiveExposure(risk: Risk) {
  const useResidual = risk.residualImpact != null && risk.residualProbability != null
  return {
    impact: useResidual ? risk.residualImpact! : risk.impact,
    probability: useResidual ? risk.residualProbability! : risk.probability,
    score: riskScore(
      useResidual ? risk.residualImpact! : risk.impact,
      useResidual ? risk.residualProbability! : risk.probability,
    ),
    source: useResidual ? 'Residual' as const : 'Initial' as const,
  }
}

export function riskLevel(impact: number, probability: number): RiskLevel {
  const score = riskScore(impact, probability)
  if (score >= 17) return 'High'
  if (score >= 12) return 'Med High'
  if (score >= 8) return 'Medium'
  if (score >= 4) return 'Low Med'
  return 'Low'
}

export function getMatrixCounts(risks: Risk[]) {
  return risks.reduce<Record<string, number>>((counts, risk) => {
    const exposure = effectiveExposure(risk)
    const key = `${exposure.impact}-${exposure.probability}`
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

export function sortRisksByExposure(risks: Risk[]) {
  return [...risks].sort((left, right) => {
    const scoreDifference = effectiveExposure(right).score - effectiveExposure(left).score
    if (scoreDifference) return scoreDifference
    return left.key.localeCompare(right.key)
  })
}

export function formatAssignee(name: string) {
  return name || 'Unassigned'
}
