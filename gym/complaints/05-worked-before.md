After upgrading dotcfg, our email templates that have "\n" in them print
the literal characters backslash-n instead of real line breaks. This
worked before the upgrade. Downgrading fixes it but we need the new
version for multiline values.
