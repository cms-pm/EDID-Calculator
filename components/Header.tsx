
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
        EDID Calculator
      </h1>
      <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
        Generate binary EDID files for your custom HDMI displays. Enter your timing parameters below and construct the 128-byte data block for your embedded Linux project.
      </p>
    </header>
  );
};

export default Header;