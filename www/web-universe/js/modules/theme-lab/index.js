export const manifest = {
  id: 'theme-lab',
  name: 'Theme Lab',
  version: '1.0.0',
  category: 'system',
  description: 'Custom theme — colors, radius, spacing, export/import.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🎨',
};

let els = {};
let ctxRef = null;

const DEFAULTS = {
  primary: '#6366f1',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  radius: '12',
  spacing: '16',
};

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-hover', theme.primary);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--surface-2', theme.surface2);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--radius-md', theme.radius + 'px');
  root.style.setProperty('--radius-lg', (parseInt(theme.radius,10)+4) + 'px');
  // spacing affects --space-4
  root.style.setProperty('--space-4', theme.spacing + 'px');
}

function getCurrentTheme() {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  return {
    primary: cs.getPropertyValue('--primary').trim() || DEFAULTS.primary,
    surface: cs.getPropertyValue('--surface').trim() || DEFAULTS.surface,
    surface2: cs.getPropertyValue('--surface-2').trim() || DEFAULTS.surface2,
    border: cs.getPropertyValue('--border').trim() || DEFAULTS.border,
    text: cs.getPropertyValue('--text').trim() || DEFAULTS.text,
    radius: (cs.getPropertyValue('--radius-md').trim().replace('px','') || DEFAULTS.radius),
    spacing: (cs.getPropertyValue('--space-4').trim().replace('px','') || DEFAULTS.spacing),
  };
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  let theme = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem('web-universe:theme-custom');
    if (raw) theme = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  // Apply persisted custom theme if exists
  const hasCustom = localStorage.getItem('web-universe:theme-custom');
  if (hasCustom) applyTheme(theme);

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <label class="muted small" style="font:600 11px var(--font-sans)">Primary</label>
        <input type="color" id="thPrimary" value="${theme.primary}" style="width:100%;height:36px;padding:2px" />
      </div>
      <div>
        <label class="muted small" style="font:600 11px var(--font-sans)">Surface</label>
        <input type="color" id="thSurface" value="${theme.surface}" style="width:100%;height:36px;padding:2px" />
      </div>
      <div>
        <label class="muted small" style="font:600 11px var(--font-sans)">Surface 2</label>
        <input type="color" id="thSurface2" value="${theme.surface2}" style="width:100%;height:36px;padding:2px" />
      </div>
      <div>
        <label class="muted small" style="font:600 11px var(--font-sans)">Border</label>
        <input type="color" id="thBorder" value="${theme.border}" style="width:100%;height:36px;padding:2px" />
      </div>
      <div>
        <label class="muted small" style="font:600 11px var(--font-sans)">Text</label>
        <input type="color" id="thText" value="${theme.text}" style="width:100%;height:36px;padding:2px" />
      </div>
      <div>
        <label class="muted small" style="font:600 11px var(--font-sans)">Radius: <span id="thRadiusVal">${theme.radius}px</span></label>
        <input type="range" id="thRadius" min="4" max="24" value="${theme.radius}" style="width:100%" />
      </div>
    </div>
    <div style="margin-top:10px">
      <label class="muted small" style="font:600 11px var(--font-sans)">Spacing: <span id="thSpacingVal">${theme.spacing}px</span></label>
      <input type="range" id="thSpacing" min="8" max="32" value="${theme.spacing}" style="width:100%" />
    </div>
    <div style="margin-top:12px;padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md)">
      <div style="font:600 11px var(--font-sans);margin-bottom:8px">Preview</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm">Primary Button</button>
        <button class="btn btn-ghost btn-sm">Ghost Button</button>
        <span class="badge">Badge</span>
      </div>
      <div style="margin-top:8px;padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);font:400 12px var(--font-sans)">Card preview — border radius and spacing affect this card</div>
      <input placeholder="Input preview" style="margin-top:8px;width:100%;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);font:500 12px var(--font-sans)" />
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" data-action="export">Export JSON</button>
      <button class="btn btn-ghost btn-sm" data-action="import">Import JSON</button>
      <input type="file" id="thImportFile" accept=".json" style="display:none" />
      <button class="btn btn-ghost btn-sm" data-action="reset">Reset</button>
      <button class="btn btn-ghost btn-sm" data-action="save">Save</button>
    </div>
    <pre id="thJson" style="margin-top:8px;max-height:120px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;display:none"></pre>
    <div class="muted small" id="thStatus" style="margin-top:6px"></div>
  `;

  els = {
    primary: container.querySelector('#thPrimary'),
    surface: container.querySelector('#thSurface'),
    surface2: container.querySelector('#thSurface2'),
    border: container.querySelector('#thBorder'),
    text: container.querySelector('#thText'),
    radius: container.querySelector('#thRadius'),
    radiusVal: container.querySelector('#thRadiusVal'),
    spacing: container.querySelector('#thSpacing'),
    spacingVal: container.querySelector('#thSpacingVal'),
    json: container.querySelector('#thJson'),
    status: container.querySelector('#thStatus'),
  };

  function collect() {
    return {
      primary: els.primary.value,
      surface: els.surface.value,
      surface2: els.surface2.value,
      border: els.border.value,
      text: els.text.value,
      radius: els.radius.value,
      spacing: els.spacing.value,
    };
  }
  function onChange() {
    const t = collect();
    applyTheme(t);
    els.radiusVal.textContent = t.radius + 'px';
    els.spacingVal.textContent = t.spacing + 'px';
  }
  [els.primary, els.surface, els.surface2, els.border, els.text].forEach(el=> el.addEventListener('input', onChange));
  els.radius.addEventListener('input', onChange);
  els.spacing.addEventListener('input', onChange);

  container.querySelector('[data-action="save"]')?.addEventListener('click',()=>{
    const t=collect();
    try{ localStorage.setItem('web-universe:theme-custom', JSON.stringify(t)); }catch{}
    applyTheme(t);
    els.status.textContent='Saved ✓ — F5 will keep';
    els.status.style.color='var(--success)';
  });
  container.querySelector('[data-action="export"]')?.addEventListener('click',()=>{
    const t=collect();
    const blob=new Blob([JSON.stringify(t,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='theme.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    els.json.textContent=JSON.stringify(t,null,2);
    els.json.style.display='block';
  });
  container.querySelector('[data-action="import"]')?.addEventListener('click',()=> container.querySelector('#thImportFile').click());
  container.querySelector('#thImportFile')?.addEventListener('change', async()=>{
    const file=container.querySelector('#thImportFile').files?.[0];
    if(!file) return;
    try{
      const text=await file.text();
      const obj=JSON.parse(text);
      // validate
      if(!obj.primary) throw new Error('Missing primary');
      // apply
      Object.assign(theme, obj);
      els.primary.value=theme.primary;
      els.surface.value=theme.surface;
      els.surface2.value=theme.surface2;
      els.border.value=theme.border;
      els.text.value=theme.text;
      els.radius.value=theme.radius;
      els.spacing.value=theme.spacing;
      applyTheme(theme);
      els.radiusVal.textContent=theme.radius+'px';
      els.spacingVal.textContent=theme.spacing+'px';
      try{ localStorage.setItem('web-universe:theme-custom', JSON.stringify(theme)); }catch{}
      els.status.textContent='Imported ✓';
      els.status.style.color='var(--success)';
    }catch(e){
      els.status.textContent='Import failed: '+e.message;
      els.status.style.color='var(--danger)';
    }
    container.querySelector('#thImportFile').value='';
  });
  container.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{
    localStorage.removeItem('web-universe:theme-custom');
    // Reset to defaults by reloading CSS variables — remove inline styles
    const root=document.documentElement;
    ['--primary','--primary-hover','--surface','--surface-2','--border','--text','--radius-md','--radius-lg','--space-4'].forEach(v=> root.style.removeProperty(v));
    // Reset inputs
    els.primary.value=DEFAULTS.primary;
    els.surface.value=DEFAULTS.surface;
    els.surface2.value=DEFAULTS.surface2;
    els.border.value=DEFAULTS.border;
    els.text.value=DEFAULTS.text;
    els.radius.value=DEFAULTS.radius;
    els.spacing.value=DEFAULTS.spacing;
    els.radiusVal.textContent=DEFAULTS.radius+'px';
    els.spacingVal.textContent=DEFAULTS.spacing+'px';
    els.status.textContent='Reset ✓';
    els.status.style.color='var(--success)';
  });

  ctxRef?.logger?.info('theme-lab: mounted');
}

export async function unmount(){ els={}; ctxRef=null; }
export async function destroy(){ await unmount(); }
