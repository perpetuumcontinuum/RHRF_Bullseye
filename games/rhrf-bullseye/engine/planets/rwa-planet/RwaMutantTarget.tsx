import React from "react";

const CY = "#00ffff";
const CY_DIM = "#0a8f8f";
const BODY_DARK = "#4a4a58";
const BODY_EDGE = "#2a2a35";
const FANG = "#f0f0f0";

export default function RwaMutantTarget() {
  return (
    <g transform="translate(580, 360)" pointerEvents="none">
      <defs>
        <radialGradient id="rwaBodyGrad" cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#9a9aa8" />
          <stop offset="100%" stopColor={BODY_DARK} />
        </radialGradient>
        <radialGradient id="rwaCoreGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff">
            <animate
              attributeName="stop-color"
              values="#ffffff;#00ffff;#ffffff"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="60%" stopColor={CY} />
          <stop offset="100%" stopColor="#063a3a" />
        </radialGradient>
        <filter id="rwaMutGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="3" result="b1" />
          <feGaussianBlur stdDeviation="7" result="b2" />
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="0.18;1"
          dur="1.1s"
          fill="freeze"
        />

        {}
        <g fill="url(#rwaBodyGrad)" stroke={BODY_EDGE} strokeWidth="2">
          <path d="M -82,-10 Q -120,-30 -132,10 Q -138,40 -110,52 Q -86,60 -74,34 Z" />
          <path d="M 82,-10 Q 120,-30 132,10 Q 138,40 110,52 Q 86,60 74,34 Z" />
          <path d="M -70,70 Q -96,96 -78,120 Q -58,138 -40,112 Q -34,92 -52,78 Z" />
          <path d="M 70,70 Q 96,96 78,120 Q 58,138 40,112 Q 34,92 52,78 Z" />
        </g>
        <g fill={CY} filter="url(#rwaMutGlow)">
          <polygon points="-132,8 -142,2 -130,16" />
          <polygon points="-126,22 -138,20 -124,32" />
          <polygon points="-112,40 -122,44 -108,50" />
          <polygon points="132,8 142,2 130,16" />
          <polygon points="126,22 138,20 124,32" />
          <polygon points="112,40 122,44 108,50" />
          <polygon points="-78,118 -86,128 -70,122" />
          <polygon points="-58,132 -62,142 -48,132" />
          <polygon points="78,118 86,128 70,122" />
          <polygon points="58,132 62,142 48,132" />
        </g>

        {}
        <path d="M -26,-78 L 26,-78 L 20,-58 L -20,-58 Z" fill={BODY_DARK} stroke={BODY_EDGE} strokeWidth="1.5" />

        {}
        <ellipse cx="0" cy="-108" rx="52" ry="44" fill="url(#rwaBodyGrad)" stroke={BODY_EDGE} strokeWidth="2.5" />
        <path d="M -34,-120 Q -18,-130 -6,-118" fill="none" stroke={BODY_DARK} strokeWidth="4" strokeLinecap="round" />
        <path d="M 34,-120 Q 18,-130 6,-118" fill="none" stroke={BODY_DARK} strokeWidth="4" strokeLinecap="round" />

        <g filter="url(#rwaMutGlow)">
          <circle cx="-20" cy="-112" r="8" fill={CY} />
          <circle cx="20" cy="-112" r="8" fill={CY} />
          <circle cx="-20" cy="-112" r="3" fill="#02141a" />
          <circle cx="20" cy="-112" r="3" fill="#02141a" />
          <animate attributeName="opacity" values="1;0.5;1" dur="3.2s" repeatCount="indefinite" />
        </g>

        {}
        <path d="M -30,-86 Q 0,-72 30,-86 Q 24,-78 0,-76 Q -24,-78 -30,-86 Z" fill="#160a10" stroke={BODY_EDGE} strokeWidth="1.5" />
        <g fill={FANG}>
          <polygon points="-22,-85 -16,-85 -19,-76" />
          <polygon points="-8,-83 -2,-83 -5,-73" />
          <polygon points="6,-83 12,-83 9,-73" />
          <polygon points="18,-85 24,-85 21,-76" />
        </g>

        {}
        <g fill={CY} filter="url(#rwaMutGlow)" opacity="0.85">
          <path d="M -16,-76 q -2,10 1,16 q 3,-6 1,-16 Z" />
          <path d="M 0,-74 q -2,14 1,22 q 3,-8 1,-22 Z" />
          <path d="M 16,-76 q -2,9 1,14 q 3,-5 1,-14 Z" />
          <circle cx="-15" cy="-58" r="2" />
          <circle cx="1" cy="-50" r="2.4" />
          <circle cx="17" cy="-60" r="1.8" />
        </g>

        {}
        <circle r="81" fill="url(#rwaBodyGrad)" stroke={BODY_EDGE} strokeWidth="3" />
        <circle r="81" fill="none" stroke={CY_DIM} strokeWidth="1" opacity="0.35" />

        {}
        <circle r="14" fill="url(#rwaCoreGrad)" filter="url(#rwaMutGlow)" />
        <circle r="3" fill="#ffffff" opacity="0.92">
          <animate attributeName="opacity" values="0.45;1;0.45" dur="0.9s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
}
