import type { InitiativeOption } from '../types'

export interface IssueHierarchyNode {
  key: string
  id: string
  name: string
  type: string
  parentKey?: string
}

export function impactTargetKeys(issueLinks: unknown) {
  if (!Array.isArray(issueLinks)) return []
  return issueLinks.flatMap((link) => {
    const record = link as {
      type?: { outward?: string; inward?: string }
      outwardIssue?: { key?: string }
      inwardIssue?: { key?: string }
    }
    const outward = record.type?.outward?.toLowerCase() === 'impacts'
    const inward = record.type?.inward?.toLowerCase() === 'is impacted by'
    const target = outward ? record.outwardIssue : inward ? record.inwardIssue : undefined
    return target?.key ? [target.key] : []
  })
}

export function resolveInitiatives(
  targetKeys: string[],
  hierarchy: ReadonlyMap<string, IssueHierarchyNode>,
) {
  const initiatives = new Map<string, InitiativeOption>()
  for (const targetKey of targetKeys) {
    const visited = new Set<string>()
    let current = hierarchy.get(targetKey)
    while (current && !visited.has(current.key)) {
      visited.add(current.key)
      if (current.type.toLowerCase() === 'initiative') {
        initiatives.set(current.id, { id: current.id, key: current.key, name: current.name })
        break
      }
      current = current.parentKey ? hierarchy.get(current.parentKey) : undefined
    }
  }
  return [...initiatives.values()]
}
