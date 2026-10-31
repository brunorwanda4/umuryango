import { createHash } from 'node:crypto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  CategoryStatus,
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyContactStatus,
  FamilyContactType,
  IncomePaymentStatus,
  IncomeRecurrence,
  TransactionScope,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { SyncService } from './sync.service';

const baseTime = new Date('2026-10-31T10:00:00.000Z');
const laterTime = new Date('2026-10-31T11:00:00.000Z');

function makeFamily(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fam-1',
    name: 'Mutesi Family',
    slug: 'mutesi-family',
    country: 'RW',
    defaultCurrency: 'RWF',
    contributionCadence: 'monthly',
    type: 'NUCLEAR',
    description: 'Extended family workspace',
    createdById: 'user-head',
    createdAt: baseTime,
    updatedAt: baseTime,
    ...overrides,
  };
}

function makeMembership(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mem-1',
    familyId: 'fam-1',
    userId: 'user-1',
    authority: FamilyAuthority.MEMBER,
    capabilities: [
      FamilyCapability.RECORD_EXPENSE,
      FamilyCapability.RECORD_INCOME,
      FamilyCapability.MANAGE_CONTRIBUTIONS,
      FamilyCapability.MANAGE_PROJECTS,
      FamilyCapability.MANAGE_CONTACTS,
    ],
    removedAt: null,
    createdAt: baseTime,
    updatedAt: baseTime,
    ...overrides,
  };
}

