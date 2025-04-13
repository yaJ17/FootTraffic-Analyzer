import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  textClassName?: string;
  showText?: boolean;
  textColor?: string;
}

const Logo: React.FC<LogoProps> = ({
  className,
  size = 30,
  textClassName,
  showText = true,
  textColor = "text-white",
}) => {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative mr-2">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn("flex-shrink-0", className)}
        >
          <path 
            d="M20 5C12.8 5 7 10.8 7 18C7 25.2 12.8 31 20 31C27.2 31 33 25.2 33 18C33 10.8 27.2 5 20 5ZM20 29C13.9 29 9 24.1 9 18C9 11.9 13.9 7 20 7C26.1 7 31 11.9 31 18C31 24.1 26.1 29 20 29Z" 
            fill="currentColor"
          />
          <circle cx="17" cy="18" r="4" fill="currentColor"/>
          <circle cx="24" cy="18" r="4" fill="currentColor"/>
        </svg>
      </div>
      {showText && (
        <h1 className={cn("font-bold text-xl whitespace-nowrap", textColor, textClassName)}>
          FOOT_TECH
        </h1>
      )}
    </div>
  );
};

export default Logo;
