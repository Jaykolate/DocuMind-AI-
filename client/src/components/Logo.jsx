import React from 'react';

export default function Logo({ className = "w-6 h-6", inverted = false }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer Hexagon Boundary */}
        <polygon
          points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5"
          fill={inverted ? "#000000" : "#ffffff"}
        />
        {/* Inner Isometric Cube / Nexus Facet */}
        <polygon
          points="16,7 24,11.5 16,16 8,11.5"
          fill={inverted ? "#ffffff" : "#000000"}
          opacity="0.9"
        />
        <polygon
          points="8,13 16,17.5 16,26 8,21.5"
          fill={inverted ? "#d4d4d4" : "#1a1a1a"}
        />
        <polygon
          points="16,17.5 24,13 24,21.5 16,26"
          fill={inverted ? "#a3a3a3" : "#333333"}
        />
      </svg>
    </div>
  );
}
