# Confluence Jira Risk Matrix

A localhost-first React trial for a Confluence risk-management page linked to Jira Cloud. It includes a 5 by 5 matrix, portfolio filters, a searchable risk register, Jira-style risk creation, and explicit Jira field mapping.

## Run Locally

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite, normally `http://localhost:5173`.

The browser runs in **Local mock** mode. Risks created during the trial persist in browser `localStorage`; no Jira credentials or Atlassian API tokens are stored by this application.

The header loads Confluence spaces first. Selecting a space reloads risks, Jira field metadata, and Initiative options for that scope. The current adapter uses the Confluence space key as the Jira project key. If a site uses different keys, define the space-to-Jira-project relationship in `RiskRepository.listRisks`, `listInitiatives`, and `getJiraFields` before production deployment.

## Monthly Meeting History

Each Confluence page is treated as one meeting minute. New risks are tagged in Jira with `conf-page-{ConfluencePageId}` and retain Jira's `created` timestamp. The **New this meeting** tab shows only tickets created from that page, including creation time, ID, summary, assignee, and status.

A newly created page starts with an empty meeting history. Reopening an older page reconstructs its history from the matching Jira page label, so the record does not depend on browser `localStorage`. For localhost testing, use `http://localhost:5173/?pageId=meeting-2026-11` to simulate a persistent meeting page.

## Project Impact Filter

The Project Impact filter lists top-level Jira `Initiative` issues in the selected space. A risk belongs to an Initiative when it has an `impacts` / `is impacted by` link to that Initiative or any descendant. The adapter follows Jira parent relationships for up to 12 levels, so links to a child or grandchild still appear under the ancestor Initiative.

## Validate

```bash
npm run test
npm run lint
npm run build
```

## Jira Attributes

Open the settings icon in the page header to map each application field to a Jira system or custom field ID:

| Application field | Current Jira ID placeholder |
| --- | --- |
| Summary | `summary` |
| Description | `description` |
| Assignee | `assignee` |
| Root cause | `customfield_rootcause` |
| Effect | `customfield_effect` |
| Risk category | `customfield_riskcategory` |
| Treatment | `customfield_treatment` |
| Treatment plan | `customfield_treatmentplan` |
| Init Impact | `customfield_preimpact` |
| Init Probability | `customfield_preprobability` |
| Residual Impact | `customfield_residualimpact` |
| Residual Probability | `customfield_residualprobability` |
| Residual justification | `customfield_residualjustification` |

The left side of Jira Mapping is the application value and the right side is the Jira field. Calculation-only values include short guidance below their names. The placeholders are suitable for the local trial. In Jira, choose the real custom field IDs from the mapping screen.

The app reads `allowedValues` from Jira create metadata for the selected space/project. New Risk dropdowns for Risk Category, Treatment, Init Impact, and Init Probability then use those Jira values. Project Impact is not entered or stored as a manual field during creation; it is derived later from `impacts / is impacted by` links and Jira Initiative ancestry. Option fields are encoded as `{ "value": "..." }`, users as `{ "accountId": "..." }`, and numeric Jira fields as numbers.

Risk tables are always ordered by effective exposure from highest to lowest. A complete residual pair replaces the initial pair; otherwise the initial pair remains active.

## Forge / Confluence Trial

1. Run `npm run build`.
2. Copy `dist/` into the existing Forge resource directory, or point the Forge manifest resource at this project's `dist` directory.
3. The Forge manifest must include `read:confluence-space.summary` for the space dropdown, plus `read:jira-work` and `write:jira-work` for Jira issue reads and creation.
4. Deploy with `forge deploy` from the Forge app directory, then install or upgrade with `forge install --upgrade` where appropriate.
5. Inside Confluence, `window.__bridge` activates `ForgeRiskRepository`; outside Forge it uses `MockRiskRepository`.
6. Repeat the field mapping process against the real Jira field list and verify the Risk issue type in each project.

The integration boundary is in `src/services/riskRepository.ts`. `ForgeRiskRepository` is the replacement point for product API requests. The UI does not contain Jira URLs, tokens, or issue-specific fetch logic.

## Production Follow-up

Before enabling writes in a shared site, add these project-specific controls:

- Resolve assignee display names to Jira account IDs rather than passing display text.
- Confirm every selected Jira field's issue type, required status, and allowed values against each production project.
- Extend option serialization to use Jira option IDs if the target Jira configuration requires IDs rather than values.
- Add pagination if a project exposes more than 100 issue-create fields.
- Configure approved Confluence/Jira hosts in Forge `external.permissions` only if external links are required.
