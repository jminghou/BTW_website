import React from 'react';

interface CardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText: string;
}

const Card = ({ href, icon, title, description, actionText }: CardProps) => {
  return (
    <div className="w-full bg-white shadow-[0px_0px_15px_rgba(0,0,0,0.09)] p-9 space-y-3 relative overflow-hidden">
      <div className="flex justify-center mb-6">
        {icon}
      </div>
      <h1 className="font-bold text-xl text-center">
        {title}
      </h1>
      <p className="text-sm text-zinc-500 leading-6 whitespace-pre-line">
        {description}
      </p>
      <div className="text-center mt-4">
        <a href={href} className="text-violet-500 hover:text-violet-600">
          {actionText}
        </a>
      </div>
    </div>
  );
}

export default Card;
