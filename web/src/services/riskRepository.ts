import { mockInitiatives, mockRisks, mockSpaces, projects } from '../data/mockRisks'
import { impactTargetKeys, resolveInitiatives, type IssueHierarchyNode } from '../lib/hierarchy'
import { createJiraFields, defaultMappings, mockJiraFields } from '../lib/mapping'
import type { FieldMappings, InitiativeOption, JiraField, LinkedTicket, MeetingContext, Risk, SpaceOption } from '../types'

export interface RiskRepository {
  readonly mode: 'Local mock' | 'Forge Jira'
  getMeetingContext(): Promise<MeetingContext>
  listSpaces(): Promise<SpaceOption[]>
  listInitiatives(spaceKey: string): Promise<InitiativeOption[]>
  listRisks(spaceKey: string): Promise<Risk[]>
  createRisk(risk: Omit<Risk, 'id' | 'key' | 'jiraUrl'>, mappings: FieldMappings, meetingPageId: string, jiraFields: JiraField[]): Promise<Risk>
  getJiraFields(spaceKey: string): Promise<JiraField[]>
}

const storageKey = 'confluence-risk-app-risks'

function readSavedMappings(spaceKey: string): FieldMappings {
  try {
    const saved = localStorage.getItem(`jira-risk-field-mappings:${spaceKey}`)
      ?? localStorage.getItem('jira-risk-field-mappings')
    return saved ? { ...defaultMappings, ...JSON.parse(saved) } : { ...defaultMappings }
  } catch {
    return { ...defaultMappings }
  }
}

function numericField(value: unknown) {
  const candidate = typeof value === 'object' && value !== null && 'value' in value
    ? (value as { value: unknown }).value
    : value
  const number = Number(String(candidate ?? '').match(/\d+/)?.[0])
  return Number.isFinite(number) ? number : undefined
}

function textField(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'content' in value) {
    const collect = (node: unknown): string => {
      if (!node || typeof node !== 'object') return ''
      const record = node as { text?: string; content?: unknown[] }
      return record.text ?? (record.content ?? []).map(collect).join(' ')
    }
    return collect(value).trim()
  }
  return ''
}

function treatedByLinks(issueLinks: unknown): LinkedTicket[] {
  if (!Array.isArray(issueLinks)) return []
  return issueLinks.flatMap((link) => {
    const record = link as {
      id?: string
      type?: { outward?: string; inward?: string }
      outwardIssue?: { id: string; key: string; fields?: { summary?: string; status?: { name?: string } } }
      inwardIssue?: { id: string; key: string; fields?: { summary?: string; status?: { name?: string } } }
    }
    const outwardLabel = record.type?.outward?.toLowerCase()
    const inwardLabel = record.type?.inward?.toLowerCase()
    const outward = outwardLabel === 'is treated by' || outwardLabel === 'treats'
    const inward = inwardLabel === 'is treated by' || inwardLabel === 'treats'
    const issue = outward ? record.outwardIssue : inward ? record.inwardIssue : undefined
    if (!issue) return []
    return [{
      id: issue.id,
      key: issue.key,
      summary: issue.fields?.summary ?? issue.key,
      status: issue.fields?.status?.name ?? 'Unknown',
      linkType: outward ? record.type?.outward ?? 'is treated by' : record.type?.inward ?? 'is treated by',
    }]
  })
}

function readLocalRisks() {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) as Risk[] : mockRisks
  } catch {
    return mockRisks
  }
}

export class MockRiskRepository implements RiskRepository {
  readonly mode = 'Local mock' as const

  async getMeetingContext() {
    const pageId = new URLSearchParams(window.location.search).get('pageId') || 'local-meeting'
    return { pageId, title: pageId === 'local-meeting' ? 'Monthly risk meeting' : `Meeting ${pageId}` }
  }

  async listSpaces() {
    return mockSpaces
  }

  async listInitiatives() {
    return mockInitiatives
  }

  async listRisks(spaceKey: string) {
    return readLocalRisks().filter((risk) => !spaceKey || risk.project === spaceKey)
  }

  async createRisk(risk: Omit<Risk, 'id' | 'key' | 'jiraUrl'>, _mappings: FieldMappings, meetingPageId: string, _jiraFields: JiraField[]) {
    const risks = readLocalRisks()
    const nextNumber = Math.max(31, ...risks.map((item) => Number(item.key.split('-')[1]) || 0)) + 1
    const created: Risk = {
      ...risk,
      id: crypto.randomUUID(),
      key: `PJM-${nextNumber}`,
      createdAt: new Date().toISOString(),
      meetingPageId,
      jiraUrl: `https://chiplet-system.atlassian.net/browse/PJM-${nextNumber}`,
    }
    localStorage.setItem(storageKey, JSON.stringify([created, ...risks]))
    return created
  }

