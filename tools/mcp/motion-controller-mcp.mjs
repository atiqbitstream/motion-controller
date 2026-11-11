#!/usr/bin/env node
// Motion Controller MCP server.
//
// An MCP (Model Context Protocol) server that lets an AI coding assistant — Claude, Cursor, VS Code, ChatGPT and the rest —
// help a developer add webcam motion control to a game. It exposes read and compute tools only: it inspects the runtime
// installed on this machine, lists the motions it can recognise, writes and checks a `motionctl-actionmap/1` action map,
// and points at the licence request. It holds no secret, issues no licence, and changes nothing outside the chat: a
// production licence still comes from the public request form (github.com/atiqbitstream/motion-controller).
//
// Dependency-free: it speaks the MCP stdio protocol (newline-delimited JSON-RPC 2.0) itself, so it runs with just Node 18+
// and no install. Add it to a client with, for example:
//   claude mcp add motion-controller -- node /path/to/motion-controller-mcp.mjs
// or an mcpServers entry: { "command": "node", "args": ["/path/to/motion-controller-mcp.mjs"] }
//
// Everything it knows about the capabilities is in data/capabilities.json beside it, generated from the runtime; the action
// map schema is data/actionmap.schema.json. Regenerate them from a new runtime to teach it new motions.
import { createConnection } from 'node:net';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = { name: 'motion-controller', version: '0.1.0' };
const DEFAULT_PROTOCOL = '2025-06-18';
const REPO = 'https://github.com/atiqbitstream/motion-controller';

const read = (p) => JSON.parse(readFileSync(join(HERE, 'data', p), 'utf8'));
const CAPS = read('capabilities.json').capabilities;
const BY_ID = new Map(CAPS.map((c) => [c.id, c]));

const log = (...a) => process.stderr.write(`motion-controller-mcp: ${a.join(' ')}\n`);

// --- what the runtime looks like on this machine -----------------------------------------------------------------

function discovery() {
  const path = join(process.env.MOTIONCTL_HOME || join(homedir(), '.motionctl'), 'runtime.json');
  try { return { path, ...JSON.parse(readFileSync(path, 'utf8')) }; } catch { return { path, missing: true }; }
}

function tcpOpen(port, timeout = 800) {
  return new Promise((resolve) => {
    const s = createConnection({ host: '127.0.0.1', port }, () => { s.destroy(); resolve(true); });
    s.on('error', () => resolve(false));
    s.setTimeout(timeout, () => { s.destroy(); resolve(false); });
  });
}

async function checkRuntime() {
  const d = discovery();
  if (d.missing) {
    return { installed: 'unknown', running: false,
      advice: `No runtime has run on this machine (no ${d.path}). Install the Motion Controller Runtime from ${REPO}/releases/latest, then start it. It runs in the background (a tray or menu-bar icon).` };
  }
  const port = Number(d.port) || 0;
  const running = port > 0 ? await tcpOpen(port) : false;
  return {
    running,
    port: port || null,
    discoveryPath: d.path,
    advice: running
      ? 'The runtime is running and listening. A game can connect. Pick the camera from its tray or menu-bar icon.'
      : `A runtime has run before but is not listening now. Start the Motion Controller Runtime (tray or menu-bar icon), or reinstall from ${REPO}/releases/latest.`,
  };
}

// --- capabilities ------------------------------------------------------------------------------------------------

const slimCap = (c) => ({
  id: c.id, version: c.version, title: c.title, family: c.family, tier: c.tier,
  outputs: [...c.emits.map((e) => ({ output: e.output, as: e.phases.includes('performed') && e.phases.length === 1 ? 'event' : 'button', phases: e.phases, triggers: e.triggers })),
            ...c.provides.map((p) => ({ output: p.output, as: p.kind === 'point' ? 'axis2' : 'value', kind: p.kind }))],
  hands: c.requires.hands, framing: c.requires.framing,
  calibrated: !!c.calibration,
});

function listCapabilities({ family, query } = {}) {
  let list = CAPS;
  if (family) list = list.filter((c) => c.family === family);
  if (query) { const q = String(query).toLowerCase(); list = list.filter((c) => (c.id + ' ' + c.title + ' ' + c.family).toLowerCase().includes(q)); }
  return { count: list.length, families: [...new Set(CAPS.map((c) => c.family))].sort(), capabilities: list.map(slimCap) };
}

