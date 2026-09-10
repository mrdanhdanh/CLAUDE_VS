#!/usr/bin/env node
/**
 * Fetch 90 HackerNoon Gamedev articles and store into www/library/export.json
 * - Extracts articleBody from __NEXT_DATA__ or ld+json
 * - Chunks with same logic as www/library/app.js (CHUNK_SIZE 2400, overlap 400)
 * - Updates registry + chunks in export.json
 */
import fs from 'node:fs';
import path from 'node:path';

const EXPORT_PATH = path.join(process.cwd(), 'www', 'library', 'export.json');
const CHUNK_SIZE = 2400;
const CHUNK_OVERLAP = 400;

// 90 URLs from https://hackernoon.com/90-blog-posts-to-learn-about-gamedev
const URLS = [
  "https://hackernoon.com/code-a-java-game-with-almost-zero-coding-skills-z442w31dh",
  "https://hackernoon.com/build-a-game-engine-from-scratch-in-c",
  "https://hackernoon.com/how-i-let-an-ai-code-a-game-for-me",
  "https://hackernoon.com/5-best-game-engines-for-beginner-indie-developers-y4893ush",
  "https://hackernoon.com/what-i-learned-writing-game-from-scratch-with-flutter-ls82g31rj",
  "https://hackernoon.com/why-i-believe-unity-is-the-best-development-engine",
  "https://hackernoon.com/phaser-3-game-framework-my-honest-review-uh1i3uv3",
  "https://hackernoon.com/is-it-hard-to-develop-a-mmorpg-5g623ydy",
  "https://hackernoon.com/unity-ai-creating-intelligent-npcs-and-enemy-behaviors",
  "https://hackernoon.com/creating-a-2d-platformer-in-unity-the-beginning",
  "https://hackernoon.com/game-development-in-2022-top-6-programming-languages",
  "https://hackernoon.com/how-to-broadcast-interactive-web-based-gaming-live-streams-with-amazon-ivs",
  "https://hackernoon.com/from-hypercasual-to-hybrid-casual-analysis-of-monetization-solutions-for-idle-games",
  "https://hackernoon.com/creating-immersive-virtual-reality-experiences-with-unity",
  "https://hackernoon.com/level-design-in-unity-from-concept-to-playable-environments",
  "https://hackernoon.com/why-gamedev-designers-are-the-swiss-army-knives-of-game-development",
  "https://hackernoon.com/how-much-does-it-cost-to-start-a-video-game-business",
  "https://hackernoon.com/game-coding-for-dummies-a-quick-guide-for-newbies",
  "https://hackernoon.com/exploring-unity-dots-and-ecs-is-it-a-game-changer",
  "https://hackernoon.com/how-i-remade-2048-using-react-viw37rc",
  "https://hackernoon.com/from-pixels-to-profits-boosting-revenue-with-analytics-in-game-development",
  "https://hackernoon.com/the-battle-against-trolls-and-hackers-a-guide-for-game-developers",
  "https://hackernoon.com/indie-game-marketing-on-youtube-a-guide-by-developers-for-developers",
  "https://hackernoon.com/unreal-engine-vs-unity-choosing-the-right-game-development-platform",
  "https://hackernoon.com/monetizing-your-unity-games-strategies-for-success",
  "https://hackernoon.com/rider-20231-release-discovering-new-features-for-unity-developers",
  "https://hackernoon.com/the-four-elements-and-their-graphic-effects-exploring-shaders-in-a-2d-game",
  "https://hackernoon.com/creating-a-troll-free-oasis-preventing-trolling-in-your-game-from-the-ground-up",
  "https://hackernoon.com/the-hackers-nemesis-strengthening-game-security-to-ward-off-intrusions",
  "https://hackernoon.com/unity-realtime-multiplayer-part-5-preparing-game-data",
  "https://hackernoon.com/what-ai-game-developers-do-and-how-to-become-one",
  "https://hackernoon.com/how-to-create-a-2d-character-controller-in-unity-part-2",
  "https://hackernoon.com/how-to-integrate-app-tracking-transparency-with-your-ios-unity-project-s94935l3",
  "https://hackernoon.com/how-to-make-your-own-game-in-python-2g1e3wn0",
  "https://hackernoon.com/on-weapon-design-in-video-games",
  "https://hackernoon.com/learn-to-code-with-pico-8-games-z54n36it",
  "https://hackernoon.com/an-introduction-to-love-the-2d-game-engine",
  "https://hackernoon.com/quest-arrest-shipping-a-physical-game-boy-game-in-2021-q66c31r2",
  "https://hackernoon.com/romut-why-less-is-more-when-it-comes-to-indie-games",
  "https://hackernoon.com/how-to-get-your-first-job-as-a-video-game-designer-5fz32q8",
  "https://hackernoon.com/making-a-spooky-quantum-game-in-15-hours-or-less-ji2a3a1d",
  "https://hackernoon.com/testing-in-godot-how-i-personally-approach-it",
  "https://hackernoon.com/72-stories-to-learn-about-video-game-development",
  "https://hackernoon.com/6-software-tools-i-use-to-make-game-art-without-being-an-artist-zyz3uzw",
  "https://hackernoon.com/how-to-enhance-your-game-project-using-the-objectpool-pattern-a-unity-guide",
  "https://hackernoon.com/getting-started-with-game-development",
  "https://hackernoon.com/frank-morgan-on-writing-hospitality-and-web3",
  "https://hackernoon.com/the-inside-scoop-on-how-gaming-companies-get-you-to-buy-their-stuff",
  "https://hackernoon.com/the-hybrid-future-of-multiplayer-game-architecture-9up36m3",
  "https://hackernoon.com/rust-opengl-rendering-250000-dynamic-3d-entities-at-50-fps-on-a-single-cpu-thread",
  "https://hackernoon.com/bugs-from-the-90s-the-code-of-the-command-and-conquer-game-ww1o3t94",
  "https://hackernoon.com/common-coding-conventions-in-gdscript",
  "https://hackernoon.com/223-stories-to-learn-about-game-development",
  "https://hackernoon.com/advantages-of-ai-in-gaming-how-were-creating-smarter-competition",
  "https://hackernoon.com/i-built-a-functional-data-oriented-3d-game-framework-in-rust-for-low-end-pcs",
  "https://hackernoon.com/pixis-asset-pack-10-is-the-new-version-a-step-forward-for-asset-management",
  "https://hackernoon.com/5-things-you-should-know-before-developing-ctv-games",
  "https://hackernoon.com/adventures-in-assembly-2-l77m3ybt",
  "https://hackernoon.com/what-ive-learned-by-making-and-promoting-a-game-to-help-stray-cats-jbd3u2c",
  "https://hackernoon.com/this-game-from-the-80s-had-kids-obsessing-over-space-tradeand-its-source-code-is-now-available",
  "https://hackernoon.com/reflection-driven-development-in-pure-c-eliminating-boilerplate-at-scale",
  "https://hackernoon.com/how-has-covid-changed-the-gaming-industry-or-catching-up-with-nis-america-oj6c3w44",
  "https://hackernoon.com/c-isnt-going-anywhere-in-game-development",
  "https://hackernoon.com/how-to-create-promotional-assets-an-insiders-guide-into-the-world-of-graphic-design",
  "https://hackernoon.com/bugs-from-the-90s-the-code-of-command-and-conquer-volume-2-np3y3t9w",
  "https://hackernoon.com/my-experience-as-a-team-lead-for-unity3d-gamedev-team-6v4l350s",
  "https://hackernoon.com/blockchain-games-hold-more-potential-than-previously-understood-sw2f3yfx",
  "https://hackernoon.com/dedicated-game-server-how-to-choose-the-right-infrastructure-fi6q3yyj",
  "https://hackernoon.com/what-to-do-when-your-12-year-old-son-has-a-girlfriend-in-fortnite-vxh3urt",
  "https://hackernoon.com/blockchain-tech-in-the-gaming-industry-major-players-to-spark-mass-adoption-b31t3ws3",
  "https://hackernoon.com/demographics-of-the-gaming-industry-reading-between-the-lines-662s33ur",
  "https://hackernoon.com/the-attention-span-drought-is-forcing-liveops-to-go-relentless",
  "https://hackernoon.com/the-brainrot-ification-of-mobile-game-economy-design",
  "https://hackernoon.com/supercharging-game-graphics-with-physics-in-phaser",
  "https://hackernoon.com/from-3d-rendering-to-motion-capture-whats-next-for-game-development-vh343ywn",
  "https://hackernoon.com/5-steps-you-should-take-to-launch-a-cool-game-f9y333h",
  "https://hackernoon.com/iot-as-a-multi-faceted-game-changer-in-2021-and-beyond-aot3woo",
  "https://hackernoon.com/the-importance-of-music-in-video-games-2k2y3td2",
  "https://hackernoon.com/51-stories-to-learn-about-gamedev",
  "https://hackernoon.com/creating-a-notification-based-game-via-unity-and-courier",
  "https://hackernoon.com/how-to-improve-customer-care-z33m37z9",
  "https://hackernoon.com/the-jinn-my-storyline-for-my-first-game-project-in-unity-m11dn30sy",
  "https://hackernoon.com/what-is-cloud-gaming-and-how-is-google-leading-the-industry-kr7g3uin",
  "https://hackernoon.com/brainrot-and-the-attention-economy-are-changing-time-gating-in-free-to-play-games",
  "https://hackernoon.com/seed-by-klang-games-part-1-of-the-game-ai-series-607035f5",
  "https://hackernoon.com/5-10-2023-noonification",
  "https://hackernoon.com/oh-youre-going-to-your-first-game-jam-read-me-first-mw3k3uuv",
  "https://hackernoon.com/wanna-get-great-at-making-indie-games-make-lots-of-them-1a1n3ttp",
  "https://hackernoon.com/why-even-legendary-games-like-wesnoth-hide-bugs-in-plain-sight",
  "https://hackernoon.com/why-hits-feel-different-now-mobile-chases-tiktok-console-chases-community",
];

