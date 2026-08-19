// dotcfg 1.0.0 — the release before the 1.1.0 "multiline values" refactor.
// Published snapshot; kept here so version bisection has a real target.

export interface ParseOptions {
  interpolate?: boolean;
  coerce?: boolean;
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

    const raw = line.slice(eq + 1).trim();
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

function unquote(raw: string): string {
  if (
    raw.length >= 2 &&
    (raw[0] === '"' || raw[0] === "'") &&
    raw[raw.length - 1] === raw[0]
  ) {
    const inner = raw.slice(1, -1);
    if (raw[0] === '"') {
      return inner.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    }
    return inner;
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
