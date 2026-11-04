// node fringe.js regions.json — buildings outside every region but within D m of one (not in the Paris box)
const fs=require('fs');const R=JSON.parse(fs.readFileSync(process.argv[2]))
const pip=(ring,la,lo)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [ai,oi]=ring[i],[aj,oj]=ring[j];if((ai>la)!==(aj>la)&&lo<(oj-oi)*(la-ai)/(aj-ai)+oi)c=!c}return c}
const segd=(la,lo,a,b)=>{const ax=(a[1]-lo)*73300,ay=(a[0]-la)*111320,bx=(b[1]-lo)*73300,by=(b[0]-la)*111320,dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/L));return Math.hypot(ax+t*dx,ay+t*dy)}
const dist=(r,la,lo)=>{const p=r.ring||r.line;if(r.ring&&pip(p,la,lo))return 0;let m=1e9;const n=p.length;for(let i=r.ring?0:1;i<n;i++)m=Math.min(m,segd(la,lo,p[(i+n-1)%n],p[i]));return Math.max(0,m-(r.margin||0))}
const D=[150,300,500,700],c=D.map(()=>0)
for(const l of fs.readFileSync(process.env.DATA+'/bh.geojsonseq','utf8').split('\n')){if(!l.trim())continue;const f=JSON.parse(l.replace(/^\x1e/,''));if(!f.properties.building||!/Polygon/.test(f.geometry.type))continue
 const r=f.geometry.type==='Polygon'?f.geometry.coordinates[0]:f.geometry.coordinates[0][0];let x=0,y=0;for(const q of r){x+=q[0];y+=q[1]}x/=r.length;y/=r.length;if(x>=2.218&&y>=48.82)continue
 const d=Math.min(...R.map(g=>dist(g,y,x)));if(d===0)continue;D.forEach((dd,i)=>{if(d<=dd)c[i]++})}
D.forEach((d,i)=>console.log('fringe within',d,'m:',c[i]))
