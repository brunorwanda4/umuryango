import Link from "next/link";
import { createTranslator } from "@/i18n/translate";

const AppFooter = () => {
  const t = createTranslator("AppShell.footer");
  const tShared = createTranslator("Shared");

  return (
    <footer className="mt-12 -mx-4 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border py-4 text-xs text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors">
        <span className="font-medium text-foreground">
          {tShared((m) => m.Shared.brand)}
        </span>
        <span>{t((m) => m.AppShell.footer.moneyManagement)}</span>
      </Link>
      <Link
        href="http://bruno-rwanda.vercel.app"
        className="hover:text-foreground transition-colors"
      >
        <span>{t((m) => m.AppShell.footer.developedBy)}</span>
        <span className="font-medium text-foreground">Rwanda Bruno</span>
      </Link>
    </footer>
  );
};

export default AppFooter;
