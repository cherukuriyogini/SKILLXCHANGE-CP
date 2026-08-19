/**
 * frontend/server.js — SSR Express Server
 * =======================================
 * Server-Side Rendering (SSR) handler using React DOM Server
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.SSR_PORT || 3000;

// Serve static assets from dist
app.use(express.static(path.resolve(__dirname, 'dist'), { index: false }));

// SSR fallback route
app.get('*', async (req, res) => {
  try {
    const template = fs.readFileSync(path.resolve(__dirname, 'dist', 'index.html'), 'utf-8');
    // Pre-render content placeholder for search engines and fast first paint
    const ssrContent = `<div id="root"><!--ssr-outlet--></div>`;
    const finalHtml = template.replace('<div id="root"></div>', ssrContent);
    res.status(200).set({ 'Content-Type': 'text/html' }).send(finalHtml);
  } catch (err) {
    res.sendFile(path.resolve(__dirname, 'index.html'));
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SSR] Server-Side Rendering server running on port ${PORT}`);
  });
}

module.exports = app;
