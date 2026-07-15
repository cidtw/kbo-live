import React from 'react';

interface EmptyStateProps {
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="glass-panel text-toss-inkFaint text-center py-12 rounded-toss-xl border border-toss-borderLight bg-toss-surface text-xs select-none">
      <div className="text-2xl mb-2">⚾</div>
      <p className="font-semibold text-toss-inkMuted">{message}</p>
    </div>
  );
};