function describeCapability({ id }) {
  const c = BY_ID.get(id);
  if (!c) return { error: `no capability "${id}"`, didYouMean: CAPS.map((x) => x.id).filter((x) => x.startsWith(String(id).split('.')[0])).slice(0, 6) };
  return c;
}

// --- action map: build and check ---------------------------------------------------------------------------------

const ID_RE = /^[a-z]+(\.[a-zA-Z]+(-[a-zA-Z]+)*)+$/;
const KINDS = new Set(['button', 'event', 'axis2']);

/** The output kinds a given action kind may bind to, by what the capability output is. */
function outputMatchesKind(cap, output, kind) {
  const emit = cap.emits.find((e) => e.output === output);
  const prov = cap.provides.find((p) => p.output === output);
  if (!emit && !prov) return { ok: false, reason: `"${cap.id}" has no output "${output}". It has: ${[...cap.emits.map((e) => e.output), ...cap.provides.map((p) => p.output)].join(', ') || '(none)'}` };
  if (prov) return prov.kind === 'point'
    ? { ok: kind === 'axis2', reason: kind === 'axis2' ? '' : `"${output}" is a position: bind it to an axis2 action.` }
    : { ok: kind === 'axis2', reason: '' };
  // An emitted output: performed-only is a one-shot (event); started/ended is held (button).
  const oneShot = emit.phases.length === 1 && emit.phases[0] === 'performed';
  if (oneShot) return { ok: kind === 'event' || kind === 'button', reason: kind === 'axis2' ? `"${output}" is a one-shot event: bind it to an event (or button) action, not axis2.` : '' };
  return { ok: kind === 'button' || kind === 'event', reason: kind === 'axis2' ? `"${output}" starts and ends (a hold): bind it to a button action, not axis2.` : '' };
}

function createActionMap({ appId, actions, contexts }) {
  const problems = [];
  if (!appId || !/^[a-z0-9]+(\.[a-z0-9-]+)+$/i.test(appId)) problems.push('appId must be reverse-domain style, e.g. com.yourstudio.yourgame');
  if (!Array.isArray(actions) || actions.length === 0) problems.push('give at least one action: { name, kind, capability, output? }');
  const used = new Set();
  const built = [];
  for (const a of actions || []) {
    if (!a || !a.name) { problems.push('an action has no name'); continue; }
    if (!KINDS.has(a.kind)) { problems.push(`action "${a.name}": kind must be button, event or axis2`); continue; }
    const cap = BY_ID.get(a.capability);
    if (!cap) { problems.push(`action "${a.name}": no capability "${a.capability}"`); continue; }
    const output = a.output || cap.emits[0]?.output || cap.provides[0]?.output;
    if (!output) { problems.push(`action "${a.name}": "${a.capability}" emits nothing to bind`); continue; }
    const m = outputMatchesKind(cap, output, a.kind);
    if (!m.ok) { problems.push(`action "${a.name}": ${m.reason}`); continue; }
    used.add(cap.id);
    built.push({ name: a.name, kind: a.kind, from: [{ capability: `${cap.id}@^${cap.version}`, output }] });
  }
  if (problems.length) return { ok: false, problems };
  const requires = [...used];
  const map = {
    schema: 'motionctl-actionmap/1',
    appId,
    requires,
    actions: built,
    contexts: Array.isArray(contexts) && contexts.length
      ? contexts.map((c) => ({ name: c.name, capabilities: c.capabilities }))
      : [{ name: 'play', capabilities: requires }],
    initialContext: Array.isArray(contexts) && contexts.length ? contexts[0].name : 'play',
  };
  const check = validateActionMap({ actionMap: map });
  return check.ok ? { ok: true, actionMap: map, note: 'Save this as a .json file, set it as the action map in the Unity bridge (or pass it to the C session), and request a licence for its appId.' }
                  : { ok: false, problems: check.problems, actionMap: map };
}

