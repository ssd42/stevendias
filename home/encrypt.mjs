// Encrypts home/data.json → home/data.enc.json for the password-locked page.
//
//   node home/encrypt.mjs              (prompts for the password)
//   HOME_PASS=... node home/encrypt.mjs
//
// AES-256-GCM with a PBKDF2-SHA256 key. Must match the decrypt code in index.html.
// Run this after every edit to data.json, then commit data.enc.json.

import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { createInterface } from "node:readline";

const dir = new URL(".", import.meta.url);
const ITERATIONS = 600000;

const ask = q => new Promise(res => {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = s => { if (s.startsWith(q)) rl.output.write(q); };
  rl.question(q, a => { rl.close(); process.stdout.write("\n"); res(a); });
});

let pass = process.env.HOME_PASS;
if (!pass) {
  pass = await ask("Password: ");
  if (pass !== await ask("Again:    ")) { console.error("Passwords don't match."); process.exit(1); }
}
if (pass.length < 8) { console.error("Use at least 8 characters."); process.exit(1); }

const plain = readFileSync(new URL("data.json", dir), "utf8");
JSON.parse(plain); // fail loudly on a typo before encrypting it

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));

const b64 = b => Buffer.from(b).toString("base64");
writeFileSync(new URL("data.enc.json", dir), JSON.stringify({
  v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(ct),
}) + "\n");
console.log("Wrote home/data.enc.json");
