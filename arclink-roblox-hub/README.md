# ArcLink — Roblox Community Hub

ArcLink is a polished, dark-themed Roblox community dashboard inspired by the general product category of group-management platforms. It uses an original name, layout, and styling; it is not affiliated with BloxCord, Roblox Corporation, or any other platform.

It is designed to be uploaded to GitHub and deployed on Cloudflare as either a **Worker with Static Assets** (recommended) or **Cloudflare Pages**.

## Features included

- Responsive dashboard for desktop, tablet, and mobile.
- Roblox **public player lookup** by username or user ID.
  - Display name, username, avatar, profile description, account creation date, ID, verified badge, and friend count when the public endpoint returns it.
  - Local recent-lookup history.
- Roblox **public group explorer** by group ID.
  - Group name, icon, owner when available, member count, public entry status, and public roles.
  - Save and remove group bookmarks.
- Internal staff audit log for notes, promotions, warnings, staff actions, and moderation requests.
- Community session planner for trainings, shifts, meetings, tryouts, and events.
- Workspace label settings and downloadable JSON backup.
- Cloudflare Worker API proxy with input checks, timeouts, caching headers, and useful error messages.
- No Discord integration and no external JavaScript framework dependency.

## Important boundaries

**The public Roblox lookup features do not need a Roblox API key.** They read public endpoints and may be limited by Roblox availability or rate limiting.

The audit log, saved groups, and session planner are stored in the current browser's `localStorage`. They are not shared between devices or staff and are not a tamper-proof database. They do not actually issue bans, promotions, rank changes, messages, or other Roblox account actions.

Authenticated actions, live in-game activity, and shared multi-user storage would need a proper backend, authenticated permissions, database storage, and the appropriate Roblox Open Cloud or in-game integration. Never put Roblox cookies, passwords, or API secrets in `public/app.js` or any other client-side file.

---

# Option A — Deploy as a Cloudflare Worker (recommended)

This path serves the website and API from a single Worker URL and is configured by `wrangler.jsonc`.

### 1. Install prerequisites

1. Install a current Node.js LTS version from [nodejs.org](https://nodejs.org/).
2. Unzip this project and open a terminal in the `arclink-roblox-hub` project folder.

### 2. Run it locally

```bash
npm install
npx wrangler login
npm run dev
```

Wrangler prints a local URL (usually `http://localhost:8787`). Open that URL in your browser. **Do not open `public/index.html` directly**: the live lookups use the local Worker API routes.

### 3. Deploy it

```bash
npm run deploy
```

Follow the Wrangler prompts if this is the first deployment. The Worker and all files in `public/` will deploy together. Open the `workers.dev` URL printed by Wrangler.

---

# Option B — Put it in GitHub and deploy with Cloudflare Pages

The project includes `functions/` adapters for Cloudflare Pages, so the `/api/*` routes keep working on Pages too.

### 1. Create the GitHub repository

1. Unzip the project.
2. On GitHub, create a **new empty repository** (for example, `ArcLink`). Do not initialize it with a README, because this project already has one.
3. Open a terminal in the unzipped project folder and run:

```bash
git init
git add .
git commit -m "Initial ArcLink Roblox Community Hub"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the example remote URL with your repository's URL. You can also upload the extracted files through GitHub's web interface, but keep the folder structure intact.

### 2. Connect GitHub to Cloudflare Pages

1. In the Cloudflare dashboard, open **Workers & Pages** and choose to create a Pages application connected to Git.
2. Select your GitHub repository and production branch (`main`).
3. Choose **None** as the framework preset if requested.
4. Set the **Build command** to blank (there is no build step) and the **Build output directory** to `public`.
5. Deploy. Cloudflare Pages should discover the root-level `functions/` directory for the API routes.

After deployment, open the assigned `pages.dev` URL and try Player lookup or Group explorer.

---

# Option C — Automatic Worker deployment from GitHub

The included `.github/workflows/deploy.yml` can deploy a Worker on pushes to `main` once you enable it.

1. In Cloudflare, create an API token that has permission to edit Workers for your account.
2. In GitHub, open **Settings → Secrets and variables → Actions** for the repository.
3. Add repository secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. Under the repository Actions variables, add `DEPLOY_TO_WORKERS` with the value `true`.
5. Push to `main` or run the workflow from the Actions tab.

The workflow is skipped unless `DEPLOY_TO_WORKERS=true`, so a Pages-only repository will not attempt a Worker deployment. If you deploy using Cloudflare Pages Git integration instead, leave that variable unset.

---

## Project structure

```text
arclink-roblox-hub/
├── public/
│   ├── index.html       # Main app shell
│   ├── styles.css       # Responsive dark UI
│   ├── app.js           # Frontend interactions and local workspace data
│   └── favicon.svg
├── src/
│   └── index.js         # Cloudflare Worker router and Roblox API proxy
├── tests/
│   └── worker.test.js   # Automated tests with mocked Roblox responses
├── functions/           # Cloudflare Pages API route adapters
│   └── api/
│       ├── health.js
│       └── roblox/
│           ├── user.js
│           └── group.js
├── wrangler.jsonc       # Cloudflare Worker/static assets config
├── package.json
└── README.md
```

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Worker health check |
| `GET` | `/api/roblox/user?username=Builderman` | Lookup a player by username |
| `GET` | `/api/roblox/user?id=1` | Lookup a player by user ID |
| `GET` | `/api/roblox/group?id=1200769` | Lookup a group and public roles |

## Local checks

With Node.js installed, run these before pushing changes:

```bash
npm run check
npm test
```

The included tests use mocked Roblox responses, so they validate routing and response handling without depending on live Roblox availability.

## Troubleshooting

- **API proxy unavailable:** make sure you opened the Wrangler local URL or the deployed Cloudflare URL rather than the HTML file directly.
- **Roblox lookup returns 429:** Roblox is rate-limiting requests; wait briefly before retrying.
- **Group not found:** check the numeric ID in the Roblox community URL.
- **Cloudflare Pages API route returns 404:** verify the `functions/` folder is in the repository root, not inside `public/`, and redeploy.
- **Local data disappeared:** browser-local storage can be cleared by browser settings. Download a JSON backup regularly from Settings.

## License

MIT. See `LICENSE`.
