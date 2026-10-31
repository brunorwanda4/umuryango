import {
  ContactRoundIcon,
  HeartHandshakeIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { SidebarIcon } from "@/components/app-shell/sidebar-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTranslator } from "@/i18n/translate";
import { formatDate } from "../money/utils";
import { ContactActions } from "./contact-actions";
import { ContactBadges } from "./contact-badges";
import type { FamilyContact } from "./types-and-schemas";

const t = createTranslator("FamilyContacts");
const tCommon = createTranslator("Common");

export interface ContactDetailsDialogProps {
  contact: FamilyContact | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (contact: FamilyContact) => void;
  onDelete: (contact: FamilyContact) => void;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border bg-muted/20 p-3">
      <dt className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
        <span className="truncate">{label}</span>
      </dt>
      <dd className="min-w-0 max-w-[60%] break-words text-right font-medium">
        {value || tCommon("notRecorded")}
      </dd>
    </div>
  );
}

export function ContactDetailsDialog({
  contact,
  onOpenChange,
  onEdit,
  onDelete,
}: ContactDetailsDialogProps) {
  return (
    <Dialog
      syncWithSearchParams={false}
      open={Boolean(contact)}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SidebarIcon
                className="size-6"
                icon={{
                  image: { src: "/images/icons/contacts.png" },
                  line: ContactRoundIcon,
                }}
              />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">
                {contact?.fullName ?? t("detailsTitle")}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t("detailsDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {contact ? (
          <div className="flex flex-col gap-5">
            <ContactBadges contact={contact} className="pt-1" />
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <DetailRow
                label={tCommon("type")}
                value={t(`types.${contact.contactType}`)}
              />
              <DetailRow label={t("phoneLabel")} value={contact.phoneNumber} />
              <DetailRow label={t("emailLabel")} value={contact.email} />
              <DetailRow
                label={t("relationshipLabel")}
                value={contact.relationshipToFamily}
              />
              <DetailRow
                label={t("organizationLabel")}
                value={contact.organization}
              />
              <DetailRow label={t("addressLabel")} value={contact.address} />
              <DetailRow
                label={tCommon("createdBy")}
                value={contact.createdByName}
              />
              <DetailRow
                label={tCommon("createdDate")}
                value={formatDate(contact.createdAt)}
              />
            </dl>
            {contact.notes ? (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <HeartHandshakeIcon className="size-4 text-muted-foreground" />
                  {t("notesLabel")}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {contact.notes}
                </p>
              </div>
            ) : null}
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <ContactActions contact={contact} />
              <div className="flex gap-2 sm:ml-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(contact)}
                >
                  <PencilIcon aria-hidden="true" data-icon="inline-start" />
                  {tCommon("update")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(contact)}
                >
                  <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                  {tCommon("delete")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
