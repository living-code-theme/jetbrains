// Port-owned role-contract tests, exercising generated files and real grammars.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {resolveAll} from '../scripts/palette.mjs';
import {generate} from '../src/generate.mjs';
import {JETBRAINS_FALLBACK,JETBRAINS_KEYS} from './contract.mjs';

const flavors = resolveAll();

const root = new URL("../", import.meta.url);

const read = (path) => readFileSync(new URL(path, root), "utf8");

const parentKeys = new Set(JSON.parse(read("test/fixtures/jetbrains-parent-keys.json")).keys);

const norm = (hex) => hex?.toLowerCase().slice(0, 7);

const TERMINALS = {"jetbrains (console and block terminal)": (f) => {
    const xml = read(`themes/${f.slug}.xml`);
    const fg = (k) => { const m = xml.match(new RegExp(`<option name="${k}">\\s*<value>\\s*<option name="FOREGROUND" value="([0-9a-fA-F]{6})"`)); return m && `#${m[1].toLowerCase()}`; };
    const names = ["BLACK", "RED", "GREEN", "YELLOW", "BLUE", "MAGENTA", "CYAN", "WHITE"];
    const console = ["BLACK", "RED", "GREEN", "YELLOW", "BLUE", "MAGENTA", "CYAN", "GRAY", "DARKGRAY", "RED_BRIGHT", "GREEN_BRIGHT", "YELLOW_BRIGHT", "BLUE_BRIGHT", "MAGENTA_BRIGHT", "CYAN_BRIGHT", "WHITE"];
    const block = [...names.map((n) => fg(`BLOCK_TERMINAL_${n}`)), ...names.map((n) => fg(`BLOCK_TERMINAL_${n}_BRIGHT`))];
    const out = console.map((n) => fg(`CONSOLE_${n}_OUTPUT`));
    return { ansi: block.map((b, i) => (norm(b) === norm(out[i]) ? b : `block ${b} / console ${out[i]}`)) };
  }};

const EDITOR_UI = {jetbrains: (f) => {
    const xml = read(`themes/${f.slug}.xml`);
    const o = (k) => { const m = xml.match(new RegExp(`<option name="${k}" value="([0-9a-fA-F]{6})"`)); return m && `#${m[1]}`; };
    const text = xml.match(/<option name="TEXT">[\s\S]*?<\/option>/)?.[0] ?? "";
    const t = (k) => { const m = text.match(new RegExp(`name="${k}" value="([0-9a-fA-F]{6})"`)); return m && `#${m[1]}`; };
    return { bg: t("BACKGROUND"), fg: t("FOREGROUND"), cursor: o("CARET_COLOR"), selection: o("SELECTION_BACKGROUND"), lineNumber: o("LINE_NUMBERS_COLOR"), lineNumberActive: o("LINE_NUMBER_ON_CARET_ROW_COLOR"), lineHighlight: o("CARET_ROW_COLOR") };
  }};

test("JetBrains sets every key the IDE's own schemes color, so none of their colors shows through", () => {
  for (const f of flavors) {
    const xml = read(`themes/${f.slug}.xml`);
    const set = new Set([...xml.matchAll(/<option name="([^"]+)"/g)].map((m) => m[1]));
    assert.deepEqual([...parentKeys].filter((k) => !set.has(k)), [], `${f.id}: set these keys (scripts/update-jetbrains-keys.mjs lists them)`);
  }
});

test("JetBrains colors every attribute key with its role, through the IDE's fallbacks", async () => {
  const failures = [];
  for (const f of flavors) {
    const xml = read(`themes/${f.slug}.xml`);
    const options = {};
    for (const m of xml.matchAll(/<option name="([^"]+)"(?: baseAttributes="([^"]+)")?\s*(\/>|>([\s\S]*?)<\/option>)/g)) {
      const fg = m[4]?.match(/<option name="FOREGROUND" value="([0-9a-fA-F]{6})"/)?.[1];
      options[m[1]] = { base: m[2], fg: fg && `#${fg.toLowerCase()}` };
    }
    // A key the scheme leaves out but the IDE's own schemes color shows their color (Darcula's #a9b7c6 for RADIUS).
    const resolve = (key, depth = 0) => {
      if (depth > 10) return undefined;
      const o = options[key];
      if (o?.fg) return o.fg;
      if (!o && parentKeys.has(key)) return `the parent scheme's color (${key} is not set)`;
      const next = o?.base ?? JETBRAINS_FALLBACK[key];
      return next && resolve(next, depth + 1);
    };
    for (const [key, role] of Object.entries(JETBRAINS_KEYS)) {
      const got = resolve(key);
      if (norm(got) !== norm(f.r(role))) failures.push(`jetbrains ${f.id} ${key}: ${role} is ${f.r(role)}, got ${got}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("every terminal has the same ANSI colors, background, foreground, cursor and selection", () => {
  const failures = [];
  for (const f of flavors) {
    const want = { bg: f.r("bg"), fg: f.r("fg"), cursor: f.r("cursor"), selection: f.r("selection"), ansi: [...f.ansi.normal, ...f.ansi.bright] };
    for (const [port, load] of Object.entries(TERMINALS)) {
      const got = load(f);
      for (const k of ["bg", "fg", "cursor", "selection"]) {
        if (k in got && norm(got[k]) !== norm(want[k])) failures.push(`${port} ${f.id} ${k}: ${want[k]}, got ${got[k]}`);
      }
      got.ansi.forEach((c, i) => { if (norm(c) !== norm(want.ansi[i])) failures.push(`${port} ${f.id} ANSI ${i}: ${want.ansi[i]}, got ${c}`); });
    }
  }
  assert.deepEqual(failures, []);
});

test("every editor draws its editing surface with the same roles", async () => {
  const failures = [];
  for (const f of flavors) {
    for (const [port, load] of Object.entries(EDITOR_UI)) {
      const got = await load(f);
      for (const [role, color] of Object.entries(got)) {
        if (norm(color) !== norm(f.r(role))) failures.push(`${port} ${f.id} ${role}: ${f.r(role)}, got ${color}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});
