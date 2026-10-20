import './storybook.css';
import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Reference theme mode',
      toolbar: {
        title: 'Theme',
        icon: 'sun',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    // Same switch brands use: `.dark` on <html> applies dist/tokens.dark.css.
    (Story, context) => {
      document.documentElement.classList.toggle('dark', context.globals.theme === 'dark');
      return Story();
    },
  ],
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: { order: ['Introduction', 'Foundations', ['Colour', 'Typography', 'Spacing', 'Shape'], 'Contract'] },
    },
  },
};
export default preview;
