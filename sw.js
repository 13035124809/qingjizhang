/* 轻记账 Service Worker - 离线缓存
 * 更新日期: 2026-09-07
 * 版本: v2
 * 变更: index.html 改用 network-first（联网刷新即拿最新版，避免被旧缓存锁死）
 *       每次发布新功能请将版本号 +1，浏览器会自动清理旧缓存
 */
const CACHE='qingjizhang-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];

/* index.html 与根路径走网络优先：先拿最新，失败才用缓存（保证线上更新能即时生效） */
function isDoc(url){
  return /(^|\/)index\.html$/.test(url) || /\/$/.test(url) || url===self.registration.scope.replace(/\/$/,'');
}

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.filter(a=>!/index\.html$/.test(a)&&a!=='./'))).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=e.request.url;
  e.respondWith(
    caches.match(e.request).then(hit=>{
      if(!isDoc(url)) return hit||fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return res;
      }).catch(()=>hit);
      // index.html / 根: network-first
      return fetch(e.request).then(res=>{
        if(res && res.status===200){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy));
        }
        return res;
      }).catch(()=>hit||caches.match('./index.html'));
    })
  );
});
