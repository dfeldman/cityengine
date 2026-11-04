// node connect.js regions.json — census per region + bike path Pont de Saint-Cloud → Place d'Armes on ways kept (any node in a region or Paris box)
const fs=require('fs'),S=process.env.DATA
const R=JSON.parse(fs.readFileSync(process.argv[2],'utf8'))
const pip=(ring,la,lo)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [ai,oi]=ring[i],[aj,oj]=ring[j];if((ai>la)!==(aj>la)&&lo<(oj-oi)*(la-ai)/(aj-ai)+oi)c=!c}return c}
const inParis=(la,lo)=>lo>=2.218&&la>=48.82
const segd=(la,lo,a,b)=>{const ax=(a[1]-lo)*73300,ay=(a[0]-la)*111320,bx=(b[1]-lo)*73300,by=(b[0]-la)*111320,dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/L));return Math.hypot(ax+t*dx,ay+t*dy)}
const nearLine=(pts,la,lo,m,closed)=>{const n=pts.length;for(let i=closed?0:1;i<n;i++){const a=pts[(i+n-1)%n],b=pts[i];if(segd(la,lo,a,b)<=m)return true}return false}
const inR=(r,la,lo)=>r.ring?(pip(r.ring,la,lo)||nearLine(r.ring,la,lo,r.margin||0,true)):nearLine(r.line,la,lo,r.margin,false)
const which=(la,lo)=>{for(const r of R)if(inR(r,la,lo))return r.name;return inParis(la,lo)?'paris':null}
const cnt={};for(const r of R)cnt[r.name]={b:0,km:0}
const NOBIKE=process.env.NOFOOT?/^(footway|path|steps|pedestrian|bridleway|motorway|motorway_link|trunk|trunk_link|construction|proposed|raceway|bus_guideway|corridor|elevator|platform)$/:/^(motorway|motorway_link|trunk|trunk_link|construction|proposed|raceway|bus_guideway|corridor|elevator|platform)$/
const adj=new Map(),pos=new Map();const k=c=>c[0].toFixed(7)+','+c[1].toFixed(7)
const add=(a,b,d)=>{if(!adj.has(a))adj.set(a,[]);adj.get(a).push([b,d])}
for(const l of fs.readFileSync(S+'/bh.geojsonseq','utf8').split('\n')){if(!l.trim())continue;const f=JSON.parse(l.replace(/^\x1e/,''));const p=f.properties,g=f.geometry
 if(p.building&&/Polygon/.test(g.type)){const r=g.type==='Polygon'?g.coordinates[0]:g.coordinates[0][0];let x=0,y=0;for(const c of r){x+=c[0];y+=c[1]}const w=which(y/r.length,x/r.length);if(w&&w!=='paris')cnt[w].b++;continue}
 if(!p.highway||g.type!=='LineString')continue
 const c=g.coordinates;let kept=false
 for(let i=1;i<c.length;i++){const w=which((c[i][1]+c[i-1][1])/2,(c[i][0]+c[i-1][0])/2);const d=Math.hypot((c[i][0]-c[i-1][0])*73.3,(c[i][1]-c[i-1][1])*111.3);if(w&&w!=='paris')cnt[w].km+=d}
 for(const q of c)if(which(q[1],q[0])){kept=true;break}
 if(!kept||NOBIKE.test(p.highway)||p.bicycle==='no'||p.access==='private'||p.access==='no')continue
 for(let i=1;i<c.length;i++){const a=k(c[i-1]),b=k(c[i]);pos.set(a,c[i-1]);pos.set(b,c[i]);const d=Math.hypot((c[i][0]-c[i-1][0])*73.3,(c[i][1]-c[i-1][1])*111.3);add(a,b,d);if(p.oneway!=='yes'||p.highway==='footway'||p['oneway:bicycle']==='no')add(b,a,d)}}
console.log('region             bldg   road km');for(const n in cnt)console.log(n.padEnd(18),String(cnt[n].b).padStart(5),cnt[n].km.toFixed(0).padStart(7))
const near=(la,lo)=>{let best,bd=1e9;for(const [kk,c] of pos){const d=Math.hypot((c[0]-lo)*73.3,(c[1]-la)*111.3);if(d<bd){bd=d;best=kk}}return best}
const src=near(48.8435,2.2215),dst=near(48.8044,2.1269)
const dist=new Map([[src,0]]),prev=new Map(),done=new Set();const pq=[[0,src]]
while(pq.length){pq.sort((a,b)=>a[0]-b[0]);const [d,u]=pq.shift();if(done.has(u))continue;done.add(u);if(u===dst)break;for(const [v,w] of adj.get(u)||[]){const nd=d+w;if(nd<(dist.get(v)??1e9)){dist.set(v,nd);prev.set(v,u);pq.push([nd,v])}}}
if(!dist.has(dst)){console.log('NOT CONNECTED; reached',done.size,'nodes');process.exit(0)}
const path=[];for(let u=dst;u;u=prev.get(u))path.push(pos.get(u));path.reverse()
console.log('path km',dist.get(dst).toFixed(2));let acc=0,last=path[0],out=[last]
for(const c of path){acc+=Math.hypot((c[0]-last[0])*73.3,(c[1]-last[1])*111.3);last=c;if(acc>(+process.argv[3]||0.6)){out.push(c);acc=0}}
console.log(out.map(c=>c[1].toFixed(4)+','+c[0].toFixed(4)+'('+which(c[1],c[0])+')').join(' '))

fs.writeFileSync(S+'/path.json',JSON.stringify(out.map(c=>[+c[1].toFixed(5),+c[0].toFixed(5)])))
