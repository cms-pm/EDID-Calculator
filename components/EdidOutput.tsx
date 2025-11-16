import React from 'react';

interface EdidOutputProps {
  displayName: string;
  edidBytes: number[] | null;
  isLoading: boolean;
  error: string | null;
}

const EdidOutput: React.FC<EdidOutputProps> = ({ displayName, edidBytes, isLoading, error }) => {
  const handleDownload = () => {
    if (!edidBytes) return;

    const byteArray = new Uint8Array(edidBytes);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const filename = displayName.trim() ? `${displayName.trim().replace(/ /g, '_')}.bin` : 'edid.bin';
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatHex = (value: number) => value.toString(16).toUpperCase().padStart(2, '0');

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="animate-spin h-8 w-8 text-teal-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg">Generating your EDID block...</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 font-semibold">Generation Failed</p>
                <p className="text-red-400 text-center text-sm mt-1">{error}</p>
            </div>
        )
    }

    if (!edidBytes) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
          <p>Your generated EDID will appear here.</p>
        </div>
      );
    }

    const downloadFilename = displayName.trim() ? `${displayName.trim().replace(/ /g, '_')}.bin` : 'edid.bin';

    return (
      <>
        <div className="bg-gray-900 font-mono text-sm p-4 rounded-md overflow-x-auto border border-gray-700 max-h-80">
          <pre className="text-gray-300 whitespace-pre">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex">
                <span className="text-gray-500 mr-4">{`0x${(i * 16).toString(16).padStart(2, '0')}: `}</span>
                <span>
                    {edidBytes.slice(i * 16, (i * 16) + 16).map(formatHex).join(' ')}
                </span>
              </div>
            ))}
          </pre>
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-gray-900 bg-blue-400 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download {downloadFilename}
          </button>
        </div>
      </>
    );
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-semibold mb-6 text-teal-300">Generated EDID (128 Bytes)</h2>
        {renderContent()}
    </div>
  )
};

export default EdidOutput;