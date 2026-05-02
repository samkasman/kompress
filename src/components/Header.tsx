import { Settings, Terminal } from 'lucide-react';

interface HeaderProps {
  showSK: boolean;
  onSettingsClick: () => void;
  onConsoleClick: () => void;
}

export default function Header({
  showSK,
  onSettingsClick,
  onConsoleClick,
}: HeaderProps) {
  return (
    <div className="relative flex-shrink-0 pointer-events-none z-20">
      <div className="flex items-start justify-between p-4">
        <div>
          <h1
            className={`text-2xl font-bold text-slate-100 leading-none transition-opacity duration-500 ${
              showSK ? 'opacity-100' : 'opacity-0'
            }`}
          >
            kompress
          </h1>
          <p
            className={`text-xs text-slate-400 mt-1 transition-opacity duration-500 ${
              showSK ? 'opacity-100' : 'opacity-0'
            }`}
          >
            A simple multimedia file compressor for macOS.
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            data-no-drag
            className="p-2 text-slate-100 hover:text-slate-200 transition-colors pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onConsoleClick();
            }}
          >
            <Terminal className="h-5 w-5" />
          </button>
          <button
            data-no-drag
            className="p-2 text-slate-100 hover:text-slate-200 transition-colors pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onSettingsClick();
            }}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
