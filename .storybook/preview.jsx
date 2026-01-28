import "../src/app/styles/index.css";
import { AppWindowWrapper } from "./AppWindowWrapper";

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#1a1a1a" },
      ],
    },
    appWindow: {
      enabled: true, // по умолчанию включено
    },
  },
  decorators: [
    (Story, context) => {
      const appWindowEnabled = context.parameters.appWindow?.enabled ?? true;

      if (appWindowEnabled) {
        return (
          <AppWindowWrapper>
            <Story />
          </AppWindowWrapper>
        );
      }

      return <Story />;
    },
  ],
};

export default preview;
