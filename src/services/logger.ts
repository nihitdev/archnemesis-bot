export function redact(value: unknown): string {
  let text = value instanceof Error ? `${value.name}: ${value.message}` : String(value);
  for (const secret of [process.env.DISCORD_TOKEN].filter((s): s is string => Boolean(s)))
    text = text.replaceAll(secret, '[REDACTED]');
  return text
    .replace(/(?:Bot|Bearer)\s+[^\s"']+/gi, '[REDACTED AUTH]')
    .replace(/[\w-]{23,}\.[\w-]{6}\.[\w-]{27,}/g, '[REDACTED TOKEN]');
}
export function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  details: Record<string, unknown> = {},
) {
  console[level](
    JSON.stringify({
      time: new Date().toISOString(),
      level,
      event,
      ...Object.fromEntries(Object.entries(details).map(([k, v]) => [k, redact(v)])),
    }),
  );
}
