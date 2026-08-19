import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, ConfigError } from "./index.js";

test("parses plain key=value pairs", () => {
  assert.deepEqual(parse("HOST=localhost\nPORT=8080"), {
    HOST: "localhost",
    PORT: "8080",
  });
});

test("skips comments and blank lines", () => {
  assert.deepEqual(parse("# a comment\n\nNAME=app\n"), { NAME: "app" });
});

test("double quotes preserve inner whitespace", () => {
  assert.deepEqual(parse('GREETING="  hello  "'), { GREETING: "  hello  " });
});

test("single quotes are literal", () => {
  assert.deepEqual(parse("PATTERN='a*b'"), { PATTERN: "a*b" });
});

test("coerces booleans and numbers", () => {
  assert.deepEqual(parse("DEBUG=true\nRETRIES=3\nRATIO=0.5", { coerce: true }), {
    DEBUG: true,
    RETRIES: 3,
    RATIO: 0.5,
  });
});

test("interpolates earlier keys", () => {
  assert.deepEqual(
    parse("HOST=db.local\nURL=postgres://${HOST}/app", { interpolate: true }),
    { HOST: "db.local", URL: "postgres://db.local/app" },
  );
});

test("allowEmpty: false rejects empty values", () => {
  assert.throws(
    () => parse("TOKEN=", { allowEmpty: false }),
    (err: unknown) => err instanceof ConfigError && err.line === 1,
  );
});

test("throws on lines without =", () => {
  assert.throws(() => parse("JUSTAKEY"), ConfigError);
});

test("multiline double-quoted values", () => {
  assert.deepEqual(parse('NOTE="first\nsecond"'), { NOTE: "first\nsecond" });
});
