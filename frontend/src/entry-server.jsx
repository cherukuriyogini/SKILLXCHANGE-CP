/**
 * entry-server.jsx — Server-Side Rendering (SSR) Entry
 * ===================================================
 * Pre-renders the React component tree into an HTML string on the server.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';

export function render(url, context = {}) {
  const html = renderToString(
    <div id="ssr-root">
      <div className="ssr-shell">
        <h1>SkillXchange — Peer-to-Peer Learning Platform</h1>
        <p>Loading application resources...</p>
      </div>
    </div>
  );

  return { html };
}