  async getJiraFields() {
    return mockJiraFields
  }
}

interface ForgeBridge {
  callBridge(name: string, payload?: unknown): Promise<unknown>
}

declare global {
  interface Window {
    __bridge?: ForgeBridge
  }
}

export class ForgeRiskRepository implements RiskRepository {
  readonly mode = 'Forge Jira' as const

  async getMeetingContext() {
    if (!window.__bridge) throw new Error('Atlassian Forge bridge is not available.')
    const context = await window.__bridge.callBridge('getContext') as {
      extension?: { content?: { id?: string; title?: string }; space?: { key?: string } }
    }
    const content = context.extension?.content
    const pageId = String(content?.id ?? context.extension?.space?.key ?? 'global')
      .replace(/[^a-zA-Z0-9_-]/g, '')
    return { pageId, title: content?.title }
  }

  async listSpaces() {
    const data = await this.request('/rest/api/3/project/search?maxResults=100&orderBy=name') as {
      values?: Array<{ id: string; key: string; name: string }>
    }
    return (data.values ?? []).map((project) => ({
      id: String(project.id),
      key: project.key,
      name: project.name,
    }))
  }

  async request(restPath: string, method = 'GET', body?: unknown) {
    if (!window.__bridge) throw new Error('Atlassian Forge bridge is not available.')
    const result = await window.__bridge.callBridge('fetchProduct', {
      product: 'jira',
      provider: 'jira',
      restPath,
      fetchRequestInit: {
        method,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Atlassian-Token': 'no-check' },
        body: body ? JSON.stringify(body) : undefined,
      },
    }) as { status: number; body: string | unknown }
    if (result.status < 200 || result.status >= 300) throw new Error(`Jira request failed (${result.status}).`)
    return typeof result.body === 'string' ? JSON.parse(result.body) : result.body
  }

  async listInitiatives(spaceKey: string) {
    if (!spaceKey) return []
    const data = await this.request('/rest/api/3/search/jql', 'POST', {
      jql: `project = "${spaceKey.replace(/"/g, '')}" AND issuetype = Initiative ORDER BY summary ASC`,
      maxResults: 200,
      fields: ['summary'],
    }) as { issues: Array<{ id: string; key: string; fields: { summary?: string } }> }
    return data.issues.map((issue) => ({ id: issue.id, key: issue.key, name: issue.fields.summary ?? issue.key }))
  }

  private async impactedInitiatives(issues: Array<{ id: string; key: string; fields: Record<string, any> }>) {
    const impactTargetsByRisk = new Map<string, string[]>()
    const pending = new Set<string>()
    for (const issue of issues) {
      const targets = impactTargetKeys(issue.fields.issuelinks)
      impactTargetsByRisk.set(issue.key, targets)
      targets.forEach((key) => pending.add(key))
    }

    const graph = new Map<string, IssueHierarchyNode>()
    for (let depth = 0; depth < 12 && pending.size; depth += 1) {
      const keys = [...pending]
      pending.clear()
      const query = keys.map((key) => `"${key.replace(/"/g, '')}"`).join(',')
      const data = await this.request('/rest/api/3/search/jql', 'POST', {
        jql: `key in (${query})`,
        maxResults: 100,
        fields: ['summary', 'issuetype', 'parent'],
      }) as { issues: Array<{ id: string; key: string; fields: { summary?: string; issuetype?: { name?: string }; parent?: { key?: string } } }> }
      for (const node of data.issues) {
        const parentKey = node.fields.parent?.key
        graph.set(node.key, {
          key: node.key,
          id: node.id,
          name: node.fields.summary ?? node.key,
          type: node.fields.issuetype?.name ?? '',
          parentKey,
        })
        if (parentKey && !graph.has(parentKey)) pending.add(parentKey)
      }
    }

    const result = new Map<string, InitiativeOption[]>()
    for (const [riskKey, targetKeys] of impactTargetsByRisk) {
      result.set(riskKey, resolveInitiatives(targetKeys, graph))
    }
    return result
  }

  async listRisks(spaceKey: string) {
    const mappings = readSavedMappings(spaceKey)
    const data = await this.request('/rest/api/3/search/jql', 'POST', {
      jql: `project = "${spaceKey.replace(/"/g, '')}" AND issuetype = "Risk" ORDER BY created DESC`,
      maxResults: 200,
      fields: [
        'summary', 'description', 'assignee', 'project', 'status', 'issuelinks', 'created', 'labels',
        ...Object.values(mappings).filter(Boolean),
      ],
    }) as { issues: Array<{ id: string; key: string; fields: Record<string, any> }> }
    const impacted = await this.impactedInitiatives(data.issues)
    return data.issues.map((issue) => {
      const fields = issue.fields
      const statusName = fields.status?.name ?? 'Open'
      const status = ['Open', 'Monitoring', 'Closed', 'Cancelled', 'Treatment Confirmed'].includes(statusName)
        ? statusName as Risk['status']
        : 'Open'
      return {
        id: issue.id,
        key: issue.key,
        project: fields.project?.key ?? 'NOVA',
        summary: fields.summary ?? issue.key,
        description: textField(fields.description),
        assignee: fields.assignee?.displayName ?? '',
        impact: numericField(fields[mappings.impact]) ?? 3,
        probability: numericField(fields[mappings.probability]) ?? 3,
        residualImpact: numericField(fields[mappings.residualImpact]),
        residualProbability: numericField(fields[mappings.residualProbability]),
        justification: textField(fields[mappings.justification]),
        linkedTickets: treatedByLinks(fields.issuelinks),
        impactedInitiatives: impacted.get(issue.key) ?? [],
        category: fields[mappings.category]?.value ?? 'Technical',
        treatment: fields[mappings.treatment]?.value ?? 'Mitigate',
        status,
        createdAt: fields.created,
        meetingPageId: Array.isArray(fields.labels)
          ? fields.labels.find((label: string) => label.startsWith('conf-page-'))?.slice('conf-page-'.length)
          : undefined,
        jiraUrl: `https://chiplet-system.atlassian.net/browse/${issue.key}`,
      }
    })
  }

  async createRisk(risk: Omit<Risk, 'id' | 'key' | 'jiraUrl'>, mappings: FieldMappings, meetingPageId: string, jiraFields: JiraField[]) {
    const fields = createJiraFields(risk, mappings, jiraFields)
    const pageLabel = `conf-page-${meetingPageId.replace(/[^a-zA-Z0-9_-]/g, '')}`
    const created = await this.request('/rest/api/3/issue', 'POST', {
      fields: {
        ...fields,
        project: { key: risk.project },
        issuetype: { name: 'Risk' },
        labels: ['confluence-risk', pageLabel],
      },
    }) as { id: string; key: string; fields?: { created?: string } }
    return {
      ...risk,
      ...created,
      createdAt: created.fields?.created ?? new Date().toISOString(),
      meetingPageId,
      jiraUrl: `https://chiplet-system.atlassian.net/browse/${created.key}`,
    }
  }

  async getJiraFields(spaceKey: string) {
    try {
      const typeData = await this.request(`/rest/api/3/issue/createmeta/${encodeURIComponent(spaceKey)}/issuetypes?maxResults=100`) as {
        issueTypes?: Array<{ id: string; name: string }>
        values?: Array<{ id: string; name: string }>
      }
      const issueTypes = typeData.issueTypes ?? typeData.values ?? []
      const riskType = issueTypes.find((type) => type.name.toLowerCase() === 'risk')
      if (!riskType) return []
      const fieldData = await this.request(`/rest/api/3/issue/createmeta/${encodeURIComponent(spaceKey)}/issuetypes/${encodeURIComponent(riskType.id)}?maxResults=100`) as {
        fields?: Array<{ fieldId?: string; id?: string; name: string; required?: boolean; allowedValues?: unknown[]; schema?: { type?: string; items?: string } }>
        values?: Array<{ fieldId?: string; id?: string; name: string; required?: boolean; allowedValues?: unknown[]; schema?: { type?: string; items?: string } }>
      }
      return (fieldData.fields ?? fieldData.values ?? []).map((field) => ({
        id: field.fieldId ?? field.id ?? field.name,
        name: field.name,
        type: ((field.schema?.type === 'array' ? field.schema.items : field.schema?.type) ?? 'unknown') as JiraField['type'],
        required: field.required,
        allowedValues: (field.allowedValues ?? []).map((value) => {
          if (typeof value === 'string') return value
          const option = value as { value?: string; name?: string; label?: string; id?: string }
          return option.value ?? option.name ?? option.label ?? option.id ?? ''
        }).filter(Boolean),
      }))
    } catch (error) {
      throw new Error(`Unable to load Risk fields for Jira project ${spaceKey}: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }
}

export function createRiskRepository(): RiskRepository {
  return typeof window !== 'undefined' && window.__bridge ? new ForgeRiskRepository() : new MockRiskRepository()
}

export { projects }
