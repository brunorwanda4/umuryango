"use client";

import {
	type ComponentProps,
	forwardRef,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type MoneyInputProps = Omit<
	ComponentProps<typeof InputGroupInput>,
	"onChange" | "type" | "value"
> & {
	value?: number | string | null;
	currency: string;
	onValueChange: (value: number) => void;
};

function getCurrencyFractionDigits(currency: string): number {
	try {
		return (
			new Intl.NumberFormat(undefined, {
				currency,
				style: "currency",
			}).resolvedOptions().maximumFractionDigits ?? 2
		);
	} catch {
		return 2;
	}
}

function groupDigits(value: string) {
	return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatMinorUnits(
	value: MoneyInputProps["value"],
	fractionDigits: number,
) {
	if (
		value === null ||
		value === undefined ||
		value === "" ||
		Number(value) === 0
	) {
		return "";
	}

	const minorUnits = BigInt(String(value));
	const scale = BigInt(10) ** BigInt(fractionDigits);

	if (fractionDigits === 0) {
		return groupDigits(minorUnits.toString());
	}

	const wholeUnits = minorUnits / scale;
	const fractionalUnits = (minorUnits % scale)
		.toString()
		.padStart(fractionDigits, "0");

	return `${groupDigits(wholeUnits.toString())}.${fractionalUnits}`;
}

function sanitizeMoneyText(value: string, fractionDigits: number) {
	const normalized = value.replace(/[^\d.]/g, "");

	if (fractionDigits === 0) {
		return normalized.replace(/\D/g, "");
	}

	const [whole = "", ...fractionParts] = normalized.split(".");
	const fraction = fractionParts.join("").slice(0, fractionDigits);

	return fractionParts.length ? `${whole}.${fraction}` : whole;
}

function parseMoneyTextToMinorUnits(value: string, fractionDigits: number) {
	const sanitized = sanitizeMoneyText(value, fractionDigits);

	if (!sanitized || sanitized === ".") {
		return 0;
	}

	const [whole = "0", fraction = ""] = sanitized.split(".");
	const wholeUnits = BigInt(whole || "0");

	if (fractionDigits === 0) {
		return Number(wholeUnits);
	}

	const scale = BigInt(10) ** BigInt(fractionDigits);
	const fractionalUnits = BigInt(
		fraction.padEnd(fractionDigits, "0").slice(0, fractionDigits) || "0",
	);

	return Number(wholeUnits * scale + fractionalUnits);
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
	function MoneyInput(
		{
			value,
			currency,
			onValueChange,
			className,
			onBlur,
			onFocus,
			disabled,
			...props
		},
		ref,
	) {
		const fractionDigits = useMemo(
			() => getCurrencyFractionDigits(currency),
			[currency],
		);
		const [isFocused, setIsFocused] = useState(false);
		const [displayValue, setDisplayValue] = useState(() =>
			formatMinorUnits(value, fractionDigits),
		);

		useEffect(() => {
			if (!isFocused) {
				setDisplayValue(formatMinorUnits(value, fractionDigits));
			}
		}, [value, fractionDigits, isFocused]);

		return (
			<InputGroup
				data-disabled={disabled}
				className={cn(disabled && "opacity-50", className)}
			>
				<InputGroupAddon align="inline-start">{currency}</InputGroupAddon>
				<InputGroupInput
					{...props}
					ref={ref}
					type="text"
					inputMode={fractionDigits === 0 ? "numeric" : "decimal"}
					disabled={disabled}
					value={displayValue}
					onChange={(event) => {
						const nextValue = sanitizeMoneyText(
							event.target.value,
							fractionDigits,
						);
						setDisplayValue(nextValue);
						onValueChange(
							parseMoneyTextToMinorUnits(nextValue, fractionDigits),
						);
					}}
					onBlur={(event) => {
						setIsFocused(false);
						setDisplayValue(
							formatMinorUnits(
								parseMoneyTextToMinorUnits(displayValue, fractionDigits),
								fractionDigits,
							),
						);
						onBlur?.(event);
					}}
					onFocus={(event) => {
						setIsFocused(true);
						setDisplayValue(
							formatMinorUnits(value, fractionDigits).replaceAll(",", ""),
						);
						onFocus?.(event);
					}}
				/>
			</InputGroup>
		);
	},
);
