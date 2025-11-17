import React, { useState, useEffect } from 'react';
import type { EdidParams, AudioSupport, Colorimetry } from '../types';
import { vesaPresets } from '../data/vesaPresets';
import { validateEdidParams } from '../services/validation';

interface EdidFormProps {
  params: EdidParams;
  onParamsChange: (name: keyof Omit<EdidParams, 'audio' | 'colorimetry'>, value: string | number) => void;
  onAudioChange: <K extends keyof AudioSupport>(field: K, value: AudioSupport[K]) => void;
  onAudioSubChange: (category: 'sampleRates' | 'bitDepths', key: string, value: boolean) => void;
  onColorimetryChange: (field: keyof Colorimetry, value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isRefreshRateLocked: boolean;
  isPixelClockLocked: boolean;
  onLockChange: (name: 'refreshRate' | 'pixelClock') => void;
  onPresetSelect: (params: EdidParams) => void;
}

const parameterDescriptions: Record<string, string> = {
  displayName: "A user-friendly name for your display profile. This will be used as the filename for the downloaded binary and can be embedded within the EDID data itself.",
  pixelClock: "The rate at which pixels are transmitted, measured in kHz. This value is calculated from the refresh rate, or it can be set to calculate the resulting refresh rate.",
  hAddressable: "The number of visible pixels in one horizontal line (e.g., 1920 for a 1920x1080 display).",
  hBlanking: "The total number of non-visible pixels in a horizontal line, used for synchronization and timing.",
  vAddressable: "The number of visible horizontal lines on the screen (e.g., 1080 for a 1920x1080 display).",
  vBlanking: "The total number of non-visible lines in a frame, used for vertical synchronization.",
  refreshRate: "The number of times the screen updates per second, measured in Hertz (Hz). This value is calculated from the pixel clock and total pixels, or it can be set to calculate the required pixel clock.",
  hFrontPorch: "The non-visible pixels between the end of the active display area and the start of the horizontal sync pulse.",
  hSyncWidth: "The duration (in pixels) of the horizontal sync pulse, which signals the end of a line.",
  vFrontPorch: "The non-visible lines between the end of the active display area and the start of the vertical sync pulse.",
  vSyncWidth: "The duration (in lines) of the vertical sync pulse, which signals the end of a full frame.",
  hImageSize: "The physical width of the display's viewable area, measured in millimeters (mm).",
  vImageSize: "The physical height of the display's viewable area, measured in millimeters (mm).",
  hBorder: "The number of pixels for a border on the left and right sides of the active display area.",
  vBorder: "The number of lines for a border on the top and bottom of the active display area.",
  redX: "CIE 1931 'x' coordinate for the red primary color of the display.",
  redY: "CIE 1931 'y' coordinate for the red primary color of the display.",
  greenX: "CIE 1931 'x' coordinate for the green primary color of the display.",
  greenY: "CIE 1931 'y' coordinate for the green primary color of the display.",
  blueX: "CIE 1931 'x' coordinate for the blue primary color of the display.",
  blueY: "CIE 1931 'y' coordinate for the blue primary color of the display.",
  whiteX: "CIE 1931 'x' coordinate for the display's white point.",
  whiteY: "CIE 1931 'y' coordinate for the display's white point.",
};

const LockIcon: React.FC<{ locked: boolean }> = ({ locked }) => {
  if (locked) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-white" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 3a3 3 0 013 3v2H7V7a3 3 0 013-3z" />
    </svg>
  );
};


const FormInput: React.FC<{
  name: string;
  label: string;
  unit?: string;
  type?: 'text' | 'number';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  isLocked?: boolean;
  onLockChange?: () => void;
  error?: string;
  step?: string;
}> = ({ name, label, unit, type = 'number', value, onChange, disabled, isLocked, onLockChange, error, step }) => {
    const paddingRightClass = unit || onLockChange ? 'pr-16' : 'pr-12';

    return (
  <div>
    <label htmlFor={name} className="flex items-center text-sm font-medium text-gray-300">
      {label}
      <div className="group relative flex items-center ml-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-teal-300 transition-colors cursor-help" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="absolute bottom-full mb-2 w-64 bg-gray-900 text-gray-200 text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-gray-700 shadow-lg right-1/2 translate-x-1/2">
          <p>{parameterDescriptions[name]}</p>
          <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
        </div>
      </div>
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        step={step}
        className={`w-full bg-gray-900/50 border rounded-md py-2 pl-3 ${paddingRightClass} text-gray-200 focus:ring-2 focus:ring-opacity-75 transition disabled:bg-gray-800/50 disabled:text-gray-500 disabled:cursor-not-allowed ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-600 focus:border-teal-400 focus:ring-teal-400'}`}
        placeholder={type === 'number' ? '0' : 'Enter name...'}
        required
        disabled={disabled || isLocked}
        aria-describedby={error ? `${name}-error-tooltip` : undefined}
        aria-invalid={!!error}
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-0.5">
        {error && (
            <div className="group relative flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div id={`${name}-error-tooltip`} role="tooltip" className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-900 text-gray-200 text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-gray-700 shadow-lg right-1/2 translate-x-1/2">
                    <p>{error}</p>
                    <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
                </div>
            </div>
        )}
        {onLockChange && (
            <button
                type="button"
                onClick={onLockChange}
                className="group p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
            >
                <LockIcon locked={isLocked!} />
            </button>
        )}
        {unit && (
          <span className="text-gray-500 text-sm pointer-events-none">{unit}</span>
        )}
      </div>
    </div>
  </div>
    );
};

