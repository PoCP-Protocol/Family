import { render, screen } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
});

describe('WAF WF1 lab', () => {
  it('renders W01 discovery home without ranking or family score', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'We are 伐木累' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '青春期沟通' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '问法咪莉校长' })).toBeTruthy();
    expect(screen.queryByText(/排名|家庭总分|family score/i)).toBeNull();
  });

  it('renders the required five WF1 screens', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'W02 主题' }));
    expect(screen.getByRole('heading', { name: '青春期沟通' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'W03 挑战' }));
    expect(screen.getByText('CommunityChallenge != GrowthJourney')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'W04 今日' }));
    expect(screen.getByRole('heading', { name: '今天的一件事' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'W05 我的参与' }));
    expect(screen.getByRole('heading', { name: '7天先听后回应' })).toBeTruthy();
  });

  it('keeps participation as community state and check-in as non-outcome state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '加入挑战' }));
    expect(screen.getByRole('button', { name: '已加入挑战' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'W04 今日' }));
    await user.click(screen.getByRole('button', { name: '今晚试试' }));
    await user.click(screen.getByRole('button', { name: '做了一部分' }));

    expect(screen.queryByText(/Outcome|GrowthEvent|GrowthJourney created/i)).toBeNull();
  });
});
