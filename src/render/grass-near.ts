/**
 * NEAR-FIELD GRASS GEOMETRY (docs/GRASS-PLAN.md phase 2; chosen from the grass lab, src/grass-lab.ts).
 *
 *   const near = new GrassNear(scene, mask, { quality: 'high' })     // mask: render/grass-mask.ts
 *   each frame:  mask.near(x, z);  near.update(eyeX, eyeZ, timeSeconds)
 *
 * Two layers, both one draw call of thin instances, nothing rebuilt per frame, nothing swims (all placement is a
 * hash of the WORLD cell, wrapped round the rider in the vertex shader):
 *   SHELLS: L stacked horizontal grid patches (1 m vertices, snapped to the metre) round the rider, alpha-tested
 *     from a hash, for manicured / lawn / the undergrowth of unkempt and meadow. Height from the mask type.
 *   CARDS:  clumps of three crossed alpha-cut quads (a blade texture drawn on a canvas at load) for unkempt and
 *     meadow, thinned by a hash towards the radius edge so the edge is a dither, never a pop.
 * Both read the mask texture in the vertex shader (type 0 drops the card and the shell vertex's grass) and
 * the fragment shader (discard where type 0), pick height / colour / density by type, and wind-bend by time.
 * Colours blend to the ground through `fieldGlsl`, which should be the city ground's own colour function.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Effect } from '@babylonjs/core/Materials/effect'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3, Vector4 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import type { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture'
import { Vector2 } from '@babylonjs/core/Maths/math.vector'
import { GRASS_HEIGHT_GLSL, GM } from './grass-mask.ts'
const GM_SHELL_KEEP = GM.shellLiftKeep

/** what the grass needs of render/grass-mask.ts's GrassMask (the lab passes a synthetic one) */
export interface MaskLike { texture: BaseTexture; origin: { x: number; z: number; size: number }; heightTexture?: BaseTexture | null }

export const GN = {
  /** per mask type 1..4 (manicured, lawn, unkempt, meadow): card height (m), shell stack height (m) */
  cardH: [0.045, 0.07, 0.16, 0.55], shellH: [0.04, 0.065, 0.07, 0.14],
  /** cards: clump width (m) by type, wind (fraction of height) by type, straw share by type */
  cardW: [0.16, 0.2, 0.3, 0.55], wind: [0, 0.15, 0.35, 0.8], straw: [0, 0.02, 0.22, 0.4],
  /** card layer A (cell 0.5 m, 2 per cell): fade start/end (m) and kept fraction per type */
  aR0: [1, 1, 14, 10], aR1: [1, 1, 20, 15], aKeep: [0, 0, 1, 0.31],
  /** card layer B (cell 1 m, 3 per cell, meadow only): fade-in span and fade-out span */
  bIn0: 10, bIn1: 14, bR0: 22, bR1: 30, bKeep: 0.85,
  /** shells: patch radius (m) and shells per patch; cells per metre by type; low variant below */
  shellRadius: 9, shells: 8, shellDens: [180, 140, 90, 50],
  high: { shells: 8, shellRadius: 9, cardDensity: 1, cardRange: 1 },
  medium: { shells: 4, shellRadius: 6, cardDensity: 0.5, cardRange: 0.6 },
  hmin: 0.35,
}

export interface GrassNearOptions {
  quality?: 'high' | 'medium'
  /** ground height under a world point: GLSL `float groundY(vec2 p)` (uses nothing but uniforms/samplers you pass to the material); default flat at uBaseY */
  groundGlsl?: string
  /** the city ground's own colour and a 0..1 patchiness: GLSL `vec4 grassField(vec2 p, int type)`; default is the lab's stand-in */
  fieldGlsl?: string
  baseY?: number
  renderingGroupId?: number
  /** the city's fog (1 - exp(-depth * density), as the road and facade shaders), not the lab's squared one */
  cityFog?: boolean
}

const COMMON = `
precision highp float;
uniform vec3 uSky;
uniform vec3 uSunCol;
uniform vec3 uSunDir;
uniform vec3 uFog;
uniform float uFogD;
uniform float uExpo;
uniform vec3 uCam;
uniform vec3 uMaskO;
uniform sampler2D uMask;
uniform float uBaseY;
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float hash13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}
vec2 hash22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);}
float maskType(vec2 p){
  vec2 uv=(p-uMaskO.xy)/uMaskO.z;
  if(uv.x<0.0||uv.y<0.0||uv.x>=1.0||uv.y>=1.0)return 0.0;
  return floor(texture2D(uMask,uv).r*255.0/50.0+0.5);
}
float pick(vec4 v,float t){return t<1.5?v.x:t<2.5?v.y:t<3.5?v.z:v.w;}
#GROUND#
#FIELD#
vec3 lightUp(vec3 n){
  float ndl=dot(n,uSunDir);
  // the ground's own terms (facade 'ground' variant, road material): sky for an up normal, plus the sun by its cosine, no scaling
  return uSky*(0.5+0.5*n.y)+uSunCol*max(ndl,0.0);
}
vec3 applyFog(vec3 c,float d){float f=1.0-exp(-d*d*uFogD*uFogD*2.0);return mix(c,uFog,clamp(f,0.0,1.0));}
vec2 windAt(vec2 p,float t){
  float g=sin(dot(p,vec2(0.55,0.35))-t*1.4)*0.5+0.5;
  float n=vnoise(p*0.09+vec2(t*0.25,0.0));
  return vec2(0.8,0.6)*(0.25+0.75*g)*(0.5+0.8*n);
}
`
const DEF_GROUND = 'float groundY(vec2 p){return uBaseY;}\nfloat groundLift(vec2 p){return 0.0;}'
// the lab's stand-in ground: manicured/lawn stripes, unkempt straw patches, meadow gold
export const GN_FIELD_GLSL = `
vec4 grassField(vec2 p,float type){
  float n1=vnoise(p*0.11), n2=vnoise(p*0.45+17.0), n3=vnoise(p*2.3+5.0);
  vec3 col; float m=1.0;
  if(type<2.5){
    col=mix(vec3(0.50,0.55,0.24),vec3(0.42,0.52,0.20),n1);
    col*=0.88+0.24*n2;
    col*=0.94+0.12*step(0.5,fract(p.x/2.2+0.1*n1));
    m=0.8+0.2*n3;
  } else if(type<3.5){
    vec3 green=vec3(0.46,0.52,0.22), straw=vec3(0.72,0.63,0.34), dirt=vec3(0.45,0.36,0.22);
    float dry=smoothstep(0.55,0.85,n1*0.7+n2*0.5);
    col=mix(green,straw,dry);
    float bare=smoothstep(0.80,0.92,vnoise(p*0.9+3.0)*0.6+n1*0.5);
    col=mix(col,dirt,bare*0.7);
    col*=0.85+0.3*n3;
    m=mix(0.45,1.0,n2)*(1.0-0.75*bare);
  } else {
    float g=smoothstep(0.35,0.65,n1);
    col=mix(vec3(0.80,0.66,0.31),vec3(0.50,0.55,0.24),g*0.6);
    col=mix(col,vec3(0.88,0.80,0.54),smoothstep(0.55,0.8,n2)*0.5);
    col*=0.8+0.4*n3;
    m=0.3+0.7*smoothstep(0.2,0.7,vnoise(p*0.18+9.0));
  }
  return vec4(col,m);
}`

