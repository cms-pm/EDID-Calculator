import type { EdidParams } from '../types';

/**
 * Generates a 128-byte EDID 1.3 block using a deterministic formula based on user-provided timing parameters.
 * @param params The EDID timing and physical display parameters.
 * @returns An array of 128 numbers, each representing a byte of the EDID block.
 */
export const generateEdid = (params: EdidParams): number[] => {
  const edid = new Array(128).fill(0);

  // Block 0: Header
  // 00h: Header (8 bytes: 00 FF FF FF FF FF FF 00)
  edid.splice(0, 8, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00);

  // Block 0: Vendor & Product Identification (10 bytes)
  // 08h: Manufacturer ID ("GDM" for Gemini Display Monitor)
  // G=7, D=4, M=13 -> (7 << 10) | (4 << 5) | 13 = 7309 = 0x1C8D
  edid[8] = 0x1C; edid[9] = 0x8D;
  // 0Ah: Product Code (Placeholder)
  edid[10] = 0x01; edid[11] = 0x01;
  // 0Ch: 32-bit Serial Number (Placeholder)
  edid[12] = 0x01; edid[13] = 0x02; edid[14] = 0x03; edid[15] = 0x04;
  // 10h: Week of Manufacture
  edid[16] = 1; // Week 1
  // 11h: Year of Manufacture
  edid[17] = new Date().getFullYear() - 1990;

  // Block 0: EDID Structure Version & Revision (2 bytes)
  // 12h: Version
  edid[18] = 0x01;
  // 13h: Revision
  edid[19] = 0x03;

  // Block 0: Basic Display Parameters/Features (5 bytes)
  // 14h: Video Input Definition
  edid[20] = 0x80; // Digital input, 8 bits per color
  // 15h: Horizontal Screen Size (cm)
  edid[21] = Math.round(params.hImageSize / 10);
  // 16h: Vertical Screen Size (cm)
  edid[22] = Math.round(params.vImageSize / 10);
  // 17h: Display Gamma
  edid[23] = 0x78; // 2.2
  // 18h: Feature Support
  edid[24] = 0x0A; // Standby, Suspend, Active-Off supported

  // Block 0: Color Characteristics (10 bytes)
  // Using standard sRGB values
  edid.splice(25, 10, 0xEE, 0x91, 0xA3, 0x54, 0x4C, 0x99, 0x26, 0x0F, 0x50, 0x54);

  // Block 0: Established Timings (3 bytes)
  edid[35] = 0x00; edid[36] = 0x00; edid[37] = 0x00; // None

  // Block 0: Standard Timing Identification (16 bytes)
  // Fill all 8 slots as "unused"
  for (let i = 38; i < 54; i += 2) {
    edid[i] = 0x01;
    edid[i + 1] = 0x01;
  }

  // Block 0: Detailed Timing Descriptor 1 (18 bytes)
  const dtd_offset = 54;
  const p_clock_10khz = Math.round(params.pixelClock / 10);
  edid[dtd_offset + 0] = p_clock_10khz & 0xFF;
  edid[dtd_offset + 1] = (p_clock_10khz >> 8) & 0xFF;

  const h_active = params.hAddressable;
  const h_blank = params.hBlanking;
  edid[dtd_offset + 2] = h_active & 0xFF;
  edid[dtd_offset + 3] = h_blank & 0xFF;
  edid[dtd_offset + 4] = ((h_active >> 4) & 0xF0) | ((h_blank >> 8) & 0x0F);

  const v_active = params.vAddressable;
  const v_blank = params.vBlanking;
  edid[dtd_offset + 5] = v_active & 0xFF;
  edid[dtd_offset + 6] = v_blank & 0xFF;
  edid[dtd_offset + 7] = ((v_active >> 4) & 0xF0) | ((v_blank >> 8) & 0x0F);

  const h_fp = params.hFrontPorch;
  const h_sync = params.hSyncWidth;
  edid[dtd_offset + 8] = h_fp & 0xFF;
  edid[dtd_offset + 9] = h_sync & 0xFF;

  const v_fp = params.vFrontPorch;
  const v_sync = params.vSyncWidth;
  edid[dtd_offset + 10] = ((v_fp & 0x0F) << 4) | (v_sync & 0x0F);
  edid[dtd_offset + 11] = (((h_fp >> 8) & 0x03) << 6) | (((h_sync >> 8) & 0x03) << 4) | (((v_fp >> 4) & 0x0C) >> 2) | (v_sync >> 8) & 0x03;

  const h_size_mm = params.hImageSize;
  const v_size_mm = params.vImageSize;
  edid[dtd_offset + 12] = h_size_mm & 0xFF;
  edid[dtd_offset + 13] = v_size_mm & 0xFF;
  edid[dtd_offset + 14] = (((h_size_mm >> 4) & 0xF0)) | ((v_size_mm >> 8) & 0x0F);

  edid[dtd_offset + 15] = params.hBorder;
  edid[dtd_offset + 16] = params.vBorder;
  edid[dtd_offset + 17] = 0x18; // Flags: Non-interlaced, Digital Separate Sync, +VSync, +HSync

  // Detailed Timing Descriptor 2: Display Name (ASCII)
  const dtd2_offset = 72;
  edid[dtd2_offset] = 0x00;
  edid[dtd2_offset + 1] = 0x00;
  edid[dtd2_offset + 2] = 0x00;
  edid[dtd2_offset + 3] = 0xFC; // Type: Display Name
  edid[dtd2_offset + 4] = 0x00;
  const name = params.displayName.substring(0, 13);
  let i = 0;
  for (; i < name.length; i++) {
    edid[dtd2_offset + 5 + i] = name.charCodeAt(i);
  }
  if (i < 13) {
    edid[dtd2_offset + 5 + i] = 0x0A; // Line feed terminator
    i++;
  }
  for (; i < 13; i++) {
    edid[dtd2_offset + 5 + i] = 0x20; // Pad with spaces
  }

  // Detailed Timing Descriptors 3 & 4 (Unused)
  for (let offset of [90, 108]) {
    edid[offset] = 0x00;
    edid[offset + 1] = 0x00;
    edid[offset + 2] = 0x00;
    edid[offset + 3] = 0x10; // Mark as dummy descriptor
  }

  // Block 0: Extension Flag
  edid[126] = 0; // No extension blocks

  // Block 0: Checksum
  const sum = edid.slice(0, 127).reduce((acc, val) => acc + val, 0);
  edid[127] = (256 - (sum % 256)) % 256;

  return edid;
};