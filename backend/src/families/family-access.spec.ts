import { ForbiddenException } from '@nestjs/common';
import { FamilyAuthority, FamilyCapability } from '@prisma/client';
import { assertGrantableSubset, can, canManageTarget } from './family-access';

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
        {
          authority: FamilyAuthority.MEMBER,
          capabilities: [FamilyCapability.RECORD_INCOME],
        },
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
      assertGrantableSubset(adminWithMembers, [
        FamilyCapability.APPROVE_EXPENSE,
      ]),
    ).toThrow(ForbiddenException);
  });

  it('allows granting a capability the actor holds', () => {
    expect(() =>
      assertGrantableSubset(adminWithMembers, [
        FamilyCapability.MANAGE_MEMBERS,
      ]),
    ).not.toThrow();
  });
});