// ---- shells: a 1 m grid patch snapped to the metre, stacked L times by instance
const SHELL_VS = `${COMMON}
attribute vec3 position;
attribute vec4 world0;
uniform mat4 viewProjection;
uniform vec4 uShell;
uniform vec4 uShH;
varying vec3 vW;
varying float vL;
varying float vHt;
varying float vFade;
void main(){
  vec2 p=floor(uCam.xz)+position.xz;
  float t=maskType(p+0.5);
  float ht=pick(uShH,max(t,1.0))*step(0.5,t);
  float l=world0.x;
  float d=length(p-uCam.xz);
  vFade=1.0-smoothstep(uShell.x*0.55,uShell.x*0.95,d);
  vW=vec3(p.x,groundY(p)-groundLift(p)*${(1 - GM_SHELL_KEEP).toFixed(2)}+l*ht,p.y);vL=l;vHt=ht;
  gl_Position=viewProjection*vec4(vW,1.0);
}`
const SHELL_FS = `${COMMON}
varying vec3 vW;
varying float vL;
varying float vHt;
varying float vFade;
uniform vec4 uShell;
uniform vec4 uShCell;
void main(){
  float type=maskType(vW.xz);
  if(type<0.5||vHt<0.003)discard;
  vec2 uv=vW.xz*pick(uShCell,type);
  vec2 fw=fwidth(uv);
  float px=max(fw.x,fw.y);
  float detail=1.0-smoothstep(0.3,0.8,px);
  vec2 id=floor(uv);
  if(hash12(id+13.7)>detail*vFade)discard;
  vec4 fld=grassField(vW.xz,type);
  float hb=mix(${GN.hmin.toFixed(2)},1.0,pow(hash12(id+7.1),1.2))*fld.a;
  float l=vL;
  if(l>hb)discard;
  vec2 f=fract(uv)-0.5-(hash22(id)-0.5)*0.45;
  if(length(f)>0.62*(1.0-0.8*l/hb))discard;
  vec3 col=fld.rgb*(0.8+0.4*hash12(id+1.7));
  col=mix(col,vec3(0.78,0.68,0.38),0.75*step(hash12(id+5.5),pick(uStraw,type)));
  vec3 c=col*mix(0.72,1.12,l)*lightUp(vec3(0.0,1.0,0.0))*uExpo;
  gl_FragColor=vec4(applyFog(c,length(uCam-vW)),1.0);
}`.replace('uniform vec4 uShCell;', 'uniform vec4 uShCell;\nuniform vec4 uStraw;')

// ---- cards
const CARD_VS = `${COMMON}
attribute vec3 position;
attribute vec2 uv;
attribute vec4 world0;
uniform mat4 viewProjection;
uniform vec4 uLayer;
uniform vec4 uCH;
uniform vec4 uCW;
uniform vec4 uCWind;
uniform vec4 uCStraw;
uniform vec4 uK0;
uniform vec4 uK1;
uniform vec4 uK2;
uniform vec2 uInOut;
uniform float uTime;
varying vec3 vBase;
varying vec2 vUv;
varying vec3 vW;
void main(){
  float N=floor(2.0*uLayer.x/uLayer.y+0.5);
  vec2 base=floor(uCam.xz/uLayer.y)-N*0.5;
  vec2 cell=base+mod(world0.xy-base,N);
  vec3 s3=vec3(cell,world0.z);
  vec2 rj=hash22(cell*1.37+world0.z*vec2(7.7,3.1));
  vec4 r=vec4(hash13(s3+11.0),hash13(s3+23.0),hash13(s3+37.0),hash13(s3+51.0));
  vec2 pos=(cell+rj)*uLayer.y;
  float d=length(pos-uCam.xz);
  float t0=maskType(pos);
  float keep=0.0;
  if(t0>2.5){
    float a=smoothstep(pick(uK1,t0),pick(uK2,t0),d);
    keep=pick(uK0,t0)*(1.0-a);
    keep*=uLayer.z>0.5?smoothstep(uInOut.x,uInOut.y,d):1.0;
  }
  float h=pick(uCH,t0)*mix(${GN.hmin.toFixed(2)},1.0,pow(r.w,1.5));
  vec4 fld=grassField(pos,t0);
  h*=fld.a*1.1;
  if(r.x>keep||h<0.01){gl_Position=vec4(0.,0.,2.,1.);vBase=vec3(0.);vUv=vec2(0.);vW=vec3(0.);return;}
  float t=position.y;
  float a=r.y*3.14159+position.z*1.0472;
  vec2 dir=vec2(cos(a),sin(a));
  float sz=pick(uCW,t0);
  vec2 wnd=windAt(pos,uTime)*pick(uCWind,t0)*h;
  vec2 off=wnd*t*t+vec2(cos(r.z*6.28),sin(r.z*6.28))*0.55*h*0.3*t*t;
  vec3 wp=vec3(pos.x+dir.x*position.x*sz+off.x,groundY(pos)+h*t,pos.y+dir.y*position.x*sz+off.y);
  vec3 col=fld.rgb*(0.85+0.3*r.x/max(keep,0.001));
  col=mix(col,vec3(0.78,0.68,0.38),0.6*step(r.z,pick(uCStraw,t0)));
  vBase=col;vUv=uv;vW=wp;
  gl_Position=viewProjection*vec4(wp,1.0);
}`
const CARD_FS = `${COMMON}
varying vec3 vBase;
varying vec2 vUv;
varying vec3 vW;
uniform sampler2D uTex;
void main(){
  vec4 tx=texture2D(uTex,vUv,-0.5);
  if(tx.a<0.45)discard;
  float ao=mix(0.5,1.25,vUv.y)*(0.75+0.5*tx.r);
  vec3 c=vBase*ao*lightUp(vec3(0.0,1.0,0.0))*uExpo;
  gl_FragColor=vec4(applyFog(c,length(uCam-vW)),1.0);
}`

