import React, { useState, useEffect } from 'react';

interface DigitalEcoTreeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface CargoBox {
  id: number;
  progress: number; // 0 to 100%
  color: string;
}

export const DigitalEcoTree: React.FC<DigitalEcoTreeProps> = ({ className = '', size = 'xl' }) => {
  const [productionSpeed, setProductionSpeed] = useState<number>(1);
  const [boxes, setBoxes] = useState<CargoBox[]>([
    { id: 1, progress: 15, color: '#10b981' }, // emerald package
    { id: 2, progress: 50, color: '#0d9488' }, // teal package
    { id: 3, progress: 85, color: '#0284c7' }  // sky blue package
  ]);
  const [boxCounter, setBoxCounter] = useState<number>(4);
  const [saleTrigger, setSaleTrigger] = useState<boolean>(false);
  const [saleCount, setSaleCount] = useState<number>(1280);

  // Smoothly move cargo from Factory (Right) -> Conveyor Belt -> DastAval (Left) -> Sold
  useEffect(() => {
    const interval = setInterval(() => {
      setBoxes((prev) => {
        const updated = prev.map((box) => {
          const nextProgress = box.progress + 1.4 * productionSpeed;
          
          // Trigger a glowing sale flash when a package hits the DastAval portal
          if (box.progress < 92 && nextProgress >= 92) {
            setSaleTrigger(true);
            setSaleCount(s => s + 1);
            setTimeout(() => setSaleTrigger(false), 500);
          }

          return {
            ...box,
            progress: nextProgress
          };
        });

        // Remove packages that entered the portal
        const filtered = updated.filter(box => box.progress < 100);

        // Auto spawn a brand new package from the factory
        if (filtered.length < 3 && Math.random() < 0.22) {
          const colors = ['#10b981', '#0d9488', '#0284c7', '#3b82f6'];
          filtered.push({
            id: boxCounter,
            progress: 0,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
          setBoxCounter(c => c + 1);
        }

        return filtered;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [productionSpeed, boxCounter]);

  const handleBoost = () => {
    setProductionSpeed(2.5);
    setTimeout(() => {
      setProductionSpeed(1);
    }, 1500);
  };

  return (
    <div 
      className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center select-none bg-transparent py-4"
    >
      <style>{`
        /* Realistic rising circular steam/smoke rings from chimneys */
        @keyframes circularPuff {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(-35px) scale(1.5); opacity: 0; }
        }

        /* Industrial gear spinning */
        @keyframes gearRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Interactive conveyor line movement */
        @keyframes conveyorSlide {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -24; }
        }

        /* Pulses along connection conduits */
        @keyframes dataPulse {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }

        /* Sale flash pulse for checkout */
        @keyframes coinFloatUp {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-35px) scale(1.2); opacity: 0; }
        }

        .puff-1 {
          animation: circularPuff ${2.2 / productionSpeed}s infinite ease-out;
          transform-origin: 435px 115px;
        }

        .puff-2 {
          animation: circularPuff ${1.8 / productionSpeed}s infinite ease-out;
          transform-origin: 455px 115px;
        }

        .puff-bg {
          animation: circularPuff ${2.6 / productionSpeed}s infinite ease-out;
          transform-origin: 365px 125px;
        }

        .heavy-gear {
          animation: gearRotate ${9 / productionSpeed}s linear infinite;
          transform-origin: 450px 200px;
        }

        .gear-bg {
          animation: gearRotate ${12 / productionSpeed}s linear infinite;
          transform-origin: 385px 190px;
        }

        .conveyor-dots {
          stroke-dasharray: 8 4;
          animation: conveyorSlide ${2.5 / productionSpeed}s linear infinite;
        }

        .conduit-active {
          stroke-dasharray: 6 6;
          animation: dataPulse ${1.2 / productionSpeed}s linear infinite;
        }

        .coin-pop {
          animation: coinFloatUp 0.8s ease-out forwards;
          transform-origin: 120px 170px;
        }
      `}</style>

      {/* Main Vector Box - Transparent Wrapper, No Frame Card */}
      <div 
        onClick={handleBoost}
        className="w-full aspect-[1.8/1] bg-transparent flex items-center justify-center overflow-visible cursor-pointer relative group"
        title="کلیک کنید تا فرآیند تولید و فروش سریع‌تر شود!"
      >
        <svg
          viewBox="0 0 600 320"
          className="w-full h-full overflow-visible relative z-10"
        >
          <defs>
            {/* Transparent elegant gradients */}
            <linearGradient id="treeDastG1" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="treeDastG2" x1="100" y1="20" x2="180" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient id="portalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.05" />
            </linearGradient>

            <linearGradient id="factoryWall" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>

            <linearGradient id="factoryWallBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            <linearGradient id="windowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="siloGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Symmetrical target lines for clean high-tech layout */}
          <g stroke="#10b981" strokeWidth="0.3" strokeOpacity="0.08">
            <line x1="300" y1="10" x2="300" y2="310" strokeDasharray="5 4" />
            <line x1="40" y1="180" x2="560" y2="180" strokeDasharray="5 4" />
          </g>

          {/* Environment: Small Bushes/Plants at foundation */}
          <g opacity="0.6">
            <circle cx="350" cy="265" r="4" fill="#10b981" />
            <circle cx="355" cy="268" r="3" fill="#059669" />
            <circle cx="510" cy="265" r="5" fill="#10b981" />
            <circle cx="520" cy="265" r="4" fill="#059669" />
          </g>

          {/* Ground Line / Foundation */}
          <line x1="100" y1="265" x2="540" y2="265" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />

          {/* Security Gate / Entrance Post */}
          <g transform="translate(340, 240)">
            <rect x="0" y="0" width="12" height="25" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
            <rect x="2" y="4" width="8" height="6" rx="1" fill="#0f172a" />
            <line x1="12" y1="20" x2="25" y2="20" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* ================= DATA CONDUITS LINKING PRODUCTION & SALES ================= */}
          <g fill="none" strokeLinecap="round">
            <path d="M 430 170 C 310 110, 210 110, 120 170" stroke="#10b981" strokeWidth="2" strokeOpacity="0.12" />
            <path d="M 430 170 C 310 110, 210 110, 120 170" stroke="#10b981" strokeWidth="1" strokeOpacity="0.5" className="conduit-active" />
          </g>

          {/* ================= LEFT SIDE: DASTAVAL SALES HUB (فروش دست اول) ================= */}
          <g>
            {/* Ambient Sale Glow Circle */}
            <circle cx="120" cy="210" r="42" fill="url(#portalGrad)" />
            
            {/* Sale Trigger Flash Effect */}
            <circle 
              cx="120" 
              cy="210" 
              r="48" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth={saleTrigger ? "3" : "0"} 
              strokeOpacity={saleTrigger ? "0.8" : "0"} 
              style={{ transition: 'all 0.15s ease' }} 
            />

            {/* Rotating digital concentric sales rings */}
            <circle cx="120" cy="210" r="32" fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="10 4" />
            <circle cx="120" cy="210" r="25" fill="none" stroke="#0d9488" strokeWidth="0.8" strokeDasharray="4 6" />

            {/* Sales Hub Core Icon */}
            <g transform="translate(108, 198)">
              <circle cx="12" cy="12" r="14" fill="#10b981" />
              <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>

            {/* Micro Sales Label in beautiful Farsi typography */}
            <text 
              x="120" 
              y="272" 
              textAnchor="middle" 
              fill="#0d9488" 
              fontSize="12.5" 
              fontWeight="900" 
              fontFamily="vazir, system-ui"
            >
              فروش دست اول
            </text>

            <text 
              x="120" 
              y="288" 
              textAnchor="middle" 
              fill="#64748b" 
              fontSize="9" 
              fontWeight="bold" 
              fontFamily="vazir, system-ui"
            >
              عرضه مستقیم به بازار
            </text>

            {/* Dynamic Money/Coin Float-Up Animation upon every direct sale */}
            {saleTrigger && (
              <g className="coin-pop">
                <circle cx="120" cy="170" r="7.5" fill="url(#goldCoinGrad)" stroke="#d97706" strokeWidth="0.8" />
                <text x="120" y="173.5" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="black" fontFamily="sans-serif">$</text>
              </g>
            )}
          </g>

          {/* ================= MIDDLE: THE DIRECT SUPPLY CHAIN (REEL CONVEYOR) ================= */}
          <g>
            {/* Straight Conveyor belt pipeline directly linking production output to sale input */}
            <rect x="120" y="235" width="310" height="12" rx="6" fill="url(#conveyorTrack)" stroke="#334155" strokeWidth="1.2" />
            <line x1="125" y1="241" x2="425" y2="241" stroke="#10b981" strokeWidth="2.5" strokeOpacity="0.8" className="conveyor-dots" />

            {/* Support struts */}
            <line x1="180" y1="247" x2="180" y2="265" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="365" y1="247" x2="365" y2="265" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />

            <line x1="150" y1="265" x2="395" y2="265" stroke="#f1f5f9" strokeWidth="1" />
          </g>

          {/* ================= RIGHT SIDE: INDUSTRIAL FACTORY CLUSTER (تعداد کارخانه‌های بیشتر) ================= */}
          <g>

            {/* --- 1. BACKGROUND FACTORY (SECONDARY ASSEMBLY BLOCK) --- */}
            {/* Background Smoke Puff */}
            <circle cx="365" cy="125" r="3.5" fill="#10b981" opacity="0.2" className="puff-bg" />
            
            {/* Background Chimney */}
            <path d="M 362 230 L 364 130 L 368 130 L 370 230 Z" fill="url(#factoryWallBg)" stroke="#cbd5e1" strokeWidth="0.8" />
            
            {/* Background Sawtooth Body */}
            <path
              d="M 330 250 
                 L 330 210 
                 L 360 185 L 360 210
                 L 390 185 L 390 250 Z"
              fill="url(#factoryWallBg)"
              stroke="#e2e8f0"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            
            {/* Background window and spinning gear */}
            <rect x="345" y="215" width="25" height="20" rx="2" fill="url(#windowGlow)" stroke="#f1f5f9" strokeOpacity="0.3" strokeWidth="0.8" />
            <circle cx="357" cy="225" r="5" fill="none" stroke="#fbbf24" strokeWidth="1" className="gear-bg" />


            {/* --- 2. FOREGROUND PRIMARY FACTORY (MAIN MANUFACTURING BLOCK) --- */}
            {/* Steam smoke puffs rising from heavy chimneys */}
            <g fill="#10b981" opacity="0.32">
              <circle cx="435" cy="115" r="4.5" className="puff-1" />
              <circle cx="435" cy="115" r="2.5" className="puff-1" style={{ animationDelay: '0.5s' }} />

              <circle cx="455" cy="115" r="5" className="puff-2" />
            </g>

            {/* Industrial Sawtooth Chimneys */}
            <g fill="url(#factoryWall)" stroke="#cbd5e1" strokeWidth="1">
              <path d="M 430 210 L 432 100 L 438 100 L 440 210 Z" />
              <rect x="429" y="97" width="10" height="3" fill="#10b981" rx="1.5" />

              <path d="M 450 210 L 452 100 L 458 100 L 460 210 Z" />
              <rect x="449" y="97" width="10" height="3" fill="#10b981" rx="1.5" />
            </g>

            {/* Unmistakable Sawtooth Factory contour */}
            <path
              d="M 370 260 
                 L 370 190 
                 L 410 160 L 410 190
                 L 450 160 L 450 190
                 L 490 160 L 490 260 Z"
              fill="url(#factoryWall)"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Symmetrical factory top ridges - WITH SOLAR PANELS */}
            <g opacity="0.9">
              {/* Sawtooth 1 */}
              <line x1="370" y1="190" x2="410" y2="160" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              <path d="M 375 186 L 405 164 L 405 174 L 375 196 Z" fill="#1e293b" opacity="0.4" />
              
              {/* Sawtooth 2 */}
              <line x1="410" y1="190" x2="450" y2="160" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              <path d="M 415 186 L 445 164 L 445 174 L 415 196 Z" fill="#1e293b" opacity="0.4" />

              {/* Sawtooth 3 */}
              <line x1="450" y1="190" x2="490" y2="160" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              <path d="M 455 186 L 485 164 L 485 174 L 455 196 Z" fill="#1e293b" opacity="0.4" />
            </g>

            {/* Window with active spinning industrial gears inside */}
            <rect x="425" y="185" width="50" height="40" rx="6" fill="url(#windowGlow)" stroke="#f1f5f9" strokeOpacity="0.4" strokeWidth="1.2" />
            
            {/* Spinning Heavy Gear */}
            <circle cx="450" cy="205" r="11" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 3" className="heavy-gear" />
            <circle cx="450" cy="205" r="4.5" fill="#0f172a" stroke="#10b981" strokeWidth="1" />


            {/* --- 3. HIGH-TECH STORAGE TERMINAL & SILOS (RIGHT WING) --- */}
            {/* Tall Vertical Silo */}
            <rect x="495" y="150" width="32" height="110" rx="8" fill="url(#siloGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Silo level indicator markings */}
            <line x1="503" y1="180" x2="519" y2="180" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="503" y1="200" x2="519" y2="200" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="503" y1="220" x2="519" y2="220" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6" />
            {/* Dome Top cap */}
            <path d="M 495 150 Q 511 130 527 150 Z" fill="#10b981" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Connecting overhead pipelines */}
            <path d="M 490 220 L 496 220" stroke="#cbd5e1" strokeWidth="3.5" />
            <path d="M 410 170 Q 450 135 495 160" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="4 4" />

            {/* Clean Farsi Cluster Label */}
            <text 
              x="445" 
              y="282" 
              textAnchor="middle" 
              fill="#475569" 
              fontSize="12.5" 
              fontWeight="900" 
              fontFamily="vazir, system-ui"
            >
              تولید مستقیم کارخانجات کشور
            </text>

            <text 
              x="445" 
              y="298" 
              textAnchor="middle" 
              fill="#64748b" 
              fontSize="9" 
              fontWeight="bold" 
              fontFamily="vazir, system-ui"
            >
              شهرک تولیدی و بنکداری اختصاصی
            </text>
          </g>

          {/* ================= ACTIVE CARGO BOXES TRAVELING DIRECTLY (FACTORY -> SALES) ================= */}
          <g>
            {boxes.map((box) => {
              // Map package movement from Factory Output (X=390) to DastAval sales gate (X=145)
              const startX = 390;
              const endX = 145;
              const currentX = startX - (box.progress / 100) * (startX - endX);
              const currentY = 211;

              // Packages fade slightly and shrink as they integrate into DastAval core at the final end
              const opacity = box.progress > 90 ? (100 - box.progress) / 10 : 1;
              const scale = box.progress > 90 ? (100 - box.progress) / 10 * 0.2 + 0.8 : 1;

              return (
                <g 
                  key={`cargo-${box.id}`} 
                  opacity={opacity} 
                  transform={`translate(${currentX}, ${currentY}) scale(${scale})`}
                  style={{ transformOrigin: 'center' }}
                >
                  {/* Subtle package drop shadow */}
                  <ellipse cx="0" cy="22" rx="10" ry="2" fill="#000000" fillOpacity="0.06" />

                  {/* Elegant corporate bulk package */}
                  <g fill="#ffffff" stroke={box.color} strokeWidth="1.8">
                    <rect x="-10" y="0" width="20" height="20" rx="3.5" />
                    {/* Security seal strap */}
                    <rect x="-1.5" y="0" width="3" height="20" fill={box.color} stroke="none" />
                    <line x1="-10" y1="5" x2="10" y2="5" stroke="#e2e8f0" strokeWidth="0.8" />
                    <line x1="-10" y1="15" x2="10" y2="15" stroke="#e2e8f0" strokeWidth="0.8" />
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
