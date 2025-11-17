import type { EdidParams, AudioSupport, Colorimetry } from '../types';

const defaultAudio: AudioSupport = {
  enabled: false,
  channels: 2,
  sampleRates: { '32kHz': false, '44.1kHz': true, '48kHz': true, '96kHz': false, '192kHz': false },
  bitDepths: { '16bit': true, '20bit': false, '24bit': false }
};

const defaultColorimetry: Colorimetry = {
  redX: 0.640, redY: 0.330,
  greenX: 0.300, greenY: 0.600,
  blueX: 0.150, blueY: 0.060,
  whiteX: 0.313, whiteY: 0.329,
};

export const vesaPresets: EdidParams[] = [
  {
    displayName: '640x480 @ 60Hz (VGA)',
    pixelClock: 25175,
    hAddressable: 640,
    hBlanking: 160,
    vAddressable: 480,
    vBlanking: 45,
    hFrontPorch: 16,
    hSyncWidth: 96,
    vFrontPorch: 10,
    vSyncWidth: 2,
    hImageSize: 305, // typical 15" 4:3
    vImageSize: 229,
    hBorder: 0,
    vBorder: 0,
    refreshRate: 60,
    audio: { ...defaultAudio },
    colorimetry: { ...defaultColorimetry },
  },
  {
    displayName: '1024x768 @ 60Hz (XGA)',
    pixelClock: 65000,
    hAddressable: 1024,
    hBlanking: 320,
    vAddressable: 768,
    vBlanking: 38,
    hFrontPorch: 24,
    hSyncWidth: 136,
    vFrontPorch: 3,
    vSyncWidth: 6,
    hImageSize: 305, // typical 15" 4:3
    vImageSize: 229,
    hBorder: 0,
    vBorder: 0,
    refreshRate: 60,
    audio: { ...defaultAudio },
    colorimetry: { ...defaultColorimetry },
  },
  {
    displayName: '1280x1024 @ 60Hz',
    pixelClock: 108000,
    hAddressable: 1280,
    hBlanking: 408,
    vAddressable: 1024,
    vBlanking: 42,
    hFrontPorch: 48,
    hSyncWidth: 112,
    vFrontPorch: 1,
    vSyncWidth: 3,
    hImageSize: 376, // typical 19" 5:4
    vImageSize: 301,
    hBorder: 0,
    vBorder: 0,
    refreshRate: 60,
    audio: { ...defaultAudio },
    colorimetry: { ...defaultColorimetry },
  },
  {
    displayName: '1920x1080 @ 60Hz (FHD)',
    pixelClock: 148500,
    hAddressable: 1920,
    hBlanking: 280,
    vAddressable: 1080,
    vBlanking: 45,
    hFrontPorch: 88,
    hSyncWidth: 44,
    vFrontPorch: 4,
    vSyncWidth: 5,
    hImageSize: 531, // typical 24" 16:9
    vImageSize: 299,
    hBorder: 0,
    vBorder: 0,
    refreshRate: 60,
    audio: { ...defaultAudio },
    colorimetry: { ...defaultColorimetry },
  },
];