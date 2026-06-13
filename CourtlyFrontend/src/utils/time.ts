const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export function timeAgo(iso: string): string {
  const now = Date.now();
  // LocalDateTime from Java has no tz suffix — treat it as UTC (server always runs in UTC)
  const hasTimezone = iso.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(iso);
  const date = new Date(hasTimezone ? iso : iso + 'Z');
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  const diffMo  = Math.floor(diffD / 30);

  if (diffMin < 1)  return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  if (diffH   < 24) return `hace ${diffH}h`;
  if (diffD   < 30) return `hace ${diffD}d`;
  if (diffMo  < 12) return `hace ${diffMo} ${diffMo === 1 ? 'mes' : 'meses'}`;

  return `${date.getDate()} de ${MONTHS[date.getMonth()]} del ${date.getFullYear()}`;
}
