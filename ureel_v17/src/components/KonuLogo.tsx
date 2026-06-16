import React from 'react';
import { getSafeLocalStorage } from '../utils/safeStorage';

interface KonuLogoProps {
  className?: string;
  variant?: 'main' | 'icon' | 'gold' | 'white';
  showSlogan?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  lang?: 'de' | 'en';
}

export function KonuLogo({ 
  className = '', 
  variant = 'gold', 
  showSlogan = false,
  size = 'md',
  lang
}: KonuLogoProps) {
  
  const currentLang = lang || ((typeof window !== 'undefined' && getSafeLocalStorage('konu_preferred_lang')) === 'en' ? 'en' : 'de');
  const sloganText = currentLang === 'en' ? 'Turn Video into Action.' : 'Aus Video wird Aktion.';

  // Custom sizing presets for vector geometry
  const sizeMap = {
    sm: { iconWidth: 26, textClass: 'text-[15px]' },
    md: { iconWidth: 36, textClass: 'text-[20px]' },
    lg: { iconWidth: 50, textClass: 'text-[26px]' },
    xl: { iconWidth: 68, textClass: 'text-[34px]' },
  };

  const selectedSize = sizeMap[size];

  // Modern purple/violet styling
  // - Cremeweiß: #F5EFE3
  // - Purple: #A855F7 (Purple-500)
  // - Dark Purple: #7E22CE (Purple-700)
  const isWhite = variant === 'white';
  const iconBaseColor = isWhite ? '#F5EFE3' : '#A855F7';
  const iconAccentColor = isWhite ? '#CCCCCC' : '#7E22CE';
  const textColor = isWhite ? '#F5EFE3' : '#FFFFFF';
  
  return (
    <div className={`flex flex-col items-center justify-center font-sans ${className}`}>
      <div className="flex items-center gap-2">
        {/* Render Round ureel Play-Reel Icon as Symbol */}
        <svg 
          width={selectedSize.iconWidth} 
          height={selectedSize.iconWidth} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-[0_2px_12px_rgba(168,85,247,0.3)] animate-pulseSlow"
        >
          {/* Circular Anthracite Outer Frame */}
          <circle cx="50" cy="50" r="48" fill="#141414" stroke={iconBaseColor} strokeWidth="3" />
          
          {/* Ambient Glow Arc */}
          <path 
            d="M 50 2 A 48 48 0 0 1 98 50" 
            stroke={iconAccentColor} 
            strokeWidth="4" 
            strokeLinecap="round" 
          />

          {/* Styled 'u' and Reel combination */}
          <path 
            d="M 32,32 V 58 A 18,18 0 0 0 68,58 V 32 M 68,44 H 32" 
            stroke={iconBaseColor} 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Dynamic play dot/triangle inside */}
          <path
            d="M45,43 L58,50 L45,57 Z"
            fill={isWhite ? '#FFFFFF' : '#D8B4FE'}
          />
        </svg>

        {/* ureel.me Wordmark */}
        {variant !== 'icon' && (
          <span 
            className={`font-black tracking-[0.05em] leading-none ${selectedSize.textClass}`}
            style={{ 
              color: textColor,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            ureel<span className="text-[#A855F7] font-semibold">.me</span>
          </span>
        )}
      </div>

      {/* Slogan line below wording */}
      {showSlogan && variant !== 'icon' && (
        <span className="text-[10px] text-stone-400 font-semibold tracking-wider mt-2 select-none text-center">
          {sloganText}
        </span>
      )}
    </div>
  );
}
