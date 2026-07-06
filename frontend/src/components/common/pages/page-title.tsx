interface PageTitleProps {
	title: string;
	description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
	return (
		<div>
			<h1 className=" font-bricolage text-2xl font-semibold">{title}</h1>
			{description && <p>{description}</p>}
		</div>
	);
}
