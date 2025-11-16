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
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}