import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock API responses
export const mockApiResponse = <T>(data: T, status = 200) => ({
  data: { data },
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

export const mockApiError = (message: string, status = 400) => {
  const error: any = new Error(message);
  error.response = {
    data: { message },
    status,
    statusText: 'Bad Request',
    headers: {},
    config: {} as any,
  };
  return Promise.reject(error);
};

// Mock axios instance
export const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

export default mockAxiosInstance;

