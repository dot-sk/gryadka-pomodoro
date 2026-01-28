import type { Meta, StoryObj } from '@storybook/react';
import { TimerPage } from './TimerPage';
import { fork } from 'effector';
import { Provider } from 'effector-react';
import { countdownModel } from '../../entitites/countdown';
import { CountdownState } from '../../entitites/countdown/constants';

const meta: Meta<typeof TimerPage> = {
  title: 'Pages/TimerPage',
  component: TimerPage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InitialState: Story = {
  name: 'Initial State (Interval Selector)',
  render: () => {
    const scope = fork({
      values: [
        [countdownModel.$time, 1499],
        [countdownModel.$currentInterval, 1500],
        [countdownModel.$countdownState, CountdownState.PAUSED],
      ],
    });
    return (
      <Provider value={scope}>
        <TimerPage />
      </Provider>
    );
  },
};

export const RunningState: Story = {
  name: 'Running State',
  render: () => {
    const scope = fork({
      values: [
        [countdownModel.$time, 1499],
        [countdownModel.$currentInterval, 1500],
        [countdownModel.$countdownState, CountdownState.RUNNING],
      ],
    });
    return (
      <Provider value={scope}>
        <TimerPage />
      </Provider>
    );
  },
};

export const PausedState: Story = {
  name: 'Paused State',
  render: () => {
    const scope = fork({
      values: [
        [countdownModel.$time, 900],
        [countdownModel.$currentInterval, 1500],
        [countdownModel.$countdownState, CountdownState.PAUSED],
      ],
    });
    return (
      <Provider value={scope}>
        <TimerPage />
      </Provider>
    );
  },
};

export const SuccessState: Story = {
  name: 'Success State',
  render: () => {
    const scope = fork({
      values: [
        [countdownModel.$time, 0],
        [countdownModel.$currentInterval, 1500],
        [countdownModel.$countdownState, CountdownState.SUCCESS],
      ],
    });
    return (
      <Provider value={scope}>
        <TimerPage />
      </Provider>
    );
  },
};

export const LongTimerHHMMSS: Story = {
  name: 'Long Timer (HH:MM:SS Format)',
  render: () => {
    const scope = fork({
      values: [
        [countdownModel.$time, 7199], // 1:59:59
        [countdownModel.$currentInterval, 7200], // 2 hours
        [countdownModel.$countdownState, CountdownState.RUNNING],
      ],
    });
    return (
      <Provider value={scope}>
        <TimerPage />
      </Provider>
    );
  },
};
