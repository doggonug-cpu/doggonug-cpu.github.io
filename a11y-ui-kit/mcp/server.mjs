#!/usr/bin/env node
/**
 * A11yKit MCP server — stdio transport, zero dependencies.
 *
 * Speaks JSON-RPC 2.0 over stdin/stdout, one JSON object per line, as the
 * Model Context Protocol stdio transport requires. Reads one local data file
 * (catalog.json one level up, or components.json next to this file). No network
 * requests, no file writes, no API keys.
 *
 * Tools: list_components, get_component, get_ai_prompt, check_wcag_checklist
 *
 * Usage:  node server.mjs            (MCP client launches it)
 *         node server.mjs --selftest (prints 5 checks and exits)
 */

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER_INFO = { name: 'a11y-ui-kit', version: '1.0.0' };
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SITE = 'https://doggonug-cpu.github.io/a11y-ui-kit/';

/* ------------------------------------------------------------------ data */

function loadCatalog() {
  const candidates = [join(HERE, '..', 'catalog.json'), join(HERE, 'components.json')];
  const errors = [];
  for (const path of candidates) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'));
      if (data && data.components) { return data; }
      errors.push(path + ': no components key');
    } catch (error) {
      errors.push(path + ': ' + error.message);
    }
  }
  throw new Error('Could not load component data. Tried: ' + errors.join(' | '));
}

let CATALOG;
try {
  CATALOG = loadCatalog();
} catch (error) {
  process.stderr.write('[a11y-ui-kit] ' + error.message + '\n');
}

const COMPONENTS = CATALOG ? CATALOG.components : {};

/* ------------------------------------------------------------------ wcag */

const CHECKS = {
  '1.1.1': 'Every image, chart and icon-only control has a text alternative; decorative graphics are aria-hidden. Verify with a screen reader and with images hidden.',
  '1.2.1': 'Any audio-only content has an equivalent text alternative on screen. Play the page muted and confirm nothing is lost.',
  '1.3.1': 'Structure survives without CSS: headings, labels tied with for/id, real lists, fieldsets and legends.',
  '1.4.1': 'Set the page to grayscale. Every state (selected, error, taken, done) must still be distinguishable by icon, text, weight or underline.',
  '1.4.4': 'Zoom the browser to 200%. Text grows, no content clips, and no horizontal scroll appears at 320px.',
  '1.4.5': 'All text is real text, not baked into an image.',
  '1.4.6': 'Measure each foreground/background pair: normal text at least 7:1, large text (24px or 19px bold) at least 4.5:1.',
  '1.4.8': 'Lines stay under about 80 characters, line height is at least 1.5, text is not justified, and the user can pick their own colours.',
  '1.4.11': 'Borders, focus rings and state indicators reach 3:1 against their adjacent colours.',
  '2.1.1': 'Complete the whole flow with Tab, Shift+Tab, arrows, Space, Enter and Escape only. No mouse.',
  '2.4.3': 'Tab through in a logical order; inside a dialog focus stays trapped and returns to the trigger on close.',
  '2.4.7': 'Every control shows a focus indicator at least 2px thick (this kit uses 4px) with an offset, never clipped by overflow.',
  '2.4.8': 'The current step or location is stated in text and marked programmatically with aria-current.',
  '2.5.2': 'Press, drag away, release outside: the action must not fire. Test with a mouse and with a finger.',
  '2.5.5': 'Measure every clickable box: at least 44x44 CSS px. This kit targets 48px minimum and 56-64px for primary actions.',
  '3.1.2': 'Each phrase in another language carries the right lang attribute; a screen reader should switch voice.',
  '3.3.1': 'Submit an invalid form. The error names the field and the problem in text, not colour alone.',
  '3.3.2': 'Every field has a persistent visible label above it. Placeholders are never the only label.',
  '3.3.3': 'The error message says how to fix the problem ("Enter at least 9 digits"), not only that it failed.',
  '3.3.4': 'Destructive or paid actions can be reviewed, confirmed or reversed. Walk the confirm path end to end.',
  '3.3.6': 'No legal, financial or data-loss action completes without review, confirmation or undo.',
  '4.1.2': 'Inspect each control: accessible name, correct role, and exposed state (aria-pressed / checked / current / expanded).',
  '4.1.3': 'Trigger a status change. It is announced by a live region without moving focus, and it is also visible on screen.',
};

