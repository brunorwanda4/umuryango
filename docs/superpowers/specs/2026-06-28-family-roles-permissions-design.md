# Family Roles & Permissions — Design

Date: 2026-06-28
Status: Approved (brainstorm), pending implementation plan

## Problem

A family member (e.g. a son) can create a family and become its top authority.
Later, another member (e.g. the father, who is the real head of the family) must
be able to take over management and remove the son's management access. Today the
family role model is coarse (`OWNER / ADMIN / MEMBER` by name only) with no
granular permissions and no settings UI to manage them.

Two separate concepts must exist:

1. **Kinship label** — son, father, mother, uncle, neighbor, cleaner, family
   friend, etc. Purely descriptive. Grants no power by itself.
2. **Capabilities (permissions)** — granular grants (create savings, record
   income, manage members, etc.) that an authorized member can give or remove
   per member, managed in family settings.

The father-is-head case is **not** automatic: family type varies, so authority is
always asked when a person is added, never inferred from the kinship label.

## Decisions (from brainstorm)

- **Kinship and authority are independent.** When adding a person, the family
  asks both: a kinship label AND an authority level. Father is often head but not
  always, so never auto-assign authority from kinship.
- **Three authority tiers** replace the old role names:
  - **HEAD** — founder tier. Protected: admins/members cannot remove or demote a
    Head. A Head has all capabilities implicitly. A Head can **grant Head to
    another member** (e.g. son grants headship to father), so multiple Heads are
    allowed (mother + father co-heads). This resolves the father-removes-son case:
    son (Head) grants Head to father; father can then remove the son's access.
  - **ADMIN** — manages MEMBERs only, scoped by granted capabilities. Cannot
    touch Heads or other Admins.
  - **MEMBER** — default low authority; capabilities granted individually.
- **Capabilities bind per member, with role presets** (option A). Each capability
  can be toggled on any member. ADMIN/MEMBER are starting presets a Head can
  fine-tune per person. Backend checks the capability, not the role name. (Named
  custom roles like "Treasurer" are future scope, not in this spec.)
- **Family type** is chosen at creation: Nuclear, Joint/Extended, Single-Parent,
  Blended, Adoptive.
- **Kinship label** is an enum plus an `OTHER` option with a free-text custom
  value, so reports stay clean while oddball labels (cleaner, in-law, godmother)
  are still allowed.
- **Backend is authoritative.** Frontend capability checks are UX only.

## Scope note

Savings / income / expense / contributions / debts / projects modules are still
"Planned". This spec builds the **permission framework + settings UI + add-member
flow** now. The capability catalog is fully defined, but capability enforcement is
wired into each money module as that module lands. The `MANAGE_MEMBERS` and
`MANAGE_FAMILY_SETTINGS` capabilities are enforceable immediately because their
target features (member management, family settings) exist in this work.

## Data model (Prisma)

```prisma
enum FamilyType {
  NUCLEAR
  JOINT_EXTENDED
  SINGLE_PARENT
  BLENDED
  ADOPTIVE
}

enum FamilyAuthority {   // replaces FamilyMemberRole
  HEAD
  ADMIN
  MEMBER
}

enum FamilyCapability {
  MANAGE_FAMILY_SETTINGS
  MANAGE_MEMBERS          // invite, remove, change authority/capabilities
  MANAGE_SAVINGS
  MANAGE_CONTRIBUTIONS
  RECORD_INCOME
  RECORD_EXPENSE
  APPROVE_EXPENSE
  MANAGE_DEBTS
  MANAGE_PROJECTS
  MANAGE_EVENTS
  MANAGE_ANNOUNCEMENTS
  MANAGE_DOCUMENTS
  VIEW_REPORTS
  EXPORT_REPORTS
}

enum FamilyKinship {
  SON
  DAUGHTER
  FATHER
  MOTHER
  BROTHER
  SISTER
  UNCLE
  AUNT
  GRANDFATHER
  GRANDMOTHER
  COUSIN
  IN_LAW
  FAMILY_FRIEND
  NEIGHBOR
  CLEANER
  OTHER
}
```

Model changes:

- `Family.type FamilyType` — new, chosen at create. Provide a safe default for
  existing rows in the migration (e.g. `NUCLEAR`) or make nullable then backfill.
- `FamilyMember`:
  - `authority FamilyAuthority @default(MEMBER)` — renamed from `role`.
  - `kinshipLabel FamilyKinship?`
  - `kinshipCustom String?` — used only when `kinshipLabel = OTHER`.
  - `capabilities FamilyCapability[]` — per-member grants on top of authority.
  - `removedAt DateTime?` — soft removal (no hard delete of membership history).
- `FamilyInvite` gains `authority`, `kinshipLabel`, `kinshipCustom`,
  `capabilities` so accepting an invite applies the intended access.
- New `FamilyAuditEvent` model:
  - `id, familyId, actorId, action (enum), targetMemberId?, before Json?,
    after Json?, createdAt`.
  - Indexed on `(familyId, createdAt)`.
  - `FamilyAuditAction` enum: `MEMBER_INVITED, MEMBER_REMOVED,
    AUTHORITY_CHANGED, CAPABILITIES_CHANGED, HEAD_GRANTED, SETTINGS_CHANGED`.

