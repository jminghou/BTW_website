import { ReactNode } from 'react';

interface HeroGradientProps {
  children: ReactNode;
}

const HeroGradient = ({ children }: HeroGradientProps) => {
  return (
    <div 
      className="relative h-screen flex flex-col justify-center" 
      style={{ 
        background: 'linear-gradient(to bottom, #00bed6 0%, #00bed6 70%, white 100%)' 
      }}
    >
      {children}
    </div>
  );
};

export default HeroGradient;
