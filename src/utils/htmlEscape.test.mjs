import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './htmlEscape.mjs';

test('escapeHtml encodes characters that can break out of HTML text', () => {
  assert.equal(
    escapeHtml(`Kat </title><script>alert("x")</script> & Co`),
    'Kat &lt;/title&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Co'
  );
});

test('escapeHtml preserves normal invoice title text', () => {
  assert.equal(escapeHtml("Ate Maria's Pets"), 'Ate Maria&#39;s Pets');
});
