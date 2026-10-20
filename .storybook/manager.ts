import { addons } from 'storybook/manager-api';

// Foundation pages have no args, so the Controls panel would only ever be empty.
addons.setConfig({ showPanel: false });
