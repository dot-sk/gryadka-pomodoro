import type { Meta, StoryObj } from '@storybook/react';
import { UpdatePage } from './UpdatePage';
import { fork } from 'effector';
import { Provider } from 'effector-react';
import {
  $updateStatus,
  $updateInfo,
  $downloadProgress,
  UpdateStatus,
} from '../../features/updater/model';

const meta: Meta<typeof UpdatePage> = {
  title: 'Pages/UpdatePage',
  component: UpdatePage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UpdateAvailable: Story = {
  name: 'Update Available',
  render: () => {
    const scope = fork({
      values: [
        [$updateStatus, UpdateStatus.AVAILABLE],
        [$updateInfo, { version: '0.2.0' }],
        [$downloadProgress, null],
      ],
    });
    return (
      <Provider value={scope}>
        <UpdatePage />
      </Provider>
    );
  },
};

export const Downloading25: Story = {
  name: 'Downloading (25%)',
  render: () => {
    const scope = fork({
      values: [
        [$updateStatus, UpdateStatus.DOWNLOADING],
        [$updateInfo, { version: '0.2.0' }],
        [$downloadProgress, { percent: 25, transferred: 2500000, total: 10000000 }],
      ],
    });
    return (
      <Provider value={scope}>
        <UpdatePage />
      </Provider>
    );
  },
};

export const Downloading50: Story = {
  name: 'Downloading (50%)',
  render: () => {
    const scope = fork({
      values: [
        [$updateStatus, UpdateStatus.DOWNLOADING],
        [$updateInfo, { version: '0.2.0' }],
        [$downloadProgress, { percent: 50, transferred: 5000000, total: 10000000 }],
      ],
    });
    return (
      <Provider value={scope}>
        <UpdatePage />
      </Provider>
    );
  },
};

export const Downloading90: Story = {
  name: 'Downloading (90%)',
  render: () => {
    const scope = fork({
      values: [
        [$updateStatus, UpdateStatus.DOWNLOADING],
        [$updateInfo, { version: '0.2.0' }],
        [$downloadProgress, { percent: 90, transferred: 9000000, total: 10000000 }],
      ],
    });
    return (
      <Provider value={scope}>
        <UpdatePage />
      </Provider>
    );
  },
};

export const Downloaded: Story = {
  name: 'Downloaded (Ready to Install)',
  render: () => {
    const scope = fork({
      values: [
        [$updateStatus, UpdateStatus.DOWNLOADED],
        [$updateInfo, { version: '0.2.0' }],
        [$downloadProgress, null],
      ],
    });
    return (
      <Provider value={scope}>
        <UpdatePage />
      </Provider>
    );
  },
};

export const LongVersionNumber: Story = {
  name: 'Long Version Number',
  render: () => {
    const scope = fork({
      values: [
        [$updateStatus, UpdateStatus.AVAILABLE],
        [$updateInfo, { version: '1.22.333-beta.4444+build.55555' }],
        [$downloadProgress, null],
      ],
    });
    return (
      <Provider value={scope}>
        <UpdatePage />
      </Provider>
    );
  },
};
