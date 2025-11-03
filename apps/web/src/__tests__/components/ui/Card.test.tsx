/**
 * Comprehensive tests for Card component
 * Tests all functionality including children, variants, and interactions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card Component', () => {
  it('renders children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Card>
        <h2>Card Title</h2>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with footer', () => {
    render(
      <Card>
        <p>Card content</p>
        <footer>Card footer</footer>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
    expect(screen.getByText('Card footer')).toBeInTheDocument();
  });

  it('applies small padding', () => {
    const { container } = render(
      <Card padding="sm">
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('p-4');
  });

  it('applies medium padding (default)', () => {
    const { container } = render(
      <Card>
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('p-6');
  });

  it('applies large padding', () => {
    const { container } = render(
      <Card padding="lg">
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('p-8');
  });

  it('applies small shadow', () => {
    const { container } = render(
      <Card shadow="sm">
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('shadow-sm');
  });

  it('applies medium shadow (default)', () => {
    const { container } = render(
      <Card>
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('shadow-md');
  });

  it('applies large shadow', () => {
    const { container } = render(
      <Card shadow="lg">
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('shadow-lg');
  });

  it('renders clickable card variant', () => {
    const { container } = render(
      <Card clickable>
        <p>Clickable content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:bg-gray-50');
    expect(card).toHaveClass('transition-colors');
  });

  it('does not apply clickable styles when clickable is false', () => {
    const { container } = render(
      <Card clickable={false}>
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).not.toHaveClass('cursor-pointer');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('has proper base styles', () => {
    const { container } = render(
      <Card>
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
  });
});

