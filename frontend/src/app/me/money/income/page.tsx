import { PageTitle } from "@/components/common/pages/page-title";
import { ArrowDownIcon } from "lucide-react";

const IncomeName = () => {
	return (
		<div>
			<PageTitle
				title="Income"
        description="Track money received from work, business, contributions, gifts, and family support."
        icon={<ArrowDownIcon className="text-success"/>}
			/>
		</div>
	);
};

export default IncomeName;
