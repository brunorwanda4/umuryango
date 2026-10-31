import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    familyInvite: {
      count: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      familyInvite: {
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    service = new NotificationsService(prisma as any);
  });

  describe('listForUser', () => {
    it('scopes query so a user only sees their own notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: NotificationType.FAMILY_INVITE,
          title: 'Invite',
          description: 'Join us',
          readAt: null,
          createdAt: new Date(),
        },
      ];
      prisma.notification.findMany.mockResolvedValue(mockNotifications);
      prisma.notification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const result = await service.listForUser('user-1', {
        page: 1,
        limit: 10,
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.items).toEqual(mockNotifications);
      expect(result.unreadCount).toBe(1);
    });

    it('filters by unread status when requested', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.listForUser('user-1', { unread: true });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', readAt: null },
        }),
      );
    });
  });

  describe('IDOR protection for marking notifications as read', () => {
    it('throws NotFoundException when notification does not belong to the user', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsRead('user-attacker', 'notif-victim'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-victim', userId: 'user-attacker' },
        include: expect.any(Object),
      });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('marks notification as read when owned by authenticated user', async () => {
      const existing = {
        id: 'notif-1',
        userId: 'user-1',
        readAt: null,
      };
      const updated = {
        ...existing,
        readAt: new Date(),
      };
      prisma.notification.findFirst.mockResolvedValue(existing);
      prisma.notification.update.mockResolvedValue(updated);

      const result = await service.markAsRead('user-1', 'notif-1');

      expect(result.readAt).toBeDefined();
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { readAt: expect.any(Date) },
        include: expect.any(Object),
      });
    });

    it('is idempotent when already read', async () => {
      const readDate = new Date();
      const existing = {
        id: 'notif-1',
        userId: 'user-1',
        readAt: readDate,
      };
      prisma.notification.findFirst.mockResolvedValue(existing);

      const result = await service.markAsRead('user-1', 'notif-1');

      expect(result.readAt).toEqual(readDate);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('only affects unread notifications belonging to the current user', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(result.count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('getSummary', () => {
    it('returns server-authoritative unread and invitation counts', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'user@example.com' });
      prisma.notification.count.mockResolvedValue(3);
      prisma.familyInvite.count.mockResolvedValue(2);
      prisma.notification.findMany.mockResolvedValue([
        { id: '1', title: 'Recent' },
      ]);

      const summary = await service.getSummary('user-1');

      expect(summary.unreadCount).toBe(3);
      expect(summary.pendingInvitationCount).toBe(2);
      expect(summary.recent).toHaveLength(1);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
      });
      expect(prisma.familyInvite.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: 'user@example.com',
            status: 'PENDING',
          }),
        }),
      );
    });
  });

  describe('createNotification duplicate-safety', () => {
    it('uses upsert with dedupeKey to prevent duplicate notifications', async () => {
      prisma.notification.upsert.mockResolvedValue({
        id: 'notif-1',
        dedupeKey: 'tx-approve:123',
      });

      await service.createNotification({
        userId: 'user-1',
        familyId: 'family-1',
        type: NotificationType.TRANSACTION_APPROVED,
        title: 'Approved',
        description: 'Transaction approved',
        dedupeKey: 'tx-approve:123',
      });

      expect(prisma.notification.upsert).toHaveBeenCalledWith({
        where: { dedupeKey: 'tx-approve:123' },
        create: expect.objectContaining({
          userId: 'user-1',
          familyId: 'family-1',
          type: NotificationType.TRANSACTION_APPROVED,
          dedupeKey: 'tx-approve:123',
        }),
        update: {},
      });
    });
  });
});
