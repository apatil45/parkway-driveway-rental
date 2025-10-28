// Deployment information to force cache refresh
export const DEPLOYMENT_INFO = {
  version: 'v10',
  timestamp: new Date().toISOString(),
  buildId: Math.random().toString(36).substring(7)
};

console.log('🚀 Deployment Info:', DEPLOYMENT_INFO);
