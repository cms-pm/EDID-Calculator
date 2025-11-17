import React, { useState } from 'react';
import type { EdidParams, AudioSupport, Colorimetry } from './types';
import { generateEdid } from './services/edidGenerator';
import Header from './components/Header';
import EdidForm from './components/EdidForm';
import EdidOutput from './components/EdidOutput';
import ChatAssistant from './components/ChatAssistant';

const App: React.FC = () => {
  const [edidBytes, setEdidBytes] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshRateLocked, setIsRefreshRateLocked] = useState<boolean>(false);
  const [isPixelClockLocked, setIsPixelClockLocked] = useState<boolean>(false);

  // Default values for a common 1920x1080 @ 60Hz display
  const initialParams: EdidParams = {
    displayName: 'Custom Display',
    pixelClock: 148500,
    hAddressable: 1920,
    hBlanking: 280,
    vAddressable: 1080,
    vBlanking: 45,
    hFrontPorch: 88,
    hSyncWidth: 44,
    vFrontPorch: 4,
    vSyncWidth: 5,
    hImageSize: 531,
    vImageSize: 299,
    hBorder: 0,
    vBorder: 0,
    refreshRate: 60,
    audio: {
      enabled: false,
      channels: 2,
      sampleRates: { '32kHz': false, '44.1kHz': true, '48kHz': true, '96kHz': false, '192kHz': false },
      bitDepths: { '16bit': true, '20bit': false, '24bit': false }
    },
    colorimetry: { // sRGB/Rec.709 defaults
        redX: 0.640, redY: 0.330,
        greenX: 0.300, greenY: 0.600,
        blueX: 0.150, blueY: 0.060,
        whiteX: 0.313, whiteY: 0.329
    }
  };

  const [formParams, setFormParams] = useState<EdidParams>(initialParams);

  const handleLockChange = (name: 'refreshRate' | 'pixelClock') => {
    if (name === 'refreshRate') {
      setIsRefreshRateLocked(prev => !prev);
    } else if (name === 'pixelClock') {
      setIsPixelClockLocked(prev => !prev);
    }
  };

  const handleFormChange = (name: keyof Omit<EdidParams, 'audio' | 'colorimetry'>, value: string | number) => {
    const newParams = { ...formParams };

    // 1. Apply the direct change from user input
    if (name === 'displayName') {
        newParams.displayName = value as string;
    } else {
        const numericValue = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
        (newParams[name] as number) = numericValue;
    }

    // 2. Perform calculations based on locks and what was changed
    const coreTimingParams: (keyof EdidParams)[] = ['hAddressable', 'hBlanking', 'vAddressable', 'vBlanking'];
    
    const hTotal = newParams.hAddressable + newParams.hBlanking;
    const vTotal = newParams.vAddressable + newParams.vBlanking;

    if (hTotal <= 0 || vTotal <= 0) {
        setFormParams(newParams);
        return; // Avoid division by zero, just update the changed field
    }

    if (coreTimingParams.includes(name)) {
        // User changed a core timing param (H/V Addressable/Blanking)
        if (isRefreshRateLocked && isPixelClockLocked) {
            return; // Don't allow change, effectively reverting it by not setting state
        }
        if (isRefreshRateLocked) {
            newParams.pixelClock = Math.round((newParams.refreshRate * hTotal * vTotal) / 1000);
        } else {
            // Default: recalculate refresh rate (this path is taken if pixel clock is locked or if neither are)
            newParams.refreshRate = Math.round((newParams.pixelClock * 1000) / (hTotal * vTotal));
        }
    } else if (name === 'refreshRate') {
        // User changed Refresh Rate
        if (isPixelClockLocked) {
            // Adjust blanking to meet the new refresh rate while respecting the locked pixel clock
            const oldHTotal = formParams.hAddressable + formParams.hBlanking;
            const oldVTotal = formParams.vAddressable + formParams.vBlanking;
            
            if (oldHTotal > 0 && oldVTotal > 0 && newParams.refreshRate > 0) {
                const totalPixelArea = (newParams.pixelClock * 1000) / newParams.refreshRate;
                const totalAspectRatio = oldHTotal / oldVTotal;

                const newVTotal = Math.sqrt(totalPixelArea / totalAspectRatio);
                const newHTotal = totalPixelArea / newVTotal;

                const newHBlanking = Math.round(newHTotal - newParams.hAddressable);
                const newVBlanking = Math.round(newVTotal - newParams.vAddressable);
                
                if (newHBlanking >= 0 && newVBlanking >= 0) {
                    newParams.hBlanking = newHBlanking;
                    newParams.vBlanking = newVBlanking;
                }
            }
        } else {
            // Default: Recalculate pixel clock
            newParams.pixelClock = Math.round((newParams.refreshRate * hTotal * vTotal) / 1000);
        }
    } else if (name === 'pixelClock') {
        // User changed Pixel Clock
        if (isRefreshRateLocked) {
            // Adjust blanking to meet the new pixel clock while respecting the locked refresh rate
            const oldHTotal = formParams.hAddressable + formParams.hBlanking;
            const oldVTotal = formParams.vAddressable + formParams.vBlanking;
            
            if (oldHTotal > 0 && oldVTotal > 0) {
                const totalPixelArea = (newParams.pixelClock * 1000) / newParams.refreshRate;
                const totalAspectRatio = oldHTotal / oldVTotal;

                const newVTotal = Math.sqrt(totalPixelArea / totalAspectRatio);
                const newHTotal = totalPixelArea / newVTotal;

                const newHBlanking = Math.round(newHTotal - newParams.hAddressable);
                const newVBlanking = Math.round(newVTotal - newParams.vAddressable);

                if (newHBlanking >= 0 && newVBlanking >= 0) {
                    newParams.hBlanking = newHBlanking;
                    newParams.vBlanking = newVBlanking;
                }
            }
        } else {
            // Default: Recalculate refresh rate
            newParams.refreshRate = Math.round((newParams.pixelClock * 1000) / (hTotal * vTotal));
        }
    }
    
    setFormParams(newParams);
  };

  const handleColorimetryChange = (field: keyof Colorimetry, value: string) => {
    setFormParams(prev => ({
      ...prev,
      colorimetry: {
        ...prev.colorimetry,
        [field]: value === '' ? 0 : parseFloat(value),
      }
    }));
  };

  const handleAudioChange = <K extends keyof AudioSupport>(field: K, value: AudioSupport[K]) => {
    setFormParams(prev => ({
        ...prev,
        audio: {
            ...prev.audio,
            [field]: value,
        }
    }));
  };

  const handleAudioSubChange = (
      category: 'sampleRates' | 'bitDepths',
      key: string,
      value: boolean
  ) => {
      setFormParams(prev => ({
          ...prev,
          audio: {
              ...prev.audio,
              [category]: {
                  ...prev.audio[category],
                  [key]: value
              }
          }
      }));
  };

  const handleFormUpdateFromAssistant = (newParams: Partial<EdidParams>) => {
    // A record to hold sanitized updates for flat properties
    const sanitizedFlatParams: Partial<EdidParams> = {};
    // A record to hold sanitized updates for nested colorimetry
    const sanitizedColorimetry: Partial<Colorimetry> = {};

    for (const key in newParams) {
        const typedKey = key as keyof EdidParams;

        if (typedKey === 'colorimetry') {
            const colorUpdate = newParams.colorimetry;
            if (colorUpdate) {
                for (const cKey in colorUpdate) {
                    const typedCKey = cKey as keyof Colorimetry;
                    const value = colorUpdate[typedCKey];
                    if (typeof value === 'number' && !isNaN(value)) {
                        (sanitizedColorimetry[typedCKey] as number) = value;
                    }
                }
            }
        } else if (typedKey !== 'audio') { // Process everything else except 'audio'
            const value = newParams[typedKey];
            if (typedKey === 'displayName' && typeof value === 'string') {
                sanitizedFlatParams[typedKey] = value;
            } else if (typeof value === 'number' && !isNaN(value)) {
                (sanitizedFlatParams[typedKey] as number) = value;
            }
        }
    }

    // Merge the updates into a new state object
    const newValues = { 
        ...formParams, 
        ...sanitizedFlatParams,
        colorimetry: {
            ...formParams.colorimetry,
            ...sanitizedColorimetry,
        }
    };

    // Perform recalculations based on what was changed
    const hTotal = newValues.hAddressable + newValues.hBlanking;
    const vTotal = newValues.vAddressable + newValues.vBlanking;

    if (hTotal > 0 && vTotal > 0) {
        if ('pixelClock' in sanitizedFlatParams && !isPixelClockLocked) {
            const newRefreshRate = (newValues.pixelClock * 1000) / (hTotal * vTotal);
            newValues.refreshRate = Math.round(newRefreshRate);
        } else if ('refreshRate' in sanitizedFlatParams && !isRefreshRateLocked) {
            const newPixelClock = (newValues.refreshRate * hTotal * vTotal) / 1000;
            newValues.pixelClock = Math.round(newPixelClock);
        }
    }
    
    setFormParams(newValues);
  };

  const handlePresetSelect = (preset: EdidParams) => {
    setFormParams(preset);
  };

  const handleGenerateEdid = async () => {
    setIsLoading(true);
    setError(null);
    setEdidBytes(null);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const bytes = generateEdid(formParams);
      if (bytes && (bytes.length === 128 || bytes.length === 256)) {
        setEdidBytes(bytes);
      } else {
        throw new Error('Invalid EDID data generated. Please check parameters and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during EDID generation.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
            <EdidForm
              params={formParams}
              onParamsChange={handleFormChange}
              onAudioChange={handleAudioChange}
              onAudioSubChange={handleAudioSubChange}
              onColorimetryChange={handleColorimetryChange}
              onSubmit={handleGenerateEdid}
              isLoading={isLoading}
              isRefreshRateLocked={isRefreshRateLocked}
              isPixelClockLocked={isPixelClockLocked}
              onLockChange={handleLockChange}
              onPresetSelect={handlePresetSelect}
            />
            <EdidOutput
              displayName={formParams.displayName}
              edidBytes={edidBytes}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <div className="lg:col-span-1">
            <ChatAssistant onFormUpdate={handleFormUpdateFromAssistant} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
