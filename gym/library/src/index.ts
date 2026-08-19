export interface ParseOptions {
  /** Expand ${VAR} references to previously-defined keys. Default: false. */
  interpolate?: boolean;
  /** Coerce values to number/boolean/Date when they look like one. Default: false. */
  coerce?: boolean;
  /** Allow empty values (KEY=). When false, empty values throw. Default: true. */
  allowEmpty?: boolean;
}

export type ConfigValue = string | number | boolean | Date;

export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly line: number,
  ) {
    super(`${message} (line ${line})`);
    this.name = "ConfigError";
  }
}

/**
 * Parse an env-style config string.
 *
 * Syntax:
 *   KEY=value            plain value, trimmed
 *   KEY="value"          double-quoted: preserves inner whitespace, expands \n and \t escapes
 *   KEY='value'          single-quoted: fully literal, no escapes, no interpolation
 *   # comment            full-line comments
 *   KEY="multi           double-quoted values may span multiple lines
 *   line"
 */
export function parse(
  source: string,
  options: ParseOptions = {},
): Record<string, ConfigValue> {
  const { interpolate = false, coerce = false, allowEmpty = true } = options;
  const result: Record<string, ConfigValue> = {};
  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i].trim();
    if (line === "" || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) throw new ConfigError(`Missing "=" in "${line}"`, lineNo);

    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new ConfigError(`Invalid key "${key}"`, lineNo);
    }

    let raw = line.slice(eq + 1).trim();

    // Multiline: a double-quoted value may span lines until the closing quote.
    if (countUnescapedQuotes(raw) % 2 === 1) {
      while (i + 1 < lines.length) {
        i++;
        raw += "\n" + lines[i];
        if (lines[i].includes('"')) break;
      }
    }

    let value = unquote(raw);

    if (!allowEmpty && value === "") {
      throw new ConfigError(`Empty value for "${key}"`, lineNo);
    }

    if (interpolate) {
      value = value.replace(/\$\{(\w+)\}/g, (_, name: string) =>
        String(result[name]),
      );
    }

    result[key] = coerce ? coerceValue(value) : value;
  }

  return result;
}

function countUnescapedQuotes(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"' && s[i - 1] !== "\\") n++;
  }
  return n;
}

function unquote(raw: string): string {
  if (
    raw.length >= 2 &&
    (raw[0] === '"' || raw[0] === "'") &&
    raw[raw.length - 1] === raw[0]
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

function coerceValue(v: string): ConfigValue {
  const first = v[0].toLowerCase();
  if (first === "t" || first === "f") {
    const lower = v.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(`${v}T00:00:00`);
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) {
    return Number(v);
  }
  return v;
}
