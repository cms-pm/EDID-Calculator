import type { EdidParams } from '../types';

const calculateChecksum = (block: number[]): number => {
    const sum = block.slice(0, 127).reduce((acc, val) => acc + val, 0);
    return (256 - (sum % 256)) % 256;
};

/**
 * Encodes a CIE coordinate (0.0-0.999) into its 10-bit EDID representation.
 * @param coord The floating point coordinate.
 * @returns An object with the high 8 bits and low 2 bits.
 */
const encodeCie = (coord: number) => {
    const val10bit = Math.round(Math.max(0, Math.min(0.999, coord)) * 1024);
    return {
        high: (val10bit >> 2) & 0xFF,
        low: val10bit & 0x03,
    };
};


/**
 * Generates a 128-byte EDID 1.3 block, optionally with a 128-byte CEA-861 extension for audio.
 * @param params The EDID timing, physical, and audio display parameters.
 * @returns An array of 128 or 256 numbers, each representing a byte of the EDID block(s).
 */
export const generateEdid = (params: EdidParams): number[] => {
  const edid = new Array(128).fill(0);

  // Block 0: Header
  edid.splice(0, 8, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00);

  // Block 0: Vendor & Product Identification
  edid[8] = 0x1C; edid[9] = 0x8D; // "GDM"
  edid[10] = 0x01; edid[11] = 0x01; // Product Code
  edid[12] = 0x01; edid[13] = 0x02; edid[14] = 0x03; edid[15] = 0x04; // Serial
  edid[16] = 1; // Week
  edid[17] = new Date().getFullYear() - 1990; // Year

  // Block 0: EDID Structure Version & Revision
  edid[18] = 0x01; edid[19] = 0x03;

  // Block 0: Basic Display Parameters/Features
  edid[20] = 0x80; // Digital input, 8 bits/color
  edid[21] = Math.round(params.hImageSize / 10);
  edid[22] = Math.round(params.vImageSize / 10);
  edid[23] = 0x78; // Gamma 2.2
  edid[24] = 0x0A; // Feature Support

  // Block 0: Color Characteristics
  const { colorimetry } = params;
  const redX = encodeCie(colorimetry.redX);
  const redY = encodeCie(colorimetry.redY);
  const greenX = encodeCie(colorimetry.greenX);
  const greenY = encodeCie(colorimetry.greenY);
  const blueX = encodeCie(colorimetry.blueX);
  const blueY = encodeCie(colorimetry.blueY);
  const whiteX = encodeCie(colorimetry.whiteX);
  const whiteY = encodeCie(colorimetry.whiteY);
  
  edid[25] = (redX.low << 6) | (redY.low << 4) | (greenX.low << 2) | greenY.low;
  edid[26] = (blueX.low << 6) | (blueY.low << 4) | (whiteX.low << 2) | whiteY.low;
  edid[27] = redX.high;
  edid[28] = redY.high;
  edid[29] = greenX.high;
  edid[30] = greenY.high;
  edid[31] = blueX.high;
  edid[32] = blueY.high;
  edid[33] = whiteX.high;
  edid[34] = whiteY.high;
  
  // Block 0: Established & Standard Timings (Unused)
  for (let i = 35; i < 54; i++) {
    edid[i] = (i % 2 === 0) ? 0x01 : 0x01;
  }
  
  // Block 0: Detailed Timing Descriptor 1 (DTD)
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
  edid[dtd_offset + 11] = (((h_fp >> 8) & 0x03) << 6) | (((h_sync >> 8) & 0x03) << 4) | ((v_fp >> 2) & 0x0C) | ((v_sync >> 4) & 0x03);

  const h_size_mm = params.hImageSize;
  const v_size_mm = params.vImageSize;
  edid[dtd_offset + 12] = h_size_mm & 0xFF;
  edid[dtd_offset + 13] = v_size_mm & 0xFF;
  edid[dtd_offset + 14] = (((h_size_mm >> 4) & 0xF0)) | ((v_size_mm >> 8) & 0x0F);

  edid[dtd_offset + 15] = params.hBorder;
  edid[dtd_offset + 16] = params.vBorder;
  edid[dtd_offset + 17] = 0x18; // Flags

  // DTD 2: Display Name
  const dtd2_offset = 72;
  edid[dtd2_offset] = 0x00; edid[dtd2_offset + 1] = 0x00; edid[dtd2_offset + 2] = 0x00;
  edid[dtd2_offset + 3] = 0xFC; // Type: Display Name
  edid[dtd2_offset + 4] = 0x00;
  const name = params.displayName.substring(0, 13);
  let i = 0;
  for (; i < name.length; i++) {
    edid[dtd2_offset + 5 + i] = name.charCodeAt(i);
  }
  if (i < 13) {
    edid[dtd2_offset + 5 + i] = 0x0A; // Line feed
    i++;
  }
  for (; i < 13; i++) {
    edid[dtd2_offset + 5 + i] = 0x20; // Padding
  }

  // DTDs 3 & 4 (Unused)
  for (let offset of [90, 108]) {
    edid[offset] = 0x00; edid[offset+1] = 0x00; edid[offset+2] = 0x00;
    edid[offset + 3] = 0x10; // Dummy
  }

  if (!params.audio.enabled) {
    edid[126] = 0; // No extension blocks
    edid[127] = calculateChecksum(edid);
    return edid;
  }

  // --- CEA-861 Extension Block for Audio ---
  edid[126] = 1; // One extension block
  edid[127] = calculateChecksum(edid);
  
  const extension = new Array(128).fill(0);
  extension[0] = 0x02; // CEA Extension Tag
  extension[1] = 0x03; // Version 3
  
  // Data Block Collection starts at byte 4
  const audio = params.audio;
  const sadByte1 = (1 << 3) | (audio.channels - 1); // LPCM, Channels
  const sadByte2 = (audio.sampleRates['192kHz'] ? 1 << 6 : 0) |
                   (audio.sampleRates['96kHz'] ? 1 << 4 : 0) |
                   (audio.sampleRates['48kHz'] ? 1 << 2 : 0) |
                   (audio.sampleRates['44.1kHz'] ? 1 << 1 : 0) |
                   (audio.sampleRates['32kHz'] ? 1 << 0 : 0);
  const sadByte3 = (audio.bitDepths['24bit'] ? 1 << 2 : 0) |
                   (audio.bitDepths['20bit'] ? 1 << 1 : 0) |
                   (audio.bitDepths['16bit'] ? 1 << 0 : 0);

  // Audio Data Block (one SAD = 3 bytes payload)
  const dataBlockOffset = 4;
  extension[dataBlockOffset] = (1 << 5) | 3; // Tag=Audio, Length=3
  extension[dataBlockOffset + 1] = sadByte1;
  extension[dataBlockOffset + 2] = sadByte2;
  extension[dataBlockOffset + 3] = sadByte3;
  
  const dtdStartOffset = dataBlockOffset + 4;
  extension[2] = dtdStartOffset; // DTDs start after our data block
  extension[3] = 1 << 6; // Basic audio support

  extension[127] = calculateChecksum(extension);

  return [...edid, ...extension];
};