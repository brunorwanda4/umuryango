import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTranslator } from "@/i18n/translate";
import { LoanList } from "./loan-list";
import type { PersonalLoan } from "./types-and-schemas";

export function LoanTabs({
  loans,
  hasLoans,
  onAdd,
  onPayment,
  onView,
}: {
  loans: PersonalLoan[];
  hasLoans: boolean;
  onAdd: () => void;
  onPayment: (loan: PersonalLoan) => void;
  onView: (loan: PersonalLoan) => void;
}) {
  const t = createTranslator("PersonalLoans");

  const render = (items: PersonalLoan[]) => (
    <LoanList
      loans={items}
      hasLoans={hasLoans}
      onAdd={onAdd}
      onPayment={onPayment}
      onView={onView}
    />
  );
  return (
    <Tabs defaultValue="all" className="gap-4">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="all">
          {t((m) => m.PersonalLoans.tabs.all)}
        </TabsTrigger>
        <TabsTrigger value="borrowed">
          {t((m) => m.PersonalLoans.tabs.borrowed)}
        </TabsTrigger>
        <TabsTrigger value="lent">
          {t((m) => m.PersonalLoans.tabs.lent)}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">{render(loans)}</TabsContent>
      <TabsContent value="borrowed">
        {render(loans.filter((loan) => loan.type === "BORROWED"))}
      </TabsContent>
      <TabsContent value="lent">
        {render(loans.filter((loan) => loan.type === "LENT"))}
      </TabsContent>
    </Tabs>
  );
}
