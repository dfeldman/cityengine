import json,re,math,sys
S=sys.argv[1]  # scratch dir holding claimed.json, r.geojsonseq (roads/squares), b.geojsonseq (buildings)
cl=json.load(open(S+'/claimed.json'))
X=lambda lon:(lon-2.332)*73270; Z=lambda lat:(lat-48.8605)*111320
# road/square points, weighted
pts={}
for l in open(S+'/r.geojsonseq'):
  f=json.loads(l.lstrip('\x1e'));p=f['properties'];g=f['geometry']
  w=3 if p.get('place')=='square' else {'trunk':2,'primary':2,'secondary':1.5}.get(p.get('highway'),1)
  cs=g['coordinates']
  if isinstance(cs[0],float): cs=[cs]
  while isinstance(cs[0][0],list): cs=[c for r in cs for c in r]
  for lon,lat in cs:
    k=(int(X(lon)//40),int(Z(lat)//40)); pts.setdefault(k,[]).append((X(lon),Z(lat),w))
def front(x,z):
  best=0
  for i in range(-1,2):
    for j in range(-1,2):
      for a,b,w in pts.get((int(x//40)+i,int(z//40)+j),[]):
        if math.hypot(a-x,b-z)<25: best=max(best,w)
  return best
EXC=r'(?i)ville|ventes|impôts|police|dieu|invalides|monnaie|^hôtel (ibis|novotel|mercure|best|holiday|le |la |les )'
out=[]
for l in open(S+'/b.geojsonseq'):
  f=json.loads(l.lstrip('\x1e'));p=f['properties'];nm=p.get('name','')
  if p.get('tourism')=='hotel' or p.get('building')=='hotel' or p.get('amenity') in('townhall','hospital'): continue
  named=re.match(r'(?i)^h[oô]tel\b',nm) and not re.search(EXC,nm)
  if not named: continue
  g=f['geometry'];rings=g['coordinates'] if g['type']=='Polygon' else g['coordinates'][0]
  r=rings[0];xs=[X(a) for a,b in r];zs=[Z(b) for a,b in r]
  area=abs(sum(xs[i]*zs[i-1]-xs[i-1]*zs[i] for i in range(len(r)))/2)
  # frontage: max over ring vertices
  fr=max(front(x,z) for x,z in zip(xs[::2],zs[::2]))
  oid=('way/' if p['@type']=='way' else 'relation/')+str(p['@id'])
  h=p.get('heritage','')
  s=(3 if h=='2' else 2 if h else 0)+(2 if p.get('wikipedia') else 0)+(1 if p.get('wikidata') else 0)+min(4,area/800)+fr*1.5
  out.append(dict(name=nm,osm=oid,score=round(s,1),area=round(area),front=fr,her=h,courts=len(rings)-1,claim=cl.get(oid)))
out.sort(key=lambda o:-o['score'])
json.dump(out,open(S+'/ranked.json','w'),ensure_ascii=False,indent=0)
print(len(out),'claimed',sum(1 for o in out if o['claim']))
for o in out[:45]: print(o['score'],o['name'][:40],o['area'],o['front'],o['her'],o['claim'] and o['claim'][0])
