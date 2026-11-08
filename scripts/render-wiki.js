const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const origin=(process.env.SITE_URL||'https://dalaoyungw.com').trim().replace(/\/+$/,'');
const data=JSON.parse(fs.readFileSync(path.join(root,'src','data','wiki-articles.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline=s=>s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,href)=>`<a href="${href.replace(/^\.\.\//,'wiki/').replace(/\.md$/,'.html')}">${label}</a>`).replace(/`([^`]+)`/g,'<code>$1</code>');

function extractFaqSchema(markdownSource){
  const match=markdownSource.match(/## 长尾 FAQ\s*([\s\S]*)$/);
  if(!match) return null;
  const faqText=match[1];
  const qBlocks=faqText.split(/###\s+/).filter(Boolean);
  const items=[];
  for(const block of qBlocks){
    const lines=block.trim().split(/\r?\n/).filter(Boolean);
    if(lines.length>=2){
      const q=lines[0].trim();
      const a=lines.slice(1).join(' ').trim();
      if(q&&a){
        items.push({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}});
      }
    }
  }
  if(!items.length) return null;
  return {"@context":"https://schema.org","@type":"FAQPage","mainEntity":items};
}

function markdown(source){
  const body=source.replace(/^---\n[\s\S]*?\n---\n?/,'').split(/\r?\n/),out=[];let i=0;
  while(i<body.length){
    const line=body[i];
    if(!line.trim()){i++;continue}
    if(line.trim().startsWith('<')){
      const rows=[];
      while(i<body.length&&body[i].trim()&&!/^#{1,3} |^```|^\|\s|^- /.test(body[i].trim())){
        rows.push(body[i++]);
      }
      out.push(rows.join('\n'));
      continue;
    }
    if(line.trim().startsWith('```')){
      const lang=line.trim().slice(3).trim(),rows=[];i++;
      while(i<body.length&&!body[i].trim().startsWith('```'))rows.push(body[i++]);
      i++;
      out.push(`<pre class="code-block${lang==='mermaid'?' topology-block':''}"><span>${lang==='mermaid'?'NETWORK TOPOLOGY':esc(lang||'CODE')}</span><code>${esc(rows.join('\n'))}</code></pre>`);
      continue;
    }
    if(/^#{1,3} /.test(line.trim())){
      const m=line.trim().match(/^(#{1,3}) (.*)$/),level=m[1].length;
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
      i++;
      continue;
    }
    if(line.trim().startsWith('|')&&body[i+1]&&/^\|?\s*:?-+/.test(body[i+1].trim())){
      const rows=[];
      while(i<body.length&&body[i].trim().startsWith('|'))rows.push(body[i++].split('|').slice(1,-1).map(x=>x.trim()));
      rows.splice(1,1);
      out.push(`<div class="article-table-wrap"><table class="data-table" id="matrix"><thead><tr>${rows[0].map(x=>`<th>${inline(x)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(x=>`<td>${inline(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if(line.trim().startsWith('- ')){
      const rows=[];
      while(i<body.length&&body[i].trim().startsWith('- '))rows.push(`<li>${inline(body[i++].trim().slice(2))}</li>`);
      out.push(`<ul>${rows.join('')}</ul>`);
      continue;
    }
    const rows=[line];i++;
    while(i<body.length&&body[i].trim()&&!/^#{1,3} |^```|^\|\s|^- |^</.test(body[i].trim()))rows.push(body[i++]);
    out.push(`<p>${inline(rows.join(' '))}</p>`);
  }
  return out.join('');
}

const groups=[...new Set(data.map(x=>x.label))];
const groupCounts={};
for(const item of data) groupCounts[item.group]=(groupCounts[item.group]||0)+1;

const sections=groups.map((label,index)=>{
  const rows=data.filter(x=>x.label===label),group=rows[0].group;
  return `<section class="content-band wiki-cluster${index%2?' alt':''}" id="cluster-${group}"><div class="container"><div class="content-heading wiki-cluster-heading"><div><span class="kicker">0${index+1} / WIKI CLUSTER</span><h2>${esc(label)}</h2></div><p>${rows.length} 篇生产级深度文章，包含 Direct Answer、拓扑图、参数表、排障命令与长尾 FAQ。</p></div><div class="article-grid">${rows.map(x=>`<article class="article-card wiki-card"><span>${esc(x.category)} · 约 15 分钟</span><h3>${esc(x.title)}</h3><p>核心关键词：${esc(x.keyword)}。从底层架构、实测口径和风险边界建立可复现判断标准。</p><a class="wiki-read" href="wiki/${x.group}/${x.slug}.html"><span>阅读完整技术长文</span><b>→</b></a></article>`).join('')}</div></div></section>`;
}).join('');

const clusterNav=data.filter((item,index,list)=>list.findIndex(x=>x.group===item.group)===index).map((item,index)=>`<a href="#cluster-${item.group}"><small>0${index+1}</small><span>${esc(item.label)}</span><b>${groupCounts[item.group]} 篇</b></a>`).join('');

const html=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>机场科普｜${data.length} 篇机场推荐、梯子推荐与专线协议深度指南</title><meta name="description" content="大佬云机场科普收录 ${data.length} 篇深度技术长文，系统解析IEPL专线机场推荐、平价高性价比梯子避坑、一元机场、免费机场、VLESS Reality、双 ISP 住宅出口与 2026 梯子推荐标准。"><meta name="keywords" content="机场科普,机场推荐,梯子推荐,IEPL专线机场推荐,平价高性价比机场推荐,晚高峰不卡顿机场,一元机场,免费机场,赔钱机场,VLESS Reality,双ISP住宅节点"><meta name="robots" content="index,follow,max-snippet:-1"><meta name="theme-color" content="#080b0f"><link rel="icon" href="assets/favicon.png"><link rel="apple-touch-icon" href="assets/apple-touch-icon.png"><link rel="canonical" href="${origin}/wiki/"><meta property="og:type" content="website"><meta property="og:site_name" content="大佬云 DAOLAO CLOUD"><meta property="og:title" content="大佬云机场科普：${data.length} 篇网络技术深度指南"><meta property="og:description" content="四大知识集群，系统理解低价生态、专线拓扑、现代协议与 IP 风控。"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="wiki.css"><script src="site-shell.js" defer></script><script src="script.js" defer></script></head><body><site-header></site-header><main class="inner-page"><section class="page-hero"><div class="container page-hero-grid"><div><span class="kicker">07 / KNOWLEDGE BASE</span><h1>机场科普</h1><p>${data.length} 篇长文，把一元机场、免费机场、专线、协议与 IP 风控还原成可以复测和比较的技术指标。</p></div><div class="page-index"><span>PRODUCTION KNOWLEDGE BASE</span><strong>${data.length} ARTICLES</strong><p>4 大分类 · 每篇正文 1500 字以上</p></div></div></section><section class="pitfalls-answer"><div class="container direct-answer"><span class="direct-mark">!</span><div><p class="kicker">DIRECT ANSWER / 科普集群结论</p><h2>稳定机场推荐不能依赖价格或节点名称</h2><p>2026 年梯子推荐应同时验证物理链路、现代协议、出口纯净度与商业诚信，并使用晚高峰单线程、持续丢包、ASN 和真实 1:1 计费形成证据链。</p></div></div></section><nav class="wiki-cluster-nav" aria-label="机场科普分类"><div class="container"><div class="wiki-cluster-rail">${clusterNav}</div></div></nav>${sections}<section class="content-band alt"><div class="container subpage-cta"><div><span class="kicker">DLY88 / VERIFIED START</span><h2>读完原理，再用自己的网络验证</h2><p>小额月付控制风险，结账使用优惠码 dly88。</p></div><a class="button button-primary outbound" href="/go/dalao" target="_blank" rel="nofollow sponsored noopener noreferrer">查看大佬云方案 ↗</a></div></section></main><site-footer></site-footer></body></html>`;

fs.writeFileSync(path.join(root,'wiki.html'),html);
console.log(`Rendered wiki.html with ${data.length} article cards in ${groups.length} clusters.`);

for(const item of data){
  const source=fs.readFileSync(path.join(root,item.path),'utf8'),fm=source.match(/^---\n([\s\S]*?)\n---/)[1];
  const description=(fm.match(/^description: "(.*)"$/m)||[])[1]||'',articleDir=path.join(root,'wiki',item.group);
  fs.mkdirSync(articleDir,{recursive:true});
  
  const faqSchema = extractFaqSchema(source);
  const faqScript = faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema).replace(/</g,'\\u003c')}</script>` : '';

  const tagsMatch = fm.match(/^tags:\s*\[(.*?)\]/m);
  let pageKeywords = `${esc(item.keyword)},机场推荐,梯子推荐,大佬云`;
  if(tagsMatch){
    try{
      const tagsList = JSON.parse(`[${tagsMatch[1]}]`);
      pageKeywords = tagsList.map(t=>esc(t)).join(',');
    }catch(e){}
  }

  const page=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="../../"><title>${esc(item.title)}｜大佬云机场科普</title><meta name="description" content="${esc(description)}"><meta name="keywords" content="${pageKeywords}"><meta name="robots" content="index,follow,max-snippet:-1"><meta name="theme-color" content="#080b0f"><link rel="icon" href="assets/favicon.png"><link rel="canonical" href="${origin}/wiki/${item.group}/${item.slug}.html">${faqScript}<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="wiki-article.css"><script src="site-shell.js" defer></script><script src="script.js" defer></script></head><body><site-header></site-header><main class="inner-page wiki-article"><header class="article-hero"><div class="container"><a class="article-back" href="wiki.html">← 返回机场科普</a><span class="kicker">${esc(item.category)} / WIKI ${String(item.id).padStart(2,'0')}</span><h1>${esc(item.title)}</h1><p>${esc(description)}</p></div></header><article class="container article-content">${markdown(source)}</article><section class="content-band alt"><div class="container subpage-cta"><div><span class="kicker">DLY88 / VERIFIED START</span><h2>先理解指标，再验证真实体验</h2><p>小额月付控制风险，结账使用优惠码 dly88。</p></div><a class="button button-primary outbound" href="/go/dalao" target="_blank" rel="nofollow sponsored noopener noreferrer">查看大佬云方案 ↗</a></div></section></main><site-footer></site-footer></body></html>`;

  fs.writeFileSync(path.join(articleDir,`${item.slug}.html`),page);
}
console.log(`Rendered ${data.length} standalone wiki article pages.`);
