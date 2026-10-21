#!/usr/bin/env node
// Refreshes test/fixtures/jetbrains-parent-keys.json: every attribute key that the JetBrains IDEs' own Default and
// Darcula schemes (with the additions each bundled plugin makes to them) give a color. The Living Code schemes have
// Darcula as their parent, and a key they leave out shows the parent's color: RADIUS in TypeScript once came out in
// Darcula's #a9b7c6 because the scheme did not set JS.LOCAL_VARIABLE. test/roles.test.mjs fails while any of
// these keys is missing from the scheme.
//
// Usage: node scripts/update-jetbrains-keys.mjs <IDE directory>, e.g. the intellij-idea folder of an IntelliJ IDEA
// install. Needs `unzip`.
import { execFileSync } from "node:child_process";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const ide = process.argv[2];
if (!ide) throw new Error("usage: node scripts/update-jetbrains-keys.mjs <IDE directory>");
const out = fileURLToPath(new URL("../test/fixtures/jetbrains-parent-keys.json", import.meta.url));

const jars = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? jars(p) : p.endsWith(".jar") ? [p] : [];
});
const unzip = (args) => execFileSync("unzip", args, { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] });
const entries = (jar) => { try { return unzip(["-Z1", jar]).split("\n"); } catch { return []; } };

// Keys with a color in a scheme file, or in the attributes section of the bundled scheme manager.
const colored = (xml) => {
  const keys = [];
  for (const m of xml.matchAll(/<option name="([^"]+)"(?: baseAttributes="[^"]+")?\s*(?:\/>|>([\s\S]*?)<\/option>)/g)) {
    if (/<option name="(FOREGROUND|BACKGROUND|EFFECT_COLOR|ERROR_STRIPE_COLOR)" value="[^"]+"/.test(m[2] ?? "")) keys.push(m[1]);
  }
  return keys;
};

const keys = new Set();
const sources = [];
for (const jar of jars(ide)) {
  for (const entry of entries(jar)) {
    if (entry === "DefaultColorSchemesManager.xml") {
      const xml = unzip(["-p", jar, entry]);
      // Both bundled schemes: Default (light) is Darcula's parent, so its keys reach the Living Code schemes too.
      for (const scheme of xml.split(/(?=<scheme name=")/).filter((s) => /^<scheme name="(Default|Darcula)"/.test(s))) {
        colored(scheme.slice(scheme.indexOf("<attributes>"))).forEach((k) => keys.add(k));
      }
      sources.push(`${basename(jar)}:${entry}`);
    } else if (/^(colorSchemes?|colors)\/[^/]*(Darcula|Default)[^/]*\.xml$/i.test(entry) && !/contrast|expui/i.test(entry)) {
      colored(unzip(["-p", jar, entry])).forEach((k) => keys.add(k));
      sources.push(`${basename(jar)}:${entry}`);
    }
  }
}
if (!sources.length) throw new Error(`no color schemes found under ${ide}`);
writeFileSync(out, `${JSON.stringify({ ide: basename(ide.replace(/\/+$/, "")), sources: sources.sort(), keys: [...keys].sort() }, null, 2)}\n`);
console.log(`${keys.size} colored keys from ${sources.length} scheme files; wrote ${out}`);
