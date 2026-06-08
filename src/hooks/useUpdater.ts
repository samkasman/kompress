import { useCallback, useEffect, useRef, useState } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type UpdaterStatus =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string; notes?: string }
  | { phase: 'downloading'; progress: number }
  | { phase: 'installing' }
  | { phase: 'error'; message: string };

interface UseUpdaterOptions {
  /**
   * Delay before the first background check, in ms. Defaults to 5000 — long
   * enough that the app finishes its splash + first paint before we touch
   * the network.
   */
  initialCheckDelayMs?: number;
  addLog?: (message: string) => void;
}

export function useUpdater({
  initialCheckDelayMs = 5000,
  addLog,
}: UseUpdaterOptions = {}) {
  const [status, setStatus] = useState<UpdaterStatus>({ phase: 'idle' });
  const updateRef = useRef<Update | null>(null);

  const checkForUpdate = useCallback(async () => {
    setStatus({ phase: 'checking' });
    try {
      const update = await check();
      if (!update) {
        setStatus({ phase: 'idle' });
        addLog?.('Updater: already on the latest version');
        return;
      }
      updateRef.current = update;
      addLog?.(`Updater: v${update.version} available`);
      setStatus({
        phase: 'available',
        version: update.version,
        notes: update.body,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog?.(`❌ Updater check failed: ${message}`);
      setStatus({ phase: 'error', message });
    }
  }, [addLog]);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;

    try {
      let downloaded = 0;
      let contentLength = 0;
      setStatus({ phase: 'downloading', progress: 0 });

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength ?? 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setStatus({
                phase: 'downloading',
                progress: Math.min(
                  100,
                  Math.round((downloaded / contentLength) * 100)
                ),
              });
            }
            break;
          case 'Finished':
            setStatus({ phase: 'installing' });
            break;
        }
      });

      addLog?.('Updater: install complete, relaunching');
      await relaunch();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog?.(`❌ Updater install failed: ${message}`);
      setStatus({ phase: 'error', message });
    }
  }, [addLog]);

  // Background check shortly after mount.
  useEffect(() => {
    const timer = setTimeout(() => {
      void checkForUpdate();
    }, initialCheckDelayMs);
    return () => clearTimeout(timer);
  }, [checkForUpdate, initialCheckDelayMs]);

  return { status, checkForUpdate, installUpdate };
}
