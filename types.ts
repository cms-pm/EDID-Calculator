export interface AudioSupport {
  enabled: boolean;
  channels: 2 | 6 | 8;
  sampleRates: {
    '32kHz': boolean;
    '44.1kHz': boolean;
    '48kHz': boolean;
    '96kHz': boolean;
    '192kHz': boolean;
  };
  bitDepths: {
    '16bit': boolean;
    '20bit': boolean;
    '24bit': boolean;
  };
}

export interface Colorimetry {
  redX: number;
  redY: number;
  greenX: number;
  greenY: number;
  blueX: number;
  blueY: number;
  whiteX: number;
  whiteY: number;
}


export interface EdidParams {
  displayName: string;
  pixelClock: number;
  hAddressable: number;
  hBlanking: number;
  vAddressable: number;
  vBlanking: number;
  hFrontPorch: number;
  hSyncWidth: number;
  vFrontPorch: number;
  vSyncWidth: number;
  hImageSize: number;
  vImageSize: number;
  hBorder: number;
  vBorder: number;
  refreshRate: number;
  audio: AudioSupport;
  colorimetry: Colorimetry;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}