import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FamilyContact } from "./types-and-schemas";

export interface ContactBadgesProps {
  contact: FamilyContact;
  className?: string;
}

export function ContactBadges({ contact, className }: ContactBadgesProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <Badge variant={contact.status === "ACTIVE" ? "default" : "outline"}>
        {contact.status === "ACTIVE" ? "Active" : "Inactive"}
      </Badge>
      {contact.isEmergencyContact ? (
        <Badge variant="destructive">Emergency</Badge>
      ) : null}
      {contact.isLoanContact ? <Badge variant="secondary">Loan</Badge> : null}
    </div>
  );
}
