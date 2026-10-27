import React from 'react';

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next.toISOString().slice(0, 10));
  };

  const formatKoreanDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T12:00:00');
      const formatter = new Intl.DateTimeFormat('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      return formatter.format(date);
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-toss-surface border border-toss-borderLight rounded-toss-xl p-3 shadow-sm select-none">
      {/* Date display label in Korean */}
      <span className="text-sm font-bold text-toss-inkPrimary px-1 md:px-2 tracking-tight">
        {formatKoreanDate(selectedDate)}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevDay}
          className="px-3.5 py-2 text-xs text-toss-inkTertiary hover:text-toss-inkPrimary rounded-toss-lg bg-toss-surfaceMuted hover:bg-toss-surfaceHover border border-toss-borderLight font-bold transition-all"
        >
          이전 날
        </button>

        {/* Custom Styled Date Picker Wrapper */}
        <div className="relative flex items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-toss-canvas border border-transparent rounded-toss-lg px-3.5 py-2 text-xs text-toss-inkPrimary font-bold focus:outline-none focus:border-toss-primary cursor-pointer"
          />
        </div>

        <button
          onClick={handleNextDay}
          className="px-3.5 py-2 text-xs text-toss-inkTertiary hover:text-toss-inkPrimary rounded-toss-lg bg-toss-surfaceMuted hover:bg-toss-surfaceHover border border-toss-borderLight font-bold transition-all"
        >
          다음 날
        </button>
      </div>
    </div>
  );
};
