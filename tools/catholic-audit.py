import json,glob,math,sys
S=sys.argv[1]
DEN=['protestant','reformed','lutheran','evangelical','baptist','anglican','methodist','pentecostal','adventist','episcopal','presbyterian','quaker','mennonite','free_church']
def osmid(i): 
    t,n=i[0],int(i[1:])
    return {'n':'node/%d'%n,'w':'way/%d'%n,'a':('way/%d'%(n//2) if n%2==0 else 'relation/%d'%(n//2))}[t]
def ring(geo):
    if geo['type']=='Polygon': return geo['coordinates'][0]
    if geo['type']=='MultiPolygon': return geo['coordinates'][0][0]
def area(r):
    k=111320*math.cos(math.radians(r[0][1]))
    return abs(sum(r[j][0]*k*r[j+1][1]*110540-r[j+1][0]*k*r[j][1]*110540 for j in range(len(r)-1)))/2
def inside(x,y,r):
    n=False
    for i in range(len(r)-1):
        (x1,y1),(x2,y2)=r[i][:2],r[i+1][:2]
        if (y1>y)!=(y2>y) and x<x1+(y-y1)*(x2-x1)/(y2-y1): n=not n
    return n
def dist(a,b): return math.hypot((a[0]-b[0])*111320*math.cos(math.radians(a[1])),(a[1]-b[1])*110540)
# landmark index by osm id
idx={};POS=[]
for f in glob.glob('public/landmarks/paris/*.json')+['public/landmarks/paris.json']:
    try: d=json.load(open(f))
    except: continue
    if not isinstance(d,list): continue
    for e in d:
        if not isinstance(e,dict): continue
        pr=e.get('procedural'); st='general' if pr=='parisCivic' else 'custom'
        if e.get('lat') and e.get('lon'): POS.append((e['lon'],e['lat'],st,f.split('/')[-1],e.get('name')))
        for o in e.get('osm') or []:
            if idx.get(o,('',))[0]!='custom': idx[o]=(st,f.split('/')[-1],e.get('name'))
rows=[]
for l in open(S+'/pow.geojsonseq'):
    l=l.strip('\x1e\n')
    if not l: continue
    g=json.loads(l);p=g['properties']
    d=p.get('denomination','');rel=p.get('religion')
    if rel and rel!='christian': continue
    if any(k in d for k in DEN+['orthodox','apostolic','coptic','maronite_x']): continue
    if 'catholic' not in d:
        if d or not (p.get('building') in ('church','chapel','cathedral','basilica','presbytery','monastery') or p.get('amenity')=='monastery' or p.get('historic') in ('church','chapel','monastery','abbey')): continue
        d='?'
    if 'Notre-Dame de Paris' in p.get('name',''): continue
    p['denomination']=d
    r=ring(g['geometry'])
    if r: c=(sum(q[0] for q in r)/len(r),sum(q[1] for q in r)/len(r)); a=area(r)
    else:
        c=g['geometry']['coordinates']
        while isinstance(c[0],list): c=c[0]
        a=0
    rows.append(dict(name=p.get('name','(unnamed)'),den=p.get('denomination'),c=tuple(c),a=a,r=r,ids=[osmid(g['id'])],wp=p.get('wikipedia','')))
# containing buildings for points
pts=[x for x in rows if x['a']==0]
for l in open(S+'/bld.geojsonseq'):
    if 'Polygon' not in l[:120]: continue
    g=json.loads(l.strip('\x1e\n'));r=ring(g['geometry'])
    xs=[q[0] for q in r];ys=[q[1] for q in r]
    for x in pts:
        lon,lat=x['c']
        if min(xs)<=lon<=max(xs) and min(ys)<=lat<=max(ys) and inside(lon,lat,r):
            a=area(r)
            if not x.get('ba') or a<x['ba']: x['ba']=a;x['bid']=osmid(g['id'])
for x in pts:
    if x.get('bid'): x['a']=x['ba'];x['ids'].append(x['bid'])
# dedupe: same building id or within 40 m with same first word set
out=[]
for x in sorted(rows,key=lambda x:-x['a']):
    m=next((y for y in out if set(x['ids'])&set(y['ids']) or dist(x['c'],y['c'])<40),None)
    if m: m['ids']+= [i for i in x['ids'] if i not in m['ids']]; m['wp']=m['wp'] or x['wp']
    else: out.append(x)
wd=[(float(b['coord']['value'][6:-1].split()[0]),float(b['coord']['value'][6:-1].split()[1]),b['art']['value'].split('/wiki/')[-1]) for b in json.load(open(S+'/wd.json'))['results']['bindings']]
import urllib.parse
for x in out:
    st=[idx[i] for i in x['ids'] if i in idx]+[(q[2],q[3],q[4]) for q in POS if dist(x['c'],q[:2])<30 or (x['r'] and inside(q[0],q[1],x['r']))]
    x['st']=('custom' if any(s[0]=='custom' for s in st) else 'general') if st else 'nothing'
    x['file']=st[0][1] if st else ''
    best=min(wd,key=lambda w:dist(x['c'],w[:2]))
    dd=dist(x['c'],best[:2])
    x['wiki']=('fr:'+x['wp'][3:] if x['wp'].startswith('fr:') else x['wp']) or (urllib.parse.unquote(best[2]).replace('_',' ')+' (%dm)'%dd if dd<60 else '')
print('| # | Name | Denom. | m² | Lat,lon | OSM | Status (file) | Wikipedia (fr; distance = matched by position) |\n|---|---|---|---|---|---|---|---|')
for n,x in enumerate(out,1):
    print('| %d | %s | %s | %d | %.4f,%.4f | %s | %s | %s |'%(n,x['name'],x['den'],x['a'],x['c'][1],x['c'][0],' '.join(x['ids'][:3]),x['st']+(' ('+x['file']+')' if x['file'] else ''),x['wiki']))
