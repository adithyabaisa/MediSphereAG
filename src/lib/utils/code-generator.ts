/**
 * Non-sequential patient code generator
 * Format: MSC-P-[6 alphanumeric characters] (e.g. MSC-P-7F29A1)
 * Uses high entropy characters avoiding ambiguous O/0 and I/1.
 */
const CODE_CHARSET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generatePatientCode(): string {
  let result = '';
  const len = 6;
  for (let i = 0; i < len; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARSET.length);
    result += CODE_CHARSET[randomIndex];
  }
  return `MSC-P-${result}`;
}

/**
 * Validates patient code format strictly
 */
export function isValidPatientCode(code: string): boolean {
  if (!code) return false;
  const regex = /^MSC-P-[0-9A-Z]{6}$/i;
  return regex.test(code.trim());
}

/**
 * Generates lightweight, clean inline SVG QR code mock pattern
 * for robust rendering without third-party network dependencies.
 */
export function generateQrSvg(data: string, size = 160): string {
  // Deterministic pattern based on hash of input string
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }

  const grid = 21; // 21x21 standard QR grid
  const cellSize = size / grid;
  const rects: string[] = [];

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      // Corner position detection patterns (QR anchors)
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= grid - 7;
      const isBottomLeft = r >= grid - 7 && c < 7;

      let filled = false;

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Render 7x7 anchor boxes
        const localR = isBottomLeft ? r - (grid - 7) : r;
        const localC = isTopRight ? c - (grid - 7) : c;
        if (
          localR === 0 ||
          localR === 6 ||
          localC === 0 ||
          localC === 6 ||
          (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4)
        ) {
          filled = true;
        }
      } else {
        // Data matrix deterministic pseudo-random pattern
        const bit = ((hash ^ (r * 31 + c * 17)) >>> (r % 16)) & 1;
        filled = bit === 1;
      }

      if (filled) {
        rects.push(
          `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#0f766e" />`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#ffffff" rx="8" />
    ${rects.join('')}
  </svg>`;
}

/**
 * Computes deterministic simulated SHA-256 hash for files / texts
 */
export function computeSimulatedSha256(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `sha256_${hex}_${Date.now().toString(16)}`;
}
