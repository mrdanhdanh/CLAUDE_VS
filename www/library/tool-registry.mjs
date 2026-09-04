/**
 * Library Tool Registry — P0-2 Harness 2.1 (Lesson 04 Tool Use)
 * Pure ESM, 0 deps, Node + browser compatible.
 * 6 building blocks: Schemas, Execution Logic, Message Handling, Integration, Error Handling, State Management
 * Exports: TOOL_SCHEMAS, TOOL_APPROVAL, validateParams, normalizeArgs, getApprovalMode, checkApproval, toolHistory
 */

export const TOOL_SCHEMAS = [
  {
    name: 'search_library',
    approval_mode: 'never_require',
    description: 'Tìm trong thư viện RAG local (BM25).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Câu truy vấn', minLength: 1 },
        top_k: { type: 'number', description: 'Số kết quả (1-20)', minimum: 1, maximum: 20, default: 5 },
        enabled_only: { type: 'boolean', description: 'Chỉ tìm trong sách đang gắn', default: true }
      },
      required: ['query']
    }
  },
  {
    name: 'search_library_iterative',
    approval_mode: 'never_require',
    description: 'Agentic RAG loop (maker-checker, max 3 vòng).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Câu truy vấn', minLength: 1 },
        top_k: { type: 'number', description: 'Số kết quả (1-20)', minimum: 1, maximum: 20, default: 5 },
        enabled_only: { type: 'boolean', description: 'Chỉ tìm trong sách đang gắn', default: true },
        maxRounds: { type: 'number', description: 'Số vòng tối đa (1-5)', minimum: 1, maximum: 5, default: 3 },
        minHits: { type: 'number', description: 'Số hits tối thiểu', minimum: 1, maximum: 20, default: 2 },
        minScore: { type: 'number', description: 'Score tối thiểu', minimum: 0, maximum: 10, default: 1.0 }
      },
      required: ['query']
    }
  },
  {
    name: 'list_books',
    approval_mode: 'never_require',
    description: 'Liệt kê tất cả sách.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_book',
    approval_mode: 'never_require',
    description: 'Lấy chi tiết 1 sách theo id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID sách', minLength: 1 },
        include_chunks: { type: 'boolean', description: 'Có trả về chunks không', default: false }
      },
      required: ['id']
    }
  },
  {
    name: 'get_status',
    approval_mode: 'never_require',
    description: 'Thống kê thư viện.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  }
];

export const TOOL_APPROVAL = Object.fromEntries(TOOL_SCHEMAS.map(s => [s.name, s.approval_mode]));

// Alias map: canonical -> aliases
const ALIASES = {
  top_k: ['topK', 'top_k'],
  enabled_only: ['enabledOnly', 'enabled_only'],
  maxRounds: ['max_rounds', 'maxRounds'],
  minHits: ['min_hits', 'minHits'],
  minScore: ['min_score', 'minScore'],
  include_chunks: ['includeChunks', 'include_chunks']
};
// Reverse: alias -> canonical
const REVERSE_ALIAS = {};
for (const [canon, alist] of Object.entries(ALIASES)) {
  for (const a of alist) REVERSE_ALIAS[a] = canon;
}
// Also handle direct canonical
for (const canon of Object.keys(ALIASES)) REVERSE_ALIAS[canon] = canon;

function normalizeAliases(args) {
  if (!args || typeof args !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(args)) {
    const canon = REVERSE_ALIAS[k] || k;
    // prefer canonical if already set, else set
    if (!(canon in out)) out[canon] = v;
  }
  return out;
}

function clamp(n, min, max) {
  const num = Number(n);
  if (Number.isNaN(num)) return n;
  return Math.min(max, Math.max(min, num));
}

export function normalizeArgs(toolName, args) {
  const schema = TOOL_SCHEMAS.find(s => s.name === toolName);
  if (!schema) return { ...args };
  const normalized = normalizeAliases(args || {});
  const props = schema.inputSchema.properties || {};
  for (const [key, def] of Object.entries(props)) {
    if (!(key in normalized) && 'default' in def) {
      normalized[key] = def.default;
    }
    // clamp known ranges
    if (key in normalized && typeof normalized[key] === 'number') {
      if (key === 'top_k') normalized[key] = clamp(normalized[key], 1, 20);
      else if (key === 'maxRounds') normalized[key] = clamp(normalized[key], 1, 5);
      else if (key === 'minHits') normalized[key] = clamp(normalized[key], 1, 20);
      else if (key === 'minScore') normalized[key] = clamp(normalized[key], 0, 10);
    }
  }
  return normalized;
}

