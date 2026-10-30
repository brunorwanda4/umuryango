import { ContactRoundIcon, FileUpIcon, PlusIcon } from "lucide-react";
import { useRef } from "react";
import { SidebarIcon } from "@/components/app-shell/sidebar-icon";
import { PageTitle } from "@/components/common/pages/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ContactPageHeaderProps {
  personal?: boolean;
  totalCount: number;
  emergencyCount: number;
  importing?: boolean;
  onImportFile: (file: File) => void;
  onAddContact: () => void;
}

export function ContactPageHeader({
  personal = false,
  totalCount,
  emergencyCount,
  importing = false,
  onImportFile,
  onAddContact,
}: ContactPageHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <PageTitle
      title={personal ? "Personal Contacts" : "Family Contacts"}
      badge={`${totalCount} saved`}
      icon={
        <SidebarIcon
          className="size-6"
          icon={{
            image: { src: "/images/icons/contacts.png" },
            line: ContactRoundIcon,
          }}
        />
      }
      description="Save relatives, neighbors, doctors, lawyers, schools, churches, SACCOs, banks, business partners, and loan contacts."
      actions={
        <>
          {emergencyCount > 0 ? (
            <Badge variant="destructive">{emergencyCount} emergency</Badge>
          ) : null}
          <input
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.vcf,text/csv,text/vcard"
            type="file"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUpIcon aria-hidden="true" data-icon="inline-start" />
            {importing ? "Importing..." : "Import contacts"}
          </Button>
          <Button size="sm" onClick={onAddContact}>
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Add Contact
          </Button>
        </>
      }
    />
  );
}
