import { Fragment, type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, BarChart3, Check, ChevronDown, ClipboardList, Database,
  ExternalLink, Link2, ListChecks, Plus, Search, Settings2, SlidersHorizontal, X,
} from 'lucide-react'
import { fieldMappingDescriptions, fieldMappingLabels, defaultMappings } from './lib/mapping'
import { effectiveExposure, formatAssignee, getMatrixCounts, impactLabels, probabilityLabels, riskLevel, riskScore, sortRisksByExposure } from './lib/risk'
import { createRiskRepository } from './services/riskRepository'
import type { FieldMappings, InitiativeOption, JiraField, MeetingContext, Risk, RiskFieldKey, SpaceOption } from './types'

const emptyRisk = (project: string): Omit<Risk, 'id' | 'key' | 'jiraUrl'> => ({
  summary: '', description: '', project, assignee: '', impact: 3, probability: 3,
  category: '', treatment: 'Mitigate', status: 'Open', rootCause: '',
  effect: '', treatmentPlan: '',
})

function formatMeetingDate(value?: string) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function loadMappings(spaceKey: string) {
  try {
    const saved = localStorage.getItem(`jira-risk-field-mappings:${spaceKey}`)
      ?? localStorage.getItem('jira-risk-field-mappings')
    return saved ? { ...defaultMappings, ...JSON.parse(saved) } as FieldMappings : { ...defaultMappings }
  } catch {
    return { ...defaultMappings }
  }
}

function Matrix({ risks, selectedCell, onSelect }: {
  risks: Risk[]
  selectedCell: string
  onSelect: (cell: string) => void
}) {
  const counts = getMatrixCounts(risks)
  return <section className="panel matrix-panel" aria-labelledby="matrix-title">
    <div className="panel-heading">
      <div><span className="eyebrow"><BarChart3 size={15} /> Live assessment</span><h2 id="matrix-title">Risk matrix</h2></div>
      <span className="period-badge">Current portfolio</span>
    </div>
    <div className="axis-label axis-impact">Impact</div>
    <div className="matrix-layout">
      <div className="axis-label axis-probability">Probability</div>
      <div className="matrix-grid-wrap">
        <div className="impact-labels">{impactLabels.map((label) => <span key={label}>{label}</span>)}</div>
        <div className="matrix-grid" role="grid" aria-label="5 by 5 risk matrix">
          {[5, 4, 3, 2, 1].map((probability) => <div className="matrix-row" role="row" key={probability}>
            <span className="probability-label">{probabilityLabels[probability - 1]}</span>
            {[1, 2, 3, 4, 5].map((impact) => {
              const key = `${impact}-${probability}`
              const count = counts[key] ?? 0
              return <button
                className={`matrix-cell level-${riskLevel(impact, probability).replace(' ', '-').toLowerCase()} ${selectedCell === key ? 'selected' : ''}`}
                key={impact}
                onClick={() => onSelect(selectedCell === key ? '' : key)}
                aria-label={`${count} risks at ${impactLabels[impact - 1]} impact and ${probabilityLabels[probability - 1]} probability`}
              >{count > 0 && <span>{count}</span>}</button>
            })}
          </div>)}
        </div>
      </div>
    </div>
    <div className="legend">{['Low', 'Low Med', 'Medium', 'Med High', 'High'].map((level) => <span key={level}><i className={`level-dot level-${level.replace(' ', '-').toLowerCase()}`} />{level}</span>)}</div>
  </section>
}

function AppDashboard() {
  const repository = useMemo(() => createRiskRepository(), [])
  const [risks, setRisks] = useState<Risk[]>([])
  const [meeting, setMeeting] = useState<MeetingContext>({ pageId: '', title: 'Monthly risk meeting' })
  const [spaces, setSpaces] = useState<SpaceOption[]>([])
  const [initiatives, setInitiatives] = useState<InitiativeOption[]>([])
  const [fields, setFields] = useState<JiraField[]>([])
  const [mappings, setMappings] = useState<FieldMappings>(() => loadMappings(''))
  const [selectedSpace, setSelectedSpace] = useState('')
  const [initiative, setInitiative] = useState('ALL')
  const [search, setSearch] = useState('')
  const [listView, setListView] = useState<'all' | 'meeting' | 'closed'>('all')
  const [showTreatments, setShowTreatments] = useState(false)
  const [selectedCell, setSelectedCell] = useState('')
  const [showNewRisk, setShowNewRisk] = useState(false)
  const [showMappings, setShowMappings] = useState(false)
  const [draft, setDraft] = useState(() => emptyRisk('NOVA'))
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.all([repository.getMeetingContext(), repository.listSpaces()]).then(([currentMeeting, availableSpaces]) => {
      setMeeting(currentMeeting)
      setSpaces(availableSpaces)
      setSelectedSpace(availableSpaces[0]?.key ?? '')
    }).catch((error: Error) => setNotice(error.message))
  }, [repository])

  useEffect(() => {
    if (!selectedSpace) return
    const spaceMappings = loadMappings(selectedSpace)
    Promise.all([
      repository.listRisks(selectedSpace),
      repository.getJiraFields(selectedSpace),
      repository.listInitiatives(selectedSpace),
    ]).then(([items, jiraFields, availableInitiatives]) => {
      setRisks(items)
      setFields(jiraFields)
      setInitiatives(availableInitiatives)
      setMappings(spaceMappings)
    }).catch((error: Error) => setNotice(error.message))
  }, [repository, selectedSpace])

  const spaceRisks = risks.filter((risk) => !selectedSpace || risk.project === selectedSpace)
  const projectRisks = spaceRisks.filter((risk) => initiative === 'ALL' || risk.impactedInitiatives?.some((item) => item.id === initiative || item.key === initiative))
  const visibleRisks = sortRisksByExposure(projectRisks.filter((risk) => {
    const exposure = effectiveExposure(risk)
    const inCell = !selectedCell || `${exposure.impact}-${exposure.probability}` === selectedCell
    const inSearch = `${risk.key} ${risk.summary} ${risk.assignee}`.toLowerCase().includes(search.toLowerCase())
    const inView = listView === 'all'
      || (listView === 'closed' && (risk.status === 'Cancelled' || risk.status === 'Treatment Confirmed' || risk.status === 'Closed'))
      || (listView === 'meeting' && risk.meetingPageId === meeting.pageId)
    return inCell && inSearch && inView
  }))
  function treatmentTickets(risk: Risk) {
    return (risk.linkedTickets ?? []).filter((ticket) =>
      ['is treated by', 'treats'].includes(ticket.linkType.toLowerCase()),
    )
  }

  function mappedFieldOptions(key: RiskFieldKey, fallback: string[]) {
    const mapped = fields.find((field) => field.id === mappings[key])
    return mapped?.allowedValues?.length ? mapped.allowedValues : fallback
  }

  function numericFieldOptions(key: RiskFieldKey, fallbackLabels: string[]) {
    return mappedFieldOptions(key, fallbackLabels).map((label, index) => ({
      value: Number(label.match(/\d+/)?.[0]) || index + 1,
      label,
    }))
  }

  function openNewRisk() {
    const categoryOptions = mappedFieldOptions('category', ['Technical', 'Quality and Security', 'Supply Chain and Vendor', 'Financial and Cost', 'Human and Resource'])
    setDraft({ ...emptyRisk(selectedSpace), category: categoryOptions[0] ?? '' })
    setShowNewRisk(true)
  }

  async function createRisk(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const created = await repository.createRisk(draft, mappings, meeting.pageId, fields)
      setRisks((current) => [created, ...current])
      setShowNewRisk(false)
      setNotice(`${created.key} was created in ${repository.mode.toLowerCase()} mode.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The risk could not be created.')
    } finally {
      setSaving(false)
    }
  }

  function saveMappings() {
    localStorage.setItem(`jira-risk-field-mappings:${selectedSpace}`, JSON.stringify(mappings))
    setShowMappings(false)
    setNotice(`Jira field mappings saved for ${selectedSpace}.`)
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><BarChart3 size={23} /></span><span>Risk matrix</span></div>
      <div className="header-actions">
        <label className="project-picker space-picker"><span>Confluence space</span>
          <select value={selectedSpace} onChange={(event) => { setSelectedSpace(event.target.value); setInitiative('ALL'); setSelectedCell('') }}>
            {!spaces.length && <option value="">Loading spaces...</option>}
            {spaces.map((space) => <option value={space.key} key={space.id}>{space.name} ({space.key})</option>)}
          </select><ChevronDown size={16} />
        </label>
        <label className="project-picker"><span>Project impact (Initiative)</span>
          <select value={initiative} onChange={(event) => { setInitiative(event.target.value); setSelectedCell('') }}>
            <option value="ALL">All initiatives</option>
            {initiatives.map((item) => <option value={item.key} key={item.id}>{item.name}</option>)}
          </select><ChevronDown size={16} />
        </label>
        <button className="icon-button" onClick={() => setShowMappings(true)} title="Jira field mappings" aria-label="Jira field mappings"><Settings2 size={19} /></button>
        <span className="environment"><Database size={13} />{repository.mode}</span>
      </div>
    </header>

    <main>
      <div className="page-heading">
        <div><span className="eyebrow">{meeting.title || 'Monthly risk meeting'} · Page {meeting.pageId || 'loading'}</span><h1>Project risk register</h1><p>Assess exposure, prioritize action, and trace every decision back to Jira.</p></div>
        <button className="primary-button" onClick={openNewRisk} disabled={!meeting.pageId}><Plus size={17} /> New risk</button>
      </div>
      <div className="dashboard-grid">
        <aside className="matrix-column">
          <div className="compact-summary">
            <span className="summary-icon"><ClipboardList size={18} /></span>
            <div><strong>{projectRisks.length}</strong><span>Total risks</span></div>
            <small>{projectRisks.filter((risk) => {
              const exposure = effectiveExposure(risk)
              return riskLevel(exposure.impact, exposure.probability) === 'High'
            }).length} high</small>
          </div>
          <Matrix risks={projectRisks} selectedCell={selectedCell} onSelect={setSelectedCell} />
          <button className="mapping-strip" onClick={() => setShowMappings(true)}>
            <span><Link2 size={16} /><strong>Jira mapping</strong><small>{fields.length} fields</small></span>
            <Settings2 size={17} />
          </button>
        </aside>

        <section className="panel risks-panel">
          <div className="risk-table-heading">
            <div><span className="eyebrow"><AlertTriangle size={14} /> Active register</span><h2>Risk inventory</h2></div>
            <span className="result-count">{visibleRisks.length} tickets</span>
          </div>
          <div className="view-switcher" aria-label="Risk list views">
            <button className={listView === 'all' ? 'active' : ''} onClick={() => setListView('all')}><ClipboardList size={15} /> All risks</button>
            <button className={listView === 'meeting' ? 'active' : ''} onClick={() => setListView('meeting')}><Plus size={15} /> New this meeting</button>
            <button className={listView === 'closed' ? 'active' : ''} onClick={() => setListView('closed')}><ListChecks size={15} /> Closed risks</button>
            <label className={`treatment-toggle ${showTreatments ? 'active' : ''}`}>
              <input type="checkbox" checked={showTreatments} onChange={(event) => setShowTreatments(event.target.checked)} />
              <Link2 size={15} /> Show treatment tickets
            </label>
          </div>
          <div className="table-toolbar">
            <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search risk, ID, or owner" /></label>
            {selectedCell && <button className="clear-filter" onClick={() => setSelectedCell('')}>Matrix filter: {selectedCell} <X size={13} /></button>}
          </div>
          <div className="table-scroll"><table>
            {listView === 'meeting' ? <>
              <thead><tr><th>Created</th><th>Risk ID</th><th>Summary</th><th>Assignee</th><th>Status</th></tr></thead>
              <tbody>{visibleRisks.map((risk) => <tr key={risk.id}>
                <td><strong>{formatMeetingDate(risk.createdAt)}</strong></td>
                <td><a className="risk-link" href={risk.jiraUrl ?? '#'} target="_blank" rel="noreferrer">{risk.key}<ExternalLink size={12} /></a></td>
                <td><strong>{risk.summary}</strong><small>{risk.category} · {risk.project}</small></td>
                <td><span className="owner">{risk.assignee ? risk.assignee[0] : '?'}</span>{formatAssignee(risk.assignee)}</td>
                <td><span className="status-badge">{risk.status}</span></td>
              </tr>)}{!visibleRisks.length && <tr><td colSpan={5} className="empty-state">No risks were created during this meeting yet.</td></tr>}</tbody>
            </> : listView === 'closed' ? <>
              <thead><tr><th>Risk ID</th><th>Risk description</th><th>Status</th><th>Residual exposure</th><th>Justification</th></tr></thead>
              <tbody>{visibleRisks.map((risk) => {
                const exposure = effectiveExposure(risk)
                const displayLevel = riskLevel(exposure.impact, exposure.probability)
                const treatments = treatmentTickets(risk)
                return <Fragment key={risk.id}>
                  <tr>
                    <td><a className="risk-link" href={risk.jiraUrl ?? '#'} target="_blank" rel="noreferrer">{risk.key}<ExternalLink size={12} /></a></td>
                    <td><strong>{risk.summary}</strong><small>{risk.project} · Owner: {formatAssignee(risk.assignee)}</small></td>
                    <td><span className={`review-status ${risk.status === 'Cancelled' ? 'cancelled' : ''}`}>{risk.status}</span></td>
                    <td><span className={`risk-badge level-${displayLevel.replace(' ', '-').toLowerCase()}`}>{displayLevel} · {exposure.score}</span><small>{exposure.source}: P{exposure.probability} × I{exposure.impact}</small>{exposure.source === 'Residual' && <small>Initial: P{risk.probability} × I{risk.impact} = {riskScore(risk.impact, risk.probability)}</small>}</td>
                    <td className="justification-cell">{risk.justification || 'No justification recorded.'}</td>
                  </tr>
                  {showTreatments && treatments.map((ticket) => <tr className={`treatment-row ${ticket.status.toLowerCase() === 'done' ? 'completed' : ''}`} key={`${risk.id}-${ticket.id}`}>
                    <td className="treatment-indent"><Link2 size={13} /></td>
                    <td colSpan={2}><a className="risk-link" href={ticket.jiraUrl ?? '#'} target="_blank" rel="noreferrer">{ticket.key}<ExternalLink size={12} /></a><strong>{ticket.summary}</strong><small>{ticket.linkType}</small></td>
                    <td><span className="status-badge">{ticket.status}</span></td>
                    <td><span className="treatment-indicator">Treatment ticket</span></td>
                  </tr>)}
                  {showTreatments && !treatments.length && <tr className="treatment-row empty-treatment"><td colSpan={5}>No linked treatment tickets</td></tr>}
                </Fragment>
              })}{!visibleRisks.length && <tr><td colSpan={5} className="empty-state">No closed risks match the current filters.</td></tr>}</tbody>
            </> : <>
              <thead><tr><th>Risk ID</th><th>Risk description</th><th>Owner</th><th>Exposure</th><th>Status</th></tr></thead>
              <tbody>{visibleRisks.map((risk) => {
                const effective = effectiveExposure(risk)
                const exposure = riskLevel(effective.impact, effective.probability)
                const treatments = treatmentTickets(risk)
                return <Fragment key={risk.id}>
                  <tr>
                    <td><a className="risk-link" href={risk.jiraUrl ?? '#'} target="_blank" rel="noreferrer">{risk.key}<ExternalLink size={12} /></a></td>
                    <td><strong>{risk.summary}</strong><small>{risk.category} · {risk.project}</small></td>
                    <td><span className="owner">{risk.assignee ? risk.assignee[0] : '?'} </span>{formatAssignee(risk.assignee)}</td>
                    <td><span className={`risk-badge level-${exposure.replace(' ', '-').toLowerCase()}`}>{exposure} · {effective.score}</span><small>{effective.source}</small></td>
                    <td><span className="status-badge">{risk.status}</span></td>
                  </tr>
                  {showTreatments && treatments.map((ticket) => <tr className={`treatment-row ${ticket.status.toLowerCase() === 'done' ? 'completed' : ''}`} key={`${risk.id}-${ticket.id}`}>
                    <td className="treatment-indent"><Link2 size={13} /></td>
                    <td colSpan={2}><a className="risk-link" href={ticket.jiraUrl ?? '#'} target="_blank" rel="noreferrer">{ticket.key}<ExternalLink size={12} /></a><strong>{ticket.summary}</strong><small>{ticket.linkType}</small></td>
                    <td><span className="status-badge">{ticket.status}</span></td>
                    <td><span className="treatment-indicator">Treatment ticket</span></td>
                  </tr>)}
                  {showTreatments && !treatments.length && <tr className="treatment-row empty-treatment"><td colSpan={5}>No linked treatment tickets</td></tr>}
                </Fragment>
              })}{!visibleRisks.length && <tr><td colSpan={5} className="empty-state">No risks match the current filters.</td></tr>}</tbody>
            </>}
          </table></div>
        </section>
      </div>
    </main>

    {notice && <div className="toast"><Check size={16} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15} /></button></div>}

    {showNewRisk && <div className="modal-backdrop" role="presentation"><section className="modal risk-form-modal" role="dialog" aria-modal="true" aria-labelledby="new-risk-title">
      <div className="modal-header"><div><span className="eyebrow">Jira create issue</span><h2 id="new-risk-title">Register a new risk</h2></div><button className="icon-button" onClick={() => setShowNewRisk(false)} aria-label="Close"><X size={19} /></button></div>
      <form onSubmit={createRisk}>
        <div className="form-grid">
          <label className="wide">Summary *<input required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="What could happen?" /></label>
          <label>Project / space<select value={draft.project} onChange={(event) => setDraft({ ...draft, project: event.target.value })}>{spaces.map((space) => <option key={space.id} value={space.key}>{space.key} - {space.name}</option>)}</select></label>
          <label>Assignee<input value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })} placeholder="Jira account or display name" /></label>
          <label>Root cause *<input required value={draft.rootCause} onChange={(event) => setDraft({ ...draft, rootCause: event.target.value })} /></label>
          <label>Effect *<input required value={draft.effect} onChange={(event) => setDraft({ ...draft, effect: event.target.value })} /></label>
          <label className="wide">Risk Category *<select required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option value="">Select risk category</option>{mappedFieldOptions('category', ['Technical', 'Quality and Security', 'Supply Chain and Vendor', 'Financial and Cost', 'Human and Resource']).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Treatment<select value={draft.treatment} onChange={(event) => setDraft({ ...draft, treatment: event.target.value })}>{mappedFieldOptions('treatment', ['Mitigate', 'Avoid', 'Transfer', 'Accept']).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Treatment plan<input value={draft.treatmentPlan} onChange={(event) => setDraft({ ...draft, treatmentPlan: event.target.value })} /></label>
          <label>Init Impact<select value={draft.impact} onChange={(event) => setDraft({ ...draft, impact: Number(event.target.value) })}>{numericFieldOptions('impact', impactLabels.map((label, index) => `${index + 1} - ${label}`)).map((option) => <option value={option.value} key={`${option.value}-${option.label}`}>{option.label}</option>)}</select></label>
          <label>Init Probability<select value={draft.probability} onChange={(event) => setDraft({ ...draft, probability: Number(event.target.value) })}>{numericFieldOptions('probability', probabilityLabels.map((label, index) => `${index + 1} - ${label}`)).map((option) => <option value={option.value} key={`${option.value}-${option.label}`}>{option.label}</option>)}</select></label>
        </div>
        <div className="form-footer"><span className={`draft-score level-${riskLevel(draft.impact, draft.probability).replace(' ', '-').toLowerCase()}`}>{riskLevel(draft.impact, draft.probability)} · score {riskScore(draft.impact, draft.probability)}</span><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Creating...' : 'Create Jira risk'}</button></div>
      </form>
    </section></div>}

    {showMappings && <div className="modal-backdrop" role="presentation"><section className="modal mapping-modal" role="dialog" aria-modal="true" aria-labelledby="mapping-title">
      <div className="modal-header"><div><span className="eyebrow"><SlidersHorizontal size={14} /> {selectedSpace} configuration</span><h2 id="mapping-title">Map form fields to Jira</h2><p>Choose fields available for the selected Confluence space and its Jira project.</p></div><button className="icon-button" onClick={() => setShowMappings(false)} aria-label="Close"><X size={19} /></button></div>
      <div className="mapping-list"><div className="mapping-list-header"><span>Value in this app</span><span>Mapped Jira field</span></div>{(Object.keys(fieldMappingLabels) as RiskFieldKey[]).map((key) => <label key={key}>
        <span>{fieldMappingLabels[key]}<small>{key === 'summary' || key === 'description' || key === 'assignee' ? 'Jira system field' : 'Jira custom field'}</small>{fieldMappingDescriptions[key] && <small className="mapping-description">{fieldMappingDescriptions[key]}</small>}</span>
        <select value={mappings[key]} onChange={(event) => setMappings({ ...mappings, [key]: event.target.value })}>
          <option value="">Not mapped</option>
          {fields.map((field) => <option key={field.id} value={field.id}>{field.name} · {field.id}</option>)}
          {mappings[key] && !fields.some((field) => field.id === mappings[key]) && <option value={mappings[key]}>{mappings[key]} · pending Jira field</option>}
        </select>
      </label>)}</div>
      <div className="form-footer"><span className="mapping-note"><Database size={15} /> Stored in this browser for the local trial</span><button className="primary-button" onClick={saveMappings}>Save mappings</button></div>
    </section></div>}
  </div>
}

export default AppDashboard