function validateActionMap({ actionMap }) {
  let m = actionMap;
  if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { return { ok: false, problems: [`not valid JSON: ${e.message}`] }; } }
  const p = [];
  if (!m || typeof m !== 'object') return { ok: false, problems: ['the action map must be a JSON object'] };
  if (m.schema !== 'motionctl-actionmap/1') p.push('schema must be "motionctl-actionmap/1"');
  if (!m.appId || !/^[a-z0-9]+(\.[a-z0-9-]+)+$/i.test(m.appId)) p.push('appId must be reverse-domain style, e.g. com.yourstudio.yourgame');
  if (!Array.isArray(m.actions) || m.actions.length === 0) p.push('actions must be a non-empty array');
  const names = new Set();
  for (const a of m.actions || []) {
    if (!a?.name) { p.push('an action has no name'); continue; }
    if (names.has(a.name)) p.push(`two actions named "${a.name}"`);
    names.add(a.name);
    if (!KINDS.has(a.kind)) p.push(`action "${a.name}": kind must be button, event or axis2`);
    for (const b of a.from || []) {
      const id = String(b.capability || '').replace(/@\^?\d+$/, '');
      if (!ID_RE.test(id)) { p.push(`action "${a.name}": "${b.capability}" is not a capability id`); continue; }
      const cap = BY_ID.get(id);
      if (!cap) { p.push(`action "${a.name}": this runtime has no "${id}"`); continue; }
      const match = outputMatchesKind(cap, b.output, a.kind);
      if (!match.ok) p.push(`action "${a.name}": ${match.reason}`);
    }
    if (!Array.isArray(a.from) || a.from.length === 0) p.push(`action "${a.name}": needs at least one binding in "from"`);
  }
  const declared = new Set([...(m.requires || []), ...(m.optional || [])].map((r) => String(r).replace(/@\^?\d+$/, '')));
  for (const c of m.contexts || []) for (const r of c.capabilities || []) {
    const id = String(r).replace(/@\^?\d+$/, '');
    if (!BY_ID.has(id)) p.push(`context "${c.name}" names "${id}", which this runtime does not have`);
  }
  if (!Array.isArray(m.contexts) || m.contexts.length === 0) p.push('contexts must be a non-empty array');
  if (!m.initialContext) p.push('initialContext is required');
  else if (!(m.contexts || []).some((c) => c.name === m.initialContext)) p.push(`initialContext "${m.initialContext}" is not one of the contexts`);
  // A used capability should be declared in requires or optional.
  const usedIds = new Set((m.actions || []).flatMap((a) => (a.from || []).map((b) => String(b.capability || '').replace(/@\^?\d+$/, ''))));
  for (const id of usedIds) if (id && !declared.has(id)) p.push(`"${id}" is used by an action but not listed in requires or optional`);
  return p.length ? { ok: false, problems: p } : { ok: true, note: 'Valid against motionctl-actionmap/1 and this runtime\'s capabilities.' };
}

function licensingHelp({ appId, capabilities }) {
  const caps = (capabilities || []).join(', ');
  const url = `${REPO}/issues/new?template=licence-request.yml`;
  return {
    appId: appId || null,
    howTo: [
      `A game needs a licence (entitlement) for its appId. During early access it is free and lasts 10 years.`,
      `1. Choose an appId, e.g. com.yourstudio.yourgame. It must match the action map's appId${appId ? ` (yours: ${appId})` : ''}.`,
      `2. Request it at ${url}${caps ? ` with the capabilities you use: ${caps}` : ''}.`,
      `3. You receive a file named <appId>.entitlement.json. In Unity set it as the bridge's Entitlement; in C pass its bytes as mc_config.entitlement.`,
    ],
    requestUrl: url,
    note: 'This server cannot issue a licence; only the project owner can, through the request above.',
  };
}

