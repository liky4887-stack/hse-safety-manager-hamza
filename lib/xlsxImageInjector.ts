import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';

const EMU_PER_PX = 9525;

export interface ImagePlacement {
  base64: string;
  col: number;
  row: number;
  widthPx: number;
}

function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:image\/\w+;base64,/, '');
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out as unknown as Uint8Array;
}

// Read PNG width/height from IHDR (offsets 16..23, big-endian uint32)
function pngSize(bytes: Uint8Array): { w: number; h: number } {
  if (bytes.length < 24) return { w: 0, h: 0 };
  const w =
    ((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0;
  const h =
    ((bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]) >>> 0;
  return { w, h };
}

/**
 * Inject PNG images into an existing XLSX (SheetJS output) as native OOXML drawings.
 * Bypasses SheetJS !images (unsupported) and any view-capture limitations.
 * Uses oneCellAnchor so aspect ratio is always preserved.
 */
export function injectImagesIntoXlsx(
  xlsxBytes: Uint8Array,
  images: ImagePlacement[],
): Uint8Array {
  // Note: casting to keep TS happy across @types/node Uint8Array variance
  if (images.length === 0) return xlsxBytes;

  const zip: any = unzipSync(xlsxBytes);

  // ── 1) Add media files ──
  images.forEach((img, i) => {
    zip[`xl/media/image${i + 1}.png`] = b64ToBytes(img.base64);
  });

  // ── 2) Build drawing1.xml with oneCellAnchor per image ──
  const anchors = images
    .map((img, i) => {
      const bytes = b64ToBytes(img.base64);
      const { w, h } = pngSize(bytes);
      const realW = w || img.widthPx;
      const realH = h || img.widthPx;
      const scale = img.widthPx / realW;
      const cx = Math.round(realW * scale * EMU_PER_PX);
      const cy = Math.round(realH * scale * EMU_PER_PX);
      return `<xdr:oneCellAnchor><xdr:from><xdr:col>${img.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${img.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i + 1}" name="Chart ${i + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${i + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
    })
    .join('');

  const drawingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${anchors}</xdr:wsDr>`;
  zip['xl/drawings/drawing1.xml'] = strToU8(drawingXml) as any;

  // ── 3) drawing1.xml.rels — links each anchor's rIdN to a media file ──
  const drawingRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${images
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i + 1}.png"/>`,
    )
    .join('')}</Relationships>`;
  zip['xl/drawings/_rels/drawing1.xml.rels'] = strToU8(drawingRelsXml) as any;

  // ── 4) Patch [Content_Types].xml ──
  let ct = strFromU8(zip['[Content_Types].xml']);
  if (!ct.includes('Extension="png"')) {
    ct = ct.replace(
      '<Default Extension="xml"',
      '<Default Extension="png" ContentType="image/png"/><Default Extension="xml"',
    );
  }
  if (!ct.includes('/xl/drawings/drawing1.xml')) {
    ct = ct.replace(
      '</Types>',
      '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>',
    );
  }
  zip['[Content_Types].xml'] = strToU8(ct) as any;

  // ── 5) Patch sheet1.xml + its rels ──
  const sheetKey = 'xl/worksheets/sheet1.xml';
  const sheetRelsKey = 'xl/worksheets/_rels/sheet1.xml.rels';

  let sheet = strFromU8(zip[sheetKey]);
  if (!sheet.includes('xmlns:r=')) {
    sheet = sheet.replace(
      '<worksheet ',
      '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ',
    );
  }

  let sheetRels = zip[sheetRelsKey]
    ? strFromU8(zip[sheetRelsKey])
    : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

  const existingIds = [...sheetRels.matchAll(/Id="rId(\d+)"/g)].map((m) =>
    parseInt(m[1], 10),
  );
  const nextRid = existingIds.length ? Math.max(...existingIds) + 1 : 1;

  if (!sheetRels.includes('drawings/drawing1.xml')) {
    sheetRels = sheetRels.replace(
      '</Relationships>',
      `<Relationship Id="rId${nextRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`,
    );
  }
  zip[sheetRelsKey] = strToU8(sheetRels) as any;

  if (!sheet.includes('<drawing ')) {
    sheet = sheet.replace(
      '</worksheet>',
      `<drawing r:id="rId${nextRid}"/></worksheet>`,
    );
  }
  zip[sheetKey] = strToU8(sheet) as any;

  // ── 6) Re-zip ──
  return zipSync(zip) as unknown as Uint8Array;
}
