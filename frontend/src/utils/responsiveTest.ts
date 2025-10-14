/**
 * Responsive Design Test Utility
 * 
 * This utility helps test responsive design across different viewport sizes
 * and provides debugging information for responsive issues.
 */

export interface ViewportSize {
  name: string;
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'wide';
}

export const VIEWPORT_SIZES: ViewportSize[] = [
  // Mobile devices
  { name: 'iPhone SE', width: 375, height: 667, deviceType: 'mobile' },
  { name: 'iPhone 12', width: 390, height: 844, deviceType: 'mobile' },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926, deviceType: 'mobile' },
  { name: 'Samsung Galaxy S20', width: 360, height: 800, deviceType: 'mobile' },
  
  // Tablet devices
  { name: 'iPad', width: 768, height: 1024, deviceType: 'tablet' },
  { name: 'iPad Pro', width: 1024, height: 1366, deviceType: 'tablet' },
  { name: 'Surface Pro', width: 912, height: 1368, deviceType: 'tablet' },
  
  // Laptop devices
  { name: 'MacBook Air', width: 1280, height: 800, deviceType: 'laptop' },
  { name: 'MacBook Pro 13"', width: 1280, height: 800, deviceType: 'laptop' },
  { name: 'Dell XPS 13', width: 1920, height: 1080, deviceType: 'laptop' },
  
  // Desktop devices
  { name: 'Desktop 1080p', width: 1920, height: 1080, deviceType: 'desktop' },
  { name: 'Desktop 1440p', width: 2560, height: 1440, deviceType: 'desktop' },
  { name: 'Desktop 4K', width: 3840, height: 2160, deviceType: 'wide' },
  
  // Half screen scenarios
  { name: 'Half Screen 1080p', width: 960, height: 1080, deviceType: 'laptop' },
  { name: 'Half Screen 1440p', width: 1280, height: 1440, deviceType: 'desktop' },
];

