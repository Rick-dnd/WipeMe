// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://wipeme.cc',

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/app') && !page.includes('/api/'),
    }),
  ],

  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  security: {
    checkOrigin: true,
  },

  vite: {
    plugins: [tailwindcss()]
  }
});