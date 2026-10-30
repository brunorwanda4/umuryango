import { FileUpIcon, PlusIcon, UsersRoundIcon } from "lucide-react";
import { useRef } from "react";
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
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Trusted contacts</Badge>
          <Badge variant="secondary">{totalCount} saved</Badge>
          {emergencyCount > 0 ? (
            <Badge variant="destructive">{emergencyCount} emergency</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
            <UsersRoundIcon className="size-5 text-muted-foreground" />
          </span>
          <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
            {personal ? "Personal Contacts" : "Family Contacts"}
          </h1>
        </div>
        <p className="max-w-4xl text-muted-foreground text-sm leading-6">
          Save relatives, neighbors, doctors, lawyers, schools, churches,
          SACCOs, banks, business partners, and loan contacts.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
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
      </div>
    </header>
  );
}
