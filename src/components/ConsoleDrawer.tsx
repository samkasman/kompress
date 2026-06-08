import { memo, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';

interface ConsoleDrawerProps {
  logs: string[];
  onClose: () => void;
}

function ConsoleDrawer({ logs, onClose }: ConsoleDrawerProps) {
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
    <Drawer icon={Terminal} title="Console" onClose={onClose}>
      <div
        ref={logsRef}
        className="flex-1 overflow-y-auto border border-zinc-900 rounded p-3 bg-black/40"
      >
        {logs.length === 0 ? (
          <div className="text-[11px] text-zinc-600 font-mono">
            No logs yet.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className="text-[11px] text-zinc-400 font-mono leading-5"
            >
              {log}
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
}

export default memo(ConsoleDrawer);