function criteriaFor(item) {
  return (item.wcag || []).map((label) => {
    const code = (label.match(/^\d+(?:\.\d+){2}/) || [''])[0];
    return {
      criterion: label,
      code,
      level: /\(AAA\)/.test(label) ? 'AAA' : /\(AA\)/.test(label) ? 'AA' : 'A',
      manual_check: CHECKS[code] || 'Review this criterion against the component in a browser with a screen reader.',
    };
  });
}

/* ------------------------------------------------------------------ tools */

const TOOLS = [
  {
    name: 'list_components',
    title: 'List A11yKit components',
    description:
      'List the 18 senior-first components with tier (free/pro), WCAG criteria and tags. Filter by tier, tag or keyword. Free components include MIT source; Pro components list the spec only.',
    inputSchema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['all', 'free', 'pro'], default: 'all', description: 'Restrict to free or Pro components.' },
        tag: { type: 'string', description: 'Only components carrying this tag, for example kiosk, care, form, speech.' },
        query: { type: 'string', description: 'Case-insensitive text match on id, name, tags and WCAG criteria.' },
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Maximum number of rows to return.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_component',
    title: 'Get component source',
    description:
      'Return one component: plain HTML/CSS/JS source, a React version, WCAG criteria, accessibility notes and labels. Pro components return the spec and a lock notice instead of source.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Component id from list_components, for example "big-action-button".' },
        include_code: { type: 'boolean', default: true, description: 'Set false to get only metadata, criteria and notes.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_ai_prompt',
    title: 'Get an implementation prompt',
    description:
      'Return a paste-ready implementation prompt for Claude Code, Cursor, Lovable or a generic agent, in English or Korean. Pro components return a lock notice.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Component id.' },
        target: { type: 'string', enum: ['claude-code', 'cursor', 'lovable', 'generic'], default: 'generic' },
        language: { type: 'string', enum: ['en', 'ko'], default: 'en' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'check_wcag_checklist',
    title: 'Get a WCAG manual checklist',
    description:
      'Return the WCAG criteria that apply to a component, each with the manual check a human must run and the component-specific accessibility notes.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Component id.' },
        level: { type: 'string', enum: ['all', 'aaa'], default: 'all', description: 'Return all criteria or only AAA ones.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

/* --------------------------------------------------------------- helpers */

const ok = (payload) => ({
  content: [{ type: 'text', text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2) }],
});

const toolError = (message, extra) => ({
  isError: true,
  content: [{ type: 'text', text: message + (extra ? '\n\n' + (typeof extra === 'string' ? extra : JSON.stringify(extra, null, 2)) : '') }],
});

function findComponent(id) {
  return COMPONENTS[String(id || '').trim()];
}

function nameOf(item, language = 'en') {
  return (item.name && (item.name[language] || item.name.en)) || item.id;
}

function lockedPayload(item, language = 'en') {
  return {
    id: item.id,
    tier: 'pro',
    locked: true,
    name: nameOf(item, language),
    summary: item.summary ? item.summary[language] || item.summary.en : '',
    wcag: item.wcag,
    spec: item.spec ? item.spec[language] || item.spec.en : [],
    notice:
      'This component is Pro. Source code and the Pro MCP payload are released to Pro seats only. ' +
      'Preview, pricing and the early-access list: ' + SITE + '#pricing',
  };
}

const TARGET_HEAD = {
  'claude-code': 'You are implementing this component in a project inside Claude Code. Read the existing files first, match their conventions, and make only the edits needed for this component.',
  cursor: 'You are implementing this component in a project inside Cursor. Match the existing design tokens and file structure; do not rewrite unrelated files.',
  lovable: 'Create this as a single self-contained React component in Lovable, with inline styles, no external libraries and no assets.',
  generic: 'Implement this component in the current project, matching its existing conventions.',
};

/* --------------------------------------------------------------- handlers */

function listComponents(args = {}) {
  const tier = args.tier || 'all';
  const tag = (args.tag || '').toLowerCase();
  const query = (args.query || '').toLowerCase();
  const limit = args.limit || 50;

  let items = Object.values(COMPONENTS);
  if (tier === 'free' || tier === 'pro') { items = items.filter((item) => item.tier === tier); }
  if (tag) { items = items.filter((item) => (item.tags || []).some((value) => value.toLowerCase() === tag)); }
  if (query) {
    items = items.filter((item) => {
      const haystack = [item.id, item.name && item.name.en, item.name && item.name.ko, (item.tags || []).join(' '), (item.wcag || []).join(' ')]
        .join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  const rows = items.slice(0, limit).map((item) => ({
    id: item.id,
    tier: item.tier,
    name: item.name ? item.name.en : item.id,
    name_ko: item.name ? item.name.ko : undefined,
    tags: item.tags,
    wcag: item.wcag,
    summary: item.summary ? item.summary.en : '',
    code_available: Boolean(item.code),
  }));

  return ok({
    total_matched: items.length,
    returned: rows.length,
    catalog: { name: CATALOG.name, version: CATALOG.version, counts: CATALOG.component_count, site: SITE },
    components: rows,
  });
}

function getComponent(args = {}) {
  const item = findComponent(args.id);
  if (!item) {
    return toolError('Unknown component id: ' + JSON.stringify(args.id) + '. Call list_components to see valid ids.');
  }
  if (item.tier === 'pro' || !item.code) {
    return ok(lockedPayload(item));
  }
  const includeCode = args.include_code !== false;
  const payload = {
    id: item.id,
    tier: item.tier,
    name: item.name,
    tags: item.tags,
    wcag: item.wcag,
    summary: item.summary,
    accessibility_notes: item.notes ? item.notes.en : [],
    usage:
      'Paste code.html into an empty .html file to run it as-is, or adapt code.react into a single-file React component. ' +
      'The free components are MIT licensed.',
  };
  if (includeCode) { payload.code = item.code; }
  payload.checklist = criteriaFor(item);
  return ok(payload);
}

function getAiPrompt(args = {}) {
  const item = findComponent(args.id);
  if (!item) {
    return toolError('Unknown component id: ' + JSON.stringify(args.id) + '. Call list_components to see valid ids.');
  }
  const language = args.language === 'ko' ? 'ko' : 'en';
  if (item.tier === 'pro' || !item.prompt) {
    return ok(lockedPayload(item, language));
  }
  const target = TARGET_HEAD[args.target] ? args.target : 'generic';
  const head = TARGET_HEAD[target];
  const prompt = item.prompt[language] || item.prompt.en;
  return ok({
    id: item.id,
    target,
    language,
    prompt: head + '\n\n' + prompt,
    accessibility_notes: item.notes ? item.notes.en : [],
    verify_with: 'check_wcag_checklist',
  });
}

function checkWcagChecklist(args = {}) {
  const item = findComponent(args.id);
  if (!item) {
    return toolError('Unknown component id: ' + JSON.stringify(args.id) + '. Call list_components to see valid ids.');
  }
  let criteria = criteriaFor(item);
  if (args.level === 'aaa') { criteria = criteria.filter((entry) => entry.level === 'AAA'); }
  return ok({
    id: item.id,
    name: nameOf(item),
    tier: item.tier,
    note: 'These are manual checks. Automated tools catch only part of WCAG; run each check in a browser with a screen reader.',
    criteria,
    accessibility_notes: item.notes ? item.notes.en : [],
  });
}

const HANDLERS = {
  list_components: listComponents,
  get_component: getComponent,
  get_ai_prompt: getAiPrompt,
  check_wcag_checklist: checkWcagChecklist,
};

/* --------------------------------------------------------------- protocol */

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function replyError(id, code, message, data) {
  send({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } });
}

function handle(message) {
  const { id, method, params } = message || {};
  const isNotification = id === undefined || id === null;

  if (!method) {
    if (!isNotification) { replyError(id, -32600, 'Invalid Request: method is required'); }
    return;
  }

  if (method === 'initialize') {
    const requested = params && params.protocolVersion;
    const protocolVersion = PROTOCOLS.includes(requested) ? requested : PROTOCOLS[0];
    reply(id, {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER_INFO,
      instructions:
        'A11yKit: senior-first, WCAG AAA-minded UI components. Call list_components first, then get_component for source, ' +
        'get_ai_prompt for an implementation prompt, and check_wcag_checklist for the manual accessibility checks. ' +
        'Free components are MIT; Pro components return a lock notice. Everything runs locally.',
    });
    return;
  }

  if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
    return; // notifications never get a response
  }

  if (method === 'ping') { reply(id, {}); return; }

  if (method === 'tools/list') {
    reply(id, { tools: TOOLS });
    return;
  }

  if (method === 'tools/call') {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    const handler = HANDLERS[name];
    if (!handler) {
      replyError(id, -32602, 'Unknown tool: ' + String(name));
      return;
    }
    try {
      reply(id, handler(args));
    } catch (error) {
      reply(id, toolError('Tool failed: ' + (error && error.message ? error.message : String(error))));
    }
    return;
  }

  if (method === 'resources/list') { reply(id, { resources: [] }); return; }
  if (method === 'prompts/list') { reply(id, { prompts: [] }); return; }
  if (method === 'logging/setLevel') { reply(id, {}); return; }

  if (!isNotification) {
    replyError(id, -32601, 'Method not found: ' + method);
  }
}

function serve() {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', (line) => {
    const text = line.trim();
    if (!text) { return; }
    let message;
    try {
      message = JSON.parse(text);
    } catch (error) {
      replyError(null, -32700, 'Parse error');
      return;
    }
    if (Array.isArray(message)) {
      message.forEach(handle);
      return;
    }
    handle(message);
  });
  rl.on('close', () => { process.exit(0); });
}

/* --------------------------------------------------------------- selftest */

function selftest() {
  const results = [];
  const check = (name, pass, detail) => results.push({ name, pass, detail });

  check('catalog loaded', Boolean(CATALOG) && Object.keys(COMPONENTS).length === 18, Object.keys(COMPONENTS).length + ' components');
  const free = Object.values(COMPONENTS).filter((item) => item.tier === 'free');
  const pro = Object.values(COMPONENTS).filter((item) => item.tier === 'pro');
  check('10 free with code', free.length === 10 && free.every((item) => item.code && item.code.html && item.code.react), free.length + ' free');
  check('8 pro locked', pro.length === 8 && pro.every((item) => !item.code), pro.length + ' pro');

  const listed = JSON.parse(listComponents({ tier: 'free' }).content[0].text);
  check('list_components filter', listed.returned === 10 && listed.components.every((row) => row.code_available), listed.returned + ' rows');

  const one = JSON.parse(getComponent({ id: 'big-action-button' }).content[0].text);
  check('get_component returns source', one.code.html.includes('<!doctype html>') && one.code.react.includes('export default'));

  const locked = JSON.parse(getComponent({ id: 'hold-to-pay' }).content[0].text);
  check('pro source withheld', locked.locked === true && !('code' in locked));

  const prompt = JSON.parse(getAiPrompt({ id: 'senior-form', target: 'claude-code' }).content[0].text);
  check('prompt prefixed for Claude Code', prompt.prompt.startsWith('You are implementing this component'));

  const checklist = JSON.parse(checkWcagChecklist({ id: 'number-keypad', level: 'aaa' }).content[0].text);
  check('checklist only AAA', checklist.criteria.length > 0 && checklist.criteria.every((entry) => entry.level === 'AAA'), checklist.criteria.length + ' criteria');

  const unknown = getComponent({ id: 'nope' });
  check('unknown id is a tool error', unknown.isError === true);

  results.forEach((result) => {
    process.stdout.write((result.pass ? 'PASS  ' : 'FAIL  ') + result.name + (result.detail ? '  (' + result.detail + ')' : '') + '\n');
  });
  const failed = results.filter((result) => !result.pass).length;
  process.stdout.write('\n' + (results.length - failed) + ' passed, ' + failed + ' failed\n');
  process.exit(failed ? 1 : 0);
}

/* ------------------------------------------------------------------- run */

if (process.argv.includes('--selftest')) {
  selftest();
} else if (process.argv.includes('--help') || process.argv.includes('-h')) {
  process.stdout.write(
    'A11yKit MCP server\n\n' +
    '  node server.mjs             start the stdio MCP server\n' +
    '  node server.mjs --selftest  run 9 local checks and exit\n\n' +
    'Tools: list_components, get_component, get_ai_prompt, check_wcag_checklist\n' +
    'Data: catalog.json (one level up) or components.json (beside this file)\n' +
    'No network access, no file writes, no API keys.\n'
  );
} else {
  serve();
}
