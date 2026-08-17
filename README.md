# Freelance IT Ops Console

Offline-first workflow prototype for turning incoming freelance work into tracked tasks, recorded time, and invoice-ready records.

The project explores one continuous operational flow:

```text
Inbox → Today → Active → Completed → Invoiced
```

## Problem

Freelance technical work often arrives through several channels while time tracking, task state, and invoicing live in separate tools. The result is missed follow-up, unbilled time, and manual reconciliation at the end of the month.

Freelance IT Ops Console tests a local, single-operator workspace that keeps those transitions visible.

## Current capability

- inbox for imported or manually created work;
- Today, Active, Completed, and Invoiced stages;
- active time tracking;
- local settings for rates and invoice identity;
- PDF invoice generation;
- mock Gmail and Jira synchronisation flows;
- SQLite persistence;
- React and Vite frontend;
- Express backend.

## Status and security boundary

**Status:** local prototype.

Gmail and Jira synchronisation is simulated. The application is not a production OAuth integration and should not be given real provider credentials.

SQLite keeps records on the local machine, but local storage alone does not make secrets or client data secure. The current prototype has no user authentication, encryption-at-rest policy, multi-user isolation, audit log, backup workflow, or hardened deployment configuration.

## Architecture

```text
frontend/   React + Vite interface
backend/    Express API, SQLite data, workflow routes, PDF generation
```

The frontend expects the backend on port `3001`. The Vite development server normally runs on port `5173`.

## Run locally

### Backend

```bash
cd backend
npm install
node server.js
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

## Validation flow

1. configure a test hourly rate and invoice identity;
2. add or simulate an inbox item;
3. move it through Today and Active;
4. record time and mark it complete;
5. generate a test invoice;
6. verify amounts, file location, state transitions, and recovery after restart.

Use demonstration data only.

## Production roadmap

1. define the single highest-value user segment and validate weekly use;
2. replace mock integrations with provider OAuth and least-privilege scopes;
3. separate secrets from ordinary settings and encrypt sensitive values;
4. add authentication, ownership rules, audit events, and backup/restore;
5. validate invoice numbering and legal fields for the target jurisdiction;
6. add automated tests and CI for both application layers;
7. package local deployment or move to a documented managed architecture.

## Security

Do not commit databases, generated invoices, API keys, or client records. See [`SECURITY.md`](./SECURITY.md) for safe reporting guidance.

## Licence

No open-source licence is currently declared. The source is public for evaluation only.
