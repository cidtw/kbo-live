import React, { useState, useEffect, useRef } from 'react';
import { BroadcastLogEntry } from '../lib/domain/broadcast';

interface CommentaryFeedProps {
  log: BroadcastLogEntry[];
}

export const CommentaryFeed: React.FC<CommentaryFeedProps> = ({ log }) => {
  // Filters: 'all' (전체) | 'key' (주요 플레이) | 'pitch' (투구 상세)
  const [filterMode, setFilterMode] = useState<'all' | 'key' | 'pitch'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  const filteredLog = log.filter((entry) => {
    if (filterMode === 'key') {
      // Hide pitches and batter announcements
      return entry.eventType !== 'pitch' && entry.eventType !== 'batter';
    }
    if (filterMode === 'pitch') {
      // Only show pitches and batter announcements
      return entry.eventType === 'pitch' || entry.eventType === 'batter';
    }
    return true;
  });

  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [filteredLog, autoScroll]);

  const getEventIcon = (type: string, defaultIcon: string) => {
    switch (type) {
      case 'homerun':
        return '💥';
      case 'run':
        return '🏠';
      case 'hit':
        return '⚾';
      case 'strikeout':
        return '❌';
      case 'walk':
        return '🚶';
      case 'out':
        return '⏹️';
      case 'steal':
        return '🏃';
      case 'change':
        return '🔄';
      case 'error':
        return '⚠️';
      case 'inning':
        return '📌';
      case 'pitch':
        return '⚾';
      case 'batter':
        return '👤';
      default:
        return defaultIcon || '💬';
    }
  };

  const getEventStyles = (type: string) => {
    // Toss Securities style mapping:
    // - Hit / HR / run / scoring = bull-red (red)
    // - Out / strikeout = bear-blue (blue)
    // - Walk / steal = warning-yellow (yellow)
    switch (type) {
      case 'homerun':
        return 'bg-toss-bullRedSoft text-toss-bullRed font-black border-l-4 border-toss-bullRed text-sm md:text-base py-3.5 shadow-sm';
      case 'run':
        return 'bg-toss-bullRedSoft text-toss-bullRed font-bold border-l-4 border-toss-bullRed text-sm md:text-base py-3';
      case 'hit':
        return 'bg-toss-bullRedSoft text-toss-bullRed font-bold border-l-4 border-toss-bullRed text-sm';
      case 'strikeout':
        return 'bg-toss-primarySoft text-toss-primary font-semibold border-l-4 border-toss-primary text-sm';
      case 'walk':
        return 'bg-toss-warningYellowSoft text-amber-800 font-semibold border-l-4 border-toss-warningYellow text-sm';
      case 'out':
        return 'bg-toss-primarySoft/40 text-toss-primary/80 border-l-4 border-toss-primary/30 text-sm';
      case 'steal':
        return 'bg-toss-warningYellowSoft/50 text-amber-800 border-l-4 border-toss-warningYellow/60 text-sm';
      case 'change':
        return 'bg-toss-surfaceMuted text-toss-inkSecondary border-l-4 border-toss-borderMedium text-xs md:text-sm';
      case 'error':
        return 'bg-orange-50 text-orange-800 font-semibold border-l-4 border-orange-500 text-xs md:text-sm';
      case 'inning':
        return 'bg-toss-canvas text-toss-inkPrimary text-center font-black text-sm py-3 my-2.5 rounded-toss-lg select-none border border-toss-borderLight';
      case 'pitch':
        return 'bg-transparent text-toss-inkMuted pl-8 text-xs font-mono py-1 border-none';
      case 'batter':
        return 'bg-toss-surfaceMuted/50 text-toss-inkTertiary pl-6 text-xs border-none font-semibold';
      case 'end':
        return 'bg-toss-inkPrimary border-y border-toss-borderMedium text-white text-center font-bold py-3.5 my-3 rounded-toss-lg select-none';
      default:
        return 'bg-toss-surface text-toss-inkSecondary border-l-4 border-toss-borderLight text-sm';
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-[520px] rounded-toss-xl border border-toss-borderLight bg-toss-surface relative">
      {/* Header / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-toss-borderLight pb-4 mb-4 gap-3">
        <h3 className="font-bold text-toss-inkPrimary tracking-tight flex items-center gap-2 text-base select-none">
          <span className="w-2.5 h-2.5 bg-toss-primary rounded-full shrink-0" />
          문자중계 피드
        </h3>
        
        {/* Segmented Control Filter */}
        <div className="bg-toss-canvas p-0.5 flex gap-0.5 rounded-toss-md border border-toss-borderLight select-none">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-toss-sm text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-toss-surface text-toss-inkPrimary shadow-sm'
                : 'text-toss-inkMuted hover:text-toss-inkSecondary'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilterMode('key')}
            className={`px-3 py-1.5 rounded-toss-sm text-xs font-bold transition-all ${
              filterMode === 'key'
                ? 'bg-toss-surface text-toss-inkPrimary shadow-sm'
                : 'text-toss-inkMuted hover:text-toss-inkSecondary'
            }`}
          >
            주요 플레이
          </button>
          <button
            onClick={() => setFilterMode('pitch')}
            className={`px-3 py-1.5 rounded-toss-sm text-xs font-bold transition-all ${
              filterMode === 'pitch'
                ? 'bg-toss-surface text-toss-inkPrimary shadow-sm'
                : 'text-toss-inkMuted hover:text-toss-inkSecondary'
            }`}
          >
            투구 상세
          </button>
        </div>
      </div>

      {/* Logs container */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-toss-borderLight hover:scrollbar-thumb-toss-borderMedium pb-12"
      >
        {filteredLog.length === 0 ? (
          <div className="h-full flex items-center justify-center text-toss-inkMuted text-sm select-none">
            선택한 조건의 중계 내용이 없습니다.
          </div>
        ) : (
          filteredLog.map((entry, index) => {
            const styles = getEventStyles(entry.eventType);
            const isPlainPitch = entry.eventType === 'pitch';
            const isInning = entry.eventType === 'inning' || entry.eventType === 'end';

            return (
              <div
                key={entry.seq || index}
                className={`p-3 rounded-toss-lg border border-toss-surfaceMuted flex items-start gap-2.5 transition-colors ${styles}`}
              >
                {!isInning && !isPlainPitch && (
                  <span className="text-toss-inkMuted text-xs font-bold select-none pt-0.5 w-10 shrink-0">
                    [{entry.ts}]
                  </span>
                )}
                {!isPlainPitch && (
                  <span className="shrink-0 text-base" role="img" aria-label={entry.eventType}>
                    {getEventIcon(entry.eventType, entry.icon)}
                  </span>
                )}
                <span className="flex-1 whitespace-pre-line leading-relaxed">{entry.text}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Scroll to Bottom button (Correct relative context) */}
      {!autoScroll && filteredLog.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-toss-primary hover:bg-toss-primaryHover text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-lg hover:scale-105 active:scale-98 transition-all duration-150 flex items-center gap-1.5 z-10"
        >
          <span>↓</span> 최신 글로 이동
        </button>
      )}
    </div>
  );
};
