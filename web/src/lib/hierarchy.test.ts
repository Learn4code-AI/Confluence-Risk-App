import { describe, expect, it } from 'vitest'
import { impactTargetKeys, resolveInitiatives, type IssueHierarchyNode } from './hierarchy'

describe('project impact hierarchy', () => {
  it('finds impacted targets from impacts/is impacted by links', () => {
    expect(impactTargetKeys([
      { type: { outward: 'impacts' }, outwardIssue: { key: 'NOVA-100' } },
      { type: { inward: 'is impacted by' }, inwardIssue: { key: 'NOVA-200' } },
      { type: { outward: 'treats' }, outwardIssue: { key: 'NOVA-300' } },
    ])).toEqual(['NOVA-100', 'NOVA-200'])
  })

  it('resolves a grandchild target to its top Initiative', () => {
    const hierarchy = new Map<string, IssueHierarchyNode>([
      ['NOVA-300', { id: '300', key: 'NOVA-300', name: 'Task', type: 'Task', parentKey: 'NOVA-200' }],
      ['NOVA-200', { id: '200', key: 'NOVA-200', name: 'Epic', type: 'Epic', parentKey: 'NOVA-100' }],
      ['NOVA-100', { id: '100', key: 'NOVA-100', name: 'Chassis', type: 'Initiative' }],
    ])

    expect(resolveInitiatives(['NOVA-300'], hierarchy)).toEqual([
      { id: '100', key: 'NOVA-100', name: 'Chassis' },
    ])
  })
})