// --- the tools ---------------------------------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'check_runtime',
    description: 'Check whether the Motion Controller Runtime is installed and running on THIS machine, and whether a game could connect right now. Use this first when a developer is setting up or when a game cannot reach the runtime. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () => checkRuntime(),
  },
  {
    name: 'list_capabilities',
    description: 'List the motions the runtime can recognise (aim, trigger, punch, kick, flight, climb, and more), each with its outputs and how to bind them. Use this to decide what a game can use before writing an action map. Optional "family" (e.g. weapon, pointer, locomotion) or "query" text narrows it. Read-only.',
    inputSchema: { type: 'object', properties: { family: { type: 'string' }, query: { type: 'string' } }, additionalProperties: false },
    run: (a) => listCapabilities(a),
  },
  {
    name: 'describe_capability',
    description: 'Full detail of one capability by id (e.g. pistol.aim): its outputs, phases, fields, framing and whether it needs calibration. Use after list_capabilities to understand one before binding it. Read-only.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'A capability id, e.g. pistol.trigger' } }, required: ['id'], additionalProperties: false },
    run: (a) => describeCapability(a),
  },
  {
    name: 'create_action_map',
    description: 'Write a valid motionctl-actionmap/1 action map from a game\'s actions. Input: appId (reverse-domain), and actions as [{ name, kind (button|event|axis2), capability, output? }]. It derives "requires", adds a default context, and validates the result. Use this to generate the file a game loads. Compute-only; writes nothing to disk.',
    inputSchema: { type: 'object', properties: {
      appId: { type: 'string', description: 'The game id, e.g. com.yourstudio.yourgame' },
      actions: { type: 'array', items: { type: 'object', properties: {
        name: { type: 'string' }, kind: { enum: ['button', 'event', 'axis2'] },
        capability: { type: 'string' }, output: { type: 'string', description: 'Optional; defaults to the capability\'s first output.' },
      }, required: ['name', 'kind', 'capability'], additionalProperties: false } },
      contexts: { type: 'array', description: 'Optional. [{ name, capabilities: [id,...] }]. Omit for one "play" context with every capability.', items: { type: 'object' } },
    }, required: ['appId', 'actions'], additionalProperties: false },
    run: (a) => createActionMap(a),
  },
  {
    name: 'validate_action_map',
    description: 'Check an action map a developer already has against the motionctl-actionmap/1 schema and this runtime\'s capabilities, and explain every problem. Pass "actionMap" as the JSON object or a JSON string. Use before shipping, or when a session is refused with INVALID_ACTION_MAP. Read-only.',
    inputSchema: { type: 'object', properties: { actionMap: { description: 'The action map, as a JSON object or a JSON string.' } }, required: ['actionMap'], additionalProperties: false },
    run: (a) => validateActionMap(a),
  },
  {
    name: 'licensing_help',
    description: 'Explain how to get the free licence a game needs and give the pre-filled request link. Use when a developer is ready to ship or sees MC_ERR_ENTITLEMENT / UNAUTHORIZED. Optional appId and capabilities tailor the steps. Read-only; this server cannot issue a licence.',
    inputSchema: { type: 'object', properties: { appId: { type: 'string' }, capabilities: { type: 'array', items: { type: 'string' } } }, additionalProperties: false },
    run: (a) => licensingHelp(a),
  },
];
const TOOL = new Map(TOOLS.map((t) => [t.name, t]));

// --- the MCP stdio protocol (newline-delimited JSON-RPC 2.0) -----------------------------------------------------

function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }
const result = (id, r) => send({ jsonrpc: '2.0', id, result: r });
const error = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') {
    const pv = params?.protocolVersion || DEFAULT_PROTOCOL;
    return result(id, { protocolVersion: pv, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER,
      instructions: 'Tools to add webcam motion control to a game: check the runtime, list and describe the motions, write and validate an action map, and get a licence. Read/compute only; no secrets, issues no licence.' });
  }
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return; // notifications: no reply
  if (method === 'ping') return result(id, {});
  if (method === 'tools/list') return result(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  if (method === 'tools/call') {
    const t = TOOL.get(params?.name);
    if (!t) return error(id, -32602, `no tool "${params?.name}"`);
    try {
      const out = await t.run(params.arguments || {});
      const isError = !!(out && (out.error || out.ok === false));
      return result(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 1) }], isError });
    } catch (e) {
      return result(id, { content: [{ type: 'text', text: `tool "${t.name}" failed: ${e instanceof Error ? e.message : String(e)}` }], isError: true });
    }
  }
  if (id !== undefined) return error(id, -32601, `unknown method "${method}"`);
}

const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
  const s = line.trim();
  if (!s) return;
  let msg; try { msg = JSON.parse(s); } catch { return log('ignored a line that was not JSON'); }
  Promise.resolve(handle(msg)).catch((e) => { log('handler error:', e?.message || e); if (msg?.id !== undefined) error(msg.id, -32603, 'internal error'); });
});
rl.on('close', () => process.exit(0));
log(`ready: ${TOOLS.length} tools, ${CAPS.length} capabilities`);
