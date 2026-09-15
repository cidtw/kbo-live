'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { playChime, toggleMute, isMuted } from '@/lib/utils/audioChimes';

export interface ShortcutToast {
  id: number;
  message: string;
  icon?: string;
}

export function useThirdPartyShortcuts(onOpenInfoModal?: () => void) {
  const router = useRouter();
  const [toast, setToast] = useState<ShortcutToast | null>(null);
  const [muted, setMuted] = useState<boolean>(false);

  useEffect(() => {
    setMuted(isMuted());
  }, []);

  const showToast = useCallback((message: string, icon: string = '⚡') => {
    const id = Date.now();
    setToast({ id, message, icon });
    setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 2000);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Input/Textarea focus 중에는 단축키 비활성화
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      if (key === '1') {
        e.preventDefault();
        playChime('switch');
        showToast('단축키 [1]: 실시간 문자중계로 이동', '📡');
        router.push('/');
      } else if (key === '2') {
        e.preventDefault();
        playChime('switch');
        showToast('단축키 [2]: 투수 혹사 지수로 이동', '🔥');
        router.push('/pitchers');
      } else if (key === '3') {
        e.preventDefault();
        playChime('switch');
        showToast('단축키 [3]: 등판 일지 & PTS 3D로 이동', '🎯');
        router.push('/journal');
      } else if (key === 'r' || key === 'R') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          playChime('click');
          showToast('단축키 [R]: 화면 데이터 새로고침', '🔄');
          window.location.reload();
        }
      } else if (key === 'm' || key === 'M') {
        e.preventDefault();
        const nextMuted = toggleMute();
        setMuted(nextMuted);
        if (!nextMuted) playChime('event');
        showToast(`단축키 [M]: 효과음 ${nextMuted ? '음소거' : '활성화'}`, nextMuted ? '🔇' : '🔊');
      } else if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        playChime('click');
        showToast('단축키 [?]: 서드파티 툴킷 정보 열기', 'ℹ️');
        if (onOpenInfoModal) {
          onOpenInfoModal();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, onOpenInfoModal, showToast]);

  return { toast, muted, setMuted, showToast };
}
