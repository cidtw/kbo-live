'use client';

import { useSyncExternalStore } from 'react';
import { getServerMutedSnapshot, isMuted, subscribeMuted } from '@/lib/utils/audioChimes';

/** localStorage 음소거 설정을 구독한다. 서버/하이드레이션 시에는 false. */
export function useMuted(): boolean {
  return useSyncExternalStore(subscribeMuted, isMuted, getServerMutedSnapshot);
}
