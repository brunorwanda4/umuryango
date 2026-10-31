import fs from "node:fs";
import path from "node:path";

const enJsonPath = path.resolve(__dirname, "../src/messages/en.json");

function getEnJson(): Record<string, unknown> {
  const content = fs.readFileSync(enJsonPath, "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}

function saveEnJson(data: Record<string, unknown>) {
  fs.writeFileSync(enJsonPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function getLineNumber(keyPath: string): number {
  const lines = fs.readFileSync(enJsonPath, "utf-8").split("\n");
  const lastKey = keyPath.split(".").pop();
  if (!lastKey) return 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line?.includes(`"${lastKey}":`)) {
      return i + 1;
    }
  }
  return 1;
}

function searchKeys(
  obj: Record<string, unknown>,
  query: string,
  prefix = "",
): Array<{ key: string; value: string; line: number }> {
  const results: Array<{ key: string; value: string; line: number }> = [];
  const lowerQuery = query.toLowerCase();

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      if (
        fullKey.toLowerCase().includes(lowerQuery) ||
        v.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ key: fullKey, value: v, line: getLineNumber(fullKey) });
      }
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      results.push(...searchKeys(v as Record<string, unknown>, query, fullKey));
    }
  }

  return results;
}

function setNestedValue(
  obj: Record<string, unknown>,
  keyPath: string,
  newValue: string,
): boolean {
  const parts = keyPath.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i] as string;
    if (!current[part] || typeof current[part] !== "object") {
      return false;
    }
    current = current[part] as Record<string, unknown>;
  }

  const last = parts[parts.length - 1] as string;
  if (!(last in current)) {
    return false;
  }

  current[last] = newValue;
  return true;
}

const args = process.argv.slice(2);
const command = args[0];

if (command === "find") {
  const query = args[1] ?? "";
  if (!query) {
    console.error("Usage: bun run i18n find <text_or_key>");
    process.exit(1);
  }
  const data = getEnJson();
  const matches = searchKeys(data, query);
  if (matches.length === 0) {
    console.log(`No translations matching "${query}" found.`);
  } else {
    console.log(`Found ${matches.length} matching translation(s):\n`);
    for (const match of matches) {
      console.log(`- ${match.key} (line ${match.line}):`);
      console.log(`  "${match.value}"`);
    }
  }
} else if (command === "set" || command === "update") {
  const key = args[1];
  const value = args.slice(2).join(" ");
  if (!key || !value) {
    console.error("Usage: bun run i18n set <key.path> <new value>");
    process.exit(1);
  }
  const data = getEnJson();
  if (setNestedValue(data, key, value)) {
    saveEnJson(data);
    console.log(`Updated "${key}" to: "${value}"`);
  } else {
    console.error(`Key "${key}" not found in en.json`);
    process.exit(1);
  }
} else {
  console.log("Rwanda Family i18n CLI");
  console.log("Usage:");
  console.log(
    "  bun run i18n find <word_or_key>    Find where a word or key is in en.json with line numbers",
  );
  console.log(
    "  bun run i18n set <key.path> <value> Update a word in en.json directly",
  );
}
