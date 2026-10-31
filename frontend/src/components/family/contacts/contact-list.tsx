import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import type * as React from "react";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";
import { formatDate } from "../money/utils";
import { ContactActions } from "./contact-actions";
import { ContactBadges } from "./contact-badges";
import { ContactFilters } from "./contact-filters";
import type { ContactFiltersState, FamilyContact } from "./types-and-schemas";

const t = createTranslator("FamilyContacts");
const tCommon = createTranslator("Common");

export interface ContactListProps {
  contacts: FamilyContact[];
  onView: (contact: FamilyContact) => void;
  onEdit: (contact: FamilyContact) => void;
  onDelete: (contact: FamilyContact) => void;
  onAddContact: () => void;
  filters: ContactFiltersState;
  onFiltersChange: React.Dispatch<React.SetStateAction<ContactFiltersState>>;
  onResetFilters: () => void;
  pageIndex: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
}

export function ContactList({
  contacts,
  onView,
  onEdit,
  onDelete,
  onAddContact,
  filters,
  onFiltersChange,
  onResetFilters,
  pageIndex,
  totalPages,
  onPageChange,
}: ContactListProps) {
  const columns: ColumnDef<FamilyContact>[] = [
    {
      accessorKey: "fullName",
      header: tCommon((m) => m.Common.name),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.fullName}</span>
      ),
    },
    {
      accessorKey: "contactType",
      header: tCommon((m) => m.Common.type),
      cell: ({ row }) => t(`types.${row.original.contactType}`),
    },
    {
      accessorKey: "phoneNumber",
      header: tCommon((m) => m.Common.phone),
      cell: ({ row }) =>
        row.original.phoneNumber || tCommon((m) => m.Common.notRecorded),
    },
    {
      accessorKey: "relationshipToFamily",
      header: t((m) => m.FamilyContacts.relationshipLabel),
      cell: ({ row }) =>
        row.original.relationshipToFamily ||
        tCommon((m) => m.Common.notRecorded),
    },
    {
      accessorKey: "organization",
      header: t((m) => m.FamilyContacts.organizationLabel),
      cell: ({ row }) =>
        row.original.organization || tCommon((m) => m.Common.notRecorded),
    },
    {
      id: "status",
      header: tCommon((m) => m.Common.status),
      cell: ({ row }) => <ContactBadges contact={row.original} />,
    },
    {
      accessorKey: "createdAt",
      header: tCommon((m) => m.Common.createdDate),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: tCommon((m) => m.Common.actions),
      cell: ({ row }) => {
        const contact = row.original;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t((m) => m.FamilyContacts.openActionsFor, {
                    name: contact.fullName,
                  })}
                >
                  <MoreVerticalIcon aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(contact)}>
                  <EyeIcon className="mr-2 size-4" />
                  {tCommon((m) => m.Common.view)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(contact)}>
                  <PencilIcon className="mr-2 size-4" />
                  {tCommon((m) => m.Common.edit)}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(contact)}
                >
                  <Trash2Icon className="mr-2 size-4" />
                  {tCommon((m) => m.Common.delete)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t((m) => m.FamilyContacts.title)}</CardTitle>
      </CardHeader>
      <ContactFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onReset={onResetFilters}
      />
      <CardContent className="px-0 md:px-5">
        {contacts.length ? (
          <>
            {/* Mobile Card List */}
            <div className="grid gap-3 md:hidden">
              {contacts.map((contact) => (
                // biome-ignore lint/a11y/useSemanticElements: Contact cards contain nested action buttons.
                <div
                  key={contact.id}
                  className="flex cursor-pointer flex-col gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    if (
                      event.target instanceof HTMLElement &&
                      event.target.closest("button, a")
                    ) {
                      return;
                    }
                    onView(contact);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onView(contact);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {contact.fullName}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {contact.relationshipToFamily ||
                          t(`types.${contact.contactType}`)}
                      </div>
                    </div>
                    <ContactBadges contact={contact} />
                  </div>
                  <div className="text-sm">
                    {contact.phoneNumber ||
                      contact.email ||
                      t((m) => m.FamilyContacts.noPhoneEmail)}
                  </div>
                  <ContactActions contact={contact} />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(contact)}
                    >
                      <EyeIcon aria-hidden="true" data-icon="inline-start" />
                      {tCommon((m) => m.Common.view)}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(contact)}
                    >
                      <PencilIcon aria-hidden="true" data-icon="inline-start" />
                      {tCommon((m) => m.Common.edit)}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(contact)}
                    >
                      <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                      {tCommon((m) => m.Common.delete)}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 md:hidden">
              <Button
                size="sm"
                variant="outline"
                disabled={pageIndex === 0}
                onClick={() => onPageChange(pageIndex - 1)}
              >
                <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
                {tCommon((m) => m.Common.previous)}
              </Button>
              <span className="text-muted-foreground text-sm">
                {tCommon((m) => m.Common.pageOfTotal, {
                  page: pageIndex + 1,
                  total: totalPages,
                })}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pageIndex + 1 >= totalPages}
                onClick={() => onPageChange(pageIndex + 1)}
              >
                {tCommon((m) => m.Common.next)}
                <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
              </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <CommonDataTable
                columns={columns}
                data={contacts}
                noFooter={false}
                onRowClick={(row) => onView(row.original)}
                pageIndex={pageIndex}
                pageSize={20}
                serverMode
                setPageIndex={onPageChange}
                totalPages={totalPages}
              />
            </div>
          </>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersRoundIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t((m) => m.FamilyContacts.emptyTitle)}</EmptyTitle>
              <EmptyDescription>
                {t((m) => m.FamilyContacts.emptyDescription)}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={onAddContact}>
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                {t((m) => m.FamilyContacts.addContact)}
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
