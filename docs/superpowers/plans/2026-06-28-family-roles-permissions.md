# Family Roles & Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the name-only `OWNER/ADMIN/MEMBER` family role with a kinship label + capability-based permission system, plus a settings UI to manage member access.

**Architecture:** Three authority tiers (HEAD/ADMIN/MEMBER) plus per-member capability grants live on `FamilyMember`. A pure rule module (`family-access.ts`) answers `can(member, capability)` and who-manages-whom; the NestJS service enforces it server-side on every mutation and writes a `FamilyAuditEvent` in the same transaction. The frontend hides unauthorized actions as UX only.

**Tech Stack:** Backend NestJS + Prisma + PostgreSQL (pnpm). Frontend Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui (Bun). Jest for backend tests.

## Global Constraints

- Backend package manager: **pnpm only** (`pnpm <script>`, `pnpm dlx`). Never npm/yarn/bun in `backend/`.
- Frontend package manager: **Bun only** (`bun run`, `bunx`). Never npm/pnpm/yarn in `frontend/`.
- Money is out of scope here; no financial records touched. No floating point introduced.
- Family is the tenant boundary. Every family-scoped route checks membership; non-members get **404 NotFoundException** (never 403), matching `getBySlugForUser` IDOR guard.
- Permission, role, member-removal, and settings changes **require an audit log** written in the same Prisma transaction as the change.
- Frontend role/capability checks are UX only; the backend is authoritative.
- Backend route prefix: `@Controller('api/v1/families')`. Auth via `JwtAuthGuard` + `@CurrentUserId()`.
- API response envelope: `{ data, message }`. Frontend reads via `apiRequest` from `@/service/api`.
- shadcn: run `bunx shadcn@latest add <component>` before importing a component the repo does not have yet. Use semantic tokens (`bg-background`, `text-muted-foreground`), no raw colors, no manual `dark:`.
- Authority values: `HEAD` (was OWNER), `ADMIN`, `MEMBER`. Capability enum and kinship enum exactly as defined in Task 1.

---

## File Structure

**Backend**
- `backend/prisma/schema.prisma` — modify: enums + model fields + audit model (Task 1).
- `backend/src/families/family-access.ts` — **create**: pure rule functions (Task 2).
- `backend/src/families/family-access.spec.ts` — **create**: unit tests for rules (Task 2).
- `backend/src/families/dto/invite-member.dto.ts` — **create** (Task 4).
- `backend/src/families/dto/update-member.dto.ts` — **create** (Task 5).
- `backend/src/families/dto/update-family-settings.dto.ts` — **create** (Task 8).
- `backend/src/families/dto/create-family.dto.ts` — modify: add `type` (Task 10).
- `backend/src/families/families.service.ts` — modify: refactor + new methods (Tasks 3–10).
- `backend/src/families/families.controller.ts` — modify: new routes (Tasks 4–10).
- `backend/src/families/families.service.spec.ts` — modify: refactor + new tests (Tasks 3–9).

**Frontend**
- `frontend/src/messages/en.json` — modify: add `familyType*` copy + member-management copy (Tasks 10–13).
- `frontend/src/components/family/create-family-form.tsx` — modify: family type select (Task 11).
- `frontend/src/lib/family-access.ts` — **create**: shared FE types + `useFamilyCapabilities` (Task 12).
- `frontend/src/app/family/[familyName]/members/page.tsx` — modify: authority + kinship + capabilities (Task 12).
- `frontend/src/app/family/[familyName]/settings/page.tsx` — modify: tabbed settings (Task 13).
- `frontend/src/components/family/family-settings.tsx` — **create**: settings client component (Task 13).

---

## Task 1: Prisma schema — enums, member fields, audit model

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: enums `FamilyType`, `FamilyAuthority`, `FamilyCapability`, `FamilyKinship`, `FamilyAuditAction`; `FamilyMember.authority/kinshipLabel/kinshipCustom/capabilities/removedAt`; `FamilyInvite.authority/kinshipLabel/kinshipCustom/capabilities`; `Family.type`; model `FamilyAuditEvent`.

- [ ] **Step 1: Replace the `FamilyMemberRole` enum and add new enums**

In `backend/prisma/schema.prisma`, delete the `FamilyMemberRole` enum (lines 33-37) and add:

```prisma
enum FamilyType {
  NUCLEAR
  JOINT_EXTENDED
  SINGLE_PARENT
  BLENDED
  ADOPTIVE
}

enum FamilyAuthority {
  HEAD
  ADMIN
  MEMBER
}

enum FamilyCapability {
  MANAGE_FAMILY_SETTINGS
  MANAGE_MEMBERS
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

enum FamilyAuditAction {
  MEMBER_INVITED
  MEMBER_REMOVED
  AUTHORITY_CHANGED
  CAPABILITIES_CHANGED
  HEAD_GRANTED
  SETTINGS_CHANGED
}
```

- [ ] **Step 2: Add `type` to `Family`**

In the `Family` model, add after `contributionCadence`:

```prisma
  type                FamilyType     @default(NUCLEAR)
```

- [ ] **Step 3: Update `FamilyMember`**

Replace the `role` line and add new fields so the model reads:

```prisma
model FamilyMember {
  id           String             @id @default(cuid())
  familyId     String
  userId       String
  authority    FamilyAuthority    @default(MEMBER)
  kinshipLabel FamilyKinship?
  kinshipCustom String?
  capabilities FamilyCapability[]
  removedAt    DateTime?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  family       Family             @relation(fields: [familyId], references: [id], onDelete: Cascade)
  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([familyId, userId])
  @@index([userId])
}
```

- [ ] **Step 4: Update `FamilyInvite`**

Replace its `role` line with:

```prisma
  authority    FamilyAuthority    @default(MEMBER)
  kinshipLabel FamilyKinship?
  kinshipCustom String?
  capabilities FamilyCapability[]
```

(Keep the rest of `FamilyInvite` unchanged.)

- [ ] **Step 5: Add the audit model and back-relation**

Add a new model:

```prisma
model FamilyAuditEvent {
  id             String            @id @default(cuid())
  familyId       String
  actorId        String
  action         FamilyAuditAction
  targetMemberId String?
  before         Json?
  after          Json?
  createdAt      DateTime          @default(now())
  family         Family            @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@index([familyId, createdAt])
}
```

Add the back-relation to `Family` (after `invites`):

```prisma
  auditEvents         FamilyAuditEvent[]
```

- [ ] **Step 6: Create the migration**

Run: `cd backend && pnpm prisma migrate dev --name family_roles_permissions`
Expected: migration created and applied; Prisma Client regenerated. Because the old `FamilyMemberRole` enum is being removed and `authority` is new, on a dev database with existing OWNER rows you must map them: if the migrate command reports data loss on the `role` column, edit the generated SQL to `ALTER TABLE "FamilyMember" ... ` setting `authority = 'HEAD'` where the old role was `OWNER`, `'ADMIN'`/`'MEMBER'` otherwise, before the drop. On an empty dev DB no manual edit is needed.

- [ ] **Step 7: Verify the client compiles**

Run: `cd backend && pnpm prisma generate && pnpm tsc --noEmit`
Expected: `prisma generate` succeeds. `tsc` will now report errors in `families.service.ts` / spec referencing `FamilyMemberRole` and `role` — that is expected and fixed in Task 3. Confirm the only errors are about `FamilyMemberRole`, `member.role`, and `role:`.

- [ ] **Step 8: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(family): add authority, capabilities, kinship, and audit schema"
```

---

## Task 2: Pure access-rule module

**Files:**
- Create: `backend/src/families/family-access.ts`
- Test: `backend/src/families/family-access.spec.ts`

**Interfaces:**
- Produces:
  - `type AccessMember = { authority: FamilyAuthority; capabilities: FamilyCapability[] }`
  - `can(member: AccessMember, cap: FamilyCapability): boolean`
  - `canManageTarget(actor: AccessMember, target: AccessMember): boolean`
  - `DEFAULT_CAPABILITIES: Record<FamilyAuthority, FamilyCapability[]>`
  - `assertGrantableSubset(actor: AccessMember, requested: FamilyCapability[]): void` (throws `ForbiddenException` on escalation)

- [ ] **Step 1: Write the failing test**

Create `backend/src/families/family-access.spec.ts`:

```typescript
import { ForbiddenException } from '@nestjs/common';
import { FamilyAuthority, FamilyCapability } from '@prisma/client';
import {
  assertGrantableSubset,
  can,
  canManageTarget,
} from './family-access';

const head = { authority: FamilyAuthority.HEAD, capabilities: [] };
const adminWithMembers = {
  authority: FamilyAuthority.ADMIN,
  capabilities: [FamilyCapability.MANAGE_MEMBERS],
};
const plainMember = { authority: FamilyAuthority.MEMBER, capabilities: [] };

describe('family-access can()', () => {
  it('HEAD has every capability implicitly', () => {
    expect(can(head, FamilyCapability.APPROVE_EXPENSE)).toBe(true);
    expect(can(head, FamilyCapability.MANAGE_FAMILY_SETTINGS)).toBe(true);
  });

  it('non-head needs the explicit grant', () => {
    expect(can(plainMember, FamilyCapability.RECORD_INCOME)).toBe(false);
    expect(
      can(
        { authority: FamilyAuthority.MEMBER, capabilities: [FamilyCapability.RECORD_INCOME] },
        FamilyCapability.RECORD_INCOME,
      ),
    ).toBe(true);
  });
});

describe('family-access canManageTarget()', () => {
  it('HEAD manages anyone', () => {
    expect(canManageTarget(head, adminWithMembers)).toBe(true);
    expect(canManageTarget(head, plainMember)).toBe(true);
  });

  it('ADMIN with MANAGE_MEMBERS manages MEMBERs only', () => {
    expect(canManageTarget(adminWithMembers, plainMember)).toBe(true);
    expect(canManageTarget(adminWithMembers, head)).toBe(false);
    expect(canManageTarget(adminWithMembers, adminWithMembers)).toBe(false);
  });

  it('MEMBER manages nobody', () => {
    expect(canManageTarget(plainMember, plainMember)).toBe(false);
  });
});

