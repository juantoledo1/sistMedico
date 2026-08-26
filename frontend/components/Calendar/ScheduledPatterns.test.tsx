// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScheduledPatterns } from './ScheduledPatterns';
import type { ScheduledPattern } from '../../hooks/useScheduledPatterns';

const basePatterns: ScheduledPattern[] = [
  {
    institution: 'Hospital Alpha',
    startTime: '08:00',
    endTime: '20:00',
    dayOfWeek: 1,
    dayLabel: 'Lunes',
    count: 4,
    totalAmount: 68000,
    hourlyRate: 17000,
  },
  {
    institution: 'Hospital Alpha',
    startTime: '08:00',
    endTime: '20:00',
    dayOfWeek: 3,
    dayLabel: 'Miércoles',
    count: 2,
    totalAmount: 34000,
    hourlyRate: 17000,
  },
  {
    institution: 'Clínica Beta',
    startTime: '20:00',
    endTime: '08:00',
    dayOfWeek: 5,
    dayLabel: 'Viernes',
    count: 3,
    totalAmount: 51000,
    hourlyRate: 17000,
  },
];

describe('ScheduledPatterns — static rendering', () => {
  it('renders nothing when patterns is empty', () => {
    const html = renderToStaticMarkup(
      <ScheduledPatterns patterns={[]} language="es" onReuse={vi.fn()} />,
    );
    expect(html).toBe('');
  });

  it('renders the heading in Spanish', () => {
    const html = renderToStaticMarkup(
      <ScheduledPatterns patterns={basePatterns} language="es" onReuse={vi.fn()} />,
    );
    expect(html).toContain('Guardias programadas este mes');
  });

  it('renders the heading in English', () => {
    const html = renderToStaticMarkup(
      <ScheduledPatterns patterns={basePatterns} language="en" onReuse={vi.fn()} />,
    );
    expect(html).toContain('Scheduled shifts this month');
  });

  it('renders institution names', () => {
    const html = renderToStaticMarkup(
      <ScheduledPatterns patterns={basePatterns} language="es" onReuse={vi.fn()} />,
    );
    expect(html).toContain('Hospital Alpha');
    expect(html).toContain('Clínica Beta');
  });

  it('renders reuse button text when institution is expanded', () => {
    // Use createRoot to interact and expand
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ScheduledPatterns patterns={basePatterns} language="es" onReuse={vi.fn()} />,
      );
    });

    // Expand Hospital Alpha
    act(() => {
      container.querySelector('button')!.click();
    });

    expect(container.textContent).toContain('Reutilizar para');
    expect(container.textContent).toContain('→');

    act(() => root.unmount());
    document.body.removeChild(container);
  });
});

describe('ScheduledPatterns — interactive', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
  });

  it('expands institution details on click and shows pattern rows', () => {
    act(() => {
      root.render(
        <ScheduledPatterns patterns={basePatterns} language="es" onReuse={vi.fn()} />,
      );
    });

    // Initially collapsed — pattern details not visible
    expect(container.textContent).not.toContain('Lun 08:00');

    // Click to expand Hospital Alpha
    act(() => {
      container.querySelector('button')!.click();
    });

    expect(container.textContent).toContain('Lun 08:00');
    expect(container.textContent).toContain('Mié 08:00');
  });

  it('collapses on second click', () => {
    act(() => {
      root.render(
        <ScheduledPatterns patterns={basePatterns} language="es" onReuse={vi.fn()} />,
      );
    });

    const btn = container.querySelector('button')!;

    // Expand
    act(() => btn.click());
    expect(container.textContent).toContain('Lun 08:00');

    // Collapse
    act(() => btn.click());
    expect(container.textContent).not.toContain('Lun 08:00');
  });

  it('calls onReuse with the correct institution patterns', () => {
    const onReuse = vi.fn();

    act(() => {
      root.render(
        <ScheduledPatterns patterns={basePatterns} language="es" onReuse={onReuse} />,
      );
    });

    // Expand Hospital Alpha
    act(() => {
      const buttons = container.querySelectorAll('button');
      buttons[0].click(); // institution header
    });

    // Click the reuse button
    act(() => {
      const reuseBtn = Array.from(container.querySelectorAll('button')).find(
        b => b.textContent?.includes('Reutilizar'),
      )!;
      reuseBtn.click();
    });

    expect(onReuse).toHaveBeenCalledOnce();
    const [patternsArg, institutionArg] = onReuse.mock.calls[0];
    expect(institutionArg).toBe('Hospital Alpha');
    expect(patternsArg).toHaveLength(2);
    expect(patternsArg[0].institution).toBe('Hospital Alpha');
  });
});
