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
    <div className="grid grid-cols-3 gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{value || "Not recorded"}</span>
    </div>
  );
}

export function ContactDetailsDialog({
  contact,
  onOpenChange,
}: ContactDetailsDialogProps) {
  return (
    <Dialog open={Boolean(contact)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contact?.fullName ?? "Contact details"}</DialogTitle>
          <DialogDescription>
            Trusted contact details saved for this family.
          </DialogDescription>
        </DialogHeader>
        {contact ? (
          <div className="flex flex-col gap-4">
            <ContactBadges contact={contact} />
            <div className="grid gap-3 text-sm">
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
            </div>
            {contact.notes ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">Notes</div>
                <p className="mt-1 text-muted-foreground">{contact.notes}</p>
              </div>
            ) : null}
            <ContactActions contact={contact} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
