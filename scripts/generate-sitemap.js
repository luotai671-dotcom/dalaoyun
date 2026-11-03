const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const rawSiteUrl=(process.env.SITE_URL||'https://dalaoyungw.com').trim();
let origin;
try{origin=new URL(rawSiteUrl).origin}catch{console.error(`Invalid SITE_URL: ${rawSiteUrl}`);process.exit(1)}
const routes=[
  '/', '/advantages/', '/pricing/', '/benchmark/', '/ai/', '/tutorials/', '/pitfalls/', '/wiki/'
];
const wikiRoot=path.join(root,'wiki');
if(fs.existsSync(wikiRoot))for(const group of fs.readdirSync(wikiRoot)){
  const groupDir=path.join(wikiRoot,group);
  if(!fs.statSync(groupDir).isDirectory())continue;
  for(const file of fs.readdirSync(groupDir).filter(name=>name.endsWith('.html'))){
    routes.push(`/wiki/${group}/${file}`);
  }
}
const lastmod=new Date().toISOString().slice(0,10);
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route=>`  <url><loc>${origin}${route}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root,'sitemap.xml'),xml);
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Generated sitemap.xml with ${routes.length} URLs for ${origin}.`);