export interface ResponsiveTestResult {
  viewport: ViewportSize;
  timestamp: Date;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export class ResponsiveDesignTester {
  private currentViewport: ViewportSize | null = null;
  private testResults: ResponsiveTestResult[] = [];

  /**
   * Simulate a viewport size for testing
   */
  simulateViewport(viewport: ViewportSize): void {
    this.currentViewport = viewport;
    
    // Update viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', `width=${viewport.width}, initial-scale=1.0`);
    }
    
    // Update body classes for device type
    document.body.className = document.body.className.replace(/device-\w+/g, '');
    document.body.classList.add(`device-${viewport.deviceType}`);
    
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('viewport-change', { 
      detail: { viewport } 
    }));
  }

  /**
   * Test responsive design elements
   */
  testResponsiveElements(): ResponsiveTestResult {
    if (!this.currentViewport) {
      throw new Error('No viewport set. Call simulateViewport() first.');
    }

    const result: ResponsiveTestResult = {
      viewport: this.currentViewport,
      timestamp: new Date(),
      issues: [],
      warnings: [],
      recommendations: []
    };

    // Test navigation
    this.testNavigation(result);
    
    // Test forms
    this.testForms(result);
    
    // Test buttons
    this.testButtons(result);
    
    // Test cards
    this.testCards(result);
    
    // Test modals
    this.testModals(result);
    
    // Test maps
    this.testMaps(result);
    
    // Test grid layouts
    this.testGridLayouts(result);
    
    // Test typography
    this.testTypography(result);

    this.testResults.push(result);
    return result;
  }

  private testNavigation(result: ResponsiveTestResult): void {
    const nav = document.querySelector('nav');
    if (!nav) {
      result.issues.push('Navigation element not found');
      return;
    }

    const navHeight = nav.offsetHeight;
    const viewportHeight = this.currentViewport!.height;

    // Check if navigation is too tall for mobile
    if (this.currentViewport!.deviceType === 'mobile' && navHeight > 80) {
      result.warnings.push('Navigation height may be too large for mobile devices');
    }

    // Check for mobile menu toggle
    const mobileToggle = nav.querySelector('[aria-controls="mobile-menu"]');
    if (this.currentViewport!.deviceType === 'mobile' && !mobileToggle) {
      result.issues.push('Mobile menu toggle not found');
    }

    // Check for desktop menu items
    const desktopMenu = nav.querySelector('.lg\\:flex');
    if (this.currentViewport!.deviceType === 'mobile' && desktopMenu) {
      result.warnings.push('Desktop menu visible on mobile - check responsive classes');
    }
  }

  private testForms(result: ResponsiveTestResult): void {
    const forms = document.querySelectorAll('form');
    
    forms.forEach((form, index) => {
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach((input) => {
        const element = input as HTMLElement;
        const minHeight = parseInt(getComputedStyle(element).minHeight);
        
        // Check minimum touch target size
        if (this.currentViewport!.deviceType === 'mobile' && minHeight < 44) {
          result.warnings.push(`Form input ${index} may be too small for touch interaction`);
        }
      });
    });
  }

  private testButtons(result: ResponsiveTestResult): void {
    const buttons = document.querySelectorAll('button, .btn');
    
    buttons.forEach((button, index) => {
      const element = button as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Check minimum touch target size
      if (this.currentViewport!.deviceType === 'mobile' && (rect.width < 44 || rect.height < 44)) {
        result.warnings.push(`Button ${index} may be too small for touch interaction`);
      }
    });
  }

  private testCards(result: ResponsiveTestResult): void {
    const cards = document.querySelectorAll('.card, [class*="card"]');
    
    cards.forEach((card, index) => {
      const element = card as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Check if card is wider than viewport
      if (rect.width > this.currentViewport!.width) {
        result.issues.push(`Card ${index} is wider than viewport`);
      }
    });
  }

  private testModals(result: ResponsiveTestResult): void {
    const modals = document.querySelectorAll('.modal, [class*="modal"]');
    
    modals.forEach((modal, index) => {
      const element = modal as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Check if modal fits in viewport
      if (rect.width > this.currentViewport!.width || rect.height > this.currentViewport!.height) {
        result.issues.push(`Modal ${index} does not fit in viewport`);
      }
    });
  }

  private testMaps(result: ResponsiveTestResult): void {
    const maps = document.querySelectorAll('.map-container, [class*="map"]');
    
    maps.forEach((map, index) => {
      const element = map as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Check if map has reasonable height
      if (rect.height < 200) {
        result.warnings.push(`Map ${index} height may be too small`);
      }
      
      // Check if map is responsive
      if (rect.width > this.currentViewport!.width) {
        result.issues.push(`Map ${index} is not responsive`);
      }
    });
  }

  private testGridLayouts(result: ResponsiveTestResult): void {
    const grids = document.querySelectorAll('[class*="grid"]');
    
    grids.forEach((grid, index) => {
      const element = grid as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Check if grid overflows
      if (rect.width > this.currentViewport!.width) {
        result.issues.push(`Grid ${index} overflows viewport`);
      }
    });
  }

  private testTypography(result: ResponsiveTestResult): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading, index) => {
      const element = heading as HTMLElement;
      const fontSize = parseInt(getComputedStyle(element).fontSize);
      
      // Check if heading is too small on mobile
      if (this.currentViewport!.deviceType === 'mobile' && fontSize < 16) {
        result.warnings.push(`Heading ${index} font size may be too small for mobile`);
      }
    });
  }

  /**
   * Get all test results
   */
  getTestResults(): ResponsiveTestResult[] {
    return this.testResults;
  }

  /**
   * Generate a comprehensive report
   */
  generateReport(): string {
    let report = '# Responsive Design Test Report\n\n';
    
    this.testResults.forEach((result, index) => {
      report += `## Test ${index + 1}: ${result.viewport.name} (${result.viewport.width}x${result.viewport.height})\n\n`;
      report += `**Device Type:** ${result.viewport.deviceType}\n`;
      report += `**Timestamp:** ${result.timestamp.toISOString()}\n\n`;
      
      if (result.issues.length > 0) {
        report += `### Issues (${result.issues.length})\n`;
        result.issues.forEach(issue => {
          report += `- ❌ ${issue}\n`;
        });
        report += '\n';
      }
      
      if (result.warnings.length > 0) {
        report += `### Warnings (${result.warnings.length})\n`;
        result.warnings.forEach(warning => {
          report += `- ⚠️ ${warning}\n`;
        });
        report += '\n';
      }
      
      if (result.recommendations.length > 0) {
        report += `### Recommendations (${result.recommendations.length})\n`;
        result.recommendations.forEach(rec => {
          report += `- 💡 ${rec}\n`;
        });
        report += '\n';
      }
      
      report += '---\n\n';
    });
    
    return report;
  }

  /**
   * Reset all test results
   */
  reset(): void {
    this.testResults = [];
    this.currentViewport = null;
  }
}

// Export singleton instance
export const responsiveTester = new ResponsiveDesignTester();

// Export utility functions
export const testAllViewports = async (): Promise<ResponsiveTestResult[]> => {
  const results: ResponsiveTestResult[] = [];
  
  for (const viewport of VIEWPORT_SIZES) {
    responsiveTester.simulateViewport(viewport);
    
    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = responsiveTester.testResponsiveElements();
    results.push(result);
  }
  
  return results;
};

export const getCurrentViewport = (): ViewportSize | null => {
  return responsiveTester['currentViewport'];
};

export const isMobile = (): boolean => {
  const viewport = getCurrentViewport();
  return viewport ? viewport.deviceType === 'mobile' : window.innerWidth < 768;
};

export const isTablet = (): boolean => {
  const viewport = getCurrentViewport();
  return viewport ? viewport.deviceType === 'tablet' : window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = (): boolean => {
  const viewport = getCurrentViewport();
  return viewport ? viewport.deviceType === 'laptop' || viewport.deviceType === 'desktop' || viewport.deviceType === 'wide' : window.innerWidth >= 1024;
};
