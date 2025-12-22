import { X } from 'lucide-react';
import { WindowsXPCommandPrompt } from 'react-old-icons';
import { useEffect, useRef } from 'react';

interface ConsoleDrawerProps {
  logs: string[];
  onClose: () => void;
}

export default function ConsoleDrawer({ logs, onClose }: ConsoleDrawerProps) {
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (logsRef.current) {
        const { scrollHeight, clientHeight } = logsRef.current;
        if (scrollHeight > clientHeight) {
          logsRef.current.scrollTop = scrollHeight;
        }
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [logs]);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <WindowsXPCommandPrompt
            size={20}
            className="text-slate-100"
            alt="Console"
          />
          <h2 className="text-lg font-semibold text-slate-100">Console</h2>
        </div>
        <button
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={logsRef}
        className="flex-1 overflow-y-auto bg-slate-950/50 rounded-lg p-3"
      >
        {logs.length === 0 ? (
          <div className="text-xs text-slate-500 font-mono">No logs yet...</div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className="text-xs text-slate-400 font-mono leading-5"
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
