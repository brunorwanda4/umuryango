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
    moneyMessage ? `${t("types.money")}: ${moneyMessage}` : null,
    contributionsMessage
      ? `${t("types.contributions")}: ${contributionsMessage}`
      : null,
    projectsMessage ? `${t("types.projects")}: ${projectsMessage}` : null,
  ].filter(Boolean);

  return (
    <Alert>
      <FileClockIcon aria-hidden="true" />
      <AlertTitle>{t("someSourceModulesNotReady")}</AlertTitle>
      <AlertDescription>
        {t("reportsCanOnlyIncludeReturned")} {messages.join(" ")}
      </AlertDescription>
    </Alert>
  );
}
