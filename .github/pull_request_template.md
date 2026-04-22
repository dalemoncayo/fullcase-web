## Ticket Link(s)
- [FCW-XXXX](https://fullspeed.atlassian.net/browse/FCW-XXXX)

**Included Tickets:**
<!-- Multiple tickets only: delete if not applicable -->
- [FCW-XXXX](https://fullspeed.atlassian.net/browse/FCW-XXXX) — (ticket title)
- [FCW-XXXX](https://fullspeed.atlassian.net/browse/FCW-XXXX) — (ticket title)

---

## Description
<!-- What and why — keep it to 1–3 sentences -->

#### Issue
<!-- Bug fix only: delete if not applicable -->

#### Root Cause Analysis
<!-- Bug fix only: delete if not applicable -->
- 

#### Solutions Made
<!-- Bug fix only: delete if not applicable -->
- 

---

## Changes Made
- 

---

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Tech Debt / Refactor
- [ ] Documentation update
- [ ] Dependency bump
- [ ] Infra / CI change

---

## How Has This Been Tested?
<!-- Test account if needed: `email@example.com` / `password` -->

1. 
2. 
3. 

**Expected:** 

### Test Configuration
| | Browser 1 | Browser 2 |
|---|---|---|
| Browser | | |
| OS | | |
| Environment | Dev / Staging / Prod | |

---

## Checklist
- [ ] `npm run lint:fix` + `npm run lint:check` pass locally
- [ ] `npm run build` passes locally (runs `tsc --noEmit`)
- [ ] No `console.log` left behind; no `any` introduced
- [ ] Firestore writes use `serverTimestamp()` / `Timestamp`; reads/writes go through a service, not from components
- [ ] New Storage uploads match the documented path prefix and size/MIME limits
- [ ] shadcn primitives used for UI (no raw `<input>` / `<button>` / `<dialog>`)
- [ ] `next/image` used for all images; new remote hosts added to `next.config.ts`
- [ ] Self-review completed
- [ ] Tests added (if the change introduces new branching logic)

---

## Screenshots / Screen Recordings
<!-- Attach before/after if visual change. N/A if not applicable -->
