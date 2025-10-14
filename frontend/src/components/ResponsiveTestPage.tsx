import React, { useState, useEffect } from 'react';
import { testRunner, TestResult } from '../test/responsiveTestRunner';

const ResponsiveTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentViewport, setCurrentViewport] = useState('');

  useEffect(() => {
    // Update current viewport display
    const updateViewport = () => {
      setCurrentViewport(`${window.innerWidth} × ${window.innerHeight}`);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await testRunner.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = () => {
    const report = testRunner.exportResults();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responsive-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPassRate = () => {
    if (testResults.length === 0) return 0;
    const passed = testResults.filter(r => r.passed).length;
    return (passed / testResults.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Responsive Design Test Suite</h1>
              <p className="text-gray-600 mt-2">Comprehensive testing for responsive design implementation</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Viewport</div>
              <div className="text-lg font-mono font-semibold text-blue-600">{currentViewport}</div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Test Controls</h2>
              <p className="text-gray-600">Run comprehensive responsive design tests</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="btn btn-primary px-6 py-3"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </button>
              {testResults.length > 0 && (
                <button
                  onClick={exportResults}
                  className="btn btn-outline px-6 py-3"
                >
                  Export Results
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Results Summary */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results Summary</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
                <div className="text-sm text-blue-800">Total Tests</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.passed).length}
                </div>
                <div className="text-sm text-green-800">Passed</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => !r.passed).length}
                </div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {getPassRate().toFixed(1)}%
                </div>
                <div className="text-sm text-purple-800">Pass Rate</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getPassRate()}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Detailed Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Test Results</h2>
            
            <div className="space-y-4">
              {Object.entries(
                testResults.reduce((acc, result) => {
                  if (!acc[result.suite]) {
                    acc[result.suite] = [];
                  }
                  acc[result.suite].push(result);
                  return acc;
                }, {} as Record<string, TestResult[]>)
              ).map(([suite, results]) => (
                <div key={suite} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{suite}</h3>
                  
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          result.passed ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {result.passed ? '✅' : '❌'}
                            </span>
                            <span className="font-medium text-gray-900">{result.test}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                          {result.error && (
                            <p className="text-sm text-red-600 mt-1">Error: {result.error}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsive Design Showcase */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsive Design Showcase</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Navigation Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Navigation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Test navigation responsiveness by resizing the window
              </p>
              <div className="bg-gray-100 rounded p-2 text-xs">
                Mobile: Hamburger menu<br/>
                Desktop: Full navigation
              </div>
            </div>

            {/* Grid Layout Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Grid Layouts</h3>
              <p className="text-sm text-gray-600 mb-3">
                Watch how grid layouts adapt to different screen sizes
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-200 h-8 rounded"></div>
                <div className="bg-blue-200 h-8 rounded"></div>
                <div className="bg-blue-200 h-8 rounded"></div>
                <div className="bg-blue-200 h-8 rounded"></div>
              </div>
            </div>

            {/* Typography Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Typography</h3>
              <p className="text-sm text-gray-600 mb-3">
                Typography scales responsively across devices
              </p>
              <div className="space-y-1">
                <div className="text-xs">Extra Small Text</div>
                <div className="text-sm">Small Text</div>
                <div className="text-base">Base Text</div>
                <div className="text-lg">Large Text</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTestPage;
