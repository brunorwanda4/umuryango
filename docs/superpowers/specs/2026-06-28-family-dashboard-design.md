# Family Dashboard — Design

Date: 2026-06-28
Scope: B (full-stack slice — backend family-detail endpoint + frontend dashboard shell)

## Goal

Replace the placeholder `/family/[familyName]` page with a real dashboard. Show
data that actually exists (family identity, members, current user's role) and
honest empty states for finance/operations modules that have no backend yet.
Never invent totals, per `AGENTS.md` non-negotiables.

## Constraints (from AGENTS.md / context)

- Family is the tenant boundary. Authorize every family-scoped read by membership (IDOR guard).
- Never invent totals, records, or report numbers. Finance modules have no Prisma models yet — show empty states, not fake/zero values presented as fact.
- Mobile-first, shadcn/ui only, semantic tokens, status not by color alone.
- Frontend calls go through `frontend/src/service/api.ts`.
- Backend: thin controller, business rules in service. No schema change needed for this slice.

## Current State

- Prisma schema: only `User`, `Family`, `FamilyMember`, `FamilyInvite`, auth models. No finance models.
- Backend endpoints: `POST /api/v1/families`, `GET /api/v1/families?limit=` (returns `id, name, slug, role`).
- No get-family-by-slug endpoint.
- `page.tsx` is a placeholder async server component.
- Sibling module pages are stubs.

## Backend — `GET /api/v1/families/:slug`

### Controller (`backend/src/families/families.controller.ts`)

- New `@Get(':slug')` handler, `@UseGuards(JwtAuthGuard)`.
- Params: `@CurrentUserId() userId`, `@Param('slug') slug`.
- Calls `familiesService.getBySlugForUser(userId, slug)`.
- Returns `{ data, message: 'Family retrieved successfully.' }`.
- Swagger: `@ApiOkResponse` example, `@ApiNotFoundResponse`, `@ApiUnauthorizedResponse`.

### Service (`backend/src/families/families.service.ts`)

Add `getBySlugForUser(userId, slug): Promise<FamilyDetail>`:

1. `family = prisma.family.findUnique({ where: { slug }, include: { members: { include: { user: true }, orderBy: { createdAt: 'asc' } } } })`.
2. If `!family` → `throw new NotFoundException('Family not found.')`.
3. `membership = family.members.find(m => m.userId === userId)`.
4. If `!membership` → `throw new NotFoundException('Family not found.')` (same 404 — no existence leak; IDOR guard).
5. Map and return detail.

### Response type

```ts
export type FamilyMemberSummary = {
  id: string;          // FamilyMember id
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: FamilyMemberRole;
  joinedAt: Date;      // FamilyMember.createdAt
};

export type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  description: string | null;
  createdAt: Date;
  role: FamilyMemberRole;   // current user's role
  memberCount: number;
  members: FamilyMemberSummary[];
};
```

No money fields — no models exist.

## Frontend — `frontend/src/app/family/[familyName]/page.tsx`

Rewrite as a client component (matches `useCurrentUser` / sidebar pattern; clean cookie auth via `apiRequest`).

- `"use client"`. Read `familyName` (slug) from params.
- Fetch `apiRequest<undefined, FamilyDetail>("get", \`/families/${slug}\`)` in effect (or small hook `useFamily(slug)`).
- Three states:
  - **loading** → skeleton cards.
  - **error** (incl. 404) → `Empty` "Family not found or no access" with link back to `/family`.
  - **success** → dashboard.

### Layout (mobile-first; single column → grid at `sm`/`lg`)

1. **Header** — family `name` (h1), badges for `country`, `defaultCurrency`, `contributionCadence`, and current user's `role`. Optional `description`.
2. **Members card** — `memberCount`, list of members: `Avatar` (initials fallback), `fullName`, `role` `Badge`. Link to `/family/:slug/members`.
3. **Summary grid** — one `Card` per module, each with `Empty` "Not set up yet" + link to its module page:
   Money, Contributions, Savings, Debts, Projects, Events, Recent activity, Alerts.

### UI rules

- shadcn components: `Card`, `Badge`, `Avatar`, `Skeleton`, `Empty`, `Separator`. Add any missing with `bunx shadcn@latest add <component>` (run from `frontend/`, Bun).
- Semantic tokens only (`bg-background`, `text-muted-foreground`, `border`, etc.). No raw colors, no manual `dark:`.
- Status conveyed by text + icon, never color alone.
- `flex` + `gap-*` for spacing; `cn()` for conditional classes.
- Strings kept extractable (localization-ready). No invented numbers in finance cards.

If `page.tsx` grows large, split dashboard sections into colocated components in the same folder (e.g. `_components/`).

## Verification

Backend:
- Member requests slug → 200 with detail + members + role.
- Non-member requests existing slug → 404.
- Unknown slug → 404.
- Unauthenticated → 401 (guard).

Frontend:
- Typecheck passes.
- Loading renders skeletons; 404/error renders not-found empty; success renders header + members + empty-state grid.

## Out of Scope

- Any finance/contribution/project/event data or models.
- Real numbers in summary cards (empty states only until modules exist).
- Editing family settings/members from the dashboard.
