import React from 'react';

interface GameGridProps {
  children: React.ReactNode;
}

export const GameGrid: React.FC<GameGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
};
