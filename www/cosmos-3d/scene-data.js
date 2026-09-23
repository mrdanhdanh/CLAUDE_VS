/**
 * ============================================================================
 *  COSMOS 3D — SCENE DATA (★ FILE DUY NHẤT CẦN SỬA KHI UPDATE NỘI DUNG)
 * ============================================================================
 *
 *  Muốn thay đổi nội dung trang 3D? Chỉ sửa file này. Không cần đụng scene.js.
 *
 *  ┌─ THÊM / XOÁ 1 HÀNH TINH PIPELINE ──────────────────────────────────────┐
 *  │ Thêm 1 object vào mảng `phases` (đúng shape bên dưới).                  │
 *  │ → Tự động: lên quỹ đạo (bán kính +2.4, tốc độ giảm dần), có vòng quỹ    │
 *  │   đạo, có nhãn, vào được Chỉ mục, click mở panel. Không sửa engine.     │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  ┌─ THÊM / XOÁ 1 VÙNG HỆ THỐNG (chòm sao) ────────────────────────────────┐
 *  │ Thêm 1 object vào mảng `nodes`.                                         │
 *  │ → Tự động: xếp vào quả cầu fibonacci quanh tâm vùng 2, có nhãn, panel.  │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  SHAPE:
 *    phases[] : { num, name, era, cosmic, desc, color }
 *    nodes[]  : { id, ico, name, file, desc, link, color }
 *    entropy  : { title, meta, desc, link }   (S đọc động từ ../cosmos/scale.json)
 *
 *  Màu: dùng đúng palette của bản 2D (www/cosmos/index.html) để 2D ↔ 3D nhất quán.
 *  Link tương đối tính từ www/cosmos-3d/ — vd: '../status.json', '../cosmos/audit.json'.
 * ============================================================================
 */