export function validateParams(toolName, args) {
  const schema = TOOL_SCHEMAS.find(s => s.name === toolName);
  if (!schema) {
    return { valid: false, errors: [`Unknown tool: ${toolName}`], normalized: args || {} };
  }
  const normalizedInput = normalizeAliases(args || {});
  const errors = [];
  const required = schema.inputSchema.required || [];
  const props = schema.inputSchema.properties || {};

  // Check required
  for (const req of required) {
    if (!(req in normalizedInput) || normalizedInput[req] === undefined) {
      errors.push(`missing required: ${req}`);
    }
  }

  // Check types and constraints for provided fields
  for (const [key, val] of Object.entries(normalizedInput)) {
    const def = props[key];
    if (!def) {
      // extra params: ignore (Lesson 04: don't fail on extra)
      continue;
    }
    const expected = def.type;
    const actual = typeof val;
    if (expected === 'string') {
      if (actual !== 'string') {
        errors.push(`wrong type: ${key} must be string (got ${actual})`);
      } else if (def.minLength !== undefined) {
        // For query/id, check trimmed non-empty
        if (key === 'query' || key === 'id') {
          if (String(val).trim().length === 0) {
            errors.push(`${key} must be non-empty string`);
          }
        } else if (String(val).length < def.minLength) {
          errors.push(`${key} must be at least ${def.minLength} chars`);
        }
      }
      if (def.enum && !def.enum.includes(val)) {
        errors.push(`${key} must be one of: ${def.enum.join(', ')}`);
      }
    } else if (expected === 'number') {
      if (actual !== 'number' || Number.isNaN(val)) {
        errors.push(`wrong type: ${key} must be number (got ${actual})`);
      } else {
        // For clampable fields, don't error on out-of-range, will clamp in normalize
        const isClampable = ['top_k', 'maxRounds', 'minHits', 'minScore'].includes(key);
        if (!isClampable) {
          if (def.minimum !== undefined && val < def.minimum) errors.push(`${key} must be >= ${def.minimum}`);
          if (def.maximum !== undefined && val > def.maximum) errors.push(`${key} must be <= ${def.maximum}`);
        }
      }
    } else if (expected === 'boolean') {
      if (actual !== 'boolean') {
        errors.push(`wrong type: ${key} must be boolean (got ${actual})`);
      }
    } else if (expected === 'object') {
      if (actual !== 'object' || val === null || Array.isArray(val)) {
        errors.push(`wrong type: ${key} must be object (got ${actual})`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, normalized: normalizedInput };
  }

  const normalized = normalizeArgs(toolName, normalizedInput);
  return { valid: true, errors: [], normalized };
}

export function getApprovalMode(toolName) {
  return TOOL_APPROVAL[toolName] || 'never_require';
}

export function checkApproval(toolName, actor = 'unknown', intent = '') {
  const mode = getApprovalMode(toolName);
  if (mode === 'never_require') return { permitted: true, reason: 'never_require' };
  if (mode === 'always_require') {
    // For now, only verify actor or takeover intent can approve write tools
    // Since current tools are all read, this path is for future write tools
    if (String(actor).toLowerCase() === 'verify' || intent === 'takeover') {
      return { permitted: true, reason: 'approved by verify/takeover' };
    }
    return { permitted: false, reason: `tool ${toolName} requires approval (always_require)` };
  }
  // on_write or other: default to permitted for read, check for write
  return { permitted: true, reason: mode };
}

// State Management (Lesson 04) — history max 20, in-memory
export const toolHistory = [];

export function pushHistory(entry) {
  toolHistory.push(entry);
  if (toolHistory.length > 20) toolHistory.shift();
}

export function executeWithValidation(toolName, args, fn) {
  const v = validateParams(toolName, args);
  if (!v.valid) {
    const entry = { tool: toolName, args, timestamp: Date.now(), durationMs: 0, success: false, error: v.errors.join('; ') };
    pushHistory(entry);
    return { error: v.errors, isError: true };
  }
  const approval = checkApproval(toolName);
  if (!approval.permitted) {
    const entry = { tool: toolName, args: v.normalized, timestamp: Date.now(), durationMs: 0, success: false, error: approval.reason };
    pushHistory(entry);
    return { error: [approval.reason], isError: true };
  }
  const t0 = Date.now();
  try {
    const result = fn(v.normalized);
    const dt = Date.now() - t0;
    pushHistory({ tool: toolName, args: v.normalized, timestamp: t0, durationMs: dt, success: true });
    return { result, isError: false };
  } catch (e) {
    const dt = Date.now() - t0;
    pushHistory({ tool: toolName, args: v.normalized, timestamp: t0, durationMs: dt, success: false, error: e.message });
    return { error: [e.message], isError: true };
  }
}

export default { TOOL_SCHEMAS, TOOL_APPROVAL, validateParams, normalizeArgs, getApprovalMode, checkApproval, toolHistory, pushHistory, executeWithValidation };
