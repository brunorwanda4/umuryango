import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FamilyInviteStatus,
  Notification,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';

export type CreateNotificationInput = {
  userId: string;
  familyId?: string | null;
  type: NotificationType;
  title: string;
  description: string;
  href?: string | null;
  dedupeKey?: string | null;
};

export type NotificationWithFamily = Notification & {
  family?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(
    input: CreateNotificationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Notification> {
    const client = tx ?? this.prisma;

    if (input.dedupeKey) {
      return client.notification.upsert({
        where: { dedupeKey: input.dedupeKey },
        create: {
          userId: input.userId,
          familyId: input.familyId ?? null,
          type: input.type,
          title: input.title,
          description: input.description,
          href: input.href ?? null,
          dedupeKey: input.dedupeKey,
        },
        update: {},
      });
    }

    return client.notification.create({
      data: {
        userId: input.userId,
        familyId: input.familyId ?? null,
        type: input.type,
        title: input.title,
        description: input.description,
        href: input.href ?? null,
      },
    });
  }

  async listForUser(
    userId: string,
    query: ListNotificationsDto,
  ): Promise<{
    items: NotificationWithFamily[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    unreadCount: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unread === true
        ? { readAt: null }
        : query.unread === false
          ? { readAt: { not: null } }
          : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          family: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    const hasMore = skip + items.length < total;

    return {
      items,
      total,
      page,
      limit,
      hasMore,
      unreadCount,
    };
  }

  async getSummary(userId: string): Promise<{
    unreadCount: number;
    pendingInvitationCount: number;
    recent: NotificationWithFamily[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const userEmail = user?.email.toLowerCase() ?? '';

    const now = new Date();
    const [unreadCount, pendingInvitationCount, recent] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
      userEmail
        ? this.prisma.familyInvite.count({
            where: {
              email: userEmail,
              status: FamilyInviteStatus.PENDING,
              expiresAt: { gt: now },
            },
          })
        : 0,
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          family: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return {
      unreadCount,
      pendingInvitationCount,
      recent,
    };
  }

  async markAsRead(
    userId: string,
    id: string,
  ): Promise<NotificationWithFamily> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.readAt) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { count: result.count };
  }
}
