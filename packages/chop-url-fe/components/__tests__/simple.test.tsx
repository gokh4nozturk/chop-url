import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Simple Test Suite', () => {
  it('renders a simple div', () => {
    const testMessage = 'Hello Test';
    render(<div>{testMessage}</div>);

    const element = screen.getByText(testMessage);
    expect(element).toBeInTheDocument();
    expect(element.tagName).toBe('DIV');
  });

  it('matches snapshot', () => {
    const { container } = render(<div>Hello Test</div>);
    expect(container).toMatchSnapshot();
  });
});