function drawBladeTexture(size = 256): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  let seed = 12345
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 26; i++) {
    const x0 = size * (0.12 + 0.76 * rnd())
    const hgt = size * (0.55 + 0.43 * rnd())
    const lean = (rnd() - 0.5) * size * 0.45 + (x0 - size / 2) * 0.25
    const wd = size * (0.014 + 0.016 * rnd())
    const shade = 90 + Math.floor(120 * rnd())
    g.fillStyle = `rgb(${shade},${shade},${shade})`
    g.beginPath()
    g.moveTo(x0 - wd, size)
    g.quadraticCurveTo(x0 - wd * 0.6 + lean * 0.1, size - hgt * 0.55, x0 + lean, size - hgt)
    g.quadraticCurveTo(x0 + wd * 0.6 + lean * 0.1, size - hgt * 0.55, x0 + wd, size)
    g.closePath()
    g.fill()
  }
  return c
}

function cardMesh(scene: Scene): Mesh {
  const pos: number[] = [], uvs: number[] = [], idx: number[] = []
  for (let p = 0; p < 3; p++) {
    const b = p * 4
    pos.push(-0.5, 0, p, 0.5, 0, p, -0.5, 1, p, 0.5, 1, p)
    uvs.push(0, 0, 1, 0, 0, 1, 1, 1)
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2)
  }
  const m = new Mesh('grassCards', scene)
  const vd = new VertexData(); vd.positions = pos; vd.uvs = uvs; vd.indices = idx; vd.applyToMesh(m)
  return m
}

function instanceBuffer(n: number, k: number): Float32Array {
  const a = new Float32Array(n * n * k * 16)
  let o = 0
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) for (let s = 0; s < k; s++) { a[o] = i; a[o + 1] = j; a[o + 2] = s; a[o + 15] = 1; o += 16 }
  return a
}

let regId = 0
const v4 = (a: number[]) => new Vector4(a[0], a[1], a[2], a[3])

