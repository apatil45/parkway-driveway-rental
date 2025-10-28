import React, { useState, useEffect, useCallback, useRef } from 'react';

// Minimal test component to isolate the initialization issue
const TestComponent: React.FC = () => {
  const [testState, setTestState] = useState<string>('initial');
  const testRef = useRef<boolean>(false);
  
  // Test useCallback
  const testCallback = useCallback(() => {
    console.log('Test callback executed');
    setTestState('callback executed');
  }, []);
  
  // Test useEffect
  useEffect(() => {
    console.log('Test useEffect executed');
    testCallback();
  }, [testCallback]);
  
  return (
    <div className="p-4 bg-blue-100 rounded-lg">
      <h2 className="text-lg font-bold">Test Component</h2>
      <p>State: {testState}</p>
      <p>Ref: {testRef.current ? 'true' : 'false'}</p>
    </div>
  );
};

export default TestComponent;
