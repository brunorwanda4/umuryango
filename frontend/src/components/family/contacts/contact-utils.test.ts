import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectContactFileFormat,
  parseContactFile,
  parseGoogleCsv,
} from "./contact-utils";

describe("contact file parsing", () => {
  it("combines Google name columns and preserves quoted multiline notes", () => {
    const csv = [
      "First Name,Middle Name,Last Name,Nickname,File As,Organization Name,E-mail 1 - Value,Phone 1 - Value,Notes",
      'Jean,Claude,Mugisha,,,Umuryango,jean@example.com,"+250 788 000 000","First line\nSecond line"',
    ].join("\n");

    assert.deepEqual(parseGoogleCsv(csv), [
      {
        fullName: "Jean Claude Mugisha",
        phoneNumber: "+250 788 000 000",
        email: "jean@example.com",
        address: undefined,
        organization: "Umuryango",
        notes: "First line\nSecond line",
      },
    ]);
  });

  it("falls back to nickname, organization, then phone for unnamed rows", () => {
    const csv = [
      "First Name,Middle Name,Last Name,Nickname,Organization Name,Phone 1 - Value",
      ",,,Kiki,,+250700000001",
      ",,,,Community SACCO,+250700000002",
      ",,,,,+250700000003",
    ].join("\n");

    assert.deepEqual(
      parseGoogleCsv(csv).map((contact) => contact.fullName),
      ["Kiki", "Community SACCO", "+250700000003"],
    );
  });

  it("detects vCard content even when the file extension is missing", () => {
    const text = "BEGIN:VCARD\nFN:Alice Example\nTEL:+250788000000\nEND:VCARD";

    assert.equal(detectContactFileFormat("contacts.txt", text), "vcard");
    assert.equal(
      parseContactFile("contacts.txt", text)[0]?.fullName,
      "Alice Example",
    );
  });
});
