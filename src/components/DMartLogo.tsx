import React from 'react';

export interface DMartLogoProps {
  /**
   * Pixel dimension or preset size
   * @default 'md'
   */
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Presentation variant:
   * - 'badge': Icon inside an emerald squircle badge (standard header/app icon)
   * - 'icon': Pure standalone vector mark (transparent backdrop)
   * - 'full': Badge + Brand Name Typography + Store Sub-badge
   * @default 'badge'
   */
  variant?: 'badge' | 'icon' | 'full';
  /**
   * For light/dark surfaces
   * @default false
   */
  inverted?: boolean;
  /**
   * Store subtitle/badge text (e.g., 'PASARAYA')
   */
  storeBadgeText?: string;
  /**
   * Additional container CSS classes
   */
  className?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 38,
  lg: 48,
  xl: 64,
  '2xl': 96,
};

/**
 * Custom vector logo for D-Mart Malaysia:
 * - A large, bold uppercase letter "D"
 * - The word "mart" in a smaller font overlapping the edge/side of the "D" (half inside, half outside)
 * - Two distinct colors: Primary Brand Green (#059669) + Clean Accent Dark Charcoal (#0f172a) / Crisp White (#ffffff)
 */
export const DMartLogo: React.FC<DMartLogoProps> = ({
  size = 'md',
  variant = 'badge',
  inverted = false,
  storeBadgeText = 'PASARAYA',
  className = '',
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 38;

  // The core vector emblem SVG:
  // ViewBox: 0 0 512 512
  // D outer boundary at y=256 reaches x=340.
  // Overlapping pill spans x=255 to 425 (width 170):
  // 85px inside D, 85px outside D (exact 50/50 overlap).
  const renderVectorMark = () => {
    const isTransparentIcon = variant === 'icon';
    // If transparent icon on light surface, D is Emerald Green and pill is Dark Charcoal
    // If badge or dark surface, D is Crisp White and pill is Dark Charcoal
    const dFill = isTransparentIcon && !inverted ? '#059669' : '#ffffff';
    const pillFill = '#0f172a';
    const pillStroke = isTransparentIcon && !inverted ? '#059669' : '#ffffff';
    const textFill = '#ffffff';

    return (
      <svg
        viewBox="0 0 512 512"
        width={pixelSize}
        height={pixelSize}
        className="shrink-0 select-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="dmartLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <filter id="dmartLogoShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#022c22" floodOpacity="0.28" />
          </filter>
        </defs>

        {variant === 'badge' && (
          <>
            <rect width="512" height="512" rx="116" fill="url(#dmartLogoGrad)" />
            <rect
              x="8"
              y="8"
              width="496"
              height="496"
              rx="108"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="4"
            />
          </>
        )}

        <g filter={variant === 'badge' ? 'url(#dmartLogoShadow)' : undefined}>
          {/* 1. Large Bold Uppercase Letter "D" */}
          <path
            d="M 80 110 L 195 110 C 295 110 340 165 340 256 C 340 347 295 402 195 402 L 80 402 Z M 150 178 L 190 178 C 248 178 275 208 275 256 C 275 304 248 334 190 334 L 150 334 Z"
            fill={dFill}
            fillRule="evenodd"
          />

          {/* 2. Overlapping Dark Charcoal Pill Badge (half inside, half outside) */}
          <rect
            x="255"
            y="216"
            width="170"
            height="80"
            rx="40"
            fill={pillFill}
            stroke={pillStroke}
            strokeWidth="6"
          />

          {/* 3. The word "mart" in smaller bold font across the center */}
          <text
            x="340"
            y="258"
            fill={textFill}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="52"
            textAnchor="middle"
            dominantBaseline="central"
            letterSpacing="-0.5"
          >
            mart
          </text>
        </g>
      </svg>
    );
  };

  if (variant === 'icon' || variant === 'badge') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {renderVectorMark()}
      </div>
    );
  }

  // variant === 'full'
  return (
    <div className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <div className="shrink-0 transition-transform hover:scale-105">
        {renderVectorMark()}
      </div>
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 leading-none">
            D<span className="text-emerald-600">-mart</span>
          </span>
          {storeBadgeText && (
            <span className="bg-emerald-100 text-emerald-800 text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-200 tracking-tight leading-none uppercase">
              {storeBadgeText}
            </span>
          )}
        </div>
        <span className="text-[10px] text-emerald-600/90 font-medium tracking-tight mt-0.5 hidden sm:block">
          Grocery & Daily Needs
        </span>
      </div>
    </div>
  );
};
