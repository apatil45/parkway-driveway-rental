import React, { useState, useEffect } from 'react';
import { responsiveTester, VIEWPORT_SIZES, ResponsiveTestResult, ViewportSize } from '../utils/responsiveTest';

interface ResponsiveDesignTesterProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResponsiveDesignTester: React.FC<ResponsiveDesignTesterProps> = ({ isOpen, onClose }) => {
  const [currentViewport, setCurrentViewport] = useState<ViewportSize | null>(null);
  const [testResults, setTestResults] = useState<ResponsiveTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedViewport, setSelectedViewport] = useState<ViewportSize>(VIEWPORT_SIZES[0]);

  useEffect(() => {
    if (isOpen) {
      // Initialize with current viewport
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const matchingViewport = VIEWPORT_SIZES.find(v => 
        Math.abs(v.width - currentWidth) < 50 && Math.abs(v.height - currentHeight) < 50
      ) || VIEWPORT_SIZES[0];
      
      setSelectedViewport(matchingViewport);
      setCurrentViewport(matchingViewport);
    }
  }, [isOpen]);

  const handleViewportChange = (viewport: ViewportSize) => {
    setSelectedViewport(viewport);
    responsiveTester.simulateViewport(viewport);
    setCurrentViewport(viewport);
  };

  const runSingleTest = () => {
    if (!currentViewport) return;
    
    const result = responsiveTester.testResponsiveElements();
    setTestResults(prev => [...prev, result]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const results: ResponsiveTestResult[] = [];
      
      for (const viewport of VIEWPORT_SIZES) {
        responsiveTester.simulateViewport(viewport);
        setCurrentViewport(viewport);
        
        // Wait for layout to settle
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const result = responsiveTester.testResponsiveElements();
        results.push(result);
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    responsiveTester.reset();
  };

  const exportReport = () => {
    const report = responsiveTester.generateReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responsive-design-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Responsive Design Tester</h2>
              <p className="text-blue-100 mt-1">Test your app across different viewport sizes</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Viewport Selection */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Viewport Sizes</h3>
            
            <div className="space-y-2 mb-6">
              {VIEWPORT_SIZES.map((viewport) => (
                <button
                  key={`${viewport.name}-${viewport.width}-${viewport.height}`}
                  onClick={() => handleViewportChange(viewport)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedViewport?.name === viewport.name
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{viewport.name}</div>
                  <div className="text-sm text-gray-600">
                    {viewport.width} × {viewport.height}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {viewport.deviceType}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={runSingleTest}
                disabled={!currentViewport}
                className="w-full btn btn-primary"
              >
                Test Current Viewport
              </button>
              
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="w-full btn btn-secondary"
              >
                {isRunning ? 'Running Tests...' : 'Test All Viewports'}
              </button>
              
              <button
                onClick={clearResults}
                disabled={testResults.length === 0}
                className="w-full btn btn-outline"
              >
                Clear Results
              </button>
              
              {testResults.length > 0 && (
                <button
                  onClick={exportReport}
                  className="w-full btn btn-success"
                >
                  Export Report
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Test Results */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            
            {testResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">No test results yet. Run a test to see results.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">
                        {result.viewport.name} ({result.viewport.width}×{result.viewport.height})
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.issues.length === 0 && result.warnings.length === 0
                          ? 'bg-green-100 text-green-800'
                          : result.issues.length > 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.issues.length === 0 && result.warnings.length === 0
                          ? 'Passed'
                          : result.issues.length > 0
                          ? `${result.issues.length} Issues`
                          : `${result.warnings.length} Warnings`}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      {result.viewport.deviceType} • {result.timestamp.toLocaleTimeString()}
                    </div>
                    
                    {result.issues.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-red-700 mb-2">Issues ({result.issues.length})</h5>
                        <ul className="space-y-1">
                          {result.issues.map((issue, i) => (
                            <li key={i} className="text-sm text-red-600 flex items-start">
                              <span className="mr-2">❌</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.warnings.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-yellow-700 mb-2">Warnings ({result.warnings.length})</h5>
                        <ul className="space-y-1">
                          {result.warnings.map((warning, i) => (
                            <li key={i} className="text-sm text-yellow-600 flex items-start">
                              <span className="mr-2">⚠️</span>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">Recommendations ({result.recommendations.length})</h5>
                        <ul className="space-y-1">
                          {result.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-blue-600 flex items-start">
                              <span className="mr-2">💡</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDesignTester;
