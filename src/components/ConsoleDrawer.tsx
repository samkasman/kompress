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
    </Drawer>
  );
}

export default memo(ConsoleDrawer);
