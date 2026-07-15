import React from 'react';

interface SectionHeaderProps {
  title: string;
  count: number;
  indicatorColor: string; // Hex or bg class or CSS var
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  indicatorColor,
}) => {
  return (
    <h2 className="text-sm font-bold text-toss-inkPrimary flex items-center gap-2 mb-4 tracking-wider uppercase select-none">
      <span
        className="w-3 h-3 rounded-full shrink-0 animate-pulse"
        style={{ backgroundColor: indicatorColor }}
      />
      {title} <span className="text-toss-inkMuted font-semibold text-xs ml-0.5">({count})</span>
    </h2>
  );
};
