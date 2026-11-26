# Confluence Risk Matrix

A Confluence Custom UI app for monthly risk reviews linked to Jira Cloud.

## Structure

- `manifest.yml`: Atlassian Forge modules, scopes, and resource configuration.
- `web/`: React, TypeScript, and Vite source.
- `web/dist/`: generated Custom UI deployment bundle (not committed).

## Local Development

```bash
cd web
npm ci
npm run dev
```

## Production Validation

```bash
cd web
npm run test
npm run lint
npm run build
cd ..
forge lint
```

## Forge Deployment

Use the organization's approved Atlassian Forge login and deployment process. Authenticate through `forge login`, then run:

```bash
forge lint
forge deploy
forge install --upgrade --site <approved-site> --product confluence
```

Deployment requires an approved Confluence/Jira site and the configured Forge app ID in `manifest.yml`. Do not bypass organization security controls, proxy policy, scopes, or approval requirements.

## Application Behavior

- Spaces and Jira field metadata are selected at runtime.
- Jira field mappings are stored per space.
- New risk dropdown values come from Jira create metadata.
- Project Impact is derived from Initiative ancestry through `impacts / is impacted by` links.
- `Show treatment tickets` expands `treats / is treated by` links.
- Effective exposure uses a complete residual pair; otherwise it uses initial impact and probability.
- Monthly meeting history is isolated with the Jira label `conf-page-{confluencePageId}`.

See `web/README.md` for detailed local and integration behavior.
