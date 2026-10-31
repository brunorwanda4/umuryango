import { createTranslator } from "@/i18n/translate";

export default async function SecurityPage() {
  const t = createTranslator("PersonalSettings");
  return <div>{t((m) => m.PersonalSettings.securityPage)}</div>;
}
