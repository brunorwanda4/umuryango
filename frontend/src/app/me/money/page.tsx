import { PageTitle } from "@/components/common/pages/page-title";
import MeMoneyMetricCards from "@/components/me/money/me-money-metric-cards.tsx";

export default async function MyMoneyPage() {
	return (
		<div>
			<PageTitle title="My Money" description="" />
			<MeMoneyMetricCards />
		</div>
	);
}
