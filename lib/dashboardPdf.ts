import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface PdfReport {
  client_id: string;
  note: string;
  department: string | null;
  subcategory: string | null;
  priority: string | null;
  status: string;
  created_by_name: string | null;
  created_at: string;
  corrective_action: string | null;
}

export interface PdfAnalytics {
  total: number;
  openCount: number;
  closedCount: number;
  pending: number;
  byPriority: Record<string, number>;
  topSubs: [string, number][];
  topDepts: [string, number][];
}

export interface PdfInput {
  title: string;
  subtitle: string;
  generatedBy: string;
  rows: PdfReport[];
  analytics: PdfAnalytics;
  isArabic: boolean;
}

const PALETTE = {
  crimson:      '#E5284B',
  crimsonLight: '#F05573',
  crimsonDark:  '#B81A3A',
  amber:        '#C77D2A',
  amberLight:   '#E8B974',
  green:        '#3E7A52',
  greenLight:   '#7BBA8A',
  blue:         '#5BA9D6',
  blueDark:     '#2878A8',
  mauve:        '#9B7FB8',
  text:         '#2A1F22',
  textSec:      '#6B5A5C',
  textTer:      '#8A7478',
  border:       '#EEE7DD',
  cream:        '#FDFAF3',
  creamTrack:   '#F2EBE2',
};

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

function blend(hex1: string, hex2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  );
}

function darken(hex: string, amount: number): string {
  return blend(hex, '#000000', amount);
}

function lighten(hex: string, amount: number): string {
  return blend(hex, '#ffffff', amount);
}

function priorityLabel(p: string | null, ar: boolean): string {
  if (!p) return '—';
  const map: Record<string, { ar: string; en: string }> = {
    critical: { ar: 'حرجة', en: 'Critical' },
    high:     { ar: 'عالية', en: 'High' },
    medium:   { ar: 'متوسطة', en: 'Medium' },
    low:      { ar: 'منخفضة', en: 'Low' },
  };
  return map[p] ? (ar ? map[p].ar : map[p].en) : p;
}

function priorityColor(p: string): string {
  const map: Record<string, string> = {
    critical: PALETTE.crimson,
    high:     PALETTE.amber,
    medium:   PALETTE.blue,
    low:      PALETTE.green,
  };
  return map[p] || PALETTE.crimsonLight;
}

// ═══════════════════════════════════════════════════════════
// BAR CHART — 3D-ish pill columns with gradient
// ═══════════════════════════════════════════════════════════
function renderBarChart(
  items: { key: string; label: string; value: number; color: string }[],
): string {
  if (items.length === 0) return '';
  const max = Math.max(1, ...items.map((i) => i.value));

  const columns = items.map((item) => {
    const pct = max > 0 ? Math.max(0, Math.round((item.value / max) * 100)) : 0;
    const fillHeight = pct === 0 ? 0 : Math.max(8, pct);

    return `
      <div class="bar-col">
        ${item.value > 0 ? `<div class="bar-value" style="color:${item.color}">${item.value}</div>` : '<div class="bar-value-empty">0</div>'}
        <div class="bar-track">
          ${fillHeight > 0 ? `
            <div class="bar-fill" style="height:${fillHeight}%; background:linear-gradient(180deg, ${lighten(item.color, 0.15)} 0%, ${item.color} 55%, ${darken(item.color, 0.25)} 100%);">
              <div class="bar-shine"></div>
            </div>
          ` : ''}
        </div>
        <div class="bar-dot" style="background:${item.color};"></div>
        <div class="bar-label">${esc(item.label)}</div>
      </div>
    `;
  }).join('');

  return `<div class="bar-chart">${columns}</div>`;
}

// ═══════════════════════════════════════════════════════════
// PIE CHART — 3D exploded slices using layered SVG
// ═══════════════════════════════════════════════════════════
function renderPieChart(
  items: { key: string; label: string; value: number; color: string }[],
): string {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return '';

  const SIZE = 340;
  const cx = SIZE / 2;
  const cy = SIZE / 2 - 20;
  const rx = 115;
  const ry = 68;
  const depth = 34;
  const explode = 12;
  const LAYERS = 8;

  // Compute slice angles starting from top, going clockwise
  let acc = -Math.PI / 2;
  const slices = items.map((item) => {
    const startAngle = acc;
    const sweep = (item.value / total) * Math.PI * 2;
    const endAngle = acc + sweep;
    acc = endAngle;
    const midAngle = (startAngle + endAngle) / 2;
    return { item, startAngle, endAngle, midAngle };
  });

  // Sort back-to-front so front slices cover back slices
  const sorted = [...slices].sort((a, b) => Math.sin(a.midAngle) - Math.sin(b.midAngle));

  const paths: string[] = [];

  sorted.forEach((slice) => {
    const { item, startAngle, endAngle, midAngle } = slice;
    const ox = Math.cos(midAngle) * explode;
    const oy = Math.sin(midAngle) * explode * (ry / rx);

    const slicePath = (dy: number) => {
      const sx = cx + rx * Math.cos(startAngle);
      const sy = cy + ry * Math.sin(startAngle) + dy;
      const ex = cx + rx * Math.cos(endAngle);
      const ey = cy + ry * Math.sin(endAngle) + dy;
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      return `M ${cx} ${cy + dy} L ${sx} ${sy} A ${rx} ${ry} 0 ${largeArc} 1 ${ex} ${ey} Z`;
    };

    const isFront = Math.sin(midAngle) > -0.15;

    if (isFront) {
      // Side wall — stacked layers, darkest at bottom
      for (let i = LAYERS; i >= 1; i--) {
        const t = i / LAYERS;
        const dy = depth * t;
        const darkness = 0.35 + 0.25 * (1 - t);
        const shade = darken(item.color, darkness);
        paths.push(
          `<path d="${slicePath(dy)}" fill="${shade}" transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)})" />`
        );
      }
    }

    // Top face with soft highlight
    paths.push(
      `<path d="${slicePath(0)}" fill="${item.color}" stroke="#ffffff" stroke-width="1.5" ` +
      `stroke-linejoin="round" transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)})" />`
    );
  });

  const legend = items.map((item) => {
    const pct = ((item.value / total) * 100).toFixed(1);
    return `
      <div class="pie-legend-row">
        <span class="pie-legend-dot" style="background:${item.color};"></span>
        <span class="pie-legend-label">${esc(item.label)}:</span>
        <span class="pie-legend-value" style="color:${item.color}">${pct}%</span>
      </div>
    `;
  }).join('');

  return `
    <div class="pie-wrap">
      <div class="pie-svg">
        <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
          ${paths.join('')}
        </svg>
      </div>
      <div class="pie-legend">${legend}</div>
    </div>
  `;
}

function renderEmptyPie(ar: boolean): string {
  const SIZE = 340;
  const cx = SIZE / 2;
  const cy = SIZE / 2 - 20;
  const rx = 115;
  const ry = 68;
  const depth = 34;

  const ellipse = (dy: number, fill: string, opacity = 1) =>
    `<ellipse cx="${cx}" cy="${cy + dy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}" />`;

  const layers: string[] = [];
  for (let i = 8; i >= 1; i--) {
    const t = i / 8;
    layers.push(ellipse(depth * t, darken(PALETTE.creamTrack, 0.35 - 0.25 * t)));
  }
  layers.push(
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${PALETTE.creamTrack}" ` +
    `stroke="${PALETTE.border}" stroke-width="2" stroke-dasharray="6 6" />`
  );
  layers.push(
    `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="Arial, sans-serif" font-size="14" fill="${PALETTE.textTer}">` +
    `${ar ? 'لا بيانات بعد' : 'No data yet'}</text>`
  );

  return `
    <div class="pie-wrap">
      <div class="pie-svg">
        <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
          ${layers.join('')}
        </svg>
      </div>
      <div class="pie-legend">
        <div class="pie-legend-row">
          <span class="pie-legend-label">${ar ? 'أضف تقارير بتصنيفات لعرض التوزيع' : 'Add reports with categories to see distribution'}</span>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// MAIN PDF GENERATOR
// ═══════════════════════════════════════════════════════════
export async function generateDashboardPdf(input: PdfInput): Promise<string> {
  const { title, subtitle, generatedBy, rows, analytics, isArabic } = input;
  const ar = isArabic;
  const dir = ar ? 'rtl' : 'ltr';

  const statusLabel = (s: string) => {
    if (ar) return s === 'closed' ? 'مغلقة' : s === 'in_progress' ? 'قيد التنفيذ' : 'مفتوحة';
    return s === 'closed' ? 'Closed' : s === 'in_progress' ? 'In progress' : 'Open';
  };

  const barItems = (['critical', 'high', 'medium', 'low'] as const).map((k) => ({
    key: k,
    label: priorityLabel(k, ar),
    value: analytics.byPriority[k] || 0,
    color: priorityColor(k),
  }));

  const pieColors = [
    PALETTE.crimson,
    PALETTE.amber,
    PALETTE.blue,
    PALETTE.green,
    PALETTE.mauve,
  ];
  const pieItems = analytics.topSubs.slice(0, 5).map(([k, v], i) => ({
    key: k,
    label: k,
    value: v,
    color: pieColors[i % pieColors.length],
  }));

  const rowsHtml = rows.length
    ? rows.map((r, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${esc(r.note)}</td>
        <td>${esc(r.department || '—')}</td>
        <td>${esc(r.subcategory || '—')}</td>
        <td>${priorityLabel(r.priority, ar)}</td>
        <td>${statusLabel(r.status)}</td>
        <td>${esc(r.created_by_name || '—')}</td>
        <td>${new Date(r.created_at).toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="8" class="empty">${ar ? 'لا توجد تقارير' : 'No reports'}</td></tr>`;

  const html = `
<!DOCTYPE html>
<html dir="${dir}" lang="${ar ? 'ar' : 'en'}">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 14mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: ${ar ? "'Noto Naskh Arabic', 'Arial', sans-serif" : "'Helvetica', 'Arial', sans-serif"};
      color: ${PALETTE.text};
      margin: 0;
      font-size: 11px;
      background: #fff;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid ${PALETTE.crimson};
      padding-bottom: 10px;
      margin-bottom: 18px;
    }
    .brand { font-size: 20px; font-weight: bold; color: ${PALETTE.crimson}; }
    .subtitle { font-size: 12px; color: ${PALETTE.textSec}; margin-top: 2px; }
    .meta { font-size: 9px; color: ${PALETTE.textTer}; text-align: ${ar ? 'left' : 'right'}; line-height: 1.5; }

    h2 {
      color: ${PALETTE.crimson};
      font-size: 14px;
      margin: 22px 0 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid ${PALETTE.border};
    }

    /* Summary cards */
    .stats { display: flex; gap: 8px; }
    .stat {
      flex: 1;
      background: ${PALETTE.cream};
      border: 1px solid ${PALETTE.border};
      border-radius: 10px;
      padding: 12px 8px;
      text-align: center;
    }
    .stat .n { font-size: 24px; font-weight: bold; }
    .stat .l { font-size: 10px; color: ${PALETTE.textSec}; margin-top: 3px; }

    /* Bar chart */
    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      gap: 20px;
      padding: 24px 20px 12px;
      background: #ffffff;
      border: 1px solid ${PALETTE.border};
      border-radius: 12px;
      height: 300px;
    }
    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      height: 100%;
      justify-content: flex-end;
    }
    .bar-value {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 6px;
      line-height: 1;
    }
    .bar-value-empty {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 6px;
      line-height: 1;
      color: #D9CFC4;
    }
    .bar-track {
      width: 60px;
      height: 175px;
      background: ${PALETTE.creamTrack};
      border-radius: 30px 30px 6px 6px;
      overflow: hidden;
      display: flex;
      align-items: flex-end;
      position: relative;
    }
    .bar-fill {
      width: 100%;
      border-radius: 30px 30px 0 0;
      position: relative;
      overflow: hidden;
    }
    .bar-shine {
      position: absolute;
      top: 4px;
      left: 6px;
      right: 6px;
      height: 40%;
      background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%);
      border-radius: 24px 24px 0 0;
    }
    .bar-dot {
      width: 12px;
      height: 12px;
      border-radius: 6px;
      margin-top: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .bar-label {
      font-size: 11px;
      color: ${PALETTE.textTer};
      margin-top: 6px;
      font-weight: 500;
    }

    /* Pie chart */
    .pie-wrap {
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 24px 16px;
      background: #ffffff;
      border: 1px solid ${PALETTE.border};
      border-radius: 12px;
      ${ar ? 'flex-direction: row-reverse;' : ''}
    }
    .pie-svg {
      flex: 0 0 340px;
      width: 340px;
      height: 340px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pie-legend { flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .pie-legend-row {
      display: flex;
      align-items: center;
      gap: 10px;
      ${ar ? 'justify-content: flex-end;' : ''}
    }
    .pie-legend-dot {
      width: 14px;
      height: 14px;
      border-radius: 7px;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .pie-legend-label { font-size: 13px; color: ${PALETTE.textSec}; }
    .pie-legend-value { font-size: 16px; font-weight: bold; margin-${ar ? 'right' : 'left'}: auto; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9.5px; }
    thead th {
      background: ${PALETTE.crimson};
      color: #fff;
      padding: 7px 5px;
      text-align: ${ar ? 'right' : 'left'};
      font-weight: 500;
    }
    tbody td {
      border-bottom: 1px solid ${PALETTE.border};
      padding: 6px 5px;
      vertical-align: top;
    }
    tbody tr:nth-child(even) td { background: ${PALETTE.cream}; }
    td.num { width: 24px; text-align: center; color: ${PALETTE.textTer}; }
    td.empty { text-align: center; padding: 24px; color: ${PALETTE.textTer}; }

    .footer {
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid ${PALETTE.border};
      font-size: 9px;
      color: ${PALETTE.textTer};
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand">${esc(title)}</div>
      <div class="subtitle">${esc(subtitle)}</div>
    </div>
    <div class="meta">
      ${ar ? 'أُنشئ بواسطة' : 'Generated by'}: ${esc(generatedBy)}<br/>
      ${new Date().toLocaleString(ar ? 'ar-EG' : 'en-GB')}
    </div>
  </div>

  <h2>${ar ? 'الملخص' : 'Summary'}</h2>
  <div class="stats">
    <div class="stat"><div class="n" style="color:${PALETTE.text}">${analytics.total}</div><div class="l">${ar ? 'الإجمالي' : 'Total'}</div></div>
    <div class="stat"><div class="n" style="color:${PALETTE.amber}">${analytics.openCount}</div><div class="l">${ar ? 'مفتوحة' : 'Open'}</div></div>
    <div class="stat"><div class="n" style="color:${PALETTE.green}">${analytics.closedCount}</div><div class="l">${ar ? 'مغلقة' : 'Closed'}</div></div>
    <div class="stat"><div class="n" style="color:${PALETTE.crimson}">${analytics.total}</div><div class="l">${ar ? 'الكل' : 'All'}</div></div>
  </div>

  <h2>${ar ? 'التقارير حسب الأولوية' : 'Reports by Priority'}</h2>
  ${renderBarChart(barItems)}

  <h2>${ar ? 'التوزيع حسب التصنيف' : 'Distribution by Category'}</h2>
  ${pieItems.length > 0 ? renderPieChart(pieItems) : renderEmptyPie(ar)}

  <h2>${ar ? 'التقارير' : 'Reports'} (${rows.length})</h2>
  <table>
    <thead>
      <tr>
        <th class="num">#</th>
        <th>${ar ? 'الوصف' : 'Description'}</th>
        <th>${ar ? 'القسم' : 'Dept'}</th>
        <th>${ar ? 'التصنيف' : 'Subcat'}</th>
        <th>${ar ? 'الأولوية' : 'Priority'}</th>
        <th>${ar ? 'الحالة' : 'Status'}</th>
        <th>${ar ? 'المُبلِّغ' : 'Reporter'}</th>
        <th>${ar ? 'التاريخ' : 'Date'}</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    ${ar ? 'فياض برقن للنفط — إدارة السلامة المهنية' : 'Fayadh Barqan Petroleum — HSE Department'}
    · ${ar ? 'نظام إدارة السلامة' : 'HSE Safety Manager'}
  </div>

</body>
</html>
  `.trim();

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function sharePdf(uri: string, dialogTitle: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle,
    UTI: 'com.adobe.pdf',
  });
}
