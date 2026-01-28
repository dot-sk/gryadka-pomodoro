import type { Meta, StoryObj } from '@storybook/react';
import { StatsPage } from './StatsPage';
import { fork } from 'effector';
import { Provider } from 'effector-react';
import { statsModel } from '../../features/stats';
import { IntervalType } from '../../entitites/countdown/constants';
import type { StatEntry } from '../../features/stats/typings';

const meta: Meta<typeof StatsPage> = {
  title: 'Pages/StatsPage',
  component: StatsPage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: 'Empty State',
  render: () => {
    const scope = fork();
    return (
      <Provider value={scope}>
        <StatsPage />
      </Provider>
    );
  },
};

export const WithData: Story = {
  name: 'With Data',
  render: () => {
    const mockEntries: StatEntry[] = [
      {
        start: Date.now() - 3600000,
        end: Date.now() - 1800000,
        time: 1800,
        interval: 1500,
        type: IntervalType.WORK,
      },
      {
        start: Date.now() - 7200000,
        end: Date.now() - 5400000,
        time: 1800,
        interval: 1500,
        type: IntervalType.WORK,
      },
    ];

    const scope = fork({
      values: [
        [statsModel.$statEntriesHistory, mockEntries],
      ],
    });

    return (
      <Provider value={scope}>
        <StatsPage />
      </Provider>
    );
  },
};