function uid(name){
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'sach';
  return base + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6);
}
function estimatePage(idx, total, pages){
  if(!pages || pages<=1) return 1;
  return Math.min(pages, Math.max(1, Math.round((idx+1)/Math.max(1,total) * pages)));
}
function chunkText(text, bookId, bookName, pages){
  const chunks = [];
  let idx=0;
  const pushChunk = (t)=>{
    if(!t || !t.trim()) return;
    t=t.trim();
    if(t.length <= CHUNK_SIZE){
      chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: t, page: estimatePage(idx, chunks.length+1, pages) });
      idx++;
    } else {
      // split by sentences if too long
      const sentences = t.split(/(?<=[.!?])\s+/);
      let buf='';
      for(const s of sentences){
        if((buf + ' ' + s).length > CHUNK_SIZE){
          if(buf){
            chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: buf, page: estimatePage(idx, chunks.length+1, pages) });
            idx++;
            const overlap = buf.slice(-CHUNK_OVERLAP);
            buf = overlap + ' ' + s;
          } else {
            for(let i=0;i<s.length;i+=CHUNK_SIZE-CHUNK_OVERLAP){
              const part = s.slice(i, i+CHUNK_SIZE);
              chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: part, page: estimatePage(idx, chunks.length+1, pages) });
              idx++;
            }
            buf='';
          }
        } else {
          buf = buf ? buf + ' ' + s : s;
        }
      }
      if(buf){
        chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: buf, page: estimatePage(idx, chunks.length+1, pages) });
        idx++;
      }
    }
  };
  // split by paragraphs first
  const paras = text.split(/\n\s*\n/);
  let current='';
  for(const p of paras){
    const trimmed=p.trim();
    if(!trimmed) continue;
    if((current + '\n\n' + trimmed).length > CHUNK_SIZE){
      if(current) pushChunk(current);
      // handle very long paragraph
      if(trimmed.length > CHUNK_SIZE*1.5){
        pushChunk(trimmed);
        current='';
      } else {
        const overlap = current.slice(-CHUNK_OVERLAP);
        current = overlap ? overlap + '\n\n' + trimmed : trimmed;
        // if still too long, push
        if(current.length > CHUNK_SIZE){
          pushChunk(current);
          current='';
        }
      }
    } else {
      current = current ? current + '\n\n' + trimmed : trimmed;
    }
  }
  if(current) pushChunk(current);
  if(chunks.length===0 && text.trim()){
    for(let i=0;i<text.length;i+=CHUNK_SIZE-CHUNK_OVERLAP){
      const part = text.slice(i, i+CHUNK_SIZE);
      chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: part, page: estimatePage(idx, chunks.length+1, pages) });
      idx++;
    }
  }
  return chunks;
}