export class GrassNear {
  readonly meshes: Mesh[] = []
  /** stats for the budget table */
  tris = 0
  instances = 0
  private readonly mats: ShaderMaterial[] = []
  private readonly cardLayers: Array<{ m: ShaderMaterial; layer: number[]; inOut: number[] }> = []
  private readonly sun = new Vector3(0.5, 0.7, 0.5)
  private readonly cam = new Vector3()
  private readonly cardRange: number
  private enabled = true
  private light = { sky: new Color3(0.42, 0.47, 0.58), sunCol: new Color3(1.16, 1.05, 0.87), fog: new Color3(0.72, 0.76, 0.82), fogD: 0.0012, expo: 1.18 }

  constructor(private readonly scene: Scene, private readonly mask: MaskLike, opt: GrassNearOptions = {}) {
    const q = GN[opt.quality ?? 'high']
    this.cardRange = q.cardRange
    const id = regId++
    // (a mask that carries a height window gives the ground for free: the city's terrain under the rider)
    const hTex = !opt.groundGlsl && mask.heightTexture ? mask.heightTexture : null
    const ground = opt.groundGlsl ?? (hTex ? GRASS_HEIGHT_GLSL : DEF_GROUND)
    const fog = (src: string) => opt.cityFog ? src.replace('float f=1.0-exp(-d*d*uFogD*uFogD*2.0);', 'float f=1.0-exp(-d*uFogD);') : src
    const prep = (src: string) => fog(src.replace('#GROUND#', ground).replace('#FIELD#', opt.fieldGlsl ?? GN_FIELD_GLSL))
    const mk = (kind: string, vs: string, fs: string, attrs: string[], uni: string[], samplers: string[]): ShaderMaterial => {
      const name = `gnear${kind}${id}`
      Effect.ShadersStore[`${name}VertexShader`] = prep(vs)
      Effect.ShadersStore[`${name}FragmentShader`] = prep(fs)
      const m = new ShaderMaterial(name, this.scene, name, {
        attributes: attrs,
        uniforms: ['viewProjection', 'uSky', 'uSunCol', 'uSunDir', 'uFog', 'uFogD', 'uExpo', 'uCam', 'uMaskO', 'uBaseY', ...uni],
        samplers: ['uMask', ...(hTex ? ['uHeight'] : []), ...samplers],
      })
      if (hTex) m.setTexture('uHeight', hTex)
      m.backFaceCulling = false
      m.setTexture('uMask', this.mask.texture)
      m.setFloat('uBaseY', opt.baseY ?? 0)
      this.mats.push(m)
      return m
    }
    const inst = ['world0', 'world1', 'world2', 'world3']
    const place = (mesh: Mesh) => {
      mesh.alwaysSelectAsActiveMesh = true
      mesh.isPickable = false
      mesh.doNotSyncBoundingInfo = true
      if (opt.renderingGroupId !== undefined) mesh.renderingGroupId = opt.renderingGroupId
      this.meshes.push(mesh)
    }

    // shells
    {
      const L = q.shells, R = q.shellRadius, n = 2 * Math.ceil(R) + 1
      const pos: number[] = [], idx: number[] = []
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) pos.push(i - Math.ceil(R), 0, j - Math.ceil(R))
      for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i; idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1) }
      const mesh = new Mesh('grassShells', this.scene)
      const vd = new VertexData(); vd.positions = pos; vd.indices = idx; vd.applyToMesh(mesh)
      const buf = new Float32Array(L * 16)
      for (let i = 0; i < L; i++) { buf[i * 16] = (i + 1) / L; buf[i * 16 + 15] = 1 }
      mesh.thinInstanceSetBuffer('matrix', buf, 16, true)
      const m = mk('Shell', SHELL_VS, SHELL_FS, ['position', ...inst], ['uShell', 'uShH', 'uShCell', 'uStraw'], [])
      m.setVector4('uShell', new Vector4(R, 0, 0, 0))
      m.setVector4('uShH', v4(GN.shellH))
      m.setVector4('uShCell', v4(GN.shellDens))
      m.setVector4('uStraw', v4(GN.straw))
      mesh.material = m
      place(mesh)
      this.instances += L
      this.tris += idx.length / 3 * L
    }

    // cards
    {
      const tex = new Texture(drawBladeTexture().toDataURL('image/png'), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE)
      tex.hasAlpha = true
      const mkLayer = (R: number, cs: number, kPer: number, isB: boolean) => {
        const mesh = cardMesh(this.scene)
        const n = Math.ceil((2 * R) / cs)
        const k = Math.max(1, Math.round(kPer))
        mesh.thinInstanceSetBuffer('matrix', instanceBuffer(n, k), 16, true)
        const m = mk(isB ? 'CardB' : 'CardA', CARD_VS, CARD_FS, ['position', 'uv', ...inst],
          ['uLayer', 'uCH', 'uCW', 'uCWind', 'uCStraw', 'uK0', 'uK1', 'uK2', 'uInOut', 'uTime'], ['uTex'])
        m.setTexture('uTex', tex)
        mesh.material = m
        place(mesh)
        this.cardLayers.push({ m, layer: [R, cs, isB ? 1 : 0, 0], inOut: [GN.bIn0 * q.cardRange, GN.bIn1 * q.cardRange] })
        this.instances += n * n * k
        this.tris += n * n * k * 6
      }
      const dens = q.cardDensity
      const rg = q.cardRange
      mkLayer(GN.aR1[2] * rg, 0.5, 2 * dens, false)
      mkLayer(GN.bR1 * rg, 1.0, 3 * dens, true)
    }
    this.setRange()
  }

  private setRange(): void {
    const rg = this.cardRange
    const s = (a: number[]) => a.map((x) => x * rg)
    for (const c of this.cardLayers) {
      const isB = c.layer[2] > 0.5
      const m = c.m
      m.setVector4('uCH', v4(GN.cardH)); m.setVector4('uCW', v4(GN.cardW)); m.setVector4('uCWind', v4(GN.wind)); m.setVector4('uCStraw', v4(GN.straw))
      if (isB) {
        m.setVector4('uK0', v4([0, 0, 0, GN.bKeep])); m.setVector4('uK1', v4([1, 1, 1, GN.bR0 * rg])); m.setVector4('uK2', v4([1, 1, 1, GN.bR1 * rg]))
      } else {
        m.setVector4('uK0', v4(GN.aKeep)); m.setVector4('uK1', v4(s(GN.aR0))); m.setVector4('uK2', v4(s(GN.aR1)))
      }
    }
  }

  setLight(sunDir: Vector3, p: Partial<GrassNear['light']> = {}): void { this.sun.copyFrom(sunDir); Object.assign(this.light, p) }
  setEnabled(on: boolean): void { this.enabled = on; for (const m of this.meshes) m.setEnabled(on) }

  /** each frame, after mask.near(x, z): the eye position and a clock in seconds. Sets a few uniforms; nothing is rebuilt. */
  update(eyeX: number, eyeZ: number, time: number): void {
    if (!this.enabled) return
    this.cam.set(eyeX, 0, eyeZ)
    const o = this.mask.origin
    const L = this.light
    for (const m of this.mats) {
      m.setColor3('uSky', L.sky); m.setColor3('uSunCol', L.sunCol); m.setVector3('uSunDir', this.sun)
      m.setColor3('uFog', L.fog); m.setFloat('uFogD', L.fogD); m.setFloat('uExpo', L.expo)
      m.setVector3('uCam', this.cam)
      m.setVector3('uMaskO', new Vector3(o.x, o.z, o.size))
    }
    for (const c of this.cardLayers) {
      c.m.setVector4('uLayer', v4(c.layer)); c.m.setVector2('uInOut', new Vector2(c.inOut[0], c.inOut[1])); c.m.setFloat('uTime', time)
    }
  }

  dispose(): void {
    for (const m of this.meshes) m.dispose()
    for (const m of this.mats) m.dispose()
    this.meshes.length = 0; this.mats.length = 0
  }
}
