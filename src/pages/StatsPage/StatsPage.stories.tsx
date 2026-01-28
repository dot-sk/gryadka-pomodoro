import type { Meta, StoryObj } from '@storybook/react';
import { StatsPage } from './StatsPage';
import { fork } from 'effector';
import { Provider } from 'effector-react';
import { statsModel } from '../../features/stats';
import { createStatEntries } from '../../shared/testing';
import { within, waitFor, expect, screen, fireEvent } from '@storybook/test';

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
    const mockEntries = createStatEntries(2, (index) => ({
      start: Date.now() - (index + 1) * 3600000,
      end: Date.now() - (index + 1) * 1800000,
      time: 1800,
      interval: 1500,
    }));

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

export const WithTooltip: Story = {
  name: 'With Tooltip',
  render: () => {
    // Создаем больше данных для демонстрации тултипа
    const mockEntries = createStatEntries(20, (index) => ({
      start: Date.now() - (index + 1) * 3600000,
      end: Date.now() - (index + 1) * 1800000,
      time: 3600 + index * 1000, // Варьируем время для разной интенсивности
      interval: 1500,
    }));

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Ждем пока компонент отрендерится
    await waitFor(
      () => {
        const heatmap = canvas.getByTestId('heatmap-activity');
        expect(heatmap).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Небольшая задержка для полной отрисовки
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Находим первую ячейку с данными (не пустую)
    const daySquares = canvas.getAllByTestId('heatmap-day-square');
    const squareWithData = daySquares.find(
      (square) => {
        const intensity = square.getAttribute('data-intensity');
        return intensity && intensity !== '0';
      }
    );

    if (squareWithData) {
      // Получаем реальные координаты элемента на странице
      const rect = squareWithData.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;

      fireEvent.mouseOver(squareWithData, {
        clientX,
        clientY,
      });

      // Небольшая задержка для отрисовки тултипа
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Проверяем, что тултип появился (ищем во всем документе, т.к. position: fixed)
      await waitFor(
        () => {
          const tooltip = screen.queryByTestId('tooltip');
          expect(tooltip).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    }
  },
};
