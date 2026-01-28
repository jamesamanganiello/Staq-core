interface StaqLogoProps {
  height?: number;
  variant?: "color" | "white";
  showText?: boolean;
  className?: string;
}

export function StaqLogo({ 
  height = 40, 
  variant = "color", 
  showText = true,
  className = "" 
}: StaqLogoProps) {
  const scale = height / 120;
  const width = showText ? 420 * scale : 75 * scale;
  
  const iconColors = variant === "white" 
    ? { bar1: "#FFFFFF", bar2: "#FFFFFF", bar3: "#FFFFFF" }
    : { bar1: "#0099A8", bar2: "#00B4C4", bar3: "#00D4E8" };
  
  const textColor = variant === "white" ? "#FFFFFF" : "#00B4C4";

  if (!showText) {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 75 120" 
        width={width} 
        height={height}
        className={className}
        aria-label="Staq"
      >
        <g transform="translate(5, 25)">
          <rect x="0" y="50" width="55" height="14" rx="4" fill={iconColors.bar1}/>
          <rect x="8" y="31" width="50" height="14" rx="4" fill={iconColors.bar2}/>
          <rect x="16" y="12" width="45" height="14" rx="4" fill={iconColors.bar3}/>
        </g>
      </svg>
    );
  }

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 420 120" 
      width={width} 
      height={height}
      className={className}
      aria-label="Staq"
    >
      <g transform="translate(20, 25)">
        <rect x="0" y="50" width="55" height="14" rx="4" fill={iconColors.bar1}/>
        <rect x="8" y="31" width="50" height="14" rx="4" fill={iconColors.bar2}/>
        <rect x="16" y="12" width="45" height="14" rx="4" fill={iconColors.bar3}/>
      </g>
      <text 
        x="100" 
        y="82" 
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        fontSize="64" 
        fontWeight="700" 
        letterSpacing="-2" 
        fill={textColor}
      >
        Staq
      </text>
    </svg>
  );
}

export function StaqIcon({ 
  size = 24, 
  variant = "color",
  className = "" 
}: { 
  size?: number; 
  variant?: "color" | "white";
  className?: string;
}) {
  const iconColors = variant === "white" 
    ? { bar1: "#FFFFFF", bar2: "#FFFFFF", bar3: "#FFFFFF" }
    : { bar1: "#0099A8", bar2: "#00B4C4", bar3: "#00D4E8" };

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 55 64" 
      width={size} 
      height={size * (64/55)}
      className={className}
      aria-label="Staq"
    >
      <rect x="0" y="50" width="55" height="14" rx="4" fill={iconColors.bar1}/>
      <rect x="8" y="31" width="50" height="14" rx="4" fill={iconColors.bar2}/>
      <rect x="16" y="12" width="45" height="14" rx="4" fill={iconColors.bar3}/>
    </svg>
  );
}
