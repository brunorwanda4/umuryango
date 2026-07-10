import { ArrowDownIcon } from "lucide-react";
import { PageTitle } from "@/components/common/pages/page-title";
import MeMoneyIncomeCard from "@/components/money/me-money-income-card";
import { moneyCurrency, moneySummary } from "@/components/money/money-data";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";

const IncomeName = () => {
  return (
    <div className=" space-y-6">
      <PageTitle
        title="Income"
        description="Track money received from work, business, contributions, gifts, and family support."
        icon={<ArrowDownIcon className="text-success" />}
        actions={<MoneyFormDialog type="income" />}
      />
      <MeMoneyIncomeCard currency={moneyCurrency} summary={moneySummary} />
    </div>
  );
};

export default IncomeName;
