'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check, X, Download } from 'lucide-react';
import { playChime } from '@/lib/utils/audioChimes';

interface RawDataDrawerProps {
  title?: string;
  data: any;
  buttonLabel?: string;
}

export const RawDataDrawer: React.FC<RawDataDrawerProps> = ({
  title = 'RAW DATASET PAYLOAD',
  data,
  buttonLabel = 'JSON RAW API',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '{}';
    }
  }, [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    playChime('click');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playChime('click');
  };

  return (
    <>
      <button
        onClick={() => {
          playChime('click');
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#051124] hover:bg-kbo-surface border border-kbo-borderLight hover:border-kbo-cyan text-[11px] font-mono font-semibold text-kbo-cyan transition shadow-sm"
        title="서드파티 원본 데이터 JSON 열람"
      >
        <Code2 className="w-3.5 h-3.5" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[80vh] flex flex-col bg-kbo-dark border border-kbo-borderMedium rounded-2xl shadow-2xl overflow-hidden text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-kbo-border bg-kbo-surface flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <Code2 className="w-4 h-4 text-kbo-cyan" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                  {title}
                </h3>
                <span className="badge-thirdparty text-[9px] py-0">DEV TOOL</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-kbo-midnight border border-kbo-borderLight text-xs font-mono flex items-center gap-1 hover:text-white transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded bg-kbo-midnight border border-kbo-borderLight text-xs font-mono flex items-center gap-1 hover:text-white transition"
                >
                  <Download className="w-3.5 h-3.5 text-kbo-gold" />
                  <span>다운로드</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white transition ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto bg-[#030a16] font-mono text-xs text-slate-300">
              <pre className="whitespace-pre leading-relaxed">{jsonString}</pre>
            </div>

            <div className="p-3 border-t border-kbo-border bg-kbo-surface flex items-center justify-between text-[11px] font-mono text-kbo-textMuted">
              <span>Third-Party Data Inspector • JSON Preview</span>
              <span>{new Blob([jsonString]).size} bytes</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
