import type { EdidParams, Colorimetry } from '../types';

// FIX: Create a helper type to represent keys of EdidParams that have numeric values.
// This resolves type errors where properties were being inferred as a broad `string | number | object` union.
type NumericEdidKeys = Exclude<keyof EdidParams, 'displayName' | 'audio' | 'colorimetry'>;

/**
 * Validates the EDID parameters against common VESA standards and logical rules.
 * @param params The EDID parameters to validate.
 * @returns An object where keys are parameter names and values are error strings. An empty object means no errors.
 */
export const validateEdidParams = (params: EdidParams): Partial<Record<keyof EdidParams | string, string>> => {
  const errors: Partial<Record<keyof EdidParams | string, string>> = {};

  // Display Name
  if (!params.displayName || params.displayName.trim().length === 0) {
    errors.displayName = "Display name is required.";
  } else if (params.displayName.length > 13) {
    errors.displayName = "Name is too long for EDID (max 13 chars)."
  }

  // Positive integers
  const positiveFields: NumericEdidKeys[] = [
    'pixelClock', 'hAddressable', 'hBlanking', 'vAddressable', 'vBlanking',
    'hFrontPorch', 'hSyncWidth', 'vFrontPorch', 'vSyncWidth',
    'hImageSize', 'vImageSize', 'refreshRate'
  ];

  for (const field of positiveFields) {
    if (params[field] <= 0) {
      errors[field] = "Must be a positive number.";
    }
  }
  
  // Non-negative integers
  const nonNegativeFields: NumericEdidKeys[] = ['hBorder', 'vBorder'];
  for (const field of nonNegativeFields) {
    if (params[field] < 0) {
      errors[field] = "Cannot be negative.";
    }
  }

  // Colorimetry validation
  const colorimetryFields: (keyof Colorimetry)[] = [
    'redX', 'redY', 'greenX', 'greenY', 'blueX', 'blueY', 'whiteX', 'whiteY'
  ];
  for (const field of colorimetryFields) {
    const value = params.colorimetry[field];
    if (typeof value !== 'number' || isNaN(value)) {
        errors[field] = "Must be a number.";
    } else if (value < 0 || value > 0.999) {
        errors[field] = "Range: 0.000 - 0.999";
    }
  }


  // More specific range checks, but only if the value is positive already
  if (!errors.pixelClock && params.pixelClock > 1000000) errors.pixelClock = "Pixel clock is unusually high (>1,000,000 kHz).";
  if (!errors.hAddressable && (params.hAddressable < 320 || params.hAddressable > 8192)) errors.hAddressable = "Common range: 320-8192";
  if (!errors.vAddressable && (params.vAddressable < 240 || params.vAddressable > 4320)) errors.vAddressable = "Common range: 240-4320";
  if (!errors.refreshRate && (params.refreshRate < 24 || params.refreshRate > 240)) errors.refreshRate = "Common range: 24-240 Hz";

  // Cross-field validation for blanking, only if component parts are valid
  if (!errors.hBlanking && !errors.hFrontPorch && !errors.hSyncWidth) {
    const hBackPorch = params.hBlanking - params.hFrontPorch - params.hSyncWidth;
    if (hBackPorch <= 0) {
      errors.hBlanking = "H. Blanking must be > (Front Porch + Sync Width).";
    }
  }

  if (!errors.vBlanking && !errors.vFrontPorch && !errors.vSyncWidth) {
    const vBackPorch = params.vBlanking - params.vFrontPorch - params.vSyncWidth;
    if (vBackPorch <= 0) {
      errors.vBlanking = "V. Blanking must be > (Front Porch + Sync Width).";
    }
  }

  // Audio validation
  if (params.audio.enabled) {
    const hasSampleRate = Object.values(params.audio.sampleRates).some(v => v);
    if (!hasSampleRate) {
        errors.audioSampleRates = "At least one sample rate must be selected.";
    }
    const hasBitDepth = Object.values(params.audio.bitDepths).some(v => v);
    if (!hasBitDepth) {
        errors.audioBitDepths = "At least one bit depth must be selected.";
    }
  }


  return errors;
};