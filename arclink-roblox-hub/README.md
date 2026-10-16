# ArcLink — Roblox Community Suite (v2.0.0)

ArcLink is a responsive, dark-themed Roblox community dashboard inspired by the general category of group-management platforms. It uses original naming, layout, and styling; it is not affiliated with BloxCord, Roblox Corporation, or any other platform.

This version adds dedicated modules for **Accounts, Roblox Link, Rules, Custom Commands, Leave of Absence, Roles, Departments, Warps, Group Links**, and quality-of-life improvements. It is packaged for GitHub and Cloudflare Pages or Workers.

## What's new in v2

- **Accounts:** create, edit, search, and remove workspace roster entries with role, department, status, and notes.
- **Roblox Link:** look up a public Roblox profile by username or user ID and associate it with a roster entry. Associations are explicitly marked **unverified**; no Roblox password or cookie is collected.
- **Rules:** manage rule titles, categories, severity levels, and active/draft/archive states.
- **Custom Commands:** maintain command triggers, permission labels, descriptions, and response templates. These are definitions only; they are not dispatched into live Roblox experiences by this website.
- **Leave of Absence:** track member names, Roblox IDs, start/return dates, reasons, and approval status.
- **Roles:** define staff roles, color, order, responsibilities, and permission notes.
- **Departments:** document department leads, status, and responsibilities.
- **Warps:** store Roblox place IDs and optional X/Y/Z coordinates and instructions. This is a reference directory; live teleportation requires an in-game script.
- **Group Links:** save official group, experience, recruitment, handbook, and staff-resource URLs.
- **Quality of life:** edit existing records, search each directory, delete confirmation prompts, global `/` shortcut for player lookup, complete JSON export/import backup, storage counters, validation, and responsive layouts.
- Preserves the original public Roblox player lookup, group explorer, audit log, session planner, and Cloudflare API proxy.

## Important boundaries

**This is a browser-local workspace prototype, not a hosted multi-user account system.** Data is stored in `localStorage` in the current browser profile. Other staff members and devices will not automatically share it. The Accounts module is a member roster; it does not create website sign-in credentials or enforce authentication/permissions.

Roblox Link currently attaches public profile details to a local roster entry as an **unverified claim**. It does not prove Roblox account ownership. Proper verification would require a Roblox OAuth flow or a server-side challenge and corresponding backend support.

Rules, role definitions, custom command templates, warps, and group links are saved and editable in the dashboard. They do not alter Roblox group ranks, execute commands inside a Roblox experience, or teleport game players. Those actions require separately implemented in-game/server integrations with appropriate authorization.

Never put Roblox passwords, `.ROBLOSECURITY` cookies, or private API credentials in `public/app.js` or other frontend files.

## Project structure

```text
arclink-roblox-hub/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── favicon.svg
├── src/index.js                 # Worker router and public Roblox API proxy
├── functions/                   # Cloudflare Pages API routes
│   └── api/
│       ├── health.js
│       └── roblox/
│           ├── user.js
│           └── group.js
├── tests/worker.test.js
├── .github/workflows/deploy.yml
├── wrangler.jsonc
├── package.json
└── README.md
```

## Option A — Deploy as a Cloudflare Worker (single app URL)

1. Install a current Node.js LTS version from [nodejs.org](https://nodejs.org/).
2. Extract the ZIP and open a terminal **inside the `arclink-roblox-hub` project folder**.
3. Run:

```bash
npm install
npx wrangler login
npm run dev
```

4. Open the local URL printed by Wrangler (usually `http://localhost:8787`). Do not open `public/index.html` directly; live Roblox lookups use the Worker API routes.
5. Deploy with:

```bash
npm run deploy
```

Wrangler deploys the Worker and the website assets together, using `wrangler.jsonc`.

## Option B — GitHub + Cloudflare Pages

### Upload to GitHub

Upload the **contents** of the extracted project folder, keeping the internal structure intact. The project folders `public`, `functions`, `src`, and `tests`, along with `package.json` and `wrangler.jsonc`, should be next to one another at the same project root.

If you upload the entire extracted `arclink-roblox-hub` folder into the repository, so the repository contains a top-level `arclink-roblox-hub` folder, configure Cloudflare Pages with:

- **Root directory:** `arclink-roblox-hub`
- **Framework preset:** None
- **Build command:** blank
- **Build output directory:** `public`
- **Production branch:** `main`

If you upload the project's contents directly to the repository root instead, leave **Root directory** blank and use the same `public` output directory.

### Connect Cloudflare Pages

1. Open the Cloudflare dashboard → **Workers & Pages** → create a Pages application connected to Git.
2. Select your GitHub repository and production branch.
3. Select **None** for the framework preset, leave build command blank, and set output directory to `public`.
4. Make sure the root directory points at the folder containing both `public` and `functions`.
5. Deploy, then open the assigned `pages.dev` URL and test `/api/health`, Player Lookup, and Group Explorer.

The Pages `functions/` folder must be at the selected project root and **not** inside `public/`.

## Option C — Automatic Worker deployment from GitHub

The included `.github/workflows/deploy.yml` can deploy a Worker on pushes to `main` when enabled:

1. Create a Cloudflare API token allowed to edit Workers.
2. Add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` under GitHub **Settings → Secrets and variables → Actions**.
3. Add repository Actions variable `DEPLOY_TO_WORKERS` with value `true`.
4. Push to `main` or manually run the workflow from GitHub Actions.

If you only use Cloudflare Pages Git integration, leave `DEPLOY_TO_WORKERS` unset.

## Public API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Worker health check |
| `GET` | `/api/roblox/user?username=Builderman` | Public Roblox profile lookup by username |
| `GET` | `/api/roblox/user?id=1` | Public Roblox profile lookup by numeric user ID |
| `GET` | `/api/roblox/group?id=1200769` | Public group metadata and roles |

The current public lookup features do not require a Roblox API key. Roblox may rate-limit requests or change its public response fields.

## Quality-of-life shortcuts

- Press `/` when not typing into another field to focus the global Roblox player lookup.
- Use each module's search box to filter local records.
- Use **Edit** to update a saved record; destructive operations ask for confirmation.
- **Settings → Export JSON** downloads a full backup. **Import JSON** restores an ArcLink backup and replaces current local records after confirmation.
- Backups include workspace settings, player lookup history, saved groups, audit entries, sessions, accounts, rules, custom commands, LOAs, roles, departments, warps, group links, and Roblox profile associations.

## Checks

With Node.js installed, run:

```bash
npm run check
npm test
```

The Worker tests use mocked Roblox responses, so tests do not depend on live Roblox availability. The browser modules can be exercised after serving the project through Wrangler or the deployed Cloudflare URL.

## Troubleshooting

- **`Output directory "public" not found`:** set Cloudflare Pages Root directory to the path containing `public`; if the repository holds a nested `arclink-roblox-hub` folder, set it to that.
- **API proxy unavailable:** open the Wrangler or deployed Cloudflare URL, not the HTML file directly.
- **Roblox lookup returns 429:** Roblox is rate-limiting requests; wait a while before trying again.
- **Pages API route returns 404:** verify `functions/` is at the Pages project root alongside `public/`, not inside it.
- **Records are not shared across devices:** expected in this local-storage version. Shared records require backend storage and authenticated access.
- **Roblox profile link marked Unverified:** that is expected; a public lookup alone cannot prove account ownership.
- **Lost local data:** browser storage can be cleared by browser settings. Download and store a JSON backup regularly.

## License

MIT. See `LICENSE`.
