import React from 'react';

const EddyAvatar: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" className="flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Head Dome */}
    <path d="M20 70 C 20 40, 80 40, 80 70" stroke="#9CA3AF" strokeWidth="4" fill="#4B5563" />
    {/* Neck */}
    <rect x="40" y="70" width="20" height="10" fill="#4B5563" stroke="#9CA3AF" strokeWidth="4" />
    {/* Base */}
    <rect x="30" y="80" width="40" height="10" rx="2" fill="#374151" stroke="#9CA3AF" strokeWidth="4" />
    {/* Eyes */}
    <circle cx="40" cy="55" r="8" fill="#34D399" stroke="#10B981" strokeWidth="2" />
    <circle cx="60" cy="55" r="8" fill="#34D399" stroke="#10B981" strokeWidth="2" />
    {/* Antenna */}
    <line x1="50" y1="40" x2="50" y2="25" stroke="#9CA3AF" strokeWidth="4" />
    <circle cx="50" cy="20" r="5" fill="#F87171" stroke="#EF4444" strokeWidth="2" />
  </svg>
);

export default EddyAvatar;
