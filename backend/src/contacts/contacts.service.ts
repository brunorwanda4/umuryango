import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  type FamilyContact,
  Prisma,
} from '@prisma/client';
import { can } from '../families/family-access';
import { PrismaService } from '../prisma/prisma.service';
import { ContactQueryDto } from './dto/contact-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

type Membership = {
  id: string;
  userId: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
};

const CONTACT_INCLUDE = Prisma.validator<Prisma.FamilyContactInclude>()({
  createdBy: { select: { fullName: true } },
});

type ContactWithCreator = Prisma.FamilyContactGetPayload<{
  include: typeof CONTACT_INCLUDE;
}>;

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, familyId: string, dto: CreateContactDto) {
    await this.requireMembership(userId, familyId);

    const contact = await this.prisma.$transaction(async (tx) => {
      const created = await tx.familyContact.create({
        data: {
          familyId,
          fullName: dto.fullName,
          contactType: dto.contactType,
          phoneNumber: dto.phoneNumber || null,
          email: dto.email || null,
          address: dto.address || null,
          relationshipToFamily: dto.relationshipToFamily || null,
          organization: dto.organization || null,
          notes: dto.notes || null,
          isEmergencyContact: dto.isEmergencyContact ?? false,
          isLoanContact: dto.isLoanContact ?? false,
          status: dto.status,
          createdById: userId,
        },
        include: CONTACT_INCLUDE,
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.CONTACT_CREATED,
          after: this.contactSnapshot(created),
        },
      });

      return created;
    });

    return this.serialize(contact);
  }

  async findMany(userId: string, familyId: string, query: ContactQueryDto) {
    await this.requireMembership(userId, familyId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Prisma.FamilyContactWhereInput = {
      familyId,
      deletedAt: null,
    };

    if (query.contactType) where.contactType = query.contactType;
    if (query.status) where.status = query.status;
    if (query.emergencyOnly) where.isEmergencyContact = true;
    if (query.loanOnly) where.isLoanContact = true;
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { relationshipToFamily: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.familyContact.findMany({
        where,
        include: CONTACT_INCLUDE,
        orderBy: [
          { isEmergencyContact: 'desc' },
          { isLoanContact: 'desc' },
          { fullName: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.familyContact.count({ where }),
    ]);

    return {
      items: items.map((contact) => this.serialize(contact)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, familyId: string, id: string) {
    await this.requireMembership(userId, familyId);
    const contact = await this.findContact(familyId, id);
    return this.serialize(contact);
  }

  async update(
    userId: string,
    familyId: string,
    id: string,
    dto: UpdateContactDto,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    const contact = await this.findContact(familyId, id);
    this.assertCanMutate(membership, contact);

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.familyContact.update({
        where: { id },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
          ...(dto.contactType !== undefined
            ? { contactType: dto.contactType }
            : {}),
          ...(dto.phoneNumber !== undefined
            ? { phoneNumber: dto.phoneNumber || null }
            : {}),
          ...(dto.email !== undefined ? { email: dto.email || null } : {}),
          ...(dto.address !== undefined
            ? { address: dto.address || null }
            : {}),
          ...(dto.relationshipToFamily !== undefined
            ? { relationshipToFamily: dto.relationshipToFamily || null }
            : {}),
          ...(dto.organization !== undefined
            ? { organization: dto.organization || null }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
          ...(dto.isEmergencyContact !== undefined
            ? { isEmergencyContact: dto.isEmergencyContact }
            : {}),
          ...(dto.isLoanContact !== undefined
            ? { isLoanContact: dto.isLoanContact }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: CONTACT_INCLUDE,
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.CONTACT_UPDATED,
          before: this.contactSnapshot(contact),
          after: this.contactSnapshot(saved),
        },
      });

      return saved;
    });

    return this.serialize(updated);
  }

  async delete(userId: string, familyId: string, id: string) {
    const membership = await this.requireMembership(userId, familyId);
    const contact = await this.findContact(familyId, id);
    this.assertCanMutate(membership, contact);

    const deleted = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.familyContact.update({
        where: { id },
        data: { deletedAt: new Date() },
        include: CONTACT_INCLUDE,
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.CONTACT_DELETED,
          before: this.contactSnapshot(contact),
          after: this.contactSnapshot(saved),
        },
      });

      return saved;
    });

    return this.serialize(deleted);
  }

  private async requireMembership(
    userId: string,
    familyId: string,
  ): Promise<Membership> {
    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, userId, removedAt: null },
      select: {
        id: true,
        userId: true,
        authority: true,
        capabilities: true,
      },
    });
    if (!membership) throw new NotFoundException('Family not found.');
    return membership;
  }

  private async findContact(familyId: string, id: string) {
    const contact = await this.prisma.familyContact.findFirst({
      where: { familyId, id, deletedAt: null },
      include: CONTACT_INCLUDE,
    });
    if (!contact) throw new NotFoundException('Contact not found.');
    return contact;
  }

  private isContactManager(membership: Membership) {
    return (
      membership.authority === FamilyAuthority.HEAD ||
      membership.authority === FamilyAuthority.ADMIN ||
      can(membership, FamilyCapability.MANAGE_CONTACTS)
    );
  }

  private assertCanMutate(membership: Membership, contact: FamilyContact) {
    if (
      this.isContactManager(membership) ||
      contact.createdById === membership.userId
    ) {
      return;
    }

    throw new ForbiddenException('You cannot manage this contact.');
  }

  private serialize(contact: ContactWithCreator) {
    return {
      id: contact.id,
      familyId: contact.familyId,
      fullName: contact.fullName,
      contactType: contact.contactType,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
      address: contact.address,
      relationshipToFamily: contact.relationshipToFamily,
      organization: contact.organization,
      notes: contact.notes,
      isEmergencyContact: contact.isEmergencyContact,
      isLoanContact: contact.isLoanContact,
      status: contact.status,
      createdById: contact.createdById,
      createdByName: contact.createdBy?.fullName ?? null,
      deletedAt: contact.deletedAt?.toISOString() ?? null,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }

  private contactSnapshot(contact: FamilyContact): Prisma.InputJsonObject {
    return {
      id: contact.id,
      fullName: contact.fullName,
      contactType: contact.contactType,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
      relationshipToFamily: contact.relationshipToFamily,
      organization: contact.organization,
      isEmergencyContact: contact.isEmergencyContact,
      isLoanContact: contact.isLoanContact,
      status: contact.status,
      deletedAt: contact.deletedAt?.toISOString() ?? null,
    };
  }
}