describe('family-access assertGrantableSubset()', () => {
  it('lets HEAD grant anything', () => {
    expect(() =>
      assertGrantableSubset(head, [FamilyCapability.APPROVE_EXPENSE]),
    ).not.toThrow();
  });

  it('blocks granting a capability the actor lacks', () => {
    expect(() =>
      assertGrantableSubset(adminWithMembers, [FamilyCapability.APPROVE_EXPENSE]),
    ).toThrow(ForbiddenException);
  });

  it('allows granting a capability the actor holds', () => {
    expect(() =>
      assertGrantableSubset(adminWithMembers, [FamilyCapability.MANAGE_MEMBERS]),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && pnpm jest family-access.spec`
Expected: FAIL — cannot find module `./family-access`.

- [ ] **Step 3: Implement `family-access.ts`**

Create `backend/src/families/family-access.ts`:

```typescript
import { ForbiddenException } from '@nestjs/common';
import { FamilyAuthority, FamilyCapability } from '@prisma/client';

export type AccessMember = {
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
};

const ALL_CAPABILITIES = Object.values(FamilyCapability);

export const DEFAULT_CAPABILITIES: Record<FamilyAuthority, FamilyCapability[]> =
  {
    [FamilyAuthority.HEAD]: ALL_CAPABILITIES,
    [FamilyAuthority.ADMIN]: [
      FamilyCapability.MANAGE_MEMBERS,
      FamilyCapability.VIEW_REPORTS,
    ],
    [FamilyAuthority.MEMBER]: [],
  };

export function can(member: AccessMember, cap: FamilyCapability): boolean {
  if (member.authority === FamilyAuthority.HEAD) {
    return true;
  }
  return member.capabilities.includes(cap);
}

// HEAD manages everyone. ADMIN with MANAGE_MEMBERS manages MEMBERs only.
// Nobody else manages anyone.
export function canManageTarget(
  actor: AccessMember,
  target: AccessMember,
): boolean {
  if (actor.authority === FamilyAuthority.HEAD) {
    return true;
  }
  if (
    actor.authority === FamilyAuthority.ADMIN &&
    can(actor, FamilyCapability.MANAGE_MEMBERS)
  ) {
    return target.authority === FamilyAuthority.MEMBER;
  }
  return false;
}

// Prevent privilege escalation: an actor may only grant capabilities they hold.
export function assertGrantableSubset(
  actor: AccessMember,
  requested: FamilyCapability[],
): void {
  const ungrantable = requested.filter((cap) => !can(actor, cap));
  if (ungrantable.length > 0) {
    throw new ForbiddenException(
      'You cannot grant a capability you do not have.',
    );
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && pnpm jest family-access.spec`
Expected: PASS (all assertions green).

- [ ] **Step 5: Commit**

```bash
git add backend/src/families/family-access.ts backend/src/families/family-access.spec.ts
git commit -m "feat(family): add pure capability and authority rule helpers"
```

---

## Task 3: Refactor existing service/types from `role` to `authority`

**Files:**
- Modify: `backend/src/families/families.service.ts`
- Modify: `backend/src/families/families.service.spec.ts`

**Interfaces:**
- Consumes: `FamilyAuthority` from `@prisma/client`; `DEFAULT_CAPABILITIES` from `./family-access`.
- Produces: `UserFamily.authority`, `FamilyMemberSummary.authority/kinshipLabel/kinshipCustom/capabilities`, `FamilyDetail.authority`. `create()` seeds the creator as `HEAD` with `DEFAULT_CAPABILITIES.HEAD`.

- [ ] **Step 1: Update the existing spec to the new field names**

In `backend/src/families/families.service.spec.ts`:
- Replace `import { FamilyMemberRole } from '@prisma/client';` with `import { FamilyAuthority, FamilyCapability } from '@prisma/client';`.
- In `familyRecord.members[0]`, replace `role: FamilyMemberRole.OWNER,` with:

```typescript
      authority: FamilyAuthority.HEAD,
      kinshipLabel: null,
      kinshipCustom: null,
      capabilities: [],
      removedAt: null,
```

- In the first test, replace `expect(result.role).toBe(FamilyMemberRole.OWNER);` with `expect(result.authority).toBe(FamilyAuthority.HEAD);`.
- In the members assertion, replace the member object with:

```typescript
      {
        id: 'mem-1',
        userId: 'u-1',
        fullName: 'Claudine Mutesi',
        avatarUrl: null,
        authority: FamilyAuthority.HEAD,
        kinshipLabel: null,
        kinshipCustom: null,
        capabilities: [],
        joinedAt: familyRecord.members[0].createdAt,
      },
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `cd backend && pnpm jest families.service.spec`
Expected: FAIL — compile/type errors and assertion mismatches referencing `authority`.

- [ ] **Step 3: Refactor `families.service.ts`**

In `backend/src/families/families.service.ts`:
- Change the import on line 10 to:

```typescript
import {
  FamilyAuthority,
  FamilyCapability,
  FamilyInviteStatus,
} from '@prisma/client';
import { DEFAULT_CAPABILITIES } from './family-access';
```

- Update the exported types:

```typescript
export type UserFamily = {
  id: string;
  name: string;
  slug: string;
  authority: FamilyAuthority;
};

export type FamilyMemberSummary = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  authority: FamilyAuthority;
  kinshipLabel: string | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
  joinedAt: Date;
};

export type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  type: FamilyType;
  description: string | null;
  createdAt: Date;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  memberCount: number;
  members: FamilyMemberSummary[];
};
```

Add `FamilyType` to the `@prisma/client` import on line 10 (alongside `FamilyAuthority`, `FamilyCapability`, `FamilyInviteStatus`).

- In `create()`, change the member seed (lines ~113-118) to:

```typescript
        members: {
          create: {
            userId: creator.id,
            authority: FamilyAuthority.HEAD,
            capabilities: DEFAULT_CAPABILITIES[FamilyAuthority.HEAD],
          },
        },
```

- In `listForUser()`, change the returned `role: membership.role` to `authority: membership.authority`.
- In `getBySlugForUser()`:
  - Add a `where` filter so soft-removed members are excluded: change the `members` include to
    `members: { where: { removedAt: null }, orderBy: { createdAt: 'asc' }, include: { user: true } }`.
  - Replace the membership branch and return so it reads:

```typescript
    return {
      id: family.id,
      name: family.name,
      slug: family.slug,
      country: family.country,
      defaultCurrency: family.defaultCurrency,
      contributionCadence: family.contributionCadence,
      description: family.description,
      type: family.type,
      createdAt: family.createdAt,
      authority: membership.authority,
      capabilities: membership.capabilities,
      memberCount: family.members.length,
      members: family.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        fullName: member.user.fullName,
        avatarUrl: member.user.avatarUrl,
        authority: member.authority,
        kinshipLabel: member.kinshipLabel,
        kinshipCustom: member.kinshipCustom,
        capabilities: member.capabilities,
        joinedAt: member.createdAt,
      })),
    };
```

- [ ] **Step 4: Update the controller Swagger examples**

In `backend/src/families/families.controller.ts`, in the two `schema.example` blocks replace `role: 'OWNER'` with `authority: 'HEAD'` (three occurrences: list item, detail `role`, and member `role`). Add `capabilities: []` next to the member's `authority`, and add `authority: 'HEAD'` + `capabilities: ['MANAGE_MEMBERS']` to the detail-level example object. This is example text only; no logic changes.

- [ ] **Step 5: Run the spec and typecheck to verify pass**

Run: `cd backend && pnpm jest families.service.spec && pnpm tsc --noEmit`
Expected: spec PASS; `tsc` clean (no remaining `FamilyMemberRole`/`role` errors).

- [ ] **Step 6: Commit**

```bash
git add backend/src/families
git commit -m "refactor(family): replace role with authority and expose capabilities"
```

---

## Task 4: Invite member endpoint

**Files:**
- Create: `backend/src/families/dto/invite-member.dto.ts`
- Modify: `backend/src/families/families.service.ts`
- Modify: `backend/src/families/families.controller.ts`
- Modify: `backend/src/families/families.service.spec.ts`

**Interfaces:**
- Consumes: `can`, `assertGrantableSubset`, `DEFAULT_CAPABILITIES` from `./family-access`; `requireMembership` helper (added here).
- Produces:
  - `InviteMemberDto { email; authority; kinshipLabel?; kinshipCustom?; capabilities? }`
  - `FamiliesService.requireMembership(userId, slug): Promise<{ family; membership }>` (throws 404 for non-member)
  - `FamiliesService.inviteMember(userId, slug, dto): Promise<{ email; authority }>`
  - `POST /api/v1/families/:slug/members`

- [ ] **Step 1: Write the failing service test**

Add to `backend/src/families/families.service.spec.ts` a new describe block (extend the `prisma` mock object with the needed delegates):

```typescript
import { ForbiddenException } from '@nestjs/common';
import { FamilyInviteStatus } from '@prisma/client';

describe('FamiliesService.inviteMember', () => {
  let service: FamiliesService;
  let prisma: any;
  const mail = { sendFamilyInvite: jest.fn() };

  const baseFamily = {
    id: 'fam-1',
    name: 'Mutesi Family',
    slug: 'mutesi-family',
    members: [
      {
        id: 'mem-1',
        userId: 'head-1',
        authority: FamilyAuthority.HEAD,
        capabilities: [],
        removedAt: null,
        user: { fullName: 'Head One', email: 'head@example.com' },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      family: { findUnique: jest.fn().mockResolvedValue(baseFamily) },
      familyInvite: { upsert: jest.fn().mockResolvedValue({}) },
      familyAuditEvent: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn(async (cb: any) =>
        cb({
          familyInvite: { upsert: jest.fn().mockResolvedValue({}) },
          familyAuditEvent: { create: jest.fn().mockResolvedValue({}) },
        }),
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost') },
        },
      ],
    }).compile();
    service = moduleRef.get(FamiliesService);
  });

  it('lets a HEAD invite a member', async () => {
    const result = await service.inviteMember('head-1', 'mutesi-family', {
      email: 'new@example.com',
      authority: FamilyAuthority.MEMBER,
      capabilities: [FamilyCapability.RECORD_INCOME],
    });
    expect(result.email).toBe('new@example.com');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects a non-member inviter with 404', async () => {
    await expect(
      service.inviteMember('stranger', 'mutesi-family', {
        email: 'new@example.com',
        authority: FamilyAuthority.MEMBER,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks a member without MANAGE_MEMBERS', async () => {
    prisma.family.findUnique.mockResolvedValue({
      ...baseFamily,
      members: [
        {
          id: 'mem-2',
          userId: 'plain-1',
          authority: FamilyAuthority.MEMBER,
          capabilities: [],
          removedAt: null,
          user: { fullName: 'Plain', email: 'plain@example.com' },
        },
      ],
    });
    await expect(
      service.inviteMember('plain-1', 'mutesi-family', {
        email: 'new@example.com',
        authority: FamilyAuthority.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && pnpm jest families.service.spec`
Expected: FAIL — `service.inviteMember` is not a function.

- [ ] **Step 3: Create the DTO**

Create `backend/src/families/dto/invite-member.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyAuthority, FamilyCapability, FamilyKinship } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'new@example.com' })
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ enum: FamilyAuthority, example: FamilyAuthority.MEMBER })
  @IsEnum(FamilyAuthority)
  authority: FamilyAuthority;

  @ApiPropertyOptional({ enum: FamilyKinship })
  @IsOptional()
  @IsEnum(FamilyKinship)
  kinshipLabel?: FamilyKinship;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  kinshipCustom?: string;

  @ApiPropertyOptional({ enum: FamilyCapability, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(FamilyCapability, { each: true })
  capabilities?: FamilyCapability[];
}
```

- [ ] **Step 4: Add `requireMembership` + `inviteMember` to the service**

In `backend/src/families/families.service.ts` add the `ForbiddenException` import and these methods inside the class. `requireMembership` is the shared 404 guard reused by later tasks.

```typescript
  // Loads the family and the caller's active membership, or throws 404 so we
  // never leak whether a family exists to a non-member (IDOR guard).
  async requireMembership(userId: string, slug: string) {
    const family = await this.prisma.family.findUnique({
      where: { slug },
      include: {
        members: {
          where: { removedAt: null },
          include: { user: true },
        },
      },
    });
    if (!family) {
      throw new NotFoundException('Family not found.');
    }
    const membership = family.members.find((m) => m.userId === userId);
    if (!membership) {
      throw new NotFoundException('Family not found.');
    }
    return { family, membership };
  }

  async inviteMember(
    userId: string,
    slug: string,
    dto: InviteMemberDto,
  ): Promise<{ email: string; authority: FamilyAuthority }> {
    const { family, membership } = await this.requireMembership(userId, slug);

    if (!can(membership, FamilyCapability.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You cannot manage members.');
    }
    // An ADMIN may not create another HEAD/ADMIN.
    if (
      membership.authority !== FamilyAuthority.HEAD &&
      dto.authority !== FamilyAuthority.MEMBER
    ) {
      throw new ForbiddenException('Only a head can grant this authority.');
    }

    const capabilities =
      dto.capabilities ?? DEFAULT_CAPABILITIES[dto.authority];
    assertGrantableSubset(membership, capabilities);

    const token = randomBytes(32).toString('base64url');
    const tokenHash = await hash(token, 10);
    const expiresAt = new Date(
      Date.now() + this.inviteExpiresInDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.familyInvite.upsert({
        where: { familyId_email: { familyId: family.id, email: dto.email } },
        create: {
          familyId: family.id,
          email: dto.email,
          authority: dto.authority,
          kinshipLabel: dto.kinshipLabel ?? null,
          kinshipCustom: dto.kinshipCustom ?? null,
          capabilities,
          status: FamilyInviteStatus.PENDING,
          tokenHash,
          expiresAt,
        },
        update: {
          authority: dto.authority,
          kinshipLabel: dto.kinshipLabel ?? null,
          kinshipCustom: dto.kinshipCustom ?? null,
          capabilities,
          status: FamilyInviteStatus.PENDING,
          tokenHash,
          expiresAt,
        },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: 'MEMBER_INVITED',
          after: { email: dto.email, authority: dto.authority, capabilities },
        },
      });
    });

    await this.sendInviteEmail({
      email: dto.email,
      token,
      familyName: family.name,
      inviterName: membership.user.fullName,
    });

    return { email: dto.email, authority: dto.authority };
  }
```

Add to the top-of-file imports: `can`, `assertGrantableSubset` from `./family-access` (extend the existing `import { DEFAULT_CAPABILITIES } from './family-access';` to `import { assertGrantableSubset, can, DEFAULT_CAPABILITIES } from './family-access';`), and the DTO `import type { InviteMemberDto } from './dto/invite-member.dto';`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && pnpm jest families.service.spec`
Expected: PASS for the new inviteMember block.

- [ ] **Step 6: Wire the controller route**

In `backend/src/families/families.controller.ts` (`Body`, `Param`, `Post` are already imported) add the import `import { InviteMemberDto } from './dto/invite-member.dto';`, then add:

```typescript
  @Post(':slug/members')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Invite a member with authority and capabilities' })
  @ApiCreatedResponse({ description: 'Invite created.' })
  @ApiNotFoundResponse({ description: 'Family not found or not a member.' })
  async inviteMember(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Body() dto: InviteMemberDto,
  ) {
    const invite = await this.familiesService.inviteMember(userId, slug, dto);
    return { data: invite, message: 'Invite sent successfully.' };
  }
```

- [ ] **Step 7: Typecheck + commit**

Run: `cd backend && pnpm tsc --noEmit && pnpm jest families.service.spec`
Expected: clean + PASS.

```bash
git add backend/src/families
git commit -m "feat(family): add invite-member endpoint with capability checks"
```

---

## Task 5: Update member (authority / kinship / capabilities)

**Files:**
- Create: `backend/src/families/dto/update-member.dto.ts`
- Modify: `backend/src/families/families.service.ts`
- Modify: `backend/src/families/families.controller.ts`
- Modify: `backend/src/families/families.service.spec.ts`

**Interfaces:**
- Consumes: `requireMembership`, `canManageTarget`, `assertGrantableSubset`.
- Produces:
  - `UpdateMemberDto { authority?; kinshipLabel?; kinshipCustom?; capabilities? }`
  - `FamiliesService.updateMember(userId, slug, memberId, dto): Promise<FamilyMemberSummary>`
  - `PATCH /api/v1/families/:slug/members/:memberId`

- [ ] **Step 1: Write the failing test**

Add to `families.service.spec.ts`:

```typescript
describe('FamiliesService.updateMember', () => {
  let service: FamiliesService;
  let prisma: any;

  const family = {
    id: 'fam-1',
    slug: 'mutesi-family',
    members: [
      { id: 'mem-head', userId: 'head-1', authority: FamilyAuthority.HEAD, capabilities: [], removedAt: null, user: { fullName: 'Head', email: 'h@x.com', avatarUrl: null } },
      { id: 'mem-2', userId: 'u-2', authority: FamilyAuthority.MEMBER, capabilities: [], removedAt: null, user: { fullName: 'Mem', email: 'm@x.com', avatarUrl: null } },
    ],
  };

  beforeEach(async () => {
    prisma = {
      family: { findUnique: jest.fn().mockResolvedValue(family) },
      $transaction: jest.fn(async (cb: any) =>
        cb({
          familyMember: {
            update: jest.fn().mockResolvedValue({
              id: 'mem-2', userId: 'u-2', authority: FamilyAuthority.MEMBER,
              kinshipLabel: 'SON', kinshipCustom: null,
              capabilities: [FamilyCapability.RECORD_INCOME],
              createdAt: new Date('2026-06-28T07:00:00.000Z'),
              user: { fullName: 'Mem', avatarUrl: null },
            }),
          },
          familyAuditEvent: { create: jest.fn().mockResolvedValue({}) },
        }),
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(FamiliesService);
  });

  it('lets a HEAD update a member capability and kinship', async () => {
    const result = await service.updateMember('head-1', 'mutesi-family', 'mem-2', {
      kinshipLabel: 'SON' as any,
      capabilities: [FamilyCapability.RECORD_INCOME],
    });
    expect(result.capabilities).toContain(FamilyCapability.RECORD_INCOME);
    expect(result.kinshipLabel).toBe('SON');
  });

  it('blocks demoting the last HEAD', async () => {
    await expect(
      service.updateMember('head-1', 'mutesi-family', 'mem-head', {
        authority: FamilyAuthority.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && pnpm jest families.service.spec`
Expected: FAIL — `service.updateMember` is not a function.

- [ ] **Step 3: Create the DTO**

Create `backend/src/families/dto/update-member.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyAuthority, FamilyCapability, FamilyKinship } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: FamilyAuthority })
  @IsOptional()
  @IsEnum(FamilyAuthority)
  authority?: FamilyAuthority;

  @ApiPropertyOptional({ enum: FamilyKinship })
  @IsOptional()
  @IsEnum(FamilyKinship)
  kinshipLabel?: FamilyKinship;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  kinshipCustom?: string;

  @ApiPropertyOptional({ enum: FamilyCapability, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(FamilyCapability, { each: true })
  capabilities?: FamilyCapability[];
}
```

- [ ] **Step 4: Implement `updateMember`**

Add to the service (and `import type { UpdateMemberDto } from './dto/update-member.dto';`, plus `canManageTarget` in the `family-access` import):

```typescript
  async updateMember(
    userId: string,
    slug: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<FamilyMemberSummary> {
    const { family, membership } = await this.requireMembership(userId, slug);
    const target = family.members.find((m) => m.id === memberId);
    if (!target) {
      throw new NotFoundException('Member not found.');
    }
    if (!can(membership, FamilyCapability.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You cannot manage members.');
    }
    if (!canManageTarget(membership, target)) {
      throw new ForbiddenException('You cannot manage this member.');
    }

    // Guard the last remaining HEAD against demotion.
    if (
      target.authority === FamilyAuthority.HEAD &&
      dto.authority &&
      dto.authority !== FamilyAuthority.HEAD
    ) {
      const headCount = family.members.filter(
        (m) => m.authority === FamilyAuthority.HEAD,
      ).length;
      if (headCount <= 1) {
        throw new ForbiddenException('A family must keep at least one head.');
      }
    }
    // Only a HEAD can promote anyone to HEAD/ADMIN.
    if (
      dto.authority &&
      dto.authority !== FamilyAuthority.MEMBER &&
      membership.authority !== FamilyAuthority.HEAD
    ) {
      throw new ForbiddenException('Only a head can grant this authority.');
    }
    if (dto.capabilities) {
      assertGrantableSubset(membership, dto.capabilities);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.familyMember.update({
        where: { id: memberId },
        data: {
          ...(dto.authority ? { authority: dto.authority } : {}),
          ...(dto.kinshipLabel !== undefined
            ? { kinshipLabel: dto.kinshipLabel ?? null }
            : {}),
          ...(dto.kinshipCustom !== undefined
            ? { kinshipCustom: dto.kinshipCustom ?? null }
            : {}),
          ...(dto.capabilities ? { capabilities: dto.capabilities } : {}),
        },
        include: { user: true },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: dto.authority ? 'AUTHORITY_CHANGED' : 'CAPABILITIES_CHANGED',
          targetMemberId: memberId,
          before: {
            authority: target.authority,
            capabilities: target.capabilities,
          },
          after: { authority: row.authority, capabilities: row.capabilities },
        },
      });
      return row;
    });

    return {
      id: updated.id,
      userId: updated.userId,
      fullName: updated.user.fullName,
      avatarUrl: updated.user.avatarUrl,
      authority: updated.authority,
      kinshipLabel: updated.kinshipLabel,
      kinshipCustom: updated.kinshipCustom,
      capabilities: updated.capabilities,
      joinedAt: updated.createdAt,
    };
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && pnpm jest families.service.spec`
Expected: PASS for updateMember.

- [ ] **Step 6: Wire the controller route**

Add `Patch` to the `@nestjs/common` imports and `UpdateMemberDto` import, then:

```typescript
  @Patch(':slug/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a member authority, kinship, or capabilities' })
  @ApiOkResponse({ description: 'Member updated.' })
  @ApiNotFoundResponse({ description: 'Family or member not found.' })
  async updateMember(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    const member = await this.familiesService.updateMember(
      userId,
      slug,
      memberId,
      dto,
    );
    return { data: member, message: 'Member updated successfully.' };
  }
```

- [ ] **Step 7: Typecheck + commit**

Run: `cd backend && pnpm tsc --noEmit && pnpm jest families.service.spec`
Expected: clean + PASS.

```bash
git add backend/src/families
git commit -m "feat(family): add update-member endpoint with last-head guard"
```

---

## Task 6: Remove member (soft delete)

**Files:**
- Modify: `backend/src/families/families.service.ts`
- Modify: `backend/src/families/families.controller.ts`
- Modify: `backend/src/families/families.service.spec.ts`

**Interfaces:**
- Produces:
  - `FamiliesService.removeMember(userId, slug, memberId): Promise<{ id: string }>`
  - `DELETE /api/v1/families/:slug/members/:memberId`

- [ ] **Step 1: Write the failing test**

Add to `families.service.spec.ts`:

```typescript
describe('FamiliesService.removeMember', () => {
  let service: FamiliesService;
  let prisma: any;
  const family = {
    id: 'fam-1', slug: 'mutesi-family',
    members: [
      { id: 'mem-head', userId: 'head-1', authority: FamilyAuthority.HEAD, capabilities: [], removedAt: null, user: { fullName: 'Head', email: 'h@x.com', avatarUrl: null } },
      { id: 'mem-2', userId: 'u-2', authority: FamilyAuthority.MEMBER, capabilities: [], removedAt: null, user: { fullName: 'Mem', email: 'm@x.com', avatarUrl: null } },
    ],
  };
  beforeEach(async () => {
    prisma = {
      family: { findUnique: jest.fn().mockResolvedValue(family) },
      $transaction: jest.fn(async (cb: any) =>
        cb({
          familyMember: { update: jest.fn().mockResolvedValue({ id: 'mem-2' }) },
          familyAuditEvent: { create: jest.fn().mockResolvedValue({}) },
        }),
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(FamiliesService);
  });

  it('lets a HEAD soft-remove a member', async () => {
    const result = await service.removeMember('head-1', 'mutesi-family', 'mem-2');
    expect(result.id).toBe('mem-2');
  });

  it('blocks removing the last HEAD', async () => {
    await expect(
      service.removeMember('head-1', 'mutesi-family', 'mem-head'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && pnpm jest families.service.spec`
Expected: FAIL — `service.removeMember` is not a function.

- [ ] **Step 3: Implement `removeMember`**

```typescript
  async removeMember(
    userId: string,
    slug: string,
    memberId: string,
  ): Promise<{ id: string }> {
    const { family, membership } = await this.requireMembership(userId, slug);
    const target = family.members.find((m) => m.id === memberId);
    if (!target) {
      throw new NotFoundException('Member not found.');
    }
    if (!can(membership, FamilyCapability.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You cannot manage members.');
    }
    if (!canManageTarget(membership, target)) {
      throw new ForbiddenException('You cannot remove this member.');
    }
    if (target.authority === FamilyAuthority.HEAD) {
      const headCount = family.members.filter(
        (m) => m.authority === FamilyAuthority.HEAD,
      ).length;
      if (headCount <= 1) {
        throw new ForbiddenException('A family must keep at least one head.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.familyMember.update({
        where: { id: memberId },
        data: { removedAt: new Date() },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: 'MEMBER_REMOVED',
          targetMemberId: memberId,
          before: { authority: target.authority },
        },
      });
    });

    return { id: memberId };
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && pnpm jest families.service.spec`
Expected: PASS.

- [ ] **Step 5: Wire the controller route**

Add `Delete` to the `@nestjs/common` imports, then:

```typescript
  @Delete(':slug/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a member from the family (soft delete)' })
  @ApiOkResponse({ description: 'Member removed.' })
  @ApiNotFoundResponse({ description: 'Family or member not found.' })
  async removeMember(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
  ) {
    const removed = await this.familiesService.removeMember(
      userId,
      slug,
      memberId,
    );
    return { data: removed, message: 'Member removed successfully.' };
  }
```

- [ ] **Step 6: Typecheck + commit**

Run: `cd backend && pnpm tsc --noEmit && pnpm jest families.service.spec`
Expected: clean + PASS.

```bash
git add backend/src/families
git commit -m "feat(family): add soft-remove member endpoint"
```

---

## Task 7: Transfer head

**Files:**
- Modify: `backend/src/families/families.service.ts`
- Modify: `backend/src/families/families.controller.ts`
- Modify: `backend/src/families/families.service.spec.ts`

**Interfaces:**
- Produces:
  - `FamiliesService.grantHead(userId, slug, memberId): Promise<{ id: string }>` — promotes the target to HEAD with all capabilities (the actor keeps HEAD; this is "grant head", multiple heads allowed).
  - `POST /api/v1/families/:slug/members/:memberId/transfer-head`

- [ ] **Step 1: Write the failing test**

```typescript
describe('FamiliesService.grantHead', () => {
  let service: FamiliesService;
  let prisma: any;
  const family = {
    id: 'fam-1', slug: 'mutesi-family',
    members: [
      { id: 'mem-head', userId: 'head-1', authority: FamilyAuthority.HEAD, capabilities: [], removedAt: null, user: { fullName: 'Head', email: 'h@x.com', avatarUrl: null } },
      { id: 'mem-2', userId: 'u-2', authority: FamilyAuthority.MEMBER, capabilities: [], removedAt: null, user: { fullName: 'Mem', email: 'm@x.com', avatarUrl: null } },
    ],
  };
  beforeEach(async () => {
    prisma = {
      family: { findUnique: jest.fn().mockResolvedValue(family) },
      $transaction: jest.fn(async (cb: any) =>
        cb({
          familyMember: { update: jest.fn().mockResolvedValue({ id: 'mem-2' }) },
          familyAuditEvent: { create: jest.fn().mockResolvedValue({}) },
        }),
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(FamiliesService);
  });

  it('lets a HEAD grant head to another member', async () => {
    const result = await service.grantHead('head-1', 'mutesi-family', 'mem-2');
    expect(result.id).toBe('mem-2');
  });

  it('blocks a non-HEAD from granting head', async () => {
    prisma.family.findUnique.mockResolvedValue({
      ...family,
      members: [
        { id: 'mem-a', userId: 'admin-1', authority: FamilyAuthority.ADMIN, capabilities: [FamilyCapability.MANAGE_MEMBERS], removedAt: null, user: { fullName: 'Admin', email: 'a@x.com', avatarUrl: null } },
        family.members[1],
      ],
    });
    await expect(
      service.grantHead('admin-1', 'mutesi-family', 'mem-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && pnpm jest families.service.spec`
Expected: FAIL — `service.grantHead` is not a function.

- [ ] **Step 3: Implement `grantHead`**

```typescript
  async grantHead(
    userId: string,
    slug: string,
    memberId: string,
  ): Promise<{ id: string }> {
    const { family, membership } = await this.requireMembership(userId, slug);
    if (membership.authority !== FamilyAuthority.HEAD) {
      throw new ForbiddenException('Only a head can grant head.');
    }
    const target = family.members.find((m) => m.id === memberId);
    if (!target) {
      throw new NotFoundException('Member not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.familyMember.update({
        where: { id: memberId },
        data: {
          authority: FamilyAuthority.HEAD,
          capabilities: DEFAULT_CAPABILITIES[FamilyAuthority.HEAD],
        },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: 'HEAD_GRANTED',
          targetMemberId: memberId,
          before: { authority: target.authority },
          after: { authority: FamilyAuthority.HEAD },
        },
      });
    });

    return { id: memberId };
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && pnpm jest families.service.spec`
Expected: PASS.

- [ ] **Step 5: Wire the controller route**

```typescript
  @Post(':slug/members/:memberId/transfer-head')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Grant head authority to another member' })
  @ApiOkResponse({ description: 'Head granted.' })
  @ApiNotFoundResponse({ description: 'Family or member not found.' })
  async grantHead(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
  ) {
    const result = await this.familiesService.grantHead(userId, slug, memberId);
    return { data: result, message: 'Head granted successfully.' };
  }
```

- [ ] **Step 6: Typecheck + commit**

Run: `cd backend && pnpm tsc --noEmit && pnpm jest families.service.spec`
Expected: clean + PASS.

```bash
git add backend/src/families
git commit -m "feat(family): add grant-head endpoint"
```

---

## Task 8: Family settings get/update

**Files:**
- Create: `backend/src/families/dto/update-family-settings.dto.ts`
- Modify: `backend/src/families/families.service.ts`
- Modify: `backend/src/families/families.controller.ts`
- Modify: `backend/src/families/families.service.spec.ts`

**Interfaces:**
- Produces:
  - `UpdateFamilySettingsDto { name?; type?; defaultCurrency?; contributionCadence?; description? }`
  - `FamiliesService.updateSettings(userId, slug, dto): Promise<FamilyDetail>` (reuses `getBySlugForUser` for the read shape)
  - `PATCH /api/v1/families/:slug/settings`
  - (Settings read uses the existing `GET /:slug`; no new GET needed.)

- [ ] **Step 1: Write the failing test**

```typescript
describe('FamiliesService.updateSettings', () => {
  let service: FamiliesService;
  let prisma: any;
  const family = {
    id: 'fam-1', slug: 'mutesi-family',
    members: [
      { id: 'mem-head', userId: 'head-1', authority: FamilyAuthority.HEAD, capabilities: [], removedAt: null, user: { fullName: 'Head', email: 'h@x.com', avatarUrl: null } },
      { id: 'mem-2', userId: 'u-2', authority: FamilyAuthority.MEMBER, capabilities: [], removedAt: null, user: { fullName: 'Mem', email: 'm@x.com', avatarUrl: null } },
    ],
  };
  beforeEach(async () => {
    prisma = {
      family: {
        findUnique: jest.fn().mockResolvedValue(family),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(async (cb: any) =>
        cb({
          family: { update: jest.fn().mockResolvedValue({}) },
          familyAuditEvent: { create: jest.fn().mockResolvedValue({}) },
        }),
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(FamiliesService);
    jest
      .spyOn(service, 'getBySlugForUser')
      .mockResolvedValue({ id: 'fam-1' } as any);
  });

  it('lets a HEAD update settings', async () => {
    const result = await service.updateSettings('head-1', 'mutesi-family', {
      name: 'New Name',
    });
    expect(result.id).toBe('fam-1');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('blocks a plain member without MANAGE_FAMILY_SETTINGS', async () => {
    await expect(
      service.updateSettings('u-2', 'mutesi-family', { name: 'X' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && pnpm jest families.service.spec`
Expected: FAIL — `service.updateSettings` is not a function.

- [ ] **Step 3: Create the DTO**

Create `backend/src/families/dto/update-family-settings.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { FAMILY_CADENCES, FAMILY_CURRENCIES } from './create-family.dto';

export class UpdateFamilySettingsDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({ enum: FamilyType })
  @IsOptional()
  @IsEnum(FamilyType)
  type?: FamilyType;

  @ApiPropertyOptional({ enum: FAMILY_CURRENCIES })
  @IsOptional()
  @IsIn(FAMILY_CURRENCIES as unknown as string[])
  defaultCurrency?: string;

  @ApiPropertyOptional({ enum: FAMILY_CADENCES })
  @IsOptional()
  @IsIn(FAMILY_CADENCES as unknown as string[])
  contributionCadence?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
```

- [ ] **Step 4: Implement `updateSettings`**

```typescript
  async updateSettings(
    userId: string,
    slug: string,
    dto: UpdateFamilySettingsDto,
  ): Promise<FamilyDetail> {
    const { family, membership } = await this.requireMembership(userId, slug);
    if (!can(membership, FamilyCapability.MANAGE_FAMILY_SETTINGS)) {
      throw new ForbiddenException('You cannot change family settings.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.family.update({
        where: { id: family.id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.defaultCurrency !== undefined
            ? { defaultCurrency: dto.defaultCurrency }
            : {}),
          ...(dto.contributionCadence !== undefined
            ? { contributionCadence: dto.contributionCadence }
            : {}),
          ...(dto.description !== undefined
            ? { description: dto.description || null }
            : {}),
        },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: 'SETTINGS_CHANGED',
          after: { ...dto },
        },
      });
    });

    return this.getBySlugForUser(userId, slug);
  }
```

Add `import type { UpdateFamilySettingsDto } from './dto/update-family-settings.dto';`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && pnpm jest families.service.spec`
Expected: PASS.

- [ ] **Step 6: Wire the controller route**

```typescript
  @Patch(':slug/settings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update family settings' })
  @ApiOkResponse({ description: 'Settings updated.' })
  @ApiNotFoundResponse({ description: 'Family not found or not a member.' })
  async updateSettings(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
    @Body() dto: UpdateFamilySettingsDto,
  ) {
    const family = await this.familiesService.updateSettings(userId, slug, dto);
    return { data: family, message: 'Family settings updated successfully.' };
  }
```

- [ ] **Step 7: Typecheck + commit**

Run: `cd backend && pnpm tsc --noEmit && pnpm jest families.service.spec`
Expected: clean + PASS.

```bash
git add backend/src/families
git commit -m "feat(family): add family settings update endpoint"
```

---

## Task 9: Audit list endpoint

**Files:**
- Modify: `backend/src/families/families.service.ts`
- Modify: `backend/src/families/families.controller.ts`
- Modify: `backend/src/families/families.service.spec.ts`

**Interfaces:**
- Produces:
  - `type FamilyAuditSummary = { id; action; actorId; targetMemberId: string | null; createdAt: Date }`
  - `FamiliesService.listAudit(userId, slug): Promise<FamilyAuditSummary[]>`
  - `GET /api/v1/families/:slug/audit`

- [ ] **Step 1: Write the failing test**

```typescript
describe('FamiliesService.listAudit', () => {
  let service: FamiliesService;
  let prisma: any;
  const family = {
    id: 'fam-1', slug: 'mutesi-family',
    members: [
      { id: 'mem-head', userId: 'head-1', authority: FamilyAuthority.HEAD, capabilities: [], removedAt: null, user: { fullName: 'Head', email: 'h@x.com', avatarUrl: null } },
      { id: 'mem-2', userId: 'u-2', authority: FamilyAuthority.MEMBER, capabilities: [], removedAt: null, user: { fullName: 'Mem', email: 'm@x.com', avatarUrl: null } },
    ],
  };
  beforeEach(async () => {
    prisma = {
      family: { findUnique: jest.fn().mockResolvedValue(family) },
      familyAuditEvent: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'ev-1', action: 'MEMBER_INVITED', actorId: 'head-1', targetMemberId: null, createdAt: new Date('2026-06-28T07:00:00.000Z') },
        ]),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(FamiliesService);
  });

  it('lets a HEAD read the audit log', async () => {
    const result = await service.listAudit('head-1', 'mutesi-family');
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('MEMBER_INVITED');
  });

  it('blocks a plain member', async () => {
    await expect(
      service.listAudit('u-2', 'mutesi-family'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && pnpm jest families.service.spec`
Expected: FAIL — `service.listAudit` is not a function.

- [ ] **Step 3: Implement `listAudit`**

```typescript
  async listAudit(userId: string, slug: string): Promise<FamilyAuditSummary[]> {
    const { family, membership } = await this.requireMembership(userId, slug);
    if (!can(membership, FamilyCapability.MANAGE_MEMBERS)) {
      throw new ForbiddenException('You cannot view the audit log.');
    }
    const events = await this.prisma.familyAuditEvent.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return events.map((e) => ({
      id: e.id,
      action: e.action,
      actorId: e.actorId,
      targetMemberId: e.targetMemberId,
      createdAt: e.createdAt,
    }));
  }
```

Add the type near the other exported types:

```typescript
export type FamilyAuditSummary = {
  id: string;
  action: string;
  actorId: string;
  targetMemberId: string | null;
  createdAt: Date;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && pnpm jest families.service.spec`
Expected: PASS.

- [ ] **Step 5: Wire the controller route + run full backend suite**

```typescript
  @Get(':slug/audit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List recent family permission and member changes' })
  @ApiOkResponse({ description: 'Audit events, newest first.' })
  @ApiNotFoundResponse({ description: 'Family not found or not a member.' })
  async listAudit(
    @CurrentUserId() userId: string,
    @Param('slug') slug: string,
  ) {
    const events = await this.familiesService.listAudit(userId, slug);
    return { data: events, message: 'Audit events retrieved successfully.' };
  }
```

Run: `cd backend && pnpm tsc --noEmit && pnpm jest families`
Expected: all family specs PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/families
git commit -m "feat(family): add audit log endpoint"
```

---

## Task 10: Family type at creation (backend)

**Files:**
- Modify: `backend/src/families/dto/create-family.dto.ts`
- Modify: `backend/src/families/families.service.ts`

**Interfaces:**
- Consumes: `FamilyType` from `@prisma/client`.
- Produces: `CreateFamilyDto.type` (optional, defaults to NUCLEAR); `create()` persists `type`; `CreatedFamily.type`.

- [ ] **Step 1: Add `type` to the DTO**

In `backend/src/families/dto/create-family.dto.ts`, add the import `import { FamilyType } from '@prisma/client';` and the field after `contributionCadence`:

```typescript
  @ApiPropertyOptional({ enum: FamilyType, example: FamilyType.NUCLEAR })
  @IsOptional()
  @IsEnum(FamilyType)
  type?: FamilyType;
```

Add `IsEnum` to the `class-validator` import list.

- [ ] **Step 2: Persist `type` in `create()`**

In `families.service.ts` `create()`, add to the `family.create` `data` object after `contributionCadence`:

```typescript
        type: dto.type ?? FamilyType.NUCLEAR,
```

Add `type: family.type,` to the returned object and `type: FamilyType;` to the `CreatedFamily` type. Add `FamilyType` to the `@prisma/client` import.

- [ ] **Step 3: Typecheck**

Run: `cd backend && pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add backend/src/families
git commit -m "feat(family): accept family type on creation"
```

---

## Task 11: Family type on the create form (frontend)

**Files:**
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/components/family/create-family-form.tsx`

**Interfaces:**
- Consumes: `copy.familyTypes`, `copy.familyTypeLabel`, `copy.familyTypePlaceholder` from `messages.CreateFamilyForm`.
- Produces: create-family POST body includes `type`.

- [ ] **Step 1: Add copy to `en.json`**

In `frontend/src/messages/en.json`, inside `CreateFamilyForm`, after the `cadencePlaceholder` line add:

```json
    "familyTypeLabel": "Family type",
    "familyTypePlaceholder": "Select a family type",
```

And after the `cadences` array (before the closing `}` of `CreateFamilyForm`) add:

```json
    "familyTypes": [
      { "value": "NUCLEAR", "label": "Nuclear family" },
      { "value": "JOINT_EXTENDED", "label": "Joint / extended family" },
      { "value": "SINGLE_PARENT", "label": "Single-parent family" },
      { "value": "BLENDED", "label": "Blended family" },
      { "value": "ADOPTIVE", "label": "Adoptive family" }
    ]
```

(Ensure commas are valid JSON: the line before `"familyTypes"` must end with a comma.)

- [ ] **Step 2: Extend the form copy type + schema + default + field**

In `create-family-form.tsx`:
- Add to `CreateFamilyFormCopy`: `familyTypeLabel: string; familyTypePlaceholder: string; familyTypes: SelectOption[];`.
- Add to `CreateFamilyFormValues`: `type: string;`.
- In `getCreateFamilySchema`, add to the object: `type: z.string().min(1, "Select a family type"),`.
- In `defaultValues`, add `type: "NUCLEAR",`.
- In `transform`, add `type: values.type,` to the returned object.
- Add a select field after the cadence field:

```tsx
        <CommonFormField
          control={form.control}
          name="type"
          label={copy.familyTypeLabel}
          placeholder={copy.familyTypePlaceholder}
          fieldType="select"
          selectOptions={copy.familyTypes}
          required
        />
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && bunx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/messages/en.json frontend/src/components/family/create-family-form.tsx
git commit -m "feat(family): choose family type when creating a family"
```

---

## Task 12: Frontend access types, capabilities hook, members page rework

**Files:**
- Create: `frontend/src/lib/family-access.ts`
- Modify: `frontend/src/app/family/[familyName]/members/page.tsx`

**Interfaces:**
- Consumes: `FamilyDetail` shape from the backend `GET /:slug` (now `authority`, `capabilities`, members with `kinshipLabel/kinshipCustom/capabilities`).
- Produces:
  - `type FamilyAuthority`, `type FamilyCapability`, `type FamilyKinship`
  - `AUTHORITY_LABELS`, `KINSHIP_LABELS`, `CAPABILITY_LABELS`
  - `hasCapability(detail, cap): boolean`

- [ ] **Step 1: Create the shared access module**

Create `frontend/src/lib/family-access.ts`:

```typescript
export type FamilyAuthority = "HEAD" | "ADMIN" | "MEMBER";

export type FamilyCapability =
  | "MANAGE_FAMILY_SETTINGS"
  | "MANAGE_MEMBERS"
  | "MANAGE_SAVINGS"
  | "MANAGE_CONTRIBUTIONS"
  | "RECORD_INCOME"
  | "RECORD_EXPENSE"
  | "APPROVE_EXPENSE"
  | "MANAGE_DEBTS"
  | "MANAGE_PROJECTS"
  | "MANAGE_EVENTS"
  | "MANAGE_ANNOUNCEMENTS"
  | "MANAGE_DOCUMENTS"
  | "VIEW_REPORTS"
  | "EXPORT_REPORTS";

export type FamilyKinship =
  | "SON" | "DAUGHTER" | "FATHER" | "MOTHER" | "BROTHER" | "SISTER"
  | "UNCLE" | "AUNT" | "GRANDFATHER" | "GRANDMOTHER" | "COUSIN"
  | "IN_LAW" | "FAMILY_FRIEND" | "NEIGHBOR" | "CLEANER" | "OTHER";

export const AUTHORITY_LABELS: Record<FamilyAuthority, string> = {
  HEAD: "Head",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export const KINSHIP_LABELS: Record<FamilyKinship, string> = {
  SON: "Son", DAUGHTER: "Daughter", FATHER: "Father", MOTHER: "Mother",
  BROTHER: "Brother", SISTER: "Sister", UNCLE: "Uncle", AUNT: "Aunt",
  GRANDFATHER: "Grandfather", GRANDMOTHER: "Grandmother", COUSIN: "Cousin",
  IN_LAW: "In-law", FAMILY_FRIEND: "Family friend", NEIGHBOR: "Neighbor",
  CLEANER: "Cleaner", OTHER: "Other",
};

export const CAPABILITY_LABELS: Record<FamilyCapability, string> = {
  MANAGE_FAMILY_SETTINGS: "Manage family settings",
  MANAGE_MEMBERS: "Manage members",
  MANAGE_SAVINGS: "Manage savings",
  MANAGE_CONTRIBUTIONS: "Manage contributions",
  RECORD_INCOME: "Record income",
  RECORD_EXPENSE: "Record expense",
  APPROVE_EXPENSE: "Approve expense",
  MANAGE_DEBTS: "Manage debts",
  MANAGE_PROJECTS: "Manage projects",
  MANAGE_EVENTS: "Manage events",
  MANAGE_ANNOUNCEMENTS: "Manage announcements",
  MANAGE_DOCUMENTS: "Manage documents",
  VIEW_REPORTS: "View reports",
  EXPORT_REPORTS: "Export reports",
};

export const ALL_CAPABILITIES = Object.keys(
  CAPABILITY_LABELS,
) as FamilyCapability[];

export function hasCapability(
  source: { authority: FamilyAuthority; capabilities: FamilyCapability[] },
  cap: FamilyCapability,
): boolean {
  return source.authority === "HEAD" || source.capabilities.includes(cap);
}
```

- [ ] **Step 2: Rework the members page to use authority + capabilities + kinship**

In `frontend/src/app/family/[familyName]/members/page.tsx` apply these changes:

- Remove the local `type FamilyMemberRole` and `ROLE_LABELS`/`ASSIGNABLE_ROLES` and import from the new module instead:

```tsx
import {
  AUTHORITY_LABELS,
  type FamilyAuthority,
  type FamilyCapability,
  type FamilyKinship,
  hasCapability,
  KINSHIP_LABELS,
} from "@/lib/family-access";
```

- Update `FamilyMemberSummary` and `FamilyDetail` types: replace `role: FamilyMemberRole` on the member with:

```tsx
  authority: FamilyAuthority;
  kinshipLabel: FamilyKinship | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
```

and on `FamilyDetail` replace `role: FamilyMemberRole;` with `authority: FamilyAuthority; capabilities: FamilyCapability[];`.

- Define the assignable authority list and managed check:

```tsx
const ASSIGNABLE_AUTHORITIES: { value: FamilyAuthority; label: string }[] = [
  { value: "ADMIN", label: AUTHORITY_LABELS.ADMIN },
  { value: "MEMBER", label: AUTHORITY_LABELS.MEMBER },
];
```

- In `MembersManager`, replace `const canManage = family.role === "OWNER" || family.role === "ADMIN";` with:

```tsx
  const canManage = hasCapability(family, "MANAGE_MEMBERS");
```

- In `MemberRow`, replace the `editable` line with:

```tsx
  const editable = canManage && member.authority !== "HEAD";
```

  and change `changeRole`/`<Select>` to operate on `authority`: rename to `changeAuthority`, send `{ authority }` in the PATCH body, set `value={member.authority}`, map over `ASSIGNABLE_AUTHORITIES`, and replace the read-only `<Badge>` text with `{AUTHORITY_LABELS[member.authority]}`.

- Show kinship under the name. After the "Joined ..." span add:

```tsx
          {member.kinshipLabel ? (
            <span className="text-muted-foreground text-xs">
              {member.kinshipLabel === "OTHER" && member.kinshipCustom
                ? member.kinshipCustom
                : KINSHIP_LABELS[member.kinshipLabel]}
            </span>
          ) : null}
```

- In `AddMemberForm`, change the schema/values/transform from `role` to `authority` (`authority: z.enum(["ADMIN", "MEMBER"])`, default `authority: "MEMBER"`, transform sends `{ email, authority }`), point `request.url` at `/families/${encodeURIComponent(familySlug)}/members`, and update the `CommonFormField name="role"` to `name="authority"` with `selectOptions={ASSIGNABLE_AUTHORITIES}`.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && bunx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/family-access.ts "frontend/src/app/family/[familyName]/members/page.tsx"
git commit -m "feat(family): members page uses authority, kinship, capabilities"
```

---

## Task 13: Family settings page (tabs)

**Files:**
- Modify: `frontend/src/app/family/[familyName]/settings/page.tsx`
- Create: `frontend/src/components/family/family-settings.tsx`

**Interfaces:**
- Consumes: `GET /families/:slug`, `PATCH /families/:slug/settings`, `GET /families/:slug/audit`, `PATCH /families/:slug/members/:memberId`, `lib/family-access`.
- Produces: a tabbed settings screen (General / Members & Access / Audit).

- [ ] **Step 1: Ensure shadcn `tabs` and `checkbox` exist**

Run: `cd frontend && bunx shadcn@latest add tabs checkbox`
Expected: components created/confirmed under `src/components/ui/`. (If already present, the CLI reports they exist — safe.)

- [ ] **Step 2: Replace the settings page stub to render the client component**

Replace `frontend/src/app/family/[familyName]/settings/page.tsx` with:

```tsx
import { FamilySettings } from "@/components/family/family-settings";

export default async function FamilySettingsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  return <FamilySettings familySlug={familyName} />;
}
```

- [ ] **Step 3: Create the settings client component**

Create `frontend/src/components/family/family-settings.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ALL_CAPABILITIES,
  AUTHORITY_LABELS,
  CAPABILITY_LABELS,
  type FamilyAuthority,
  type FamilyCapability,
  type FamilyKinship,
  hasCapability,
  KINSHIP_LABELS,
} from "@/lib/family-access";
import apiRequest from "@/service/api";

type Member = {
  id: string;
  fullName: string;
  authority: FamilyAuthority;
  kinshipLabel: FamilyKinship | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
};

type FamilyType =
  | "NUCLEAR" | "JOINT_EXTENDED" | "SINGLE_PARENT" | "BLENDED" | "ADOPTIVE";

type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  type: FamilyType;
  defaultCurrency: string;
  contributionCadence: string;
  description: string | null;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  members: Member[];
};

const FAMILY_TYPE_OPTIONS: { value: FamilyType; label: string }[] = [
  { value: "NUCLEAR", label: "Nuclear family" },
  { value: "JOINT_EXTENDED", label: "Joint / extended family" },
  { value: "SINGLE_PARENT", label: "Single-parent family" },
  { value: "BLENDED", label: "Blended family" },
  { value: "ADOPTIVE", label: "Adoptive family" },
];

type AuditEvent = {
  id: string;
  action: string;
  actorId: string;
  targetMemberId: string | null;
  createdAt: string;
};

export function FamilySettings({ familySlug }: { familySlug: string }) {
  const [family, setFamily] = useState<FamilyDetail>();
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    const res = await apiRequest<undefined, FamilyDetail>(
      "get",
      `/families/${encodeURIComponent(familySlug)}`,
    );
    if (res.ok && res.data) {
      setFamily(res.data);
    } else {
      setError(res.message ?? "Unable to load this family.");
    }
  }, [familySlug]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Cannot open settings</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!family) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const canManageMembers = hasCapability(family, "MANAGE_MEMBERS");
  const canManageSettings = hasCapability(family, "MANAGE_FAMILY_SETTINGS");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl tracking-tight">Family settings</h1>
        <p className="text-muted-foreground text-sm">{family.name}</p>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          {canManageSettings ? (
            <TabsTrigger value="general">General</TabsTrigger>
          ) : null}
          <TabsTrigger value="members">Members &amp; access</TabsTrigger>
          {canManageMembers ? (
            <TabsTrigger value="audit">Audit</TabsTrigger>
          ) : null}
        </TabsList>

        {canManageSettings ? (
          <TabsContent value="general">
            <GeneralTab
              familySlug={familySlug}
              family={family}
              onSaved={load}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="members" className="flex flex-col gap-3">
          {family.members.map((member) => (
            <MemberAccessCard
              key={member.id}
              familySlug={familySlug}
              member={member}
              actor={family}
              onChanged={load}
            />
          ))}
        </TabsContent>

        {canManageMembers ? (
          <TabsContent value="audit">
            <AuditTab familySlug={familySlug} />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function MemberAccessCard({
  familySlug,
  member,
  actor,
  onChanged,
}: {
  familySlug: string;
  member: Member;
  actor: { authority: FamilyAuthority; capabilities: FamilyCapability[] };
  onChanged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const editable =
    hasCapability(actor, "MANAGE_MEMBERS") && member.authority !== "HEAD";

  const toggle = async (cap: FamilyCapability, on: boolean) => {
    const next = on
      ? [...member.capabilities, cap]
      : member.capabilities.filter((c) => c !== cap);
    setPending(true);
    const res = await apiRequest(
      "patch",
      `/families/${encodeURIComponent(familySlug)}/members/${encodeURIComponent(member.id)}`,
      { capabilities: next },
    );
    setPending(false);
    if (res.ok) onChanged();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{member.fullName}</span>
          <Badge variant="outline">{AUTHORITY_LABELS[member.authority]}</Badge>
        </CardTitle>
        <CardDescription>
          {member.kinshipLabel
            ? member.kinshipLabel === "OTHER" && member.kinshipCustom
              ? member.kinshipCustom
              : KINSHIP_LABELS[member.kinshipLabel]
            : "No relationship set"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {ALL_CAPABILITIES.map((cap) => {
          const granted =
            member.authority === "HEAD" || member.capabilities.includes(cap);
          const actorCanGrant = hasCapability(actor, cap);
          return (
            <label
              key={cap}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                checked={granted}
                disabled={
                  !editable || pending || member.authority === "HEAD" || !actorCanGrant
                }
                onCheckedChange={(value) => toggle(cap, value === true)}
              />
              <span className="text-muted-foreground">
                {CAPABILITY_LABELS[cap]}
              </span>
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}

const CURRENCY_OPTIONS = ["RWF", "USD", "EUR", "KES", "TZS", "UGX"];
const CADENCE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As needed" },
  { value: "project-based", label: "Project based" },
  { value: "event-based", label: "Event based" },
];

function GeneralTab({
  familySlug,
  family,
  onSaved,
}: {
  familySlug: string;
  family: FamilyDetail;
  onSaved: () => void;
}) {
  const [name, setName] = useState(family.name);
  const [type, setType] = useState<FamilyType>(family.type);
  const [currency, setCurrency] = useState(family.defaultCurrency);
  const [cadence, setCadence] = useState(family.contributionCadence);
  const [description, setDescription] = useState(family.description ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    setPending(true);
    setError(undefined);
    const res = await apiRequest(
      "patch",
      `/families/${encodeURIComponent(familySlug)}/settings`,
      {
        name,
        type,
        defaultCurrency: currency,
        contributionCadence: cadence,
        description,
      },
    );
    setPending(false);
    if (res.ok) {
      onSaved();
    } else {
      setError(res.message ?? "Unable to save settings.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">General</CardTitle>
        <CardDescription>Family name, type, and money defaults.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-sm">Family name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-sm">Family type</span>
          <Select value={type} onValueChange={(v) => setType(v as FamilyType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FAMILY_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-sm">Default currency</span>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-sm">Contribution rhythm</span>
            <Select value={cadence} onValueChange={setCadence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CADENCE_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-sm">Family note</span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditTab({ familySlug }: { familySlug: string }) {
  const [events, setEvents] = useState<AuditEvent[]>();

  useEffect(() => {
    let active = true;
    apiRequest<undefined, AuditEvent[]>(
      "get",
      `/families/${encodeURIComponent(familySlug)}/audit`,
    ).then((res) => {
      if (active && res.ok && res.data) setEvents(res.data);
    });
    return () => {
      active = false;
    };
  }, [familySlug]);

  if (!events) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent changes</CardTitle>
        <CardDescription>Permission and member activity.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between border-border/60 border-b py-2 text-sm last:border-b-0"
            >
              <span>{event.action.replaceAll("_", " ").toLowerCase()}</span>
              <span className="text-muted-foreground text-xs">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Typecheck + lint the settings work**

Run: `cd frontend && bunx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "frontend/src/app/family/[familyName]/settings/page.tsx" frontend/src/components/family/family-settings.tsx frontend/src/components/ui
git commit -m "feat(family): add tabbed family settings with member access and audit"
```

---

## Final Verification

- [ ] **Backend:** `cd backend && pnpm tsc --noEmit && pnpm jest families` → all PASS.
- [ ] **Frontend:** `cd frontend && bunx tsc --noEmit` → clean.
- [ ] **Manual smoke (optional, if a dev DB is available):** create a family (pick a type), invite a member, open settings → Members & Access, grant a capability, confirm it persists after reload, and that the Audit tab shows the change.

---

## Notes / Out of scope

- Capability enforcement inside money modules (savings, income, expense, etc.) is wired when each module is built; this plan only defines the catalog and enforces `MANAGE_MEMBERS` / `MANAGE_FAMILY_SETTINGS`.
- Invite acceptance flow (`/family/invite/:token`) already exists in scope from earlier work; this plan stores `authority/kinship/capabilities` on the invite so acceptance applies them. If the accept handler is not yet implemented, applying these fields on accept is a follow-up task in that flow.
- Custom named roles (Treasurer, Secretary) are deferred.
```