export const SCENE_DATA = {
  /** Tâm mỗi vùng (world units) — scene.js đọc để đặt camera. */
  zones: {
    core: { pos: [0, 7, 17], target: [0, 0, 0], label: 'Lõi hệ thống' },
    map:  { pos: [90, 8, 42], target: [90, 0, 0], label: 'Bản đồ sao' },
  },

  /** Copy hiển thị lần đầu (hero overlay). */
  hero: {
    title: 'COSMOS · 3D',
    subtitle: 'Vũ trụ Harness v2 — bay giữa hệ thống. Kéo để xoay · cuộn để zoom · click để mở.',
    cta: '🚀 Khám phá',
    cta2d: '← Bản 2D đầy đủ',
    cta2dHref: '../cosmos/index.html',
  },

  /** Nguồn telemetry + ngưỡng freshness cho HUD. Không hardcode số liệu trong engine. */
  telemetry: {
    source: '../cosmos/scale.json',
    staleAfterHours: 48,
    signalOrder: ['entropy', 'policy', 'dissent', 'gravity', 'kn'],
    labels: {
      entropy: 'Entropy S',
      policy: 'Policy',
      dissent: 'Dissent',
      gravity: 'Gravity',
      kn: 'KN',
    },
  },

  /** Ba cụm chòm sao — dùng để vẽ links trong map zone. */
  constellations: [
    { key: 'foundation', label: 'NỀN TẢNG', color: '#06b6d4', desc: 'Tri thức, policy và audit giữ vũ trụ có thể quan sát được.' },
    { key: 'control', label: 'ĐIỀU KHIỂN', color: '#7c3aed', desc: 'Registry, preset, plan và routine định hình các hành tinh.' },
    { key: 'learning', label: 'HỌC HỎI', color: '#f59e0b', desc: 'Bugs, lab và design system biến lỗi thành vật liệu mới.' },
  ],

  /** Links chỉ dùng cho hiển thị; không thêm object vào items/pickables. */
  links: [
    ['cmb', 'lightcone'], ['lightcone', 'law'], ['law', 'darkmatter'], ['cmb', 'law'],
    ['pulsar', 'catalog'], ['catalog', 'multiverse'], ['catalog', 'dormant'], ['pulsar', 'quasar'],
    ['supernova', 'planets'], ['supernova', 'sdss'], ['sdss', 'filter'], ['planets', 'hubble'],
    ['filter', 'field'], ['hubble', 'field'], ['sdss', 'field'],
  ],

  /** Lõi trung tâm — Harness. */
  core: {
    num: '00',
    ico: '◈',
    title: 'Lõi Harness v2',
    meta: 'Process > Model · .github/',
    desc: 'Mọi hành tinh quay quanh đây: pipeline 8 phase là định luật vật lý của vũ trụ con. Lõi phát sáng liên tục — kể cả khi không ai quan sát.',
    lore: 'Idea là Big Bang. Explore mở rộng không gian khả thi; Verify là kính thiên văn biến khả năng thành thực tại.',
    link: '../index.html',
    linkLabel: '→ STATUS dashboard',
    color: '#7c3aed',
  },

  /** 8 hành tinh pipeline — thêm/xoá object là tự lên quỹ đạo. */
  phases: [
    { num: '01', name: 'Explore',   era: 'Vũ trụ sơ khai · 380k năm',  cosmic: '🌌 Superposition: liệt kê 3-5 khả thi',                desc: 'Quét không gian khả thi, đọc stack, tìm pattern — như bản đồ bức xạ nền.',            lore: 'Ở đây mọi hướng đều có thể tồn tại cùng lúc. Explore không chọn hướng; nó làm cho lựa chọn trở nên có thể.', color: '#7c3aed' },
    { num: '02', name: 'Clarify',   era: 'Sụp đổ hàm sóng',            cosmic: '⚛️ Collapse: 1 câu → 1 hướng',                        desc: 'Hỏi 1 câu chốt, ghi assumption — từ nhiều thực tại về 1.',                            lore: 'Một câu hỏi đúng giảm entropy: thực tại đi từ vô hạn khả năng về một hướng có thể kiểm chứng.', color: '#6366f1' },
    { num: '03', name: 'PRD',       era: 'Định luật vật lý',           cosmic: '📜 Cosmic-Quantum: Macro · Micro · Entanglement',      desc: 'Viết định luật cho vũ trụ con: Vision, Scope, Non-Goals, Metrics.',                   lore: 'PRD là bản đồ entanglement: một thay đổi ở Vision có thể kéo Design, Plan và Verify thay đổi theo.', color: '#06b6d4' },
    { num: '04', name: 'Design',    era: 'Hình thành thiên hà',        cosmic: '🎨 Vibe: cosmic dark / quantum light',                 desc: 'Palette, typography, wireframe 375/768/1280, states — cấu trúc từ hỗn mang.',         lore: 'Design biến bụi nguyên liệu thành hành lang: token, contrast, states và motion đều là vật liệu quan sát.', color: '#10b981' },
    { num: '05', name: 'Plan',      era: 'Quỹ đạo hành tinh',          cosmic: '🗺️ Mỗi todo là một hành tinh',                        desc: 'Chia todo có quỹ đạo, ghi Entangled with + Ladder nấc 1-7.',                          lore: 'Mỗi todo có khối lượng, quỹ đạo và ràng buộc. Plan tốt không tạo thêm hành tinh; nó làm các hành tinh không va chạm.', color: '#f59e0b' },
    { num: '06', name: 'Implement', era: 'Tunneling qua rào cản',      cosmic: '🚇 YAGNI → reuse → native → tối thiểu',                desc: 'Chạy ladder 7 nấc, mỗi edit → get_errors (đo bất định) → fix ngay.',                  lore: 'Đường hầm ngắn nhất không phải đường bằng code nhiều nhất; nó là đường đi qua rào cản với ít năng lượng nhất.', color: '#ec4899' },
    { num: '07', name: 'Polish',    era: 'Tinh vân thành sao',         cosmic: '✨ Bụi → sao sáng',                                    desc: 'Responsive, states, animation 150-300ms, a11y ≥4.5:1 — đánh bóng bụi thành sao.',     lore: 'Polish không cộng thêm hiệu ứng vô nghĩa; nó biến chi tiết nhỏ thành tín hiệu mà người mới vẫn đọc được.', color: '#8b5cf6' },
    { num: '08', name: 'Verify',    era: 'Quan sát tạo thực tại',      cosmic: '🔭 Không đo = không tồn tại',                          desc: 'build/test/lint + visual + audit verify — không quan sát = chưa xong.',               lore: 'Verify là kính thiên văn của Harness: tín hiệu mới chỉ trở thành thực tại khi có bằng chứng từ bên ngoài model.', color: '#06b6d4' },
  ],

  /** 15 vùng hệ thống — chòm sao ở vùng 2. Đồng bộ với MAPS trong www/cosmos/index.html. */
  nodes: [
    { id: 'cmb',       ico: '📡', name: 'CMB — Bức xạ nền',        file: 'docs/knowleged.md',                            link: 'https://github.com/mrdanhdanh/CLAUDE_VS/blob/main/docs/knowleged.md', color: '#f59e0b', desc: 'Tri thức gốc của vũ trụ — bài học từ bug (KN-001→…). Mọi agent PHẢI đọc trước khi code: đây là phông nền mà mọi quyết định in trên đó.' },
    { id: 'lightcone', ico: '💡', name: 'Nón ánh sáng',            file: '.agent/audit.jsonl → mirror: www/cosmos/audit.json', link: '../cosmos/audit.json',                                        color: '#06b6d4', desc: 'Append-only + hash-chain: mọi event để lại dấu vết nhân quả, không ai sửa được quá khứ. Chain vỡ = nghịch lý thời gian → điều tra ngay.' },
    { id: 'law',       ico: '⚖️', name: 'Định luật + Event Horizon', file: '.agent/policy.json',                           link: 'https://github.com/mrdanhdanh/CLAUDE_VS/blob/main/.agent/policy.json', color: '#7c3aed', desc: 'Deny trước allow, fail-closed. Qua event horizon (refused) là phải human takeover — agent không tự fix loop.' },
    { id: 'darkmatter',ico: '🌑', name: 'Vật chất tối',            file: '.agent/credentials.enc.json',                  link: '',                                                            color: '#6366f1', desc: 'Tồn tại, có khối lượng (AES-256-GCM) nhưng không nhìn thấy trực tiếp — never logged, không plain trong .env.' },
    { id: 'pulsar',    ico: '📶', name: 'Pulsar',                  file: '.agent/routines.json',                         link: '',                                                            color: '#ec4899', desc: 'Nhịp phát đều theo cron (floor 15m, cap 20, 10 fails → off). Kỷ luật lịch trình như nhịp xung sao neutron.' },
    { id: 'quasar',    ico: '🌟', name: 'Quasar',                  file: 'www/status.json',                              link: '../status.json',                                              color: '#f59e0b', desc: 'Nguồn sáng trung tâm — regenerate từ registry.json, không sửa tay. JSON.parse + serve 200 mới là thật (KN-002).' },
    { id: 'catalog',   ico: '🗂️', name: 'Catalog Messier',         file: '.github/harness/registry.json',                link: '',                                                            color: '#10b981', desc: 'Danh mục mọi thiên hà: skill/instruction/agent/prompt/hook. Source of truth — sync sau khi clone.' },
    { id: 'multiverse',ico: '🫧', name: 'Đa vũ trụ',               file: '.github/harness/presets/',                     link: '',                                                            color: '#a78bfa', desc: 'Mỗi preset là 1 vũ trụ con (web-product, api-minimal, lean-product). Chọn preset = chọn vũ trụ để sống.' },
    { id: 'dormant',   ico: '😴', name: 'Thiên hà ngủ đông',       file: '**/.disabled/',                                link: '',                                                            color: '#64748b', desc: 'Tồn tại nhưng tắt — không load, không gợi ý. Enable khi task thực sự cần, không nhồi 20 thứ cùng lúc.' },
    { id: 'supernova', ico: '💥', name: 'Supernova',               file: '.agent/bugs/',                                 link: '',                                                            color: '#ef4444', desc: 'Mỗi bug nổ tung rồi để lại nguyên tố nặng: bug.md + KN-XXX. Không để lỗi trôi — log ngay, fix sau.' },
    { id: 'planets',   ico: '🪐', name: 'Hệ hành tinh',            file: '.agent/plans/',                                link: '',                                                            color: '#f97316', desc: 'PRD/Design/Plan quay quanh 1 task như hành tinh quay quanh sao. Thư mục/task, cấm flat.' },
    { id: 'sdss',      ico: '🔭', name: 'SDSS — khảo sát trời',    file: 'auto-learn.mjs',                               link: '',                                                            color: '#22d3ee', desc: 'Suggest KN trước khi code, auto-log khi lỗi, propose sau fix — khảo sát tự học liên tục, không bỏ sót vùng trời.' },
    { id: 'filter',    ico: '🪟', name: 'Bộ lọc khả kiến',         file: 'context.mjs',                                  link: '',                                                            color: '#14b8a6', desc: 'Quarantine → compress → isolate → inspect: chỉ thấy dải sáng an toàn, chặn prompt-injection và secret lọt vào.' },
    { id: 'hubble',    ico: '🌠', name: 'Hubble Deep Field',       file: 'awesome-design-md/',                           link: '',                                                            color: '#8b5cf6', desc: '74 dải thiên hà thiết kế (DESIGN.md) — mỗi vibe là 1 mảnh trời sâu để chọn tokens.' },
    { id: 'field',     ico: '⚡', name: 'Kích thích trường',       file: 'wise loading',                                 link: '',                                                            color: '#eab308', desc: 'Không kích hoạt toàn trường — chỉ load skill/instruction khi description/applyTo match task. Progressive disclosure.' },
  ],

  /** Lore ngắn cho các vùng chòm sao; engine chỉ hiển thị, không sinh nội dung. */
  nodeLore: {
    cmb: 'Phông nền tri thức: mọi agent đều bắt đầu từ đây trước khi chạm vào code.',
    lightcone: 'Mỗi tool call để lại dấu vết; chuỗi hash là ánh sáng không thể sửa ngược.',
    law: 'Deny-first tạo ranh giới an toàn trước khi mở miệng — fail-closed là chất lượng, không phải trừng phạt.',
    darkmatter: 'Secrets tồn tại có khối lượng nhưng không được phát ra; chỉ hệ thống biết cách giải mã.',
    pulsar: 'Routine biến thời gian thành nhịp; một nhịp trễ là dấu hiệu vũ trụ lệch nhịp.',
    quasar: 'Status là nguồn sáng tổng hợp — được sinh lại từ registry, không chỉnh tay.',
    catalog: 'Registry là danh mục thiên thể; filesystem lệch danh mục là dark matter phải được phát hiện.',
    multiverse: 'Preset là các vũ trụ song song, mỗi preset chọn một cách sống cho cùng một Harness.',
    dormant: 'Disabled không phải xóa: ngôi sao ngủ vẫn có thể được đánh thức đúng lúc.',
    supernova: 'Bug nổ rồi để lại nguyên tố nặng — KN và guard là vật liệu của lần sửa sau.',
    planets: 'Mỗi plan là một hệ hành tinh nhỏ; ràng buộc dependency là quỹ đạo giữ nó không rơi.',
    sdss: 'Auto-learn quét bầu trời tri thức, đánh dấu điểm lạnh trước khi chúng biến thành im lặng.',
    filter: 'Context pipeline lọc nhiễu trước khi tín hiệu đi vào mô hình — chất lượng bắt đầu từ provenance.',
    hubble: 'Thiết kế tốt là một Hubble Deep Field: nhiều mẫu, cùng một ngôn ngữ quan sát.',
    field: 'Wise loading giữ vũ trụ gọn: capability chỉ xuất hiện khi nhiệm vụ thực sự cần nó.',
  },

  /** Lỗ đen entropy — S đọc động từ ../cosmos/scale.json (fallback: demo). */
  entropy: {
    num: '09',
    ico: '◉',
    title: 'Lỗ đen Entropy (S)',
    meta: '../cosmos/scale.json · cosmic-scale.mjs',
    desc: 'Entropy S = tech debt đo được. Càng nhiều cấu trúc không trả nợ → chân trời sự kiện càng phình. Màu accretion disk: xanh (low) · vàng (medium) · đỏ (high).',
    lore: 'Đây là chân trời sự kiện của quy trình: khi S tăng, mọi lời hứa cần nhiều năng lượng hơn để giữ trạng thái quan sát.',
    link: '../cosmos/scale.html',
    linkLabel: '→ Dashboard entropy',
    color: '#ef4444',
  },
};