function cleanText(s){
  if(!s) return '';
  // decode common entities
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\u00A0/g,' ').replace(/\s+/g,' ').trim();
}
function stripHtml(s){
  if(!s) return '';
  return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}

async function fetchArticle(url, retries=2){
  for(let attempt=0; attempt<=retries; attempt++){
    try{
      const res = await fetch(url, { headers: { 'User-Agent': 'YUNIE-last30days/1.0', 'Accept': 'text/html' } });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      // Try __NEXT_DATA__
      let title='', articleBody='', author='', datePublished='', tags=[], image='', desc='';
      const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if(nextMatch){
        try{
          const j = JSON.parse(nextMatch[1]);
          const data = j?.props?.pageProps?.data;
          if(data){
            title = data.title || data.seoTitle || '';
            articleBody = data.articleBody || data.body || data.content || '';
            author = data.profile?.handle || data.profile?.displayName || data.author || '';
            if(data.profile?.displayName && data.profile?.handle) author = `${data.profile.displayName} (@${data.profile.handle})`;
            else if(data.profile?.displayName) author = data.profile.displayName;
            datePublished = data.datePublished || data.publishedAt || data.createdAt || '';
            if(datePublished && typeof datePublished === 'number') datePublished = new Date(datePublished*1000).toISOString();
            else if(datePublished && typeof datePublished === 'string' && /^\d+$/.test(datePublished)) datePublished = new Date(parseInt(datePublished)*1000).toISOString();
            tags = data.tags || data.topics || [];
            if(Array.isArray(tags)) tags = tags.map(t=> typeof t==='string'?t:(t.name||t.slug||'')).filter(Boolean);
            image = data.mainImage || data.image || '';
            desc = data.tldr || data.description || data.seoDescription || '';
          }
        }catch(e){
          console.warn(`  parse NEXT_DATA failed for ${url}: ${e.message}`);
        }
      }
      // Fallback ld+json
      if(!articleBody){
        const ldMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
        for(const m of ldMatches){
          try{
            const j = JSON.parse(m[1]);
            const obj = Array.isArray(j) ? j[0] : j;
            if(obj && obj.articleBody){
              articleBody = obj.articleBody;
              title = title || obj.headline || obj.name || '';
              author = author || (obj.author?.name || '');
              datePublished = datePublished || obj.datePublished || '';
              image = image || obj.image || '';
              break;
            }
          }catch{}
        }
      }
      // Fallback: extract <article> or main content
      if(!articleBody){
        // try to find articleBody in html as plain text between markers
        const bodyMatch = html.match(/"articleBody"\s*:\s*"([\s\S]*?)"/);
        if(bodyMatch){
          try{
            articleBody = JSON.parse(`"${bodyMatch[1]}"`);
          }catch{
            articleBody = bodyMatch[1].replace(/\\n/g,'\n').replace(/\\"/g,'"').replace(/\\u[\dA-Fa-f]{4}/g, (m)=> String.fromCharCode(parseInt(m.slice(2),16)));
          }
        }
      }
      if(!articleBody){
        // last fallback: strip html paragraphs
        const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
        const paras = pMatches.map(m=> stripHtml(m[1])).filter(s=> s.length>40).slice(0,100);
        if(paras.length>3) articleBody = paras.join('\n\n');
      }
      if(!title){
        const tMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if(tMatch) title = stripHtml(tMatch[1]).replace(/\| HackerNoon.*$/,'').trim();
      }
      if(!title) title = url.split('/').pop().replace(/-/g,' ').slice(0,80);
      // Clean
      title = cleanText(title);
      articleBody = articleBody ? articleBody.replace(/\\n/g,'\n').replace(/\r\n/g,'\n') : '';
      // If articleBody still contains HTML, strip
      if(articleBody.includes('<') && articleBody.includes('>')){
        articleBody = stripHtml(articleBody);
      }
      // Ensure decent length
      if(!articleBody || articleBody.length < 200){
        console.warn(`  ⚠️ short body for ${url} len=${articleBody.length} title=${title.slice(0,60)}`);
        // try to use desc + body
        if(desc && articleBody.length < 200) articleBody = desc + '\n\n' + articleBody;
      }
      // Build full text for chunking: include metadata header
      const header = `# ${title}\n\nTác giả: ${author || 'HackerNoon'}\nNgày: ${datePublished || ''}\nNguồn: ${url}\nTags: ${tags.join(', ')}\n\n${desc ? `Tóm tắt: ${desc}\n\n` : ''}`;
      const fullText = header + articleBody;
      return { url, title, author, datePublished, tags, image, desc, articleBody, fullText, htmlLen: html.length };
    }catch(e){
      console.warn(`  attempt ${attempt+1} failed for ${url}: ${e.message}`);
      if(attempt===retries) throw e;
      await new Promise(r=> setTimeout(r, 1000*(attempt+1)));
    }
  }
}

async function main(){
  console.log(`📚 Fetching ${URLS.length} HackerNoon Gamedev articles...`);
  // Load existing export
  let existing = { version:1, exportedAt: new Date().toISOString(), registry:{}, chunks:[] };
  if(fs.existsSync(EXPORT_PATH)){
    try{
      const raw = fs.readFileSync(EXPORT_PATH,'utf8');
      existing = JSON.parse(raw);
      if(!existing.registry) existing.registry={};
      if(!existing.chunks) existing.chunks=[];
      console.log(`Existing: ${Object.keys(existing.registry).length} books, ${existing.chunks.length} chunks`);
    }catch(e){
      console.warn('Failed to parse existing export.json, starting fresh', e.message);
    }
  }
  const registry = existing.registry;
  let chunks = existing.chunks;
  // Remove old gamedev entries if re-running (to avoid duplicates)
  const gamedevIds = Object.keys(registry).filter(k=> k.startsWith('hackernoon-gamedev-'));
  if(gamedevIds.length>0){
    console.log(`Removing ${gamedevIds.length} old gamedev entries for re-run...`);
    for(const id of gamedevIds) delete registry[id];
    chunks = chunks.filter(c=> !c.bookId.startsWith('hackernoon-gamedev-'));
  }
  let success=0, failed=0, totalChunks=0;
  const start = Date.now();
  for(let i=0;i<URLS.length;i++){
    const url = URLS[i];
    const slug = url.split('/').pop().split('?')[0];
    const id = `hackernoon-gamedev-${String(i+1).padStart(2,'0')}-${slug.slice(0,40)}`;
    console.log(`\n[${i+1}/${URLS.length}] ${slug}`);
    try{
      const data = await fetchArticle(url);
      console.log(`  ✅ ${data.title.slice(0,80)} | body ${data.articleBody.length} chars | author ${data.author}`);
      // Create book entry
      const bookName = `${data.title} — HackerNoon Gamedev #${i+1}`;
      const bookChunks = chunkText(data.fullText, id, bookName, 1);
      console.log(`  → ${bookChunks.length} chunks`);
      if(bookChunks.length===0){
        console.warn(`  ⚠️ no chunks for ${url}`);
        failed++;
        continue;
      }
      registry[id] = {
        id,
        name: bookName,
        type: "hackernoon",
        enabled: true,
        read: false,
        progress: 0,
        chunks: bookChunks.length,
        size: data.fullText.length,
        addedAt: new Date().toISOString(),
        pages: 1,
        source: "HackerNoon",
        link: url,
        author: data.author,
        published: data.datePublished,
        tags: data.tags,
        image: data.image,
        desc: data.desc,
        slug
      };
      chunks.push(...bookChunks);
      totalChunks += bookChunks.length;
      success++;
      // Save incrementally every 10
      if((i+1)%10===0){
        const tmp = { version:1, exportedAt: new Date().toISOString(), registry, chunks };
        fs.writeFileSync(EXPORT_PATH, JSON.stringify(tmp, null, 2), 'utf8');
        console.log(`  💾 checkpoint saved (${Object.keys(registry).length} books, ${chunks.length} chunks)`);
      }
    }catch(e){
      console.error(`  ❌ failed ${url}: ${e.message}`);
      failed++;
    }
    // delay to be nice
    await new Promise(r=> setTimeout(r, 600));
  }
  const finalData = { version:1, exportedAt: new Date().toISOString(), registry, chunks };
  fs.writeFileSync(EXPORT_PATH, JSON.stringify(finalData, null, 2), 'utf8');
  const elapsed = ((Date.now()-start)/1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s: ${success} success, ${failed} failed, ${totalChunks} new chunks`);
  console.log(`Total: ${Object.keys(registry).length} books, ${chunks.length} chunks`);
  console.log(`File: ${EXPORT_PATH} (${(fs.statSync(EXPORT_PATH).size/1024/1024).toFixed(2)} MB)`);
  // Verify JSON
  try{
    JSON.parse(fs.readFileSync(EXPORT_PATH,'utf8'));
    console.log('✅ JSON valid');
  }catch(e){
    console.error('❌ JSON invalid', e.message);
  }
  // Test search
  console.log('\n🔍 Test search "Unity game engine"...');
  // quick BM25 test via search.mjs if available
  try{
    const { execSync } = await import('node:child_process');
    const out = execSync(`node www/library/search.mjs "Unity game engine" --top_k 3 --json`, { encoding:'utf8', timeout:5000 });
    console.log(out.slice(0,2000));
  }catch(e){
    console.log('search test failed', e.message);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