describe('SyncService', () => {
  let service: SyncService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      family: {
        findFirst: jest.fn(),
      },
      familyMember: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      familyTransactionCategory: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      familyTransaction: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
      },
      familyReceipt: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      familyContributionPlan: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      familyContributionCycle: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      familyContributionPayment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      familyProject: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      familyContact: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
      },
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      familySyncMutation: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      familyAuditEvent: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    service = new SyncService(prisma);
  });

  describe('Family authorization, IDOR protection, and membership revocation', () => {
    it('rejects sync pull for a user who is not a member of the family (IDOR attempt)', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.pull('attacker-user', 'mutesi-family', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects sync push with ForbiddenException (MEMBERSHIP_REVOKED) when member was soft-removed', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(
        makeMembership({ removedAt: laterTime }),
      );

      await expect(
        service.push('user-1', 'mutesi-family', {
          contractVersion: '1.0.0',
          deviceId: 'dev-1',
          commands: [],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('Idempotent push, duplicate commands, and financial validation', () => {
    it('applies a valid offline expense command, writes an audit event, and stores a sync mutation receipt', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(makeMembership());
      prisma.familySyncMutation.findUnique.mockResolvedValue(null);
      prisma.familyTransactionCategory.findFirst.mockResolvedValue({
        id: 'cat-expense',
        familyId: 'fam-1',
        type: TransactionType.EXPENSE,
        scope: TransactionScope.FAMILY,
        status: CategoryStatus.ACTIVE,
        ownerId: null,
      });
      prisma.familyTransaction.findUnique.mockResolvedValue(null);
      prisma.familyTransaction.create.mockResolvedValue({
        id: 'tx-server-1',
        familyId: 'fam-1',
        categoryId: 'cat-expense',
        amountMinorUnits: 2500000n,
        currency: 'RWF',
        type: TransactionType.EXPENSE,
        scope: TransactionScope.FAMILY,
        status: TransactionStatus.PENDING,
        incomeRecurrence: IncomeRecurrence.ONE_TIME,
        paymentStatus: IncomePaymentStatus.NOT_EXPECTED,
        date: baseTime,
        description: 'School fees installment',
        paymentMethod: 'MOBILE_MONEY',
        notes: 'Paid via MoMo',
        receivedFrom: null,
        receivedBy: 'Sunrise Academy',
        createdById: 'user-1',
        approvedById: null,
        approvedAt: null,
        reversedAt: null,
        createdAt: laterTime,
        updatedAt: laterTime,
        category: { name: 'Education', icon: 'book', color: '#000' },
        createdBy: { fullName: 'Jean Mutesi' },
      });

      const response = await service.push('user-1', 'mutesi-family', {
        contractVersion: '1.0.0',
        deviceId: 'device-win-1',
        commands: [
          {
            idempotencyKey: 'idem-exp-001',
            localRecordId: 'local-tx-001',
            commandType: 'CREATE_EXPENSE',
            clientCreatedAt: baseTime.toISOString(),
            payload: {
              categoryId: 'cat-expense',
              amountMinorUnits: '2500000',
              currency: 'RWF',
              date: baseTime.toISOString(),
              description: 'School fees installment',
              paymentMethod: 'MOBILE_MONEY',
              notes: 'Paid via MoMo',
              receivedBy: 'Sunrise Academy',
            },
          },
        ],
      });

      expect(response.results).toHaveLength(1);
      expect(response.results[0]?.outcome).toBe('APPLIED');
      expect(response.results[0]?.serverRecordId).toBe('tx-server-1');
      expect(response.results[0]?.serverRecord?.amountMinorUnits).toBe(
        '2500000',
      );
      expect(response.results[0]?.serverRecord?.status).toBe('PENDING');
      expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            familyId: 'fam-1',
            actorId: 'user-1',
            action: FamilyAuditAction.TRANSACTION_CREATED,
          }),
        }),
      );
      expect(prisma.familySyncMutation.create).toHaveBeenCalledTimes(1);
    });

    it('returns DUPLICATE_IGNORED without creating a second transaction when the same idempotencyKey is retried', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(makeMembership());

      const cmd = {
        idempotencyKey: 'idem-exp-001',
        localRecordId: 'local-tx-001',
        commandType: 'CREATE_EXPENSE' as const,
        clientCreatedAt: baseTime.toISOString(),
        payload: {
          categoryId: 'cat-expense',
          amountMinorUnits: '2500000',
          currency: 'RWF',
          date: baseTime.toISOString(),
          description: 'School fees installment',
        },
      };

      const canonical = JSON.stringify({
        commandType: cmd.commandType,
        localRecordId: cmd.localRecordId,
        dependsOnLocalId: null,
        baseVersion: null,
        payload: cmd.payload,
      });
      const payloadHash = createHash('sha256').update(canonical).digest('hex');

      prisma.familySyncMutation.findUnique.mockResolvedValue({
        id: 'mut-1',
        familyId: 'fam-1',
        actorId: 'user-1',
        deviceId: 'device-win-1',
        idempotencyKey: 'idem-exp-001',
        localRecordId: 'local-tx-001',
        commandType: 'CREATE_EXPENSE',
        payloadHash,
        outcome: 'APPLIED',
        conflictCode: null,
        serverRecordId: 'tx-server-1',
        responseJson: {
          serverVersion: laterTime.toISOString(),
          serverRecord: { id: 'tx-server-1', amountMinorUnits: '2500000' },
        },
      });

      const response = await service.push('user-1', 'mutesi-family', {
        contractVersion: '1.0.0',
        deviceId: 'device-win-1',
        commands: [cmd],
      });

      expect(response.results[0]?.outcome).toBe('DUPLICATE_IGNORED');
      expect(response.results[0]?.serverRecordId).toBe('tx-server-1');
      expect(prisma.familyTransaction.create).not.toHaveBeenCalled();
    });

    it('returns CONFLICT with IDEMPOTENCY_KEY_REUSED if the same idempotencyKey is sent with a modified payload', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(makeMembership());
      prisma.familySyncMutation.findUnique.mockResolvedValue({
        id: 'mut-1',
        familyId: 'fam-1',
        actorId: 'user-1',
        deviceId: 'device-win-1',
        idempotencyKey: 'idem-exp-001',
        localRecordId: 'local-tx-001',
        commandType: 'CREATE_EXPENSE',
        payloadHash: 'different-hash-from-original',
        outcome: 'APPLIED',
        conflictCode: null,
        serverRecordId: 'tx-server-1',
        responseJson: {},
      });

      const response = await service.push('user-1', 'mutesi-family', {
        contractVersion: '1.0.0',
        deviceId: 'device-win-1',
        commands: [
          {
            idempotencyKey: 'idem-exp-001',
            localRecordId: 'local-tx-001',
            commandType: 'CREATE_EXPENSE',
            clientCreatedAt: baseTime.toISOString(),
            payload: {
              categoryId: 'cat-expense',
              amountMinorUnits: '9999999',
              currency: 'RWF',
              date: baseTime.toISOString(),
            },
          },
        ],
      });

      expect(response.results[0]?.outcome).toBe('CONFLICT');
      expect(response.results[0]?.conflictCode).toBe('IDEMPOTENCY_KEY_REUSED');
    });

    it('rejects offline expense when permission was revoked between offline creation and synchronization', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(
        makeMembership({
          authority: FamilyAuthority.MEMBER,
          capabilities: [], // RECORD_EXPENSE revoked before sync
        }),
      );
      prisma.familySyncMutation.findUnique.mockResolvedValue(null);

      const response = await service.push('user-1', 'mutesi-family', {
        contractVersion: '1.0.0',
        deviceId: 'device-android-1',
        commands: [
          {
            idempotencyKey: 'idem-exp-revoked',
            localRecordId: 'local-tx-revoked',
            commandType: 'CREATE_EXPENSE',
            clientCreatedAt: baseTime.toISOString(),
            payload: {
              categoryId: 'cat-expense',
              amountMinorUnits: '100000',
              currency: 'RWF',
              date: baseTime.toISOString(),
            },
          },
        ],
      });

      expect(response.results[0]?.outcome).toBe('REJECTED');
      expect(response.results[0]?.conflictCode).toBe('PERMISSION_DENIED');
      expect(prisma.familyTransaction.create).not.toHaveBeenCalled();
      expect(prisma.familyAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: FamilyAuditAction.SYNC_MUTATION_REJECTED,
          }),
        }),
      );
    });

    it('halts dependent child commands (e.g. ATTACH_RECEIPT) with PARENT_COMMAND_FAILED when parent CREATE_EXPENSE fails', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(
        makeMembership({ capabilities: [] }), // Parent will fail with PERMISSION_DENIED
      );
      prisma.familySyncMutation.findUnique.mockResolvedValue(null);

      const response = await service.push('user-1', 'mutesi-family', {
        contractVersion: '1.0.0',
        deviceId: 'device-1',
        commands: [
          {
            idempotencyKey: 'idem-parent-tx',
            localRecordId: 'local-parent-tx',
            commandType: 'CREATE_EXPENSE',
            clientCreatedAt: baseTime.toISOString(),
            payload: {
              categoryId: 'cat-expense',
              amountMinorUnits: '100000',
              currency: 'RWF',
              date: baseTime.toISOString(),
            },
          },
          {
            idempotencyKey: 'idem-child-receipt',
            localRecordId: 'local-receipt-1',
            commandType: 'ATTACH_RECEIPT',
            dependsOnLocalId: 'local-parent-tx',
            clientCreatedAt: baseTime.toISOString(),
            payload: {
              transactionId: 'local-parent-tx',
              fileName: 'receipt.jpg',
              fileType: 'image/jpeg',
              fileSizeBytes: 1024,
              storageKey: 'families/fam-1/receipts/receipt.jpg',
              checksumSha256: 'a'.repeat(64),
            },
          },
        ],
      });

      expect(response.results).toHaveLength(2);
      expect(response.results[0]?.conflictCode).toBe('PERMISSION_DENIED');
      expect(response.results[1]?.outcome).toBe('REJECTED');
      expect(response.results[1]?.conflictCode).toBe('PARENT_COMMAND_FAILED');
      expect(prisma.familyReceipt.create).not.toHaveBeenCalled();
    });
  });

  describe('Conflict detection (VERSION_CONFLICT, APPROVAL_STATE_CONFLICT, ATTACHMENT_CHECKSUM_MISMATCH)', () => {
    it('returns APPROVAL_STATE_CONFLICT when an offline note edit targets an already approved transaction', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(makeMembership());
      prisma.familySyncMutation.findUnique.mockResolvedValue(null);
      prisma.familyTransaction.findFirst.mockResolvedValue({
        id: 'tx-1',
        familyId: 'fam-1',
        categoryId: 'cat-1',
        amountMinorUnits: 500000n,
        currency: 'RWF',
        type: TransactionType.EXPENSE,
        scope: TransactionScope.FAMILY,
        status: TransactionStatus.APPROVED,
        incomeRecurrence: IncomeRecurrence.ONE_TIME,
        paymentStatus: IncomePaymentStatus.NOT_EXPECTED,
        date: baseTime,
        description: 'Original',
        paymentMethod: 'CASH',
        notes: 'Approved note',
        receivedFrom: null,
        receivedBy: null,
        createdById: 'user-1',
        approvedById: 'user-head',
        approvedAt: laterTime,
        reversedAt: null,
        createdAt: baseTime,
        updatedAt: laterTime,
      });

      const response = await service.push('user-1', 'mutesi-family', {
        contractVersion: '1.0.0',
        deviceId: 'device-1',
        commands: [
          {
            idempotencyKey: 'idem-edit-approved',
            localRecordId: 'tx-1',
            commandType: 'UPDATE_TRANSACTION_NOTES',
            baseVersion: baseTime.toISOString(),
            clientCreatedAt: baseTime.toISOString(),
            payload: {
              serverRecordId: 'tx-1',
              notes: 'Edited while offline',
            },
          },
        ],
      });

      expect(response.results[0]?.outcome).toBe('CONFLICT');
      expect(response.results[0]?.conflictCode).toBe(
        'APPROVAL_STATE_CONFLICT',
      );
      expect(response.results[0]?.serverRecord?.status).toBe('APPROVED');
    });

    it('returns VERSION_CONFLICT when server updatedAt differs from command baseVersion', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(makeMembership());
      prisma.familySyncMutation.findUnique.mockResolvedValue(null);
      prisma.familyTransaction.findFirst.mockResolvedValue({
        id: 'tx-1',
        familyId: 'fam-1',
        categoryId: 'cat-1',
        amountMinorUnits: 500000n,
        currency: 'RWF',
        type: TransactionType.EXPENSE,
        scope: TransactionScope.FAMILY,
        status: TransactionStatus.PENDING,
        incomeRecurrence: IncomeRecurrence.ONE_TIME,
        paymentStatus: IncomePaymentStatus.NOT_EXPECTED,
        date: baseTime,
        description: 'Updated on server',
        paymentMethod: 'CASH',
        notes: 'Server note',
        receivedFrom: null,
        receivedBy: null,
        createdById: 'user-1',
        approvedById: null,
        approvedAt: null,
        reversedAt: null,
        createdAt: baseTime,
        updatedAt: laterTime,
      });

      const response = await service.push('user-1', 'mutesi-family', {
        contractVersion: '1.0.0',
        deviceId: 'device-1',
        commands: [
          {
            idempotencyKey: 'idem-edit-stale',
            localRecordId: 'tx-1',
            commandType: 'UPDATE_TRANSACTION_NOTES',
            baseVersion: baseTime.toISOString(), // Stale version
            clientCreatedAt: baseTime.toISOString(),
            payload: {
              serverRecordId: 'tx-1',
              notes: 'Client offline note',
            },
          },
        ],
      });

      expect(response.results[0]?.outcome).toBe('CONFLICT');
      expect(response.results[0]?.conflictCode).toBe('VERSION_CONFLICT');
      expect(response.results[0]?.serverVersion).toBe(laterTime.toISOString());
    });

    it('returns ATTACHMENT_CHECKSUM_MISMATCH when uploaded receipt content does not match SHA-256 checksum', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(makeMembership());
      prisma.familySyncMutation.findUnique.mockResolvedValue(null);

      const response = await service.push('user-1', 'mutesi-family', {
        contractVersion: '1.0.0',
        deviceId: 'device-1',
        commands: [
          {
            idempotencyKey: 'idem-bad-receipt',
            localRecordId: 'local-rec-1',
            commandType: 'ATTACH_RECEIPT',
            clientCreatedAt: baseTime.toISOString(),
            payload: {
              transactionId: 'tx-1',
              fileName: 'receipt.png',
              fileType: 'image/png',
              fileSizeBytes: 12,
              storageKey: 'families/fam-1/receipts/receipt.png',
              checksumSha256: '0'.repeat(64),
              contentBase64: Buffer.from('corrupted-bytes').toString('base64'),
            },
          },
        ],
      });

      expect(response.results[0]?.outcome).toBe('CONFLICT');
      expect(response.results[0]?.conflictCode).toBe(
        'ATTACHMENT_CHECKSUM_MISMATCH',
      );
    });
  });

  describe('Cursor pull, cross-family isolation, and tombstones', () => {
    it('returns tombstones for removed members, archived categories, reversed transactions, and deleted contacts', async () => {
      prisma.family.findFirst.mockResolvedValue(makeFamily());
      prisma.familyMember.findFirst.mockResolvedValue(makeMembership());
      prisma.familyMember.findMany.mockResolvedValue([
        {
          id: 'mem-removed',
          familyId: 'fam-1',
          userId: 'user-ex',
          authority: FamilyAuthority.MEMBER,
          kinshipLabel: null,
          kinshipCustom: null,
          capabilities: [],
          removedAt: laterTime,
          createdAt: baseTime,
          updatedAt: laterTime,
          user: { fullName: 'Removed Member', avatarUrl: null, email: 'ex@example.com' },
        },
      ]);
      prisma.familyTransactionCategory.findMany.mockResolvedValue([
        {
          id: 'cat-archived',
          familyId: 'fam-1',
          name: 'Old Category',
          type: TransactionType.EXPENSE,
          description: null,
          icon: null,
          color: null,
          status: CategoryStatus.INACTIVE,
          isDefault: false,
          scope: TransactionScope.FAMILY,
          ownerId: null,
          createdById: 'user-head',
          createdAt: baseTime,
          updatedAt: laterTime,
        },
      ]);
      prisma.familyTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-reversed',
          familyId: 'fam-1',
          categoryId: 'cat-archived',
          amountMinorUnits: 150000n,
          currency: 'RWF',
          type: TransactionType.EXPENSE,
          scope: TransactionScope.FAMILY,
          status: TransactionStatus.REVERSED,
          incomeRecurrence: IncomeRecurrence.ONE_TIME,
          paymentStatus: IncomePaymentStatus.NOT_EXPECTED,
          date: baseTime,
          description: 'Reversed expense',
          paymentMethod: 'CASH',
          notes: null,
          receivedFrom: null,
          receivedBy: null,
          createdById: 'user-1',
          approvedById: null,
          approvedAt: null,
          reversedAt: laterTime,
          createdAt: baseTime,
          updatedAt: laterTime,
        },
      ]);
      prisma.familyContact.findMany.mockResolvedValue([
        {
          id: 'contact-deleted',
          familyId: 'fam-1',
          fullName: 'Deleted Contact',
          contactType: FamilyContactType.OTHER,
          phoneNumber: null,
          email: null,
          address: null,
          relationshipToFamily: null,
          organization: null,
          notes: null,
          isEmergencyContact: false,
          isLoanContact: false,
          status: FamilyContactStatus.INACTIVE,
          createdById: 'user-1',
          deletedAt: laterTime,
          createdAt: baseTime,
          updatedAt: laterTime,
          displayNames: [],
        },
      ]);

      const pullResult = await service.pull('user-1', 'mutesi-family', {
        cursor: `v1:${baseTime.getTime()}:fam-1`,
      });

      expect(pullResult.familyId).toBe('fam-1');
      expect(pullResult.nextCursor).toBe(
        `v1:${laterTime.getTime()}:contact-deleted`,
      );
      expect(pullResult.tombstones).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            recordType: 'MEMBER',
            serverId: 'mem-removed',
            reason: 'MEMBER_REMOVED',
          }),
          expect.objectContaining({
            recordType: 'CATEGORY',
            serverId: 'cat-archived',
            reason: 'CATEGORY_ARCHIVED',
          }),
          expect.objectContaining({
            recordType: 'TRANSACTION',
            serverId: 'tx-reversed',
            reason: 'TRANSACTION_REVERSED',
          }),
          expect.objectContaining({
            recordType: 'CONTACT',
            serverId: 'contact-deleted',
            reason: 'CONTACT_DELETED',
          }),
        ]),
      );

      // Verify queries strictly scope by familyId and personal ownerId/createdById
      expect(prisma.familyTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            familyId: 'fam-1',
            OR: [
              { scope: TransactionScope.FAMILY },
              { scope: TransactionScope.PERSONAL, createdById: 'user-1' },
            ],
          }),
        }),
      );
    });
  });
});
