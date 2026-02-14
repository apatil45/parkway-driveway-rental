/**
 * Comprehensive tests for AppLayout component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AppLayout from '@/components/layout/AppLayout';

// Mock child components
jest.mock('@/components/layout/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock('@/components/layout/Breadcrumbs', () => ({
  __esModule: true,
  default: () => <nav data-testid="breadcrumbs">Breadcrumbs</nav>,
}));

describe('AppLayout Component', () => {
  it('wraps children', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('includes Navbar', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('includes Footer by default', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('includes Breadcrumbs by default', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('hides breadcrumbs when showBreadcrumbs is false', () => {
    render(
      <AppLayout showBreadcrumbs={false}>
        <div>Content</div>
      </AppLayout>
    );
    
    expect(screen.queryByTestId('breadcrumbs')).not.toBeInTheDocument();
  });

  it('hides footer when showFooter is false', () => {
    render(
      <AppLayout showFooter={false}>
        <div>Content</div>
      </AppLayout>
    );
    
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    
    const mainLayout = container.firstChild;
    expect(mainLayout).toHaveClass('min-h-screen', 'flex', 'flex-col');
    
    const main = container.querySelector('main');
    expect(main).toHaveClass('flex-1');
  });
});

