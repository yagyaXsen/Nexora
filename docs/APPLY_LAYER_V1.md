# Apply Layer v1 — Implementation Plan

> **Goal:** Turn Nexora from a directory into a transactional platform.
> Every opportunity gets one "Apply via Nexora" button that does
> something credible — email submission, native form, or staged external —
> picked automatically.
>
> Owner: Founder · Target: 30 days · Status: Locked-in, building

---

## 0 · Founder calls (locked, no re-litigation)

| Decision | Pick |
|---|---|
| Submission tracks at launch | Email (full) + Staged External (full) + Native (skeleton, 2 hand-onboarded providers) |
| File storage | Cloudflare R2 (`nexora-assets` bucket) |
| Email provider v1 | Resend, behind a `Mailer` interface (swap-ready) |
| Verified sending domain | `apply@nexora.app` (SPF/DKIM/DMARC via Resend) |
| Provider portal | **Deferred** to Phase 4 |
| Per-submission consent | Required UI checkbox — never silent send |

---

## 1 · The user-facing promise

To the user, there is one button and one outcome:

> Click **"Apply via Nexora"** → application is submitted (or staged) → tracker card auto-moves to **Applied**.

Behind the button, Nexora silently picks a track based on `opportunity.apply_method`:

- `email_submission` → packet emailed via Resend (Case 1)
- `native` → native form rendered inside Nexora (Case 2)
- `external_form` → staged-redirect: drafts staged, source opens, return-detection auto-marks Applied (Case 3)

The user never sees the labels. One button. One bucket. One promise.

---

## 2 · Data model changes

### 2.1 Opportunity — new columns

```python
apply_method     = Enum('email_submission','native','external_form') default 'external_form'
apply_email      = String?         # used when apply_method='email_submission'
apply_form_schema = JSONB?         # used when apply_method='native'
# apply_url already exists as `url`
```

Migration runs on startup like `_ensure_opportunity_slugs()` — idempotent ALTER TABLE.

### 2.2 New table — `user_assets`

```python
id              = UUID, pk
user_id         = FK users
kind            = Enum('cv','transcript','portfolio','reference_letter','other')
storage_key     = String           # R2 object key
original_filename = String
mime_type       = String
size_bytes      = Integer
uploaded_at     = DateTime
```

CV/transcript/portfolio uploaded once, reused across every submission.

### 2.3 New table — `application_submissions`

```python
id                  = UUID, pk
user_id             = FK users
opportunity_id      = FK opportunities
application_id      = FK applications     # links to the tracker card
submission_method   = Enum('email','native','external')
submitted_at        = DateTime
payload_json        = JSONB                # answers, drafted text
attachments         = JSONB                # [{asset_id, kind, storage_key}]
delivery_status     = Enum('queued','sent','delivered','bounced','viewed','staged_external')
provider_reference  = String?              # confirmation # from provider
error_message       = String?
```

One row per submission attempt. Tracker `applications` row stays as the user-facing pipeline card; `application_submissions` is the audit trail.

---

## 3 · `apply_method` classifier (the heuristic)

Run on every opportunity at ingest + backfill all 50 dev rows on first boot. Pure rule-based v1:

```python
def classify_apply_method(opp) -> tuple[str, str | None]:
    text = f"{opp.description} {opp.url} {opp.eligibility or ''}".lower()
    # 1. explicit mailto: in URL or description
    if m := re.search(r'mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})', text):
        return 'email_submission', m.group(1)
    # 2. "email your application to <addr>" / "send to <addr>"
    if m := re.search(r'(?:email|send|submit)[^@]{0,40}([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})', text):
        return 'email_submission', m.group(1)
    # 3. otherwise — external form (we'll stage + redirect)
    return 'external_form', None
```

Native is set manually by the founder/ops for hand-onboarded providers (Phase 4 automates this via provider portal).

---

## 4 · API surface (new endpoints)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/assets` | multipart upload → R2 → returns `asset_id` | JWT |
| GET | `/api/assets/` | list current user's assets | JWT |
| DELETE | `/api/assets/{id}` | delete an asset (only owner) | JWT |
| POST | `/api/applications/{app_id}/submit` | body: `{method, answers, asset_ids, consent: true}` → routes to email/native/external pathway | JWT |
| GET | `/api/applications/{app_id}/submission` | returns the latest `application_submission` row | JWT |
| POST | `/api/webhooks/resend` | delivery/bounce events from Resend → updates `delivery_status` | webhook signature |

### Submission state machine

```
POST /submit  →  application_submissions row created (queued)
                 ├── method=email     → Mailer.send() → sent → (webhook) → delivered|bounced
                 ├── method=native    → row stored, provider notified → sent (immediate)
                 └── method=external  → row stored as staged_external, applications.status='Applied'
```

For email: the application card flips to `Applied` immediately at `sent`. Delivery status is a secondary badge.

---

## 5 · Frontend additions

### 5.1 New pages
- `/app/assets` — **Asset Vault**: drag-drop upload, list with mime icons + size, delete.

