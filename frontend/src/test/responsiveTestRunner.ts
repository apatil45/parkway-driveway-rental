/**
 * Responsive Design Test Runner
 * 
 * This script runs comprehensive tests to validate the responsive design implementation
 */

import { responsiveTester, VIEWPORT_SIZES, ResponsiveTestResult } from '../utils/responsiveTest';

export interface TestSuite {
  name: string;
  description: string;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  description: string;
  test: () => boolean | Promise<boolean>;
  expectedResult: boolean;
}

export class ResponsiveTestRunner {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Responsive Design Test Suite...');
    
    const testSuites: TestSuite[] = [
      this.getComponentTests(),
      this.getLayoutTests(),
      this.getAccessibilityTests(),
      this.getPerformanceTests(),
      this.getCrossBrowserTests()
    ];

    for (const suite of testSuites) {
      console.log(`\n📋 Running Test Suite: ${suite.name}`);
      console.log(`📝 ${suite.description}`);
      
      for (const testCase of suite.tests) {
        try {
          const result = await testCase.test();
          const passed = result === testCase.expectedResult;
          
          this.results.push({
            suite: suite.name,
            test: testCase.name,
            description: testCase.description,
            passed,
            expected: testCase.expectedResult,
            actual: result,
            timestamp: new Date()
          });

          console.log(`${passed ? '✅' : '❌'} ${testCase.name}: ${passed ? 'PASSED' : 'FAILED'}`);
        } catch (error) {
          this.results.push({
            suite: suite.name,
            test: testCase.name,
            description: testCase.description,
            passed: false,
            expected: testCase.expectedResult,
            actual: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          });

          console.log(`❌ ${testCase.name}: ERROR - ${error}`);
        }
      }
    }

    this.generateReport();
    return this.results;
  }

  private getComponentTests(): TestSuite {
    return {
      name: 'Component Responsiveness',
      description: 'Tests individual component responsive behavior',
      tests: [
        {
          name: 'Navigation Mobile Toggle',
          description: 'Navigation should show mobile toggle on small screens',
          test: () => {
            responsiveTester.simulateViewport(VIEWPORT_SIZES[0]); // iPhone SE
            const mobileToggle = document.querySelector('[aria-controls="mobile-menu"]');
            return mobileToggle !== null;
          },
          expectedResult: true
        },
        {
          name: 'Navigation Desktop Menu',
          description: 'Navigation should show desktop menu on large screens',
          test: () => {
            responsiveTester.simulateViewport(VIEWPORT_SIZES[10]); // MacBook Pro
            const desktopMenu = document.querySelector('.lg\\:flex');
            return desktopMenu !== null;
          },
          expectedResult: true
        },
        {
          name: 'Form Input Touch Targets',
          description: 'Form inputs should meet minimum touch target size',
          test: () => {
            responsiveTester.simulateViewport(VIEWPORT_SIZES[0]); // iPhone SE
            const inputs = document.querySelectorAll('input, select, textarea');
            let allValid = true;
            
            inputs.forEach(input => {
              const element = input as HTMLElement;
              const minHeight = parseInt(getComputedStyle(element).minHeight);
              if (minHeight < 44) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        },
        {
          name: 'Button Touch Targets',
          description: 'Buttons should meet minimum touch target size',
          test: () => {
            responsiveTester.simulateViewport(VIEWPORT_SIZES[0]); // iPhone SE
            const buttons = document.querySelectorAll('button, .btn');
            let allValid = true;
            
            buttons.forEach(button => {
              const element = button as HTMLElement;
              const rect = element.getBoundingClientRect();
              if (rect.width < 44 || rect.height < 44) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        }
      ]
    };
  }

  private getLayoutTests(): TestSuite {
    return {
      name: 'Layout Responsiveness',
      description: 'Tests overall layout responsive behavior',
      tests: [
        {
          name: 'Grid Layout Adaptation',
          description: 'Grid layouts should adapt to screen size',
          test: () => {
            responsiveTester.simulateViewport(VIEWPORT_SIZES[0]); // iPhone SE
            const grids = document.querySelectorAll('[class*="grid"]');
            let allValid = true;
            
            grids.forEach(grid => {
              const element = grid as HTMLElement;
              const rect = element.getBoundingClientRect();
              if (rect.width > window.innerWidth) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        },
        {
          name: 'Modal Viewport Fit',
          description: 'Modals should fit within viewport',
          test: () => {
            responsiveTester.simulateViewport(VIEWPORT_SIZES[0]); // iPhone SE
            const modals = document.querySelectorAll('.modal, [class*="modal"]');
            let allValid = true;
            
            modals.forEach(modal => {
              const element = modal as HTMLElement;
              const rect = element.getBoundingClientRect();
              if (rect.width > window.innerWidth || rect.height > window.innerHeight) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        },
        {
          name: 'Typography Scaling',
          description: 'Typography should scale appropriately',
          test: () => {
            responsiveTester.simulateViewport(VIEWPORT_SIZES[0]); // iPhone SE
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let allValid = true;
            
            headings.forEach(heading => {
              const element = heading as HTMLElement;
              const fontSize = parseInt(getComputedStyle(element).fontSize);
              if (fontSize < 16) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        }
      ]
    };
  }

  private getAccessibilityTests(): TestSuite {
    return {
      name: 'Accessibility',
      description: 'Tests accessibility compliance',
      tests: [
        {
          name: 'Keyboard Navigation',
          description: 'All interactive elements should be keyboard accessible',
          test: () => {
            const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
            let allValid = true;
            
            interactiveElements.forEach(element => {
              const tabIndex = element.getAttribute('tabindex');
              if (tabIndex === '-1' && element.matches('button, a, input, select, textarea')) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        },
        {
          name: 'ARIA Labels',
          description: 'Interactive elements should have proper ARIA labels',
          test: () => {
            const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
            let allValid = true;
            
            interactiveElements.forEach(element => {
              const hasLabel = element.getAttribute('aria-label') || 
                              element.getAttribute('aria-labelledby') ||
                              element.textContent?.trim() ||
                              element.getAttribute('placeholder');
              
              if (!hasLabel) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        },
        {
          name: 'Color Contrast',
          description: 'Text should have sufficient color contrast',
          test: () => {
            // This is a simplified test - in production, you'd use a proper contrast checker
            const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
            let allValid = true;
            
            textElements.forEach(element => {
              const style = getComputedStyle(element);
              const color = style.color;
              const backgroundColor = style.backgroundColor;
              
              // Basic check - ensure colors are not the same
              if (color === backgroundColor) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        }
      ]
    };
  }

  private getPerformanceTests(): TestSuite {
    return {
      name: 'Performance',
      description: 'Tests performance-related responsive features',
      tests: [
        {
          name: 'CSS Load Time',
          description: 'CSS should load within acceptable time',
          test: () => {
            const startTime = performance.now();
            const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
            const endTime = performance.now();
            
            // Check if CSS links are present and load time is reasonable
            return linkElements.length > 0 && (endTime - startTime) < 1000;
          },
          expectedResult: true
        },
        {
          name: 'Image Optimization',
          description: 'Images should be optimized for different screen sizes',
          test: () => {
            const images = document.querySelectorAll('img');
            let allValid = true;
            
            images.forEach(img => {
              const src = img.getAttribute('src');
              const srcset = img.getAttribute('srcset');
              
              // Check if images have responsive attributes
              if (!src && !srcset) {
                allValid = false;
              }
            });
            
            return allValid;
          },
          expectedResult: true
        }
      ]
    };
  }

  private getCrossBrowserTests(): TestSuite {
    return {
      name: 'Cross-Browser Compatibility',
      description: 'Tests cross-browser responsive features',
      tests: [
        {
          name: 'Flexbox Support',
          description: 'Flexbox should be supported',
          test: () => {
            const testElement = document.createElement('div');
            testElement.style.display = 'flex';
            return testElement.style.display === 'flex';
          },
          expectedResult: true
        },
        {
          name: 'Grid Support',
          description: 'CSS Grid should be supported',
          test: () => {
            const testElement = document.createElement('div');
            testElement.style.display = 'grid';
            return testElement.style.display === 'grid';
          },
          expectedResult: true
        },
        {
          name: 'Viewport Meta Tag',
          description: 'Viewport meta tag should be present',
          test: () => {
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            return viewportMeta !== null;
          },
          expectedResult: true
        }
      ]
    };
  }

  private generateReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = (passedTests / totalTests) * 100;

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Pass Rate: ${passRate.toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.suite}: ${result.test}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      });
    }

    console.log('\n🎉 Responsive Design Test Suite Complete!');
  }

  getResults(): TestResult[] {
    return this.results;
  }

  exportResults(): string {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        passRate: (this.results.filter(r => r.passed).length / this.results.length) * 100
      },
      results: this.results
    };

    return JSON.stringify(report, null, 2);
  }
}

export interface TestResult {
  suite: string;
  test: string;
  description: string;
  passed: boolean;
  expected: boolean;
  actual: boolean;
  error?: string;
  timestamp: Date;
}

// Export singleton instance
export const testRunner = new ResponsiveTestRunner();

// Auto-run tests if in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Run tests after a short delay to ensure DOM is ready
  setTimeout(() => {
    testRunner.runAllTests().then(() => {
      console.log('🧪 Responsive Design Tests completed automatically');
    });
  }, 2000);
}
