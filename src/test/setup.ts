import '@testing-library/jest-dom/vitest';
import { Window } from 'happy-dom';
import { afterAll } from 'vitest';

// Node can expose an unconfigured experimental localStorage global. Always use
// the isolated storage supplied by the happy-dom test window instead.
const storageWindow = new Window({ url: 'http://localhost/' });
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: storageWindow.localStorage,
});

afterAll(() => storageWindow.close());
