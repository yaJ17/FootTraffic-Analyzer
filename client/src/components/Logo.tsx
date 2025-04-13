import React from 'react';
import { cn } from '@/lib/utils';
import logoImage from '@assets/logo.png';

interface LogoProps {
  className?: string;
  size?: number;
  textClassName?: string;
  showText?: boolean;
  textColor?: string;
}

const Logo: React.FC<LogoProps> = ({
  className,
  size = 40,
  textClassName,
  showText = true,
  textColor = "text-white",
}) => {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative mr-2" style={{ width: size, height: size }}>
        <img 
          src={logoImage} 
          alt="FootTraffic Logo" 
          className="w-full h-full object-contain" 
        />
      </div>
      {showText && (
        <h1 className={cn("font-bold text-xl whitespace-nowrap", textColor, textClassName)}>
          FootTraffic
        </h1>
      )}
    </div>
  );
};

export default Logo;
