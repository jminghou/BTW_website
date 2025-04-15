import { ReactNode } from 'react';

interface HeroGradientProps {
  children: ReactNode;
}

const HeroGradient = ({ children }: HeroGradientProps) => {
  return (
    <div 
      className="relative h-screen flex flex-col justify-center" 
      style={{ 
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.7) 70%, rgba(255, 255, 255, 1) 100%)' 
      }}
    >
      {children}
    </div>
  );
};

export default HeroGradient;
