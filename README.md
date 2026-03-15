# WipeMe

WipeMe scans your inbox, finds services you signed up for, and sends deletion requests. Everything runs in the browser. Nothing gets stored on the server.

## What it does

- Connects to your email account via IMAP (app password)
- Scans for signup confirmations and newsletter subscriptions
- Matches results against 4,800+ companies
- Generates legally compliant deletion and access requests for 10 legal frameworks
- Sends via SMTP directly from your email address
- Tracks deadlines and detects company responses automatically

## Legal frameworks

| Law | Region | Deadline |
|-----|--------|----------|
| GDPR | EU/EEA | 30 days |
| UK GDPR | United Kingdom | 30 days |
| CCPA | USA (California) | 45 days |
| LGPD | Brazil | 15 days |
| DPDPA | India | 90 days |
| PIPA | South Korea | 14 days |
| PDPA | Thailand | 90 days |
| APPI | Japan | 21 days |
| Law 25 | Canada (Quebec) | 30 days |

The matching law is picked automatically based on where the company is located.

## Features

**Scanning**
- Folder selection (not just INBOX)
- Newsletter detection alongside account registrations
- Password manager CSV import (Chrome, Firefox, 1Password, Bitwarden)
- Manual search across the full company database
- Data broker recommendations
- Scan history with diff ("12 new services since last scan")

**Requests**
- Deletion requests (Art. 17 GDPR etc.)
- Access requests (Art. 15 GDPR etc.)
- Batch sending: all selected services at once
- Strengthened templates (backup deletion, justification requirement, AI training data)
- Difficulty guidance for hard-to-delete services

**Tracking**
- 6 status options (pending, expired, completed, no record, partial, rejected)
- Follow-up via SMTP directly from the app
- Automatic response detection via IMAP
- Browser notifications for approaching deadlines
- Export: JSON, CSV, print, calendar (.ics)

## Privacy

No server storage. No database. No analytics. No cookies.

Your credentials live in sessionStorage and get wiped when you close the tab. Found services and sent requests live in localStorage in your browser. The server is a pass-through: connect to your mail provider, read emails, send results back, forget.

## Stack

Astro 6 (SSR, Node adapter) + React 19 + TypeScript + Tailwind CSS 4

## Setup

```bash
bun install
bun run dev          # localhost:4321
bun run build        # production build
bun run preview      # test the build
```

Update the company database:
```bash
bunx tsx scripts/import-companies.ts
```

## License

MIT
