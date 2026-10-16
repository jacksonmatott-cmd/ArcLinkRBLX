# Changelog

## 2.0.0 — 2026-10-16

- Added local workspace Accounts roster and Roblox Link profile association flow.
- Added Rules, Custom Commands, Leave of Absence, Roles, Departments, Warps, and Group Links modules.
- Added record search, editing, input validation, duplicate guards for account usernames and command triggers, date validation, and delete confirmations.
- Added full JSON workspace backup export and validated backup import.
- Added `/` keyboard shortcut to focus global player lookup.
- Updated responsive navigation, local storage schema, app docs, and Cloudflare deployment instructions.
- Added automated feature tests; all current feature and Worker tests pass.

### Boundaries

All new community-management records remain in browser-local storage. Roblox Link records are unverified public-profile associations. Custom commands and warps are reference definitions; they do not execute in live Roblox experiences.
