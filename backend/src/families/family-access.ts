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

export function assertGrantableSubset(
  actor: AccessMember,
  requested: FamilyCapability[],
): void {
  const ungrantable = requested.filter((capability) => !can(actor, capability));

  if (ungrantable.length > 0) {
    throw new ForbiddenException(
      'You cannot grant a capability you do not have.',
    );
  }
}