### Rule engine (backend)

`can(member, capability)` = `member.authority === HEAD` OR
`member.capabilities.includes(capability)`.

Authority gates who-manages-whom:
- HEAD manages all members.
- ADMIN manages MEMBERs only, and only with `MANAGE_MEMBERS`.
- MEMBER manages none.

## Backend (NestJS) — API + enforcement

All routes under `/api/v1`, family-scoped, audited where they mutate access.

| Method | Route | Required | Purpose |
|---|---|---|---|
| GET | `/families/:slug/members` | family member | list members: authority, kinship, capabilities |
| POST | `/families/:slug/members` | `MANAGE_MEMBERS` | invite with authority + kinship + capabilities |
| PATCH | `/families/:slug/members/:memberId` | see rules | change authority / kinship / capabilities |
| DELETE | `/families/:slug/members/:memberId` | see rules | soft-remove member |
| POST | `/families/:slug/members/:memberId/transfer-head` | HEAD only | grant HEAD to another member |
| GET | `/families/:slug/settings` | family member | read settings |
| PATCH | `/families/:slug/settings` | `MANAGE_FAMILY_SETTINGS` | name, type, currency, cadence, description |
| GET | `/families/:slug/audit` | `MANAGE_MEMBERS` or HEAD | recent permission/member changes |

Enforcement:

- Reusable `FamilyAccessGuard` + `requireCapability(slug, userId, cap)` helper:
  loads membership, runs `can()`. Returns **404** (not 403) for non-members, to
  avoid leaking family existence (IDOR guard) — matches existing
  `getBySlugForUser` behavior in `families.service.ts`.
- Service-level authority rules:
  - ADMIN cannot edit or remove a HEAD or another ADMIN; only MEMBERs. HEAD edits
    anyone.
  - Removing or demoting the **last remaining HEAD** is blocked.
  - Granting a capability the actor does not themselves hold is blocked
    (no privilege escalation). HEAD holds all, so a Head can grant anything.
- Every member / authority / capability / settings change writes a
  `FamilyAuditEvent` inside the same Prisma transaction as the change.
- Invite acceptance applies the stored `authority`, `kinshipLabel`,
  `kinshipCustom`, and `capabilities` onto the new `FamilyMember`.

Refactor: the existing `FamilyMemberRole` enum and `role` field are used in
`families.service.ts`, `families.controller.ts`, the members page, and the
`UserFamily` / `FamilyDetail` types. All migrate to `FamilyAuthority` /
`authority`. Contained rename.

## Frontend (Next.js 15 + shadcn)

### Create-family form (`create-family-form.tsx`)

- Add **Family Type** select (Nuclear / Joint-Extended / Single-Parent /
  Blended / Adoptive), required.
- Invite emails stay as-is; per-invite authority/kinship is handled later in
  settings to keep the create form light. Creator auto-becomes HEAD.

### Family Settings page (`settings/page.tsx`, currently a stub) — tabbed

- **General** — name, type, currency, cadence, description. Needs
  `MANAGE_FAMILY_SETTINGS`.
- **Members & Access** — table: avatar, name, kinship, authority badge,
  capability summary. Row actions gated by `MANAGE_MEMBERS`: edit access, remove,
  transfer-head.
- **Edit-access sheet/dialog** — set authority (Head / Admin / Member), kinship
  (enum; show custom text input when `OTHER`), capability checkboxes grouped by
  module. Hide capabilities the actor cannot grant.
- **Audit** tab (Heads / admins with `MANAGE_MEMBERS`) — recent permission and
  member changes from `FamilyAuditEvent`.

### Members page (`members/page.tsx`, has uncommitted edits)

- Show kinship + authority. Gate the "Invite" button and row actions on the
  current member's capabilities.

### Client permission helper

- `useFamilyCapabilities()` reads the current member's authority + capabilities
  from the family detail payload and hides unauthorized actions. UX only —
  backend remains the source of truth (per AGENTS.md).

UI: shadcn `tabs`, `table`, `sheet`, `dialog`, `badge`, `checkbox`, `select`,
`alert`. Semantic tokens (`bg-background`, `text-muted-foreground`), mobile-first,
English copy through the existing i18n message pattern. Add any missing shadcn
components via `bunx shadcn@latest add <component>`.

## Testing

Backend `families.service.spec.ts` additions:

- `can()` capability resolution (HEAD implies all; member grant respected).
- Last-HEAD guard blocks removing/demoting the final Head.
- No-privilege-escalation: granting a capability the actor lacks is rejected.
- Authority scoping: ADMIN cannot edit a HEAD or another ADMIN.
- Audit event written on each access change.
- IDOR: non-member receives 404 on member/settings/audit routes.

## Out of scope (future)

- Custom named roles (Treasurer, Secretary) with reusable capability sets.
- Capability enforcement inside money modules not yet built (wired as each lands).
- Per-invite authority/kinship picker on the create-family form.
```
