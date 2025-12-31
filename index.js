import { registerRootComponent } from 'expo';

import App from './app';

// Ensure the app is registered whether Metro loads index.js or app.js directly
registerRootComponent(App);

