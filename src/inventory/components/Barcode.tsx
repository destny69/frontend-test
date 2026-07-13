import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Deterministic, dependency-free Code128-style bar rendering derived from the string.
// Not a certified symbology — a faithful visual barcode of the stored value.
export function barcodeBars(value: string): number[] {
  const widths: number[] = [];
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    widths.push((c % 3) + 1, ((c >> 2) % 3) + 1, ((c >> 4) % 3) + 1, ((c >> 1) % 3) + 1);
  }
  return widths.length ? widths : [1];
}

export function barcodeSvg(
  value: string,
  { height = 56, unit = 2, color = 'currentColor' }: { height?: number; unit?: number; color?: string } = {},
): string {
  const widths = barcodeBars(value);
  const quiet = unit * 5;
  let x = quiet;
  const rects: string[] = [];
  widths.forEach((w, i) => {
    const bw = w * unit;
    // even index = dark bar, odd index = light gap
    if (i % 2 === 0) rects.push(`<rect x="${x}" y="0" width="${bw}" height="${height}" fill="${color}"/>`);
    x += bw;
  });
  const totalW = x + quiet;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}" preserveAspectRatio="xMinYMid meet">${rects.join('')}</svg>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

// Opens a focused printable label window and triggers the browser print dialog.
export function printBarcode(opts: { title: string; subtitle?: string; value: string }) {
  const svg = barcodeSvg(opts.value, { height: 80, unit: 2, color: '#000' });
  const w = window.open('', '_blank', 'width=480,height=360');
  if (!w) return;
  w.document.write(
    `<!doctype html><html><head><title>${escapeHtml(opts.title)}</title>` +
      `<style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;color:#000;text-align:center}` +
      `.label{border:1px solid #000;display:inline-block;padding:16px 24px}` +
      `.name{font-size:14px;font-weight:600;margin-bottom:4px}` +
      `.sub{font-size:11px;color:#333;margin-bottom:10px}` +
      `.code{font-size:12px;letter-spacing:3px;margin-top:6px}</style></head>` +
      `<body><div class="label"><div class="name">${escapeHtml(opts.title)}</div>` +
      (opts.subtitle ? `<div class="sub">${escapeHtml(opts.subtitle)}</div>` : '') +
      svg +
      `<div class="code">${escapeHtml(opts.value)}</div></div>` +
      `<script>window.onload=function(){window.focus();window.print();}</script>` +
      `</body></html>`,
  );
  w.document.close();
}

export default function Barcode({ value, height = 56, unit = 2 }: { value: string; height?: number; unit?: number }) {
  const markup = useMemo(() => barcodeSvg(value, { height, unit, color: 'currentColor' }), [value, height, unit]);
  return (
    <Box>
      <Box
        sx={{ color: 'text.primary', lineHeight: 0, overflowX: 'auto', '& svg': { display: 'block' } }}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <Typography variant="caption" sx={{ letterSpacing: 3, color: 'text.secondary', fontFamily: 'monospace' }}>
        {value}
      </Typography>
    </Box>
  );
}