const ScreenViewDiagram: React.FC<{ hRes: number; vRes: number }> = ({ hRes, vRes }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">Visible Screen Area</h3>
        <div className="relative flex justify-center items-center p-6">
            {/* Screen */}
            <div className="w-full aspect-video bg-blue-500/80 border-2 border-blue-400 rounded-md flex items-center justify-center text-white font-semibold">
                <span>{`${hRes} x ${vRes}`}</span>
            </div>
            {/* H Label */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 text-center">
                <div className="w-full h-px bg-gray-500"></div>
                <span className="text-xs text-gray-400 bg-gray-900/50 px-1 -mt-2.5 inline-block">H. Addressable</span>
            </div>
            {/* V Label */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4/5 text-center flex items-center">
                <div className="h-full w-px bg-gray-500"></div>
                <span className="text-xs text-gray-400 bg-gray-900/50 py-1 -ml-[1px]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>V. Addressable</span>
            </div>
        </div>
    </div>
);


const TimingDiagram: React.FC<{ title: string; sections: { label: string; color: string; }[] }> = ({ title, sections }) => (
  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
    <h3 className="text-lg font-semibold text-gray-300 mb-4">{title}</h3>
    <div className="flex w-full h-8 rounded-md overflow-hidden border-2 border-gray-700">
      {sections.map((sec, idx) => (
        <div key={idx} className={`flex-grow ${sec.color} flex items-center justify-center relative group`}>
          <div className="absolute bottom-full mb-2 bg-gray-900 text-gray-200 text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-600">
            {sec.label}
          </div>
        </div>
      ))}
    </div>
    <div className="mt-2 text-xs text-gray-400 grid grid-cols-4 gap-2">
       {sections.map((sec, idx) => (
         <div key={idx} className="flex items-center">
           <div className={`w-3 h-3 rounded-sm mr-2 ${sec.color}`}></div>
           <span>{sec.label}</span>
         </div>
       ))}
    </div>
  </div>
);

const SpeakerIcon: React.FC<{ className?: string, label: string }> = ({ className, label }) => (
  <div className={`absolute flex flex-col items-center group ${className}`}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
      <path d="M6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    </svg>
    <span className="hidden group-hover:block absolute -bottom-5 text-xs bg-gray-900 px-1 rounded">{label}</span>
  </div>
);

const SubwooferIcon: React.FC<{ className?: string, label: string }> = ({ className, label }) => (
  <div className={`absolute flex flex-col items-center group ${className}`}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    </svg>
    <span className="hidden group-hover:block absolute -bottom-5 text-xs bg-gray-900 px-1 rounded">{label}</span>
  </div>
);

const AudioCapabilitiesDiagram: React.FC<{ audio: AudioSupport }> = ({ audio }) => {
  const selectedSampleRates = Object.entries(audio.sampleRates).filter(([, v]) => v).map(([k]) => k).join(', ');
  const selectedBitDepths = Object.entries(audio.bitDepths).filter(([, v]) => v).map(([k]) => k).join(', ');

  const getChannelLayout = () => {
    switch (audio.channels) {
      case 2:
        return (
          <>
            <SpeakerIcon className="top-1/2 -translate-y-1/2 left-4" label="L" />
            <SpeakerIcon className="top-1/2 -translate-y-1/2 right-4" label="R" />
          </>
        );
      case 6: // 5.1
        return (
          <>
            <SpeakerIcon className="top-4 left-1/2 -translate-x-1/2" label="C" />
            <SpeakerIcon className="top-8 left-8" label="FL" />
            <SpeakerIcon className="top-8 right-8" label="FR" />
            <SpeakerIcon className="bottom-8 left-8" label="SL" />
            <SpeakerIcon className="bottom-8 right-8" label="SR" />
            <SubwooferIcon className="bottom-4 left-1/2 -translate-x-1/2" label="LFE" />
          </>
        );
      case 8: // 7.1
         return (
          <>
            <SpeakerIcon className="top-2 left-1/2 -translate-x-1/2" label="C" />
            <SpeakerIcon className="top-8 left-8" label="FL" />
            <SpeakerIcon className="top-8 right-8" label="FR" />
            <SpeakerIcon className="top-1/2 -translate-y-1/2 left-2" label="SL" />
            <SpeakerIcon className="top-1/2 -translate-y-1/2 right-2" label="SR" />
            <SpeakerIcon className="bottom-8 left-12" label="BL" />
            <SpeakerIcon className="bottom-8 right-12" label="BR" />
            <SubwooferIcon className="bottom-2 left-1/2 -translate-x-1/2" label="LFE" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">
        Audio Setup {audio.enabled ? `(${audio.channels === 2 ? 'Stereo' : `${audio.channels - 1}.1 Surround`})` : ''}
      </h3>
      <div className="relative flex justify-center items-center h-48 bg-gray-800/30 rounded-md border border-dashed border-gray-700">
        {audio.enabled ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-gray-600">Listener</span>
            {getChannelLayout()}
          </>
        ) : (
          <div className="text-center text-gray-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <p>Audio Disabled</p>
          </div>
        )}
      </div>
       {audio.enabled && (
        <div className="mt-4 space-y-2 text-sm text-gray-400">
            <div>
                <strong>Sample Rates:</strong>
                <span className="ml-2 text-gray-300">{selectedSampleRates || 'None selected'}</span>
            </div>
            <div>
                <strong>Bit Depths:</strong>
                <span className="ml-2 text-gray-300">{selectedBitDepths || 'None selected'}</span>
            </div>
        </div>
      )}
    </div>
  );
};


const EdidForm: React.FC<EdidFormProps> = ({ params, onParamsChange, onAudioChange, onAudioSubChange, onColorimetryChange, onSubmit, isLoading, isRefreshRateLocked, isPixelClockLocked, onLockChange, onPresetSelect }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof EdidParams | string, string>>>({});

  useEffect(() => {
    const validationErrors = validateEdidParams(params);
    setErrors(validationErrors);
  }, [params]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    const preset = vesaPresets.find(p => p.displayName === presetName);
    if (preset) {
        onPresetSelect(preset);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset(''); // Reset preset selection on manual change
    const { name, value, type } = e.target as { name: keyof Omit<EdidParams, 'audio' | 'colorimetry'>; value: string; type: string };
    if (type === 'text') {
      onParamsChange(name, value);
    } else {
      onParamsChange(name, value === '' ? 0 : parseInt(value, 10));
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedPreset('');
      const { name, value } = e.target as { name: keyof Colorimetry; value: string };
      onColorimetryChange(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0] as keyof EdidParams;
      const errorElement = document.getElementById(firstErrorKey);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus({ preventScroll: true });
      }
      return;
    }
    onSubmit();
  };
  
  const areTimingsLocked = isRefreshRateLocked && isPixelClockLocked;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6 text-teal-300">Display Timing Parameters</h2>

      <div className="mb-6">
        <label htmlFor="vesa-presets" className="block text-sm font-medium text-gray-300 mb-1">
          Load VESA Standard Preset
        </label>
        <select
          id="vesa-presets"
          name="vesa-presets"
          value={selectedPreset}
          onChange={handlePresetChange}
          className="w-full bg-gray-900/50 border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-opacity-75 focus:ring-teal-400 transition"
        >
          <option value="">-- Select a preset --</option>
          {vesaPresets.map((p) => (
            <option key={p.displayName} value={p.displayName}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          {/* LEFT COLUMN: INPUTS */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-teal-400 font-medium mb-2">Core Display</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormInput name="displayName" label="Display Name" type="text" value={params.displayName} onChange={handleChange} error={errors.displayName} />
                </div>
                <FormInput name="hAddressable" label="H. Addressable" unit="pixels" value={params.hAddressable} onChange={handleChange} disabled={areTimingsLocked} error={errors.hAddressable} />
                <FormInput name="vAddressable" label="V. Addressable" unit="lines" value={params.vAddressable} onChange={handleChange} disabled={areTimingsLocked} error={errors.vAddressable} />
                <FormInput name="refreshRate" label="Refresh Rate" unit="Hz" value={params.refreshRate} onChange={handleChange} isLocked={isRefreshRateLocked} onLockChange={() => onLockChange('refreshRate')} error={errors.refreshRate} />
                <FormInput name="pixelClock" label="Pixel Clock" unit="kHz" value={params.pixelClock} onChange={handleChange} isLocked={isPixelClockLocked} onLockChange={() => onLockChange('pixelClock')} error={errors.pixelClock} />
              </div>
            </fieldset>
             <fieldset>
              <legend className="text-teal-400 font-medium mb-2">Horizontal Timing</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <FormInput name="hBlanking" label="H. Blanking" unit="pixels" value={params.hBlanking} onChange={handleChange} disabled={areTimingsLocked} error={errors.hBlanking} />
                 <FormInput name="hFrontPorch" label="H. Front Porch" unit="pixels" value={params.hFrontPorch} onChange={handleChange} error={errors.hFrontPorch} />
                 <FormInput name="hSyncWidth" label="H. Sync Width" unit="pixels" value={params.hSyncWidth} onChange={handleChange} error={errors.hSyncWidth} />
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-teal-400 font-medium mb-2">Vertical Timing</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormInput name="vBlanking" label="V. Blanking" unit="lines" value={params.vBlanking} onChange={handleChange} disabled={areTimingsLocked} error={errors.vBlanking} />
                  <FormInput name="vFrontPorch" label="V. Front Porch" unit="lines" value={params.vFrontPorch} onChange={handleChange} error={errors.vFrontPorch} />
                  <FormInput name="vSyncWidth" label="V. Sync Width" unit="lines" value={params.vSyncWidth} onChange={handleChange} error={errors.vSyncWidth} />
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-teal-400 font-medium mb-2">Physical & Border</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormInput name="hImageSize" label="H. Image Size" unit="mm" value={params.hImageSize} onChange={handleChange} error={errors.hImageSize} />
                 <FormInput name="vImageSize" label="V. Image Size" unit="mm" value={params.vImageSize} onChange={handleChange} error={errors.vImageSize} />
                 <FormInput name="hBorder" label="H. Border" unit="pixels" value={params.hBorder} onChange={handleChange} error={errors.hBorder} />
                 <FormInput name="vBorder" label="V. Border" unit="lines" value={params.vBorder} onChange={handleChange} error={errors.vBorder} />
              </div>
            </fieldset>
            <fieldset>
                <legend className="text-teal-400 font-medium mb-3">Audio Capabilities (CEA-861)</legend>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="audio-enabled" className="text-gray-300 font-medium">Enable Audio Support</label>
                        <button
                            type="button"
                            id="audio-enabled"
                            onClick={() => onAudioChange('enabled', !params.audio.enabled)}
                            className={`${params.audio.enabled ? 'bg-teal-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500`}
                            role="switch"
                            aria-checked={params.audio.enabled}
                        >
                            <span className={`${params.audio.enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                        </button>
                    </div>
                    <div className={`space-y-4 transition-opacity ${params.audio.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div>
                            <label className="text-sm font-medium text-gray-400">Channels (LPCM)</label>
                            <div className="mt-2 flex space-x-4">
                                {[2, 6, 8].map(ch => (
                                    <label key={ch} className="flex items-center space-x-2 text-sm text-gray-300">
                                        <input type="radio" name="audio-channels" value={ch} checked={params.audio.channels === ch} onChange={e => onAudioChange('channels', parseInt(e.target.value) as 2 | 6 | 8)} className="form-radio bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" disabled={!params.audio.enabled} />
                                        <span>{ch === 2 ? '2 (Stereo)' : `${ch} (${ch-1}.1)`}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400">Supported Sample Rates</label>
                            {errors.audioSampleRates && <p className="text-xs text-red-400 mt-1">{errors.audioSampleRates}</p>}
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                {Object.keys(params.audio.sampleRates).map(rate => (
                                    <label key={rate} className="flex items-center space-x-2 text-sm text-gray-300">
                                        <input type="checkbox" name={`sr-${rate}`} checked={params.audio.sampleRates[rate as keyof typeof params.audio.sampleRates]} onChange={e => onAudioSubChange('sampleRates', rate, e.target.checked)} className="form-checkbox bg-gray-700 border-gray-600 rounded text-teal-500 focus:ring-teal-500" disabled={!params.audio.enabled} />
                                        <span>{rate}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-400">Supported Bit Depths</label>
                             {errors.audioBitDepths && <p className="text-xs text-red-400 mt-1">{errors.audioBitDepths}</p>}
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                {Object.keys(params.audio.bitDepths).map(depth => (
                                    <label key={depth} className="flex items-center space-x-2 text-sm text-gray-300">
                                        <input type="checkbox" name={`bd-${depth}`} checked={params.audio.bitDepths[depth as keyof typeof params.audio.bitDepths]} onChange={e => onAudioSubChange('bitDepths', depth, e.target.checked)} className="form-checkbox bg-gray-700 border-gray-600 rounded text-teal-500 focus:ring-teal-500" disabled={!params.audio.enabled} />
                                        <span>{depth}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </fieldset>
          </div>

          {/* RIGHT COLUMN: VISUAL AIDS */}
          <div className="space-y-6 lg:mt-6">
             <ScreenViewDiagram hRes={params.hAddressable} vRes={params.vAddressable} />
             <TimingDiagram 
                title="Horizontal Scanline"
                sections={[
                    { label: 'H. Addressable', color: 'bg-blue-500' },
                    { label: 'H. Front Porch', color: 'bg-yellow-500' },
                    { label: 'H. Sync Width', color: 'bg-red-500' },
                    { label: 'H. Back Porch', color: 'bg-purple-500' },
                ]}
            />
            <TimingDiagram 
                title="Vertical Frame"
                sections={[
                    { label: 'V. Addressable', color: 'bg-blue-500' },
                    { label: 'V. Front Porch', color: 'bg-yellow-500' },
                    { label: 'V. Sync Width', color: 'bg-red-500' },
                    { label: 'V. Back Porch', color: 'bg-purple-500' },
                ]}
            />
            <AudioCapabilitiesDiagram audio={params.audio} />
            <p className="text-xs text-gray-500 italic text-center">
                Note: H. Blanking = H. Front Porch + H. Sync Width + H. Back Porch. The same applies to Vertical timings.
            </p>
          </div>
        </div>

        <fieldset className="mt-8">
            <legend className="text-teal-400 font-medium mb-3">Color Characteristics (CIE 1931)</legend>
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Left Column for Red & Green */}
                <div className="space-y-6">
                    <div>
                        <h4 className="font-medium text-gray-300 mb-2">Red Primary</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput name="redX" label="X Coordinate" value={params.colorimetry.redX} onChange={handleColorChange} error={errors.redX} step="0.001" />
                            <FormInput name="redY" label="Y Coordinate" value={params.colorimetry.redY} onChange={handleColorChange} error={errors.redY} step="0.001" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-300 mb-2">Green Primary</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput name="greenX" label="X Coordinate" value={params.colorimetry.greenX} onChange={handleColorChange} error={errors.greenX} step="0.001" />
                            <FormInput name="greenY" label="Y Coordinate" value={params.colorimetry.greenY} onChange={handleColorChange} error={errors.greenY} step="0.001" />
                        </div>
                    </div>
                </div>
                {/* Right Column for Blue & White */}
                <div className="space-y-6">
                    <div>
                        <h4 className="font-medium text-gray-300 mb-2">Blue Primary</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput name="blueX" label="X Coordinate" value={params.colorimetry.blueX} onChange={handleColorChange} error={errors.blueX} step="0.001" />
                            <FormInput name="blueY" label="Y Coordinate" value={params.colorimetry.blueY} onChange={handleColorChange} error={errors.blueY} step="0.001" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-300 mb-2">White Point</h4>
                        <div className="grid grid-cols-2 gap-4">
                           <FormInput name="whiteX" label="X Coordinate" value={params.colorimetry.whiteX} onChange={handleColorChange} error={errors.whiteX} step="0.001" />
                           <FormInput name="whiteY" label="Y Coordinate" value={params.colorimetry.whiteY} onChange={handleColorChange} error={errors.whiteY} step="0.001" />
                        </div>
                    </div>
                </div>
            </div>
        </fieldset>

        <div className="mt-8 text-right">
          <button
            type="submit"
            disabled={isLoading || hasErrors}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label={hasErrors ? 'Please fix the errors before generating' : 'Generate EDID'}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : 'Generate EDID'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EdidForm;