import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Svg, {
  Rect,
  Circle,
  Ellipse,
  G,
  Path,
  Text as SvgText,
} from 'react-native-svg';

const PALETTE = {
  crimson: '#E5284B',
  amber: '#C77D2A',
  green: '#3E7A52',
  blue: '#5BA9D6',
  mauve: '#9B7FB8',
  text: '#2A1F22',
  textSec: '#6B5A5C',
  creamTrack: '#F2EBE2',
  white: '#FFFFFF',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: PALETTE.crimson,
  high: PALETTE.amber,
  medium: PALETTE.blue,
  low: PALETTE.green,
};

export type ChartHandle = { capture: () => Promise<string | null> };

// ═══════════════════════════════════════════════════
// Bar Chart — SVG bars + RN Text labels (Arabic safe)
// ═══════════════════════════════════════════════════
interface BarChartProps {
  data: { key: string; label: string; value: number }[];
  width?: number;
  height?: number;
}

export const BarChartCapture = forwardRef<ChartHandle, BarChartProps>(
  ({ data, width = 700, height = 400 }, ref) => {
    const shotRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!shotRef.current) return null;
        try {
          return await shotRef.current.capture();
        } catch (err) {
          console.warn('[BarChartCapture] capture failed:', err);
          return null;
        }
      },
    }));

    const LABEL_H = 100;
    const svgH = height - LABEL_H;
    const chartPadding = 60;
    const barWidth = 90;
    const gap =
      (width - chartPadding * 2 - barWidth * data.length) /
      Math.max(1, data.length - 1);
    const max = Math.max(1, ...data.map((d) => d.value));
    const chartHeight = svgH - 70;
    const baseline = svgH - 30;

    return (
      <ViewShot
        ref={shotRef}
        options={{ format: 'png', quality: 1, result: 'base64' }}
      >
        <View style={{ width, height, backgroundColor: PALETTE.white }}>
          <Svg width={width} height={svgH}>
            {data.map((d, i) => {
              const x = chartPadding + i * (barWidth + gap);
              const pct = d.value / max;
              const barHeight = Math.max(4, pct * chartHeight);
              const y = baseline - barHeight;
              const color = PRIORITY_COLORS[d.key] || PALETTE.crimson;
              const topRadius = Math.min(
                barWidth / 2,
                Math.max(4, barHeight / 2),
              );

              return (
                <G key={d.key}>
                  <Rect
                    x={x}
                    y={baseline - chartHeight}
                    width={barWidth}
                    height={chartHeight}
                    rx={topRadius}
                    fill={PALETTE.creamTrack}
                  />
                  <Path
                    d={`M ${x} ${baseline}
                       L ${x} ${y + topRadius}
                       Q ${x} ${y} ${x + topRadius} ${y}
                       L ${x + barWidth - topRadius} ${y}
                       Q ${x + barWidth} ${y} ${x + barWidth} ${y + topRadius}
                       L ${x + barWidth} ${baseline} Z`}
                    fill={color}
                  />
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 14}
                    fontSize={24}
                    fontWeight="bold"
                    fill={color}
                    textAnchor="middle"
                  >
                    {String(d.value)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>

          {/* Arabic labels — RN Text, no clipping possible */}
          <View style={[styles.labelRow, { height: LABEL_H }]}>
            {data.map((d) => {
              const color = PRIORITY_COLORS[d.key] || PALETTE.crimson;
              return (
                <View
                  key={d.key}
                  style={[styles.labelCell, { width: barWidth + gap }]}
                >
                  <Text style={styles.labelText}>{d.label}</Text>
                  <View style={[styles.labelDot, { backgroundColor: color }]} />
                </View>
              );
            })}
          </View>
        </View>
      </ViewShot>
    );
  },
);
BarChartCapture.displayName = 'BarChartCapture';

// ═══════════════════════════════════════════════════
// Pie Chart 3D — SVG pie + RN Text legend
// ═══════════════════════════════════════════════════
interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  width?: number;
  height?: number;
}

export const PieChartCapture = forwardRef<ChartHandle, PieChartProps>(
  ({ data, width = 700, height = 500 }, ref) => {
    const shotRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!shotRef.current) return null;
        try {
          return await shotRef.current.capture();
        } catch (err) {
          console.warn('[PieChartCapture] capture failed:', err);
          return null;
        }
      },
    }));

    const total = data.reduce((s, d) => s + d.value, 0);
    const legendW = 260;
    const pieArea = width - legendW;
    const cx = pieArea / 2;
    const cy = height / 2;
    const r = Math.min(pieArea, height) / 2 - 80;
    const explode = 22;
    const depth = 48;
    const layers = 16;

    const sliceColors = [
      PALETTE.crimson,
      PALETTE.amber,
      PALETTE.blue,
      PALETTE.green,
      PALETTE.mauve,
    ];

    // ── Empty state ──
    if (total === 0) {
      return (
        <ViewShot
          ref={shotRef}
          options={{ format: 'png', quality: 1, result: 'base64' }}
        >
          <View style={{ width, height, backgroundColor: PALETTE.white }}>
            <Svg width={width} height={height}>
              <Circle
                cx={width / 2}
                cy={height / 2}
                r={140}
                fill={PALETTE.creamTrack}
                stroke="#EEE7DD"
                strokeWidth={2}
                strokeDasharray="10 8"
              />
            </Svg>
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>لا بيانات بعد</Text>
            </View>
          </View>
        </ViewShot>
      );
    }

    // ── Slice geometry ──
    let acc = -Math.PI / 2;
    const slices = data.map((d, i) => {
      const startAngle = acc;
      const sweep = (d.value / total) * Math.PI * 2;
      const endAngle = acc + sweep;
      acc = endAngle;
      const midAngle = (startAngle + endAngle) / 2;
      return {
        d,
        startAngle,
        endAngle,
        midAngle,
        color: d.color || sliceColors[i % sliceColors.length],
      };
    });

    const sorted = [...slices].sort(
      (a, b) => Math.sin(a.midAngle) - Math.sin(b.midAngle),
    );

    const polar = (angle: number, radius: number) => ({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });

    const arcPath = (start: number, end: number, radius: number) => {
      const s = polar(start, radius);
      const e = polar(end, radius);
      const largeArc = end - start > Math.PI ? 1 : 0;
      return `M ${cx} ${cy} L ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
    };

    const paths: React.ReactNode[] = [];

    // Ground shadow
    paths.push(
      <Ellipse
        key="pie-shadow"
        cx={cx}
        cy={cy + depth + 12}
        rx={r * 1.02 + explode}
        ry={r * 0.34}
        fill="rgba(0,0,0,0.18)"
      />,
    );

    sorted.forEach((slice, i) => {
      const ox = Math.cos(slice.midAngle) * explode;
      const oy = Math.sin(slice.midAngle) * explode;
      const isFront = Math.sin(slice.midAngle) > -0.25;

      if (isFront) {
        for (let k = layers; k >= 1; k--) {
          const t = k / layers;
          const dy = depth * t;
          const darken = 0.28 + 0.32 * (1 - t);
          paths.push(
            <Path
              key={`wall-${i}-${k}`}
              d={arcPath(slice.startAngle, slice.endAngle, r)}
              fill={shadeColor(slice.color, darken)}
              transform={`translate(${ox.toFixed(2)} ${oy.toFixed(2)}) translate(0 ${dy.toFixed(2)})`}
              stroke={shadeColor(slice.color, 0.55)}
              strokeWidth={0.6}
            />,
          );
        }
      }

      paths.push(
        <Path
          key={`top-${i}`}
          d={arcPath(slice.startAngle, slice.endAngle, r)}
          fill={slice.color}
          stroke={PALETTE.white}
          strokeWidth={2.5}
          transform={`translate(${ox.toFixed(2)} ${oy.toFixed(2)})`}
        />,
      );

      const midR = r * 0.86;
      const rimS = polar(slice.startAngle + 0.05, midR);
      const rimE = polar(slice.endAngle - 0.05, midR);
      const rimLarge = slice.endAngle - slice.startAngle > Math.PI ? 1 : 0;
      paths.push(
        <Path
          key={`rim-${i}`}
          d={`M ${rimS.x} ${rimS.y} A ${midR} ${midR} 0 ${rimLarge} 1 ${rimE.x} ${rimE.y}`}
          stroke={shadeColor(slice.color, -0.22)}
          strokeWidth={6}
          fill="none"
          opacity={0.45}
          transform={`translate(${ox.toFixed(2)} ${oy.toFixed(2)})`}
        />,
      );
    });

    return (
      <ViewShot
        ref={shotRef}
        options={{ format: 'png', quality: 1, result: 'base64' }}
      >
        <View
          style={{
            width,
            height,
            backgroundColor: PALETTE.white,
            flexDirection: 'row',
          }}
        >
          <Svg width={pieArea} height={height}>
            <G>{paths}</G>
          </Svg>

          {/* Legend — RN Text, Arabic safe */}
          <View style={[styles.legendCol, { width: legendW }]}>
            {data.slice(0, 5).map((d, i) => {
              const pct = ((d.value / total) * 100).toFixed(1);
              const color = d.color || sliceColors[i % sliceColors.length];
              return (
                <View key={`legend-${i}`} style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: color }]}
                  />
                  <View style={styles.legendTextWrap}>
                    <Text style={styles.legendLabel}>{d.label}</Text>
                    <Text style={styles.legendPct}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ViewShot>
    );
  },
);
PieChartCapture.displayName = 'PieChartCapture';

function shadeColor(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)));
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 8,
  },
  labelCell: {
    alignItems: 'center',
  },
  labelText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 22,
    color: PALETTE.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  labelDot: {
    marginTop: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendCol: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  legendDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginEnd: 14,
  },
  legendTextWrap: {
    flex: 1,
  },
  legendLabel: {
    fontFamily: 'Cairo-Bold',
    fontSize: 19,
    color: PALETTE.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  legendPct: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    color: PALETTE.textSec,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  },
  emptyWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
    color: PALETTE.textSec,
    writingDirection: 'rtl',
  },
});
