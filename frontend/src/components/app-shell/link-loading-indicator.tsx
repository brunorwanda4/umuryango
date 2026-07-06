export function LinkLoadingIndicator({
	icon: Icon,
	title,
	isOpen,
}: {
	icon: React.ComponentType<{ size: number; className: string }>;
	title: string;
	isOpen: boolean;
}) {
	const { pending } = useLinkStatus();

	return (
		<>
			{pending ? (
				<Loader2 size={24} className="size-5 animate-spin" />
			) : (
				<Icon size={24} className="size-5" />
			)}
			{isOpen && <span>{title}</span>}
		</>
	);
}
