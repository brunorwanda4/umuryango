import { Badge } from "@/components/ui/badge";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type { FamilyContact } from "./types-and-schemas";

const t = createTranslator("FamilyContacts");

export interface ContactBadgesProps {
  contact: FamilyContact;
  className?: string;
}

export function ContactBadges({ contact, className }: ContactBadgesProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <Badge variant={contact.status === "ACTIVE" ? "default" : "outline"}>
        {t(`statuses.${contact.status}`)}
      </Badge>
      {contact.isEmergencyContact ? (
        <Badge variant="destructive">
          {t((m) => m.FamilyContacts.badgeEmergency)}
        </Badge>
      ) : null}
      {contact.isLoanContact ? (
        <Badge variant="secondary">
          {t((m) => m.FamilyContacts.badgeLoan)}
        </Badge>
      ) : null}
    </div>
  );
}
