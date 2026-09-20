export type ImageDimensions = { width: number; height: number };

function readUint24LE(view: DataView, offset: number) {
  return view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16);
}

export async function readImageDimensions(file: File): Promise<ImageDimensions | null> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (file.type === "image/png" && bytes.length >= 24) {
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    if (!isPng) return null;
    return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
  }

  if (file.type === "image/jpeg" && bytes.length >= 4) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = bytes[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (offset + 2 > bytes.length) break;

      const segmentLength = view.getUint16(offset, false);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

      const isSof =
        marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3 ||
        marker === 0xc5 || marker === 0xc6 || marker === 0xc7 ||
        marker === 0xc9 || marker === 0xca || marker === 0xcb ||
        marker === 0xcd || marker === 0xce || marker === 0xcf;

      if (isSof && segmentLength >= 7) {
        return {
          height: view.getUint16(offset + 3, false),
          width: view.getUint16(offset + 5, false),
        };
      }

      offset += segmentLength;
    }
    return null;
  }

  if (file.type === "image/webp" && bytes.length >= 30) {
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (riff !== "RIFF" || webp !== "WEBP") return null;

    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunk === "VP8X" && bytes.length >= 30) {
      return {
        width: 1 + readUint24LE(view, 24),
        height: 1 + readUint24LE(view, 27),
      };
    }
  }

  return null;
}

export function hasEditorialResolution(dimensions: ImageDimensions) {
  const longSide = Math.max(dimensions.width, dimensions.height);
  const shortSide = Math.min(dimensions.width, dimensions.height);
  return longSide >= 1920 && shortSide >= 1080;
}
