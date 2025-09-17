# Storytime Dev Notes


## First-time setup
1. Replace EXPECTED_ORG / EXPECTED_REPO in `scripts/remote-guard.sh`.
2. `npm i` then `npm i -D husky lint-staged && npm run prepare`.
3. `chmod +x scripts/remote-guard.sh`.
4. Confirm the remote guard works: try `git push`.


## Cursor usage
- Open this repo in a **separate Cursor window**.
- New Chat → rules auto-load from `.cursor/rules/PROJECT.mdc`.
- Pin `src/app`, `src/components`, `src/lib` via @Folders.
- If you see Palette references, stop and warn (per rules).
