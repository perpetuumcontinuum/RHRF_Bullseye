import React from "react";

interface CyberPlanetBackgroundProps {
  viewBox: string;
}

export default function CyberPlanetBackground({ viewBox }: CyberPlanetBackgroundProps) {
  return (
    <>
      <defs>
        <linearGradient id="skyGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="640">
          <stop offset="0%" stopColor="#0a0014"/><stop offset="100%" stopColor="#1a0035"/>
        </linearGradient>
        <linearGradient id="groundGrad" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2="700">
          <stop offset="0%" stopColor="#1a0035"/><stop offset="100%" stopColor="#0a0014"/>
        </linearGradient>
        <linearGradient id="treeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a0050"/><stop offset="50%" stopColor="#1a0035"/><stop offset="100%" stopColor="#2a0050"/>
        </linearGradient>
        <filter id="neonGlowCyan"><feGaussianBlur stdDeviation="4" result="b1"/><feGaussianBlur stdDeviation="8" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="neonGlowPink"><feGaussianBlur stdDeviation="3" result="b1"/><feGaussianBlur stdDeviation="7" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="neonGlowYellow"><feGaussianBlur stdDeviation="5" result="b1"/><feGaussianBlur stdDeviation="12" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <rect x="-20000" y="-20000" width="60000" height="60000" fill="url(#skyGrad)"/>

      <g opacity="0.8">
        <rect x="50" y="380" width="30" height="100" fill="#1a0044" stroke="#ff00ff33" strokeWidth="0.5"/>
        <rect x="90" y="350" width="25" height="130" fill="#1a0044" stroke="#ff00ff33" strokeWidth="0.5"/>
        <rect x="750" y="360" width="35" height="120" fill="#1a0044" stroke="#00ffff33" strokeWidth="0.5"/>
        <rect x="840" y="370" width="30" height="110" fill="#1a0044" stroke="#00ffff33" strokeWidth="0.5"/>
        <rect x="910" y="380" width="40" height="100" fill="#1a0044" stroke="#00ffff33" strokeWidth="0.5"/>
      </g>

      <g>
        <circle cx="100" cy="60" r="1.5" fill="#ffffff"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx="320" cy="40" r="1.5" fill="#ffffff"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/></circle>
        <circle cx="550" cy="30" r="2" fill="#ffffff"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx="780" cy="50" r="1.5" fill="#ffffff"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/></circle>
        <circle cx="40" cy="95" r="1.2" fill="#ffffff"><animate attributeName="opacity" values="0.25;0.9;0.25" dur="2.4s" repeatCount="indefinite" /></circle>
        <circle cx="150" cy="130" r="1" fill="#ffffff"><animate attributeName="opacity" values="0.2;0.75;0.2" dur="2.8s" repeatCount="indefinite" /></circle>
        <circle cx="205" cy="72" r="1" fill="#ffffff"><animate attributeName="opacity" values="0.3;0.85;0.3" dur="1.7s" repeatCount="indefinite" /></circle>
        <circle cx="430" cy="95" r="1.6" fill="#ffffff"><animate attributeName="opacity" values="0.25;0.95;0.25" dur="2.1s" repeatCount="indefinite" /></circle>
        <circle cx="660" cy="85" r="1.3" fill="#ffffff"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.9s" repeatCount="indefinite" /></circle>
        <circle cx="905" cy="70" r="1" fill="#ffffff"><animate attributeName="opacity" values="0.25;0.7;0.25" dur="2.3s" repeatCount="indefinite" /></circle>
      </g>

      <g>
        <circle cx="800" cy="120" r="58" fill="#e26a2933" filter="url(#bigGlow)"/>
        <circle cx="800" cy="120" r="42" fill="url(#moonGradRed)" filter="url(#neonGlowRed)"/>
        <circle cx="785" cy="110" r="6" fill="#520104" opacity="0.7"/>
        <circle cx="810" cy="130" r="8" fill="#6E0A05" opacity="0.8"/>
        <circle cx="800" cy="120" r="42" fill="none" stroke="#fb8b35" strokeWidth="1.2" opacity="0.55"/>
      </g>
      <circle cx="800" cy="120" r="65" fill="none" stroke="#F7931A33" strokeWidth="1"/>

      <rect x="-20000" y="480" width="60000" height="20000" fill="url(#groundGrad)"/>
      <line x1="-20000" y1="480" x2="20000" y2="480" stroke="#ff00ff" strokeWidth="2" filter="url(#neonGlowPink)" opacity="0.6"/>

      <g filter="url(#softGlow)">
        <line x1="100" y1="490" x2="95" y2="470" stroke="#00ff88" strokeWidth="1.5" opacity="0.6"/>
        <line x1="200" y1="490" x2="196" y2="472" stroke="#00ffcc" strokeWidth="1" opacity="0.6"/>
        <line x1="400" y1="488" x2="397" y2="468" stroke="#00ff88" strokeWidth="1.5" opacity="0.6"/>
        <line x1="700" y1="491" x2="695" y2="473" stroke="#00ffaa" strokeWidth="1" opacity="0.6"/>
        <line x1="900" y1="489" x2="897" y2="471" stroke="#00ff88" strokeWidth="1.5" opacity="0.6"/>
      </g>

      <g>
        <rect x="560" y="280" width="40" height="200" fill="url(#treeGrad)" rx="3"/>
        <rect x="560" y="280" width="40" height="200" fill="none" stroke="#cc00ff" strokeWidth="1.5" rx="3" filter="url(#neonGlowPink)" opacity="0.5"/>
        <line x1="560" y1="320" x2="500" y2="280" stroke="#2a0050" strokeWidth="12" strokeLinecap="round"/>
        <line x1="600" y1="310" x2="660" y2="270" stroke="#2a0050" strokeWidth="12" strokeLinecap="round"/>

        <g filter="url(#neonGlowCyan)" opacity="0.7">
          <circle cx="490" cy="255" r="25" fill="#00ffaa11" stroke="#00ffaa" strokeWidth="1"/>
          <circle cx="510" cy="240" r="20" fill="#00ffcc11" stroke="#00ffcc" strokeWidth="0.8"/>
        </g>
        <g filter="url(#neonGlowPink)" opacity="0.6">
          <circle cx="660" cy="250" r="25" fill="#ff00ff11" stroke="#ff00ff" strokeWidth="1"/>
          <circle cx="645" cy="265" r="20" fill="#ff00ff11" stroke="#ff00ff" strokeWidth="0.8"/>
        </g>
      </g>

      <g transform="translate(-560, 0)" opacity="0.8">
        <polygon points="720,480 740,340 760,340 780,480" fill="#1a0035" stroke="#ff0066" strokeWidth="1" filter="url(#softGlow)"/>
        <line x1="730" y1="300" x2="770" y2="300" stroke="#ff0066" strokeWidth="0.8" opacity="0.6"/>
        <line x1="735" y1="350" x2="765" y2="350" stroke="#ff0066" strokeWidth="0.8" opacity="0.6"/>
        <line x1="738" y1="400" x2="762" y2="400" stroke="#ff0066" strokeWidth="0.8" opacity="0.6"/>
        <circle cx="750" cy="335" r="4" fill="#ff0000" filter="url(#neonGlowPink)"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></circle>
      </g>

      <g>
        <rect x="55" y="390" width="4" height="4" fill="#00ffff" opacity="0.8"><animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite"/></rect>
        <rect x="65" y="410" width="4" height="4" fill="#ff00ff" opacity="0.7"><animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.5s" repeatCount="indefinite"/></rect>
        <rect x="75" y="395" width="4" height="4" fill="#ffff00" opacity="0.6"><animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite"/></rect>
        <rect x="95" y="365" width="4" height="4" fill="#00ffff" opacity="0.7"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></rect>
        <rect x="105" y="385" width="4" height="4" fill="#ff00ff" opacity="0.8"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.5s" repeatCount="indefinite"/></rect>
        <rect x="755" y="375" width="4" height="4" fill="#00ffff" opacity="0.7"><animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite"/></rect>
        <rect x="765" y="395" width="4" height="4" fill="#ffff00" opacity="0.6"><animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/></rect>

        <rect x="855" y="385" width="4" height="4" fill="#00ffff" opacity="0.8"><animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite"/></rect>
        <rect x="925" y="395" width="4" height="4" fill="#ffff00" opacity="0.6"><animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite"/></rect>
      </g>

      {(() => {
        const p = viewBox.split(" ").map(Number);
        const vx = Number.isFinite(p[0]) ? p[0] : 0;
        const vy = Number.isFinite(p[1]) ? p[1] : 0;
        const vw = Number.isFinite(p[2]) && p[2] > 0 ? p[2] : 960;
        const vh = Number.isFinite(p[3]) && p[3] > 0 ? p[3] : 640;
        if (vw <= 960.5 && vh <= 640.5) return null;

        const stars: React.ReactElement[] = [];
        const sc = Math.max(60, Math.min(360, Math.round(vw / 10)));
        for (let i = 0; i < sc; i++) {
          const x = vx - 120 + ((i * 173.317) % (vw + 240));
          const y = vy - 80 + ((i * 91.713) % Math.max(240, vh * 0.58));
          stars.push(<circle key={"s"+i} cx={x} cy={y} r={0.45+((i*17)%13)/10} fill="#fff" opacity={0.14+((i*7)%16)/45} />);
        }

        const step = 82;
        const b: React.ReactElement[] = [];
        const bc = Math.max(0, Math.ceil((vw + step * 2) / step));
        for (let i = 0; i < bc; i++) {
          const x = vx - step + i * step;
          const w = 22 + ((i * 31) % 38);
          if (!(x + w < 0 || x > 960)) continue;
          const h = 58 + ((i * 47) % 132);
          b.push(<rect key={"b"+i} x={x} y={480 - h} width={w} height={h} fill="#1a0044" stroke={i%2?"#ff00ff33":"#00ffff33"} strokeWidth="0.5" />);
        }
        return (<><g opacity="0.5">{stars}</g><g opacity="0.62">{b}</g></>);
      })()}
    </>
  );
}
