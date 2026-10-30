import { HeartHandshakeIcon, UserRoundIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "../money/utils";
import { ContactActions } from "./contact-actions";
import { ContactBadges } from "./contact-badges";
import { contactTypeLabel, type FamilyContact } from "./types-and-schemas";

export interface ContactDetailsDialogProps {
  contact: FamilyContact | null;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border bg-muted/20 p-3">
      <dt className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
        <span className="truncate">{label}</span>
      </dt>
      <dd className="min-w-0 max-w-[60%] break-words text-right font-medium">
        {value || "Not recorded"}
      </dd>
    </div>
  );
}

export function ContactDetailsDialog({
  contact,
  onOpenChange,
}: ContactDetailsDialogProps) {
  return (
    <Dialog open={Boolean(contact)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRoundIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate">
                {contact?.fullName ?? "Contact details"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Trusted contact details saved for this family.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {contact ? (
          <div className="flex flex-col gap-5">
            <ContactBadges contact={contact} className="pt-1" />
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <DetailRow
                label="Type"
                value={contactTypeLabel(contact.contactType)}
              />
              <DetailRow label="Phone" value={contact.phoneNumber} />
              <DetailRow label="Email" value={contact.email} />
              <DetailRow
                label="Relationship"
                value={contact.relationshipToFamily}
              />
              <DetailRow label="Organization" value={contact.organization} />
              <DetailRow label="Address" value={contact.address} />
              <DetailRow label="Created by" value={contact.createdByName} />
              <DetailRow
                label="Created date"
                value={formatDate(contact.createdAt)}
              />
            </dl>
            {contact.notes ? (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <HeartHandshakeIcon className="size-4 text-muted-foreground" />
                  Notes
                </div>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {contact.notes}
                </p>
              </div>
            ) : null}
            <ContactActions contact={contact} className="border-t pt-4" />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
