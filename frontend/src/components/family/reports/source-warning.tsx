import { FileClockIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createTranslator } from "@/i18n/translate";

export function SourceWarning({
  contributionsMessage,
  moneyMessage,
  projectsMessage,
}: {
  contributionsMessage?: string;
  moneyMessage?: string;
  projectsMessage?: string;
}) {
  const t = createTranslator("FamilyReports");
  const messages = [
    moneyMessage
      ? `${t((m) => m.FamilyReports.types.money)}: ${moneyMessage}`
      : null,
    contributionsMessage
      ? `${t((m) => m.FamilyReports.types.contributions)}: ${contributionsMessage}`
      : null,
    projectsMessage
      ? `${t((m) => m.FamilyReports.types.projects)}: ${projectsMessage}`
      : null,
  ].filter(Boolean);

  return (
    <Alert>
      <FileClockIcon aria-hidden="true" />
      <AlertTitle>
        {t((m) => m.FamilyReports.someSourceModulesNotReady)}
      </AlertTitle>
      <AlertDescription>
        {t((m) => m.FamilyReports.reportsCanOnlyIncludeReturned)}{" "}
        {messages.join(" ")}
      </AlertDescription>
    </Alert>
  );
}
