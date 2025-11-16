import React from 'react';
import type { EdidParams } from '../types';

interface EdidFormProps {
  params: EdidParams;
  onParamsChange: (name: keyof EdidParams, value: string | number) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isRefreshRateLocked: boolean;
  isPixelClockLocked: boolean;
  onLockChange: (name: 'refreshRate' | 'pixelClock') => void;
}

const parameterDescriptions: Record<keyof Omit<EdidParams, 'refreshRate'>, string> & { refreshRate: string } = {
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
  name: keyof EdidParams;
  label: string;
  unit?: string;
  type?: 'text' | 'number';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  isLocked?: boolean;
  onLockChange?: () => void;
}> = ({ name, label, unit, type = 'number', value, onChange, disabled, isLocked, onLockChange }) => (
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
        className={`w-full bg-gray-900/50 border-gray-600 rounded-md py-2 pl-3 pr-24 text-gray-200 focus:ring-teal-400 focus:border-teal-400 transition disabled:bg-gray-800/50 disabled:text-gray-500 disabled:cursor-not-allowed`}
        placeholder={type === 'number' ? '0' : 'Enter name...'}
        required
        disabled={disabled || isLocked}
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-3">
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

const EdidForm: React.FC<EdidFormProps> = ({ params, onParamsChange, onSubmit, isLoading, isRefreshRateLocked, isPixelClockLocked, onLockChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target as { name: keyof EdidParams; value: string; type: string };
    if (type === 'text') {
      onParamsChange(name, value);
    } else {
      onParamsChange(name, value === '' ? 0 : parseInt(value, 10));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  
  const areTimingsLocked = isRefreshRateLocked && isPixelClockLocked;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6 text-teal-300">Display Timing Parameters</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          {/* LEFT COLUMN: INPUTS */}
          <div className="space-y-6">
            <fieldset>
              <legend className="text-teal-400 font-medium mb-2">Core Display</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormInput name="displayName" label="Display Name" type="text" value={params.displayName} onChange={handleChange} />
                </div>
                <FormInput name="hAddressable" label="H. Addressable" unit="pixels" value={params.hAddressable} onChange={handleChange} disabled={areTimingsLocked}/>
                <FormInput name="vAddressable" label="V. Addressable" unit="lines" value={params.vAddressable} onChange={handleChange} disabled={areTimingsLocked}/>
                <FormInput name="refreshRate" label="Refresh Rate" unit="Hz" value={params.refreshRate} onChange={handleChange} isLocked={isRefreshRateLocked} onLockChange={() => onLockChange('refreshRate')} />
                <FormInput name="pixelClock" label="Pixel Clock" unit="kHz" value={params.pixelClock} onChange={handleChange} isLocked={isPixelClockLocked} onLockChange={() => onLockChange('pixelClock')} />
              </div>
            </fieldset>
             <fieldset>
              <legend className="text-teal-400 font-medium mb-2">Horizontal Timing</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <FormInput name="hBlanking" label="H. Blanking" unit="pixels" value={params.hBlanking} onChange={handleChange} disabled={areTimingsLocked} />
                 <FormInput name="hFrontPorch" label="H. Front Porch" unit="pixels" value={params.hFrontPorch} onChange={handleChange} />
                 <FormInput name="hSyncWidth" label="H. Sync Width" unit="pixels" value={params.hSyncWidth} onChange={handleChange} />
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-teal-400 font-medium mb-2">Vertical Timing</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormInput name="vBlanking" label="V. Blanking" unit="lines" value={params.vBlanking} onChange={handleChange} disabled={areTimingsLocked} />
                  <FormInput name="vFrontPorch" label="V. Front Porch" unit="lines" value={params.vFrontPorch} onChange={handleChange} />
                  <FormInput name="vSyncWidth" label="V. Sync Width" unit="lines" value={params.vSyncWidth} onChange={handleChange} />
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-teal-400 font-medium mb-2">Physical & Border</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormInput name="hImageSize" label="H. Image Size" unit="mm" value={params.hImageSize} onChange={handleChange} />
                 <FormInput name="vImageSize" label="V. Image Size" unit="mm" value={params.vImageSize} onChange={handleChange} />
                 <FormInput name="hBorder" label="H. Border" unit="pixels" value={params.hBorder} onChange={handleChange} />
                 <FormInput name="vBorder" label="V. Border" unit="lines" value={params.vBorder} onChange={handleChange} />
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
            <p className="text-xs text-gray-500 italic text-center">
                Note: H. Blanking = H. Front Porch + H. Sync Width + H. Back Porch. The same applies to Vertical timings.
            </p>
          </div>
        </div>

        <div className="mt-8 text-right">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
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