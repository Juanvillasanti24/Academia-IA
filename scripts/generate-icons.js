import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // Simple uncompressed or deflate PNG generator
  const signature = Buffer.from([137, 80, 78, 72, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // Compute CRC32
    let crc = 0 ^ -1;
    for (let byte of Buffer.concat([typeBuf, data])) {
      crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
    }
    crc = (crc ^ -1) >>> 0;
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Precompute CRC table
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 2; // Color type: Truecolor (RGB)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = chunk('IHDR', ihdr);

  // Raw scanlines: width * 3 bytes per pixel + 1 filter byte (0) per row
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Gradient / academic blue
      const grad = Math.min(255, Math.floor(b - (y / height) * 40));
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = grad;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = chunk('IDAT', compressedData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pwa192 = createPNG(192, 192, 37, 99, 235);
const pwa512 = createPNG(512, 512, 37, 99, 235);
const appleIcon = createPNG(180, 180, 37, 99, 235);

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/pwa-192x192.png', pwa192);
fs.writeFileSync('public/pwa-512x512.png', pwa512);
fs.writeFileSync('public/pwa-maskable-512x512.png', pwa512);
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);
console.log('Generated PNG icons successfully.');
