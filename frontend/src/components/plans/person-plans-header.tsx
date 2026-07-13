import { ArrowLeftIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlanPerson } from "./types-and-schemas";

function initials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

export function PersonPlansHeader({
	person,
	onAdd,
}: {
	person: PlanPerson;
	onAdd: () => void;
}) {
	const firstName = person.fullName.split(" ")[0] || person.fullName;

	return (
		<header className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex min-w-0 items-center gap-3">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<Image
								alt=""
								aria-hidden="true"
								height={24}
								src="/images/icons/plan.png"
								width={24}
							/>
							<h1 className="truncate font-bricolage text-2xl font-bold sm:text-3xl">
								{firstName}&apos;s plans
							</h1>
						</div>
					</div>
				</div>
				<Button onClick={onAdd} className="w-full sm:w-auto">
					<PlusIcon aria-hidden="true" data-icon="inline-start" />
					Add plan
				</Button>
			</div>
		</header>
	);
}
