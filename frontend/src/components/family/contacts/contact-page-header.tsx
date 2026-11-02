import { ContactRoundIcon, PlusIcon } from "lucide-react";
import { SidebarIcon } from "@/components/app-shell/sidebar-icon";
import { PageTitle } from "@/components/common/pages/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";

const t = createTranslator("FamilyContacts");

export interface ContactPageHeaderProps {
  personal?: boolean;
  totalCount: number;
  emergencyCount: number;
  importing?: boolean;
  onImportFile?: (file: File) => void;
  onAddContact: () => void;
}

export function ContactPageHeader({
  personal = false,
  totalCount,
  emergencyCount,
  onAddContact,
}: ContactPageHeaderProps) {
  return (
    <PageTitle
      title={
        personal
          ? t((m) => m.FamilyContacts.personalTitle)
          : t((m) => m.FamilyContacts.familyTitle)
      }
      badge={t((m) => m.FamilyContacts.savedCount, { count: totalCount })}
      icon={
        <SidebarIcon
          className="size-6"
          icon={{
            image: { src: "/images/icons/contacts.png" },
            line: ContactRoundIcon,
          }}
        />
      }
      description={
        personal
          ? t((m) => m.FamilyContacts.personalDescription)
          : t((m) => m.FamilyContacts.description)
      }
      actions={
        <>
          {emergencyCount > 0 ? (
            <Badge variant="destructive">
              {t((m) => m.FamilyContacts.emergencyBadge, {
                count: emergencyCount,
              })}
            </Badge>
          ) : null}
          <Button size="sm" onClick={onAddContact}>
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            {t((m) => m.FamilyContacts.addContact)}
          </Button>
        </>
      }
    />
  );
}
