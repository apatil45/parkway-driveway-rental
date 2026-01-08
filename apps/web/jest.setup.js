// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock Leaflet (for MapView tests)
global.L = {
  map: jest.fn(() => ({
    setView: jest.fn(),
    getZoom: jest.fn(() => 13),
    invalidateSize: jest.fn(),
    remove: jest.fn(),
    getPane: jest.fn(() => ({})),
    _container: { parentNode: document.body },
  })),
  tileLayer: jest.fn(),
  marker: jest.fn(),
  icon: jest.fn(),
  divIcon: jest.fn(() => ({ options: {} })),
};

// Mock window methods for map
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: jest.fn(),
});

// Mock Request for CSRF tests
global.Request = class Request {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input?.url || '';
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers || {});
    this.body = init?.body || null;
  }
};

// Mock Headers for Request
global.Headers = class Headers {
  constructor(init) {
    this._headers = {};
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this._headers[key.toLowerCase()] = value;
      });
    }
  }
  get(name) {
    return this._headers[name.toLowerCase()];
  }
  set(name, value) {
    this._headers[name.toLowerCase()] = value;
  }
};

// Mock useToast hook for tests
jest.mock('@/components/ui/Toast', () => {
  const actual = jest.requireActual('@/components/ui/Toast');
  return {
    ...actual,
    useToast: () => ({
      showToast: jest.fn(),
    }),
  };
});

// Suppress console errors in tests (optional, remove if you want to see them)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning:') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

