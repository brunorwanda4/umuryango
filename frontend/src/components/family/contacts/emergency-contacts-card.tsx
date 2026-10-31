import { ShieldAlertIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { ContactActions } from "./contact-actions";
import type { FamilyContact } from "./types-and-schemas";

const t = createTranslator("FamilyContacts");

export interface EmergencyContactsCardProps {
  emergencyContacts: FamilyContact[];
}

export function EmergencyContactsCard({
  emergencyContacts,
}: EmergencyContactsCardProps) {
  if (!emergencyContacts.length) return null;

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlertIcon className="size-4 text-destructive" />
          {t("emergencyContacts")}
        </CardTitle>
        <CardDescription>{t("emergencyContactsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {emergencyContacts.slice(0, 6).map((contact) => (
          <div
            key={contact.id}
            className="flex flex-col gap-3 rounded-md border p-3"
          >
            <div>
              <div className="font-medium">{contact.fullName}</div>
              <div className="text-muted-foreground text-sm">
                {contact.relationshipToFamily ||
                  t(`types.${contact.contactType}`)}
              </div>
            </div>
            <ContactActions contact={contact} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