### 5.2 New components
- `AssetUploader` — drag-drop, progress bar, multi-file.
- `ApplyDrawer` — opened from "Apply via Nexora" CTA; auto-picks one of three inner views by `opp.apply_method`:
  - `EmailApplyForm` — preview AI cover letter (Gemini, already built), pick attachments from vault, **consent checkbox**, Send.
  - `NativeApplyForm` — JSON-schema → React form (minimal hand-roll, ~50 LOC).
  - `ExternalApplyStaging` — left panel with copy-buttons for each drafted answer + profile field + asset download link, big "Open application →" button. On window blur+return (or 60s elapsed since open), auto-mark Applied.
- `SubmissionStatusBadge` — small chip on tracker cards: `Queued · Sent · Delivered · Bounced · Staged`.

### 5.3 Page edits
- `OpportunityDetail.jsx` — primary CTA changes from **Save** to **Apply via Nexora**; Save becomes secondary "Save for later."
- `Tracker.jsx` — render `SubmissionStatusBadge` on each card.
- `Profile.jsx` — link to `/app/assets` ("Manage your CV & attachments").

---

## 6 · Infrastructure / ops setup (founder action items)

These are blocking — I cannot land the email pathway until they exist:

1. **DNS for Resend** — add SPF, DKIM, DMARC records for `nexora.app` per Resend dashboard. ~30 min, founder action.
2. **Resend API key** — production key, set as `RESEND_API_KEY` in backend env.
3. **Cloudflare R2 bucket** — create `nexora-assets`, generate scoped API token, set `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` in backend env.
4. **Privacy Policy update** — add explicit paragraph: *"When you click Apply via Nexora, you authorise us to send the application (your profile, attachments, and drafted text) to the opportunity provider on your behalf. We do this only when you explicitly confirm each submission."*

---

## 7 · The four PRs

| PR | Scope | Days |
|---|---|---|
| **PR-1 · Schema + classifier** | Add columns, create tables, backfill `apply_method` on 50 dev rows | 2 |
| **PR-2 · Asset Vault** | R2 client, `/api/assets/*`, `/app/assets` page, `AssetUploader` | 5 |
| **PR-3 · Email submission** | `Mailer` interface + Resend driver, `/submit` route (email pathway only), `EmailApplyForm`, Resend webhook, consent UX, Privacy update | 8 |
| **PR-4 · External + Native + Polish** | Staged external pathway with return-detection, native-form skeleton, `SubmissionStatusBadge`, founder onboards 2 native providers | 8 |

**Total: ~23 days of focused build + ~7 days for founder-dogfood + bug-fix tail. = 30 days.**

---

## 8 · Definition of done (the v1 gate)

1. ✅ Every opportunity row has `apply_method` classified.
2. ✅ Every opportunity card and detail page shows **"Apply via Nexora"** as primary CTA.
3. ✅ Email pathway sends from `apply@nexora.app` with verified DNS; delivery status reflected on tracker card via Resend webhook.
4. ✅ External pathway opens source in new tab, stages drafts in side panel, auto-flips card to Applied on return.
5. ✅ Native pathway works for at least 2 hand-onboarded test providers.
6. ✅ Asset Vault accepts CV + transcript + portfolio; assets are attached to email submissions.
7. ✅ Consent checkbox required per submission; recorded in `application_submissions.payload_json`.
8. ✅ Privacy Policy updated and reviewed.
9. ✅ **Founder has personally applied to ≥10 real opportunities through Nexora.**
10. ✅ Backend health + flow check (`docs/USER_FLOW.md` style) re-run green, with Flow 12 (Apply via Nexora) added.

---

## 9 · Out of scope (explicit, for v1)

- Provider portal (Phase 4).
- Browser extension for autofill on external forms (Phase 4).
- Multi-user shared assets / team accounts.
- Per-language drafting (English-only v1).
- Resume parsing on upload (we store, we don't parse yet).
- Application analytics dashboard for the user (just status badges in v1).
- Mobile-app submit flow (web-responsive only for v1).

---

## 10 · Risks & mitigations

| Risk | Mitigation |
|---|---|
| Resend deliverability lower than Postmark at scale | `Mailer` interface; swap to Postmark behind same interface in 1 day if bounce rate >2%. |
| Provider TOS prohibits third-party submission | Per-submission consent + clear disclosure; partner with provider (Track A) where blocked. |
| User uploads malicious files | File-type allowlist (PDF, DOCX, JPG, PNG); max 10MB; virus scan via Cloudflare R2 + lambda hook (Phase 3 polish). |
| Classifier mis-tags `external_form` as `email_submission` | Per-row override field; founder reviews classifier output for the wedge before launch. |
| Email goes to spam at scale | DMARC monitoring; warmup with low daily volume first 14 days; rotate to Postmark if needed. |
| Return-detection (Case 3) fires false-positive Applied | Require ≥60s open OR explicit "I submitted it" button as fallback; user can un-Apply from tracker. |
