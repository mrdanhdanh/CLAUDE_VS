export const manifest = {
  id: 'crash-demo',
  name: 'Crash Demo',
  version: '1.0.0',
  category: 'devtools',
  description: 'Cố tình throw error để test error isolation — app vẫn sống.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '💥',
};

let ctxRef = null;

export async function mount(container, ctx) {
  ctxRef = ctx;
  container.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:rgba(239,68,68,.12);color:var(--danger);font-size:24px;margin:0 auto 12px">💥</div>
      <h3 style="font:700 16px var(--font-sans)">Crash Demo</h3>
      <p class="muted small" style="margin-top:8px;max-width:40ch;margin-left:auto;margin-right:auto">Bấm nút bên dưới để module throw error — chỉ module này crash, các module khác vẫn chạy.</p>
      <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-danger btn-sm" id="btnThrow">Throw Error</button>
        <button class="btn btn-ghost btn-sm" id="btnThrowAsync">Throw Async</button>
        <button class="btn btn-ghost btn-sm" id="btnInfiniteLoop">Infinite Loop (5s)</button>
      </div>
      <div class="muted small" id="crashInfo" style="margin-top:12px;min-height:18px"></div>
      <div style="margin-top:16px;padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;text-align:left">
        <div style="font:700 12px var(--font-sans)">Kỳ vọng (Error Isolation):</div>
        <ul style="font:400 12px var(--font-sans);color:var(--text-2);margin:6px 0 0 16px;line-height:1.6">
          <li>Chỉ card này hiện <b style="color:var(--danger)">❌ Module crashed</b></li>
          <li>Các window khác vẫn tương tác được</li>
          <li>Nút <b>Restart</b> sẽ mount lại thành công</li>
          <li>App shell không reload</li>
        </ul>
      </div>
    </div>
  `;

  container.querySelector('#btnThrow')?.addEventListener('click', () => {
    throw new Error('Crash Demo: intentional sync error — testing error isolation');
  });

  container.querySelector('#btnThrowAsync')?.addEventListener('click', async () => {
    container.querySelector('#crashInfo').textContent = 'Throwing async in 300ms…';
    await new Promise(r => setTimeout(r, 300));
    throw new Error('Crash Demo: intentional async error');
  });

  container.querySelector('#btnInfiniteLoop')?.addEventListener('click', () => {
    const info = container.querySelector('#crashInfo');
    info.textContent = 'Running heavy loop for 5s — FPS should drop, then recover…';
    const start = performance.now();
    let count = 0;
    function loop() {
      // Busy work
      for (let i = 0; i < 1e6; i++) count += Math.random();
      if (performance.now() - start < 5000) {
        requestAnimationFrame(loop);
      } else {
        info.textContent = `Done — count ${Math.round(count)} — FPS should recover`;
      }
    }
    requestAnimationFrame(loop);
  });

  ctxRef?.logger?.info('crash-demo: mounted — ready to crash');
}

export async function unmount() {
  ctxRef = null;
}
export async function destroy() { await unmount(); }
