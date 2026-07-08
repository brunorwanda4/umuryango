import { Badge } from "@/components/ui/badge";

interface PageTitleProps {
	title: string;
  description?: string;
	badge ?: string
}

export function PageTitle({ title, description, badge }: PageTitleProps) {
	return (
		<div>
		<div className="flex flex-wrap items-center gap-2.5">
        <h1 className=" font-bold text-3xl sm:text-4xl font-bricolage">{title}</h1>
			{badge && <Badge variant="secondary">{badge}</Badge>}
			</div>
			{description &&  <p className="max-w-3xl text-muted-foreground text-sm leading-6">{description}</p>}
		</div>
	);
}
