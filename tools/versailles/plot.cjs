// node plot.js out.png [regions.json]  — buildings, roads, parks, Paris box edge, candidate regions, 0.01° graticule
const fs=require('fs'),path=require('path'),sharp=require(path.resolve('/Users/dfeldman/cityengine/node_modules/sharp'))
const S=process.env.DATA
const W0=2.07,E0=2.235,S0=48.788,N0=48.852,PX=1300
const kx=73.3,ky=111.3,sc=PX/((E0-W0)*kx),H=Math.round((N0-S0)*ky*sc)
const X=l=>((l-W0)*kx*sc).toFixed(1),Y=a=>((N0-a)*ky*sc).toFixed(1)
let o=[`<svg xmlns="http://www.w3.org/2000/svg" width="${PX}" height="${H}"><rect width="100%" height="100%" fill="#fff"/>`]
const parks=/^(Domaine national de Saint-Cloud|Forêt de Fausses-Reposes|Parc de Versailles|Domaine de Trianon)$/
const poly=(rings,st)=>o.push(`<path d="${rings.map(r=>'M'+r.map(c=>X(c[0])+','+Y(c[1])).join('L')+'Z').join('')}" ${st}/>`)
for(const l of fs.readFileSync(S+'/areas.geojsonseq','utf8').split('\n')){if(!l.trim())continue;const f=JSON.parse(l.replace(/^\x1e/,''));if(!parks.test(f.properties.name||''))continue
 const rs=f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat();poly(rs,'fill="#cfe8c4" stroke="#4a4" stroke-width="1"')}
const rw={motorway:2.5,trunk:2,primary:1.6,secondary:1.3,tertiary:1.1,residential:0.6,unclassified:0.6,cycleway:0.8,track:0.5,path:0.4,footway:0.3,service:0.3}
for(const l of fs.readFileSync(S+'/bh.geojsonseq','utf8').split('\n')){if(!l.trim())continue;const f=JSON.parse(l.replace(/^\x1e/,''));const p=f.properties,g=f.geometry
 if(p.building&&/Polygon/.test(g.type)){const r=g.type==='Polygon'?g.coordinates[0]:g.coordinates[0][0];o.push(`<path d="M${r.map(c=>X(c[0])+','+Y(c[1])).join('L')}Z" fill="#999"/>`)}
 else if(p.highway&&g.type==='LineString'){const w=rw[p.highway]??0.3;const col=p.highway==='cycleway'?'#c0c':(w>=1.1?'#c60':'#555');o.push(`<path d="M${g.coordinates.map(c=>X(c[0])+','+Y(c[1])).join('L')}" fill="none" stroke="${col}" stroke-width="${w}"/>`)}}
for(let l=2.07;l<=2.235;l+=0.01){o.push(`<line x1="${X(l)}" x2="${X(l)}" y1="0" y2="${H}" stroke="#08f" stroke-width="0.5"/><text x="${+X(l)+2}" y="12" font-size="11" fill="#08f">${l.toFixed(2)}</text>`)}
for(let a=48.79;a<=48.852;a+=0.01){o.push(`<line y1="${Y(a)}" y2="${Y(a)}" x1="0" x2="${PX}" stroke="#08f" stroke-width="0.5"/><text y="${+Y(a)-2}" x="2" font-size="11" fill="#08f">${a.toFixed(2)}</text>`)}
// Paris box: west 2.2180, south 48.8200
o.push(`<path d="M${X(2.218)},0L${X(2.218)},${Y(48.82)}L${PX},${Y(48.82)}" fill="none" stroke="red" stroke-width="2" stroke-dasharray="6 4"/>`)
if(process.argv[3])for(const r of JSON.parse(fs.readFileSync(process.argv[3],'utf8'))){if(r.ring)poly([r.ring.map(([la,lo])=>[lo,la])],`fill="rgba(255,0,0,0.12)" stroke="red" stroke-width="${Math.max(2,2*(r.margin||0)*sc/1000)}" stroke-opacity="0.5"`);else o.push(`<path d="M${r.line.map(([la,lo])=>X(lo)+','+Y(la)).join('L')}" fill="none" stroke="rgba(255,0,0,0.3)" stroke-linejoin="round" stroke-linecap="round" stroke-width="${2*r.margin*sc/1000}"/>`)}
o.push('</svg>')
sharp(Buffer.from(o.join(''))).png().toFile(process.argv[2]).then(()=>console.log('ok',PX,H))
