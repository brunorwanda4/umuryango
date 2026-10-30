import {
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "../money/utils";
import { ContactActions } from "./contact-actions";
import { ContactBadges } from "./contact-badges";
import { contactTypeLabel, type FamilyContact } from "./types-and-schemas";

export interface ContactListProps {
  familyName: string;
  contacts: FamilyContact[];
  onView: (contact: FamilyContact) => void;
  onEdit: (contact: FamilyContact) => void;
  onDelete: (contact: FamilyContact) => void;
  onAddContact: () => void;
}

export function ContactList({
  familyName,
  contacts,
  onView,
  onEdit,
  onDelete,
  onAddContact,
}: ContactListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
        <CardDescription>
          Active and inactive trusted contacts connected to {familyName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length ? (
          <>
            {/* Mobile Card List */}
            <div className="grid gap-3 md:hidden">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-col gap-3 rounded-md border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {contact.fullName}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {contact.relationshipToFamily ||
                          contactTypeLabel(contact.contactType)}
                      </div>
                    </div>
                    <ContactBadges contact={contact} />
                  </div>
                  <div className="text-sm">
                    {contact.phoneNumber || contact.email || "No phone/email"}
                  </div>
                  <ContactActions contact={contact} />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(contact)}
                    >
                      <EyeIcon aria-hidden="true" data-icon="inline-start" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(contact)}
                    >
                      <PencilIcon aria-hidden="true" data-icon="inline-start" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(contact)}
                    >
                      <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.fullName}
                      </TableCell>
                      <TableCell>
                        {contactTypeLabel(contact.contactType)}
                      </TableCell>
                      <TableCell>
                        {contact.phoneNumber || "Not recorded"}
                      </TableCell>
                      <TableCell>
                        {contact.relationshipToFamily || "Not recorded"}
                      </TableCell>
                      <TableCell>
                        {contact.organization || "Not recorded"}
                      </TableCell>
                      <TableCell>
                        <ContactBadges contact={contact} />
                      </TableCell>
                      <TableCell>{formatDate(contact.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Open actions for ${contact.fullName}`}
                            >
                              <MoreVerticalIcon aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(contact)}>
                              <EyeIcon className="mr-2 size-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(contact)}>
                              <PencilIcon className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onDelete(contact)}
                            >
                              <Trash2Icon className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersRoundIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No contacts found</EmptyTitle>
              <EmptyDescription>
                Add trusted people and organizations the family may need.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={onAddContact}>
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                Add Contact
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
