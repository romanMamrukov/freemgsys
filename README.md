# Freelance IT Ops Console

A streamlined, full-stack workflow management tool designed for freelancers to parse tasks from Gmail and Jira seamlessly into a central inbox. It supports active task time-tracking, mock API syncing for offline debugging, and automated pipeline processes for generating PDF invoices.

Designed entirely offline-first, your API keys and configuration preferences remain stored locally in your SQLite Database.

## Features Let Down
* **Inbox Funneling**: Review tasks imported directly from Gmail requests or Jira stories.
* **Unified Kanban-style Flow**: Inbox -> Today -> Active -> Completed -> Invoiced.
* **Active Progress Tracker**: Click 'Play' on a Today task to track exact hours automatically. 
* **Dynamic PDF Invoices**: Bulk-select completed tasks to generate a customized PDF Invoice billed exactly to your client. 
* **Secure Local Config**: Manage keys, rates, and aliases right from the dashboard GUI, bypassing hardcoded vulnerability risks.

## Project Structure
* `backend/` - The ExpressJS + NodeJS server operating on port 3001. Handles all logic, the SQLite database (`app.db`), mock API injections, and dynamic PDF production.
* `frontend/` - The React + Vite client interface utilizing custom CSS, Lucide icons, and modern responsive routing.

## Setup Instructions

### 1. Boot up the Backend
```bash
cd backend
npm install
node server.js
# The server will run on http://localhost:3001
# The local SQLite DB app.db is initialized immediately.
```
> **Note**: PDF invoices produced are routed directly to `/invoices_output/` in the root folder structure.

### 2. Boot up the Frontend 
Open a new secondary terminal window:
```bash
cd frontend
npm install
npm run dev
# The dev server usually initiates on http://localhost:5173
```

## How to Work With the App
1. Go to the **Settings** menu via the frontend sidebar. Customize your `Hour Rate` and the `From / To` company alias parameters. 
2. Test the API logic offline by toggling the **Sync Gmail** and **Sync Jira** buttons in the `Inbox`. This will trigger realistic mock tasks.
3. Plan the tasks to track them actively. Once checked off as `Completed`, hit **Generate Invoice** to see a dynamic PDF produced to root using your exact settings!
