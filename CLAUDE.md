# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **ThreadsManager** - an Electron desktop application for managing and automating Threads (Instagram/Meta) accounts at scale. The application features account management, proxy support, automated posting, account farming, and data scraping capabilities.

**Tech Stack:**
- Runtime: Electron 39
- Frontend: React 19 + TypeScript 5
- Styling: Tailwind CSS 4
- Database: SQLite with Prisma ORM 5
- Automation: Playwright (headless browser automation)
- Build: Electron-Vite 5 + Vite 7

## Development Commands

### Primary Application (threads-app/)

```bash
cd threads-app

# Install dependencies
npm install

# Database setup (required after schema changes)
npx prisma generate
npx prisma db push

# Development mode (hot reload for renderer)
npm run dev

# Preview mode (production-like build)
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Building for distribution
npm run build          # Full build
npm run build:win      # Windows
npm run build:mac      # macOS
npm run build:linux    # Linux
```

### Database Schema Changes

After modifying `prisma/schema.prisma`, always run:
```bash
npx prisma generate
npx prisma db push
```

## Architecture

### Electron Process Structure

```
threads-app/src/
├── main/           # Node.js main process
├── preload/        # Context bridge API
└── renderer/       # React frontend
```

### IPC Communication Pattern

**Main Process** (`src/main/index.ts`):
- Defines `ipcMain.handle()` handlers for all database operations and automation tasks
- Uses Prisma directly for database access
- Triggers automation modules (autoPost, autoFarm, checkLive, autoScraper)

**Preload** (`src/preload/index.ts`):
- Bridges main process APIs to renderer via `contextBridge.exposeInMainWorld()`
- Exposes `window.api` object with all callable functions

**Renderer** (`src/renderer/src/`):
- Calls `window.api.*()` functions to interact with main process
- Uses React Router (HashRouter) for navigation

### Automation Engine

Located in `src/main/automation/`:
- **engine.ts**: Core browser automation using Playwright's `chromium.launchPersistentContext()`
  - Handles proxy configuration
  - Manages browser profiles in `userData/automation-profile`
  - Restores cookies from database for persistent sessions
- **autoPost.ts**: Campaign-based bulk posting automation
- **autoFarm.ts**: Account farming (likes, follows, scrolling simulation)
- **checkLive.ts**: Validates account status by attempting login
- **autoScraper.ts**: Scrapes follower/following counts and post metrics

### Database Schema (Prisma)

Key models:
- **Account**: Threads accounts with credentials, cookies, proxy assignment, stats
- **Proxy**: HTTP/HTTPS/SOCKS5 proxies with authentication
- **Group**: Account grouping for organization
- **Post**: Content templates (text + media URLs as JSON)
- **Campaign**: Bulk posting campaigns with account assignment and delay configuration
- **FarmConfig**: Farming behavior configuration (like/follow counts, scroll timing)
- **FarmCampaign**: Farming campaigns with config references

### File Structure Notes

- **Database location**: `threads-app/database.db` (dev), `userData/database.db` (production)
- **Media uploads**: Stored in `userData/media/` and referenced as `file://` URLs
- **Browser profiles**: Playwright profiles stored in `userData/automation-profile/`

## Key Implementation Details

### Browser Automation Anti-Detection

The automation engine (`engine.ts`) includes several anti-detection measures:
- Custom User-Agent string
- `--disable-blink-features=AutomationControlled` flag
- Cookie persistence via database storage
- Proxy support per account
- Random delays between actions

### Campaign Execution Flow

1. Campaign created with post content, target accounts, and delay ranges
2. `startCampaign()` triggered via IPC
3. For each account:
   - Apply random delay (delayMin to delayMax)
   - Launch Playwright context with proxy and saved cookies
   - Navigate to threads.net and verify login
   - Auto-login if needed (username/password from database)
   - Create post with content and media
   - Save updated cookies to database
   - Mark CampaignAccount as SUCCESS/FAILED
4. Campaign marked COMPLETED when all accounts processed

### Import/Export Format

Accounts can be imported from `.txt` or `.csv` files with format:
```
username|password
username:password
```

## Development Notes

- **Hot reload**: Works for renderer process changes; main process changes require restart
- **IPC debugging**: Add console.log in main process handlers, check renderer console for responses
- **Prisma client**: Single instance exported from `src/main/db.ts`, imported throughout main process
- **Automation tasks**: Run asynchronously (fire-and-forget) via IPC, results logged to console
- **Proxy format**: `{ protocol, host, port, username?, password? }` stored in Proxy model
- **Cookie storage**: JSON string in Account.cookies field
