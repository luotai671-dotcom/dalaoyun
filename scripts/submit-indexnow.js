const fs=require('fs'),path=require('path'),https=require('https');
const root=path.resolve(__dirname,'..'),sitemapPath=path.join(root,'sitemap.xml');
if(!fs.existsSync(sitemapPath)){console.error('Missing sitemap.xml. Run npm run build first.');process.exit(1)}
const xml=fs.readFileSync(sitemapPath,'utf8');
const urlList=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
if(!urlList.length){console.error('sitemap.xml contains no URLs.');process.exit(1)}
let site;
try{site=new URL(urlList[0])}catch{console.error('sitemap.xml contains an invalid URL.');process.exit(1)}
const host=(process.env.INDEXNOW_HOST||site.host).trim();
if(!host||host==='example.com'){console.error('IndexNow aborted: configure SITE_URL or INDEXNOW_HOST with the production domain.');process.exit(1)}
const keyFile=fs.readdirSync(root).find(file=>/^[a-f0-9]{32}\.txt$/i.test(file));
if(!keyFile){console.error('IndexNow verification key file was not found in the site root.');process.exit(1)}
const key=(process.env.INDEXNOW_KEY||fs.readFileSync(path.join(root,keyFile),'utf8')).trim();
if(!/^[a-f0-9]{32}$/i.test(key)||keyFile!==`${key}.txt`){console.error('IndexNow key file name and content do not match.');process.exit(1)}
for(const item of urlList)if(new URL(item).host!==host){console.error(`Sitemap host mismatch: ${item}`);process.exit(1)}
const body=JSON.stringify({host,key,keyLocation:`https://${host}/${key}.txt`,urlList});
const req=https.request({hostname:'api.indexnow.org',path:'/indexnow',method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body)}},res=>{
  console.log(`IndexNow response: ${res.statusCode}; submitted ${urlList.length} URLs.`);
  if(res.statusCode!==200&&res.statusCode!==202)process.exitCode=1;
  res.resume();
});
req.on('error',error=>{console.error(`IndexNow failed: ${error.message}`);process.exitCode=1});req.end(body);
