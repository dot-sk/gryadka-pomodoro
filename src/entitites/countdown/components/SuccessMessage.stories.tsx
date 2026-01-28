import type { Meta, StoryObj } from '@storybook/react';
import { SuccessMessage } from './SuccessMessage';

const meta: Meta<typeof SuccessMessage> = {
  title: 'Countdown/SuccessMessage',
  component: SuccessMessage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'Время сохранено!',
    duration: 2000,
  },
};

export const CustomMessage: Story = {
  args: {
    message: 'Отлично!',
    duration: 3000,
  },
};

export const LongDuration: Story = {
  args: {
    message: 'Время сохранено!',
    duration: 5000,
  },
};
