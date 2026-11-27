/**
 * Near-field grass geometry lab (phase 2 of docs/GRASS-PLAN.md). An isolated page, nothing of the city:
 *
 *   /?grasslab=1&tech=shells|blades|cards|none&type=manicured|unkempt|meadow
 *       &density=1 (multiplier)  &radius=24 (blades/cards, m)  &shells=8  &srad=10 (shell patch m)
 *       &move=1 (ride at 7 m/s)  &pitch=8 (deg down)  &h=1.6 (eye m)  &fov=60  &sunaz=60  &lod=0|1 (cheap variant)
 *
 * Everything is placed from a hash of the WORLD cell and wrapped round the rider in the vertex shader, so nothing is
 * rebuilt per frame and nothing swims. window.grassReady, window.labStats {tris, instances}, window.__lab.
 */
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector2, Vector3, Vector4 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Effect } from '@babylonjs/core/Materials/effect'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture'
import { Constants } from '@babylonjs/core/Engines/constants'
import { GrassNear } from './render/grass-near.ts'

export const LAB = {
  // per grass type: max blade height (m), blade width (m), lean (fraction of height), wind (m/height), straw share,
  // min height fraction, shell cells per m, near-ring blades per m2, far-ring blades per m2
  types: {
    manicured: { id: 0, h: 0.045, w: 0.0035, lean: 0.25, wind: 0.0, straw: 0.0, hmin: 0.7, shellDens: 180, near: 500, far: 30, R: 14, nearFrac: 0.3, cardW: 0.16, cardDens: 30, cardR: 14 },
    unkempt: { id: 1, h: 0.16, w: 0.006, lean: 0.55, wind: 0.35, straw: 0.22, hmin: 0.3, shellDens: 90, near: 220, far: 20, R: 20, nearFrac: 0.3, cardW: 0.3, cardDens: 8, cardR: 20 },
    meadow: { id: 2, h: 0.55, w: 0.010, lean: 0.7, wind: 0.8, straw: 0.4, hmin: 0.35, shellDens: 40, near: 150, far: 12, R: 30, nearFrac: 0.3, cardW: 0.55, cardDens: 2.5, cardR: 28 },
  },
  eye: 1.6, speed: 7, fogDensity: 0.0012, exposure: 1.18, groundDark: 0.78,
  sunEl: 42, // degrees
  sky: new Color3(0.42, 0.47, 0.58), sunCol: new Color3(1.16, 1.05, 0.87), fog: new Color3(0.72, 0.76, 0.82),
  nearR: 0.3, // near blade ring as a fraction of radius
  nearCell: 0.5, farCell: 1.5, farWide: 2.4,
}
type TypeName = keyof typeof LAB.types

const COMMON = `
precision highp float;
uniform float uType;
uniform vec3 uSky;
uniform vec3 uSunCol;
uniform vec3 uSunDir;
uniform vec3 uFog;
uniform float uFogD;
uniform float uExpo;
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float hash13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}
vec2 hash22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);}
vec4 grassField(vec2 p){
  float n1=vnoise(p*0.11), n2=vnoise(p*0.45+17.0), n3=vnoise(p*2.3+5.0);
  vec3 col; float m=1.0;
  if(uType<0.5){
    col=mix(vec3(0.50,0.55,0.24),vec3(0.42,0.52,0.20),n1);
    col*=0.88+0.24*n2;
    float stripe=step(0.5,fract(p.x/2.2+0.1*n1));
    col*=0.94+0.12*stripe;
    m=0.8+0.2*n3;
  } else if(uType<1.5){
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
}
vec3 lightUp(vec3 n){
  float ndl=dot(n,uSunDir);
  return uSky*(0.62+0.2*n.y)+uSunCol*0.62*max(ndl*0.7+0.3,0.0);
}
vec3 applyFog(vec3 c,float d){float f=1.0-exp(-d*d*uFogD*uFogD*2.0);return mix(c,uFog,clamp(f,0.0,1.0));}
`

const GROUND_VS = `
precision highp float;
attribute vec3 position;
uniform mat4 viewProjection;
varying vec3 vW;
void main(){vW=position;gl_Position=viewProjection*vec4(position,1.0);}`
const GROUND_FS = `${COMMON}
varying vec3 vW;
uniform vec3 uCam;
uniform float uGDark;
void main(){
  vec4 g=grassField(vW.xz);
  vec3 c=g.rgb*uGDark*lightUp(vec3(0.0,1.0,0.0))*uExpo;
  gl_FragColor=vec4(applyFog(c,length(vW-uCam)),1.0);
}`

// shared per-instance placement: world cell wrapped round the rider
const PLACE = `
uniform vec3 uCam;
uniform vec4 uLayer;
uniform vec4 uLod;
uniform vec4 uBl;
uniform vec4 uBl2;
uniform vec2 uView;
uniform float uTime;
vec2 windAt(vec2 p,float t){
  float g=sin(dot(p,vec2(0.55,0.35))-t*1.4)*0.5+0.5;
  float n=vnoise(p*0.09+vec2(t*0.25,0.0));
  return vec2(0.8,0.6)*(0.25+0.75*g)*(0.5+0.8*n);
}
`

const BLADE_VS = `${COMMON}${PLACE}
attribute vec3 position;
attribute vec4 world0;
uniform mat4 viewProjection;
varying vec3 vBase;
varying float vT;
varying vec3 vN;
varying vec3 vW;
void main(){
  float N=floor(2.0*uLayer.x/uLayer.y+0.5);
  vec2 base=floor(uCam.xz/uLayer.y)-N*0.5;
  vec2 cell=base+mod(world0.xy-base,N);
  float sub=world0.z;
  vec3 s3=vec3(cell,sub);
  vec2 rj=hash22(cell*1.37+sub*vec2(7.7,3.1));
  vec4 r=vec4(hash13(s3+11.0),hash13(s3+23.0),hash13(s3+37.0),hash13(s3+51.0));
  vec2 pos=(cell+rj)*uLayer.y;
  float d=length(pos-uCam.xz);
  float fin=uLod.y>uLod.x?smoothstep(uLod.x,uLod.y,d):1.0;
  float keep=fin*(1.0-smoothstep(uLod.z,uLod.w,d));
  vec4 fld=grassField(pos);
  float h=uBl.x*fld.a*mix(uBl2.y,1.0,pow(r.w,uBl2.z));
  if(r.x>keep||h<0.004){gl_Position=vec4(0.,0.,2.,1.);vBase=vec3(0.);vT=0.;vN=vec3(0.,1.,0.);vW=vec3(0.);return;}
  float t=position.y;
  float a=r.y*6.2831853;
  vec2 yaw=vec2(cos(a),sin(a));
  vec2 vh=normalize(pos-uCam.xz);
  vec2 l0=vec2(-yaw.y,yaw.x);
  vec2 lv=vec2(-vh.y,vh.x);
  vec2 lat=normalize(mix(l0,lv*(dot(l0,lv)<0.0?-1.0:1.0),0.35));
  float w=uBl.y*uLayer.w*(0.8+0.5*r.z);
  w=max(w,d*uView.x*0.7);
  float tap=1.0-pow(t,1.6)*0.96;
  float lean=uBl.w*(0.25+0.9*r.z)*h;
  vec2 wnd=windAt(pos,uTime)*uBl2.x*h;
  vec2 off=yaw*lean*t*t+wnd*t*t;
  float bendAmt=clamp((lean+length(wnd))/h,0.0,1.2);
  float y=h*t*(1.0-0.22*bendAmt*t);
  vec3 wp=vec3(pos.x+lat.x*position.x*w*tap+off.x,y,pos.y+lat.y*position.x*w*tap+off.y);
  vec3 col=fld.rgb;
  col*=0.8+0.4*r.x/max(keep,0.001);
  if(hash13(s3+77.0)<uBl2.w)col=mix(col,vec3(0.78,0.68,0.38),0.75);
  vBase=col;vT=t;
  vN=normalize(vec3(yaw.x*0.6,0.7-0.5*t*bendAmt,yaw.y*0.6));
  vW=wp;
  gl_Position=viewProjection*vec4(wp,1.0);
}`
const BLADE_FS = `${COMMON}
varying vec3 vBase;
varying float vT;
varying vec3 vN;
varying vec3 vW;
uniform vec3 uCam;
void main(){
  vec3 v=normalize(uCam-vW);
  vec3 n=vN;if(dot(n,v)<0.0)n=-n;
  float ao=mix(0.78,1.2,smoothstep(0.0,1.0,vT));
  vec3 lit=lightUp(normalize(mix(vec3(0,1,0),n,0.22)));
  float back=pow(max(dot(-v,uSunDir),0.0),3.0)*vT*0.5;
  vec3 c=vBase*ao*(lit+uSunCol*back)*uExpo;
  gl_FragColor=vec4(applyFog(c,length(uCam-vW)),1.0);
}`

const SHELL_VS = `${COMMON}
attribute vec3 position;
attribute vec4 world0;
uniform mat4 viewProjection;
uniform vec3 uCam;
uniform vec4 uShell;
varying vec3 vW;
varying float vL;
void main(){
  vec2 p=uCam.xz+position.xz*uShell.x;
  float l=world0.x;
  vW=vec3(p.x,l*uShell.y,p.y);vL=l;
  gl_Position=viewProjection*vec4(vW,1.0);
}`
const SHELL_FS = `${COMMON}
varying vec3 vW;
varying float vL;
uniform vec3 uCam;
uniform vec4 uShell;
uniform vec4 uSh2;
void main(){
  float d=length(vW.xz-uCam.xz);
  float rim=1.0-smoothstep(uShell.x*0.55,uShell.x*0.95,d);
  vec2 uv=vW.xz*uShell.z;
  vec2 fw=fwidth(uv);
  float px=max(fw.x,fw.y);
  float detail=1.0-smoothstep(0.3,0.8,px);
  vec2 id=floor(uv);
  float hr=hash12(id+13.7);
  if(hr>detail*rim)discard;
  vec4 fld=grassField(vW.xz);
  float hb=mix(uSh2.y,1.0,pow(hash12(id+7.1),uSh2.z))*fld.a;
  float l=vL;
  if(l>hb)discard;
  vec2 f=fract(uv)-0.5-(hash22(id)-0.5)*0.45;
  float r=0.62*(1.0-0.8*l/hb);
  if(length(f)>r)discard;
  vec3 col=fld.rgb*(0.8+0.4*hash12(id+1.7));
  if(hash12(id+5.5)<uSh2.w)col=mix(col,vec3(0.78,0.68,0.38),0.75);
  float ao=mix(0.45,1.25,l);
  vec3 c=col*ao*lightUp(vec3(0.0,1.0,0.0))*uExpo;
  gl_FragColor=vec4(applyFog(c,length(uCam-vW)),1.0);
}`

const CARD_VS = `${COMMON}${PLACE}
attribute vec3 position;
attribute vec2 uv;
attribute vec4 world0;
uniform mat4 viewProjection;
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
  float keep=1.0-smoothstep(uLod.z,uLod.w,d);
  vec4 fld=grassField(pos);
  float h=uBl.x*fld.a*mix(uBl2.y,1.0,pow(r.w,uBl2.z))*1.15;
  if(r.x>keep||h<0.004){gl_Position=vec4(0.,0.,2.,1.);vBase=vec3(0.);vUv=vec2(0.);vW=vec3(0.);return;}
  float t=position.y;
  float a=r.y*3.14159+position.z*1.0472;
  vec2 dir=vec2(cos(a),sin(a));
  float sz=uLayer.w;
  vec2 wnd=windAt(pos,uTime)*uBl2.x*h;
  vec2 off=wnd*t*t+vec2(cos(r.z*6.28),sin(r.z*6.28))*uBl.w*h*0.3*t*t;
  vec3 wp=vec3(pos.x+dir.x*position.x*sz+off.x,h*t,pos.y+dir.y*position.x*sz+off.y);
  vBase=fld.rgb*(0.85+0.3*r.x/max(keep,0.001));
  vUv=uv;vW=wp;
  gl_Position=viewProjection*vec4(wp,1.0);
}`
const CARD_FS = `${COMMON}
varying vec3 vBase;
varying vec2 vUv;
varying vec3 vW;
uniform vec3 uCam;
uniform sampler2D uTex;
void main(){
  vec4 tx=texture2D(uTex,vUv,-0.5);
  if(tx.a<0.45)discard;
  float ao=mix(0.5,1.25,vUv.y)*(0.75+0.5*tx.r);
  vec3 c=vBase*ao*lightUp(vec3(0.0,1.0,0.0))*uExpo;
  gl_FragColor=vec4(applyFog(c,length(uCam-vW)),1.0);
}`

// the ground for tech=near: type and colour from the synthetic mask (0 = path), same field as the grass
const GROUND_N_FS = GROUND_FS.replace('uniform float uType;', 'float uType;').replace('void main(){', `uniform sampler2D uMask;
uniform vec3 uMaskO;
void main(){
  vec2 muv=(vW.xz-uMaskO.xy)/uMaskO.z;
  float mt=(muv.x<0.0||muv.y<0.0||muv.x>=1.0||muv.y>=1.0)?0.0:floor(texture2D(uMask,muv).r*255.0/50.0+0.5);
  if(mt<0.5){
    vec3 pc=vec3(0.52,0.46,0.38)*(0.9+0.2*vnoise(vW.xz*3.0));
    gl_FragColor=vec4(applyFog(pc*uGDark*lightUp(vec3(0.0,1.0,0.0))*uExpo,length(vW-uCam)),1.0);return;
  }
  uType=mt<2.5?0.0:mt<3.5?1.0:2.0;`)
function reg(name: string, vs: string, fs: string): void {
  Effect.ShadersStore[`${name}VertexShader`] = vs
  Effect.ShadersStore[`${name}FragmentShader`] = fs
}

function drawBladeTexture(size = 256): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.clearRect(0, 0, size, size)
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

function stripMesh(scene: Scene, name: string, segs: number): Mesh {
  // positions: x = lateral -0.5..0.5, y = t along the blade
  const pos: number[] = []
  const idx: number[] = []
  for (let k = 0; k < segs; k++) pos.push(-0.5, k / segs, 0, 0.5, k / segs, 0)
  pos.push(0, 1, 0)
  for (let k = 0; k < segs - 1; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
  const last = (segs - 1) * 2
  idx.push(last, last + 1, segs * 2)
  const m = new Mesh(name, scene)
  const vd = new VertexData()
  vd.positions = pos
  vd.indices = idx
  vd.applyToMesh(m)
  return m
}

function cardMesh(scene: Scene): Mesh {
  const pos: number[] = []
  const uvs: number[] = []
  const idx: number[] = []
  for (let p = 0; p < 3; p++) {
    const b = p * 4
    pos.push(-0.5, 0, p, 0.5, 0, p, -0.5, 1, p, 0.5, 1, p)
    uvs.push(0, 0, 1, 0, 0, 1, 1, 1)
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2)
  }
  const m = new Mesh('cardClump', scene)
  const vd = new VertexData()
  vd.positions = pos
  vd.uvs = uvs
  vd.indices = idx
  vd.applyToMesh(m)
  return m
}

function instanceBuffer(n: number, k: number): Float32Array {
  const a = new Float32Array(n * n * k * 16)
  let o = 0
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) for (let s = 0; s < k; s++) {
    a[o] = i; a[o + 1] = j; a[o + 2] = s; a[o + 15] = 1
    o += 16
  }
  return a
}

/** a synthetic mask: a path down the middle, lawn and manicured on the left (with a winding path), unkempt and meadow on the right, a pond */
export function synthType(x: number, z: number): number {
  if (Math.abs(x) < 1.5) return 0
  if (x < 0) {
    if (Math.abs(x + 18 - 6 * Math.sin(z * 0.04)) < 1) return 0
    return ((z % 200) + 200) % 200 > 120 ? 1 : 2
  }
  if ((x - 12) ** 2 + ((((z % 160) + 160) % 160) - 30) ** 2 < 25) return 0
  return ((z % 160) + 160) % 160 < 80 ? 3 : 4
}
function synthMask(scene: Scene) {
  const W = 128
  const bytes = new Uint8Array(W * W)
  const texture = new RawTexture(bytes, W, W, Constants.TEXTUREFORMAT_RED, scene, false, false, Texture.NEAREST_SAMPLINGMODE, Constants.TEXTURETYPE_UNSIGNED_BYTE)
  texture.wrapU = texture.wrapV = Texture.CLAMP_ADDRESSMODE
  const origin = { x: 0, z: 0, size: W }
  let cx = Infinity, cz = Infinity
  return {
    texture, origin,
    near(x: number, z: number): boolean {
      if (Math.abs(x - cx) < 8 && Math.abs(z - cz) < 8) return false
      cx = x; cz = z
      origin.x = Math.floor(x - W / 2); origin.z = Math.floor(z - W / 2)
      for (let r = 0; r < W; r++) for (let c = 0; c < W; c++) bytes[r * W + c] = synthType(origin.x + c + 0.5, origin.z + r + 0.5) * 50
      texture.update(bytes)
      return true
    },
  }
}

const v4 = (a: number[]) => new Vector4(a[0], a[1], a[2], a[3])

export async function grassLab(canvas: HTMLCanvasElement, params: URLSearchParams): Promise<void> {
  const P = (k: string, d: number) => (params.has(k) ? Number(params.get(k)) : d)
  const tech = params.get('tech') ?? 'blades'
  const type = (params.get('type') ?? 'manicured') as TypeName
  const T = LAB.types[type]
  const density = P('density', 1)
  const radius = P('radius', T.R)
  const cheap = P('lod', 0) === 1
  const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true }, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(LAB.fog.r, LAB.fog.g, LAB.fog.b, 1)
  const cam = new UniversalCamera('cam', new Vector3(0, P('h', LAB.eye), 0), scene)
  cam.fov = (P('fov', 60) * Math.PI) / 180
  cam.minZ = 0.05
  cam.maxZ = 900
  cam.rotation.x = (P('pitch', 8) * Math.PI) / 180
  scene.activeCamera = cam
  const az = (P('sunaz', 60) * Math.PI) / 180
  const el = (LAB.sunEl * Math.PI) / 180
  const sunDir = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))

  reg('glabGround', GROUND_VS, GROUND_FS)
  reg('glabBlade', BLADE_VS, BLADE_FS)
  reg('glabShell', SHELL_VS, SHELL_FS)
  reg('glabCard', CARD_VS, CARD_FS)
  reg('glabGroundN', GROUND_VS, GROUND_N_FS)

  const mats: ShaderMaterial[] = []
  const mk = (name: string, attrs: string[], extra: string[]): ShaderMaterial => {
    const m = new ShaderMaterial(name, scene, name, {
      attributes: attrs,
      uniforms: ['viewProjection', 'uType', 'uSky', 'uSunCol', 'uSunDir', 'uFog', 'uFogD', 'uExpo', 'uCam', ...extra],
      samplers: name === 'glabCard' ? ['uTex'] : name === 'glabGroundN' ? ['uMask'] : [],
    })
    m.backFaceCulling = false
    mats.push(m)
    return m
  }
  const synth = tech === 'near' ? synthMask(scene) : null
  const ground = mk(tech === 'near' ? 'glabGroundN' : 'glabGround', ['position'], ['uGDark', 'uMaskO'])
  if (synth) ground.setTexture('uMask', synth.texture)
  const gm = new Mesh('ground', scene)
  const gv = new VertexData()
  const G = 450
  gv.positions = [-G, 0, -G, G, 0, -G, -G, 0, G, G, 0, G]
  gv.indices = [0, 2, 1, 1, 2, 3]
  gv.applyToMesh(gm)
  gm.material = ground
  gm.alwaysSelectAsActiveMesh = true

  let tris = 0
  let instances = 0
  const layerSets: Array<{ m: ShaderMaterial; layer: number[]; lod: number[]; bl: number[]; bl2: number[] }> = []
  const shellSets: Array<{ m: ShaderMaterial; shell: number[]; sh2: number[] }> = []
  const iattrs = ['world0', 'world1', 'world2', 'world3']
  const iunis = ['uLayer', 'uLod', 'uBl', 'uBl2', 'uView', 'uTime']

  const bladeLayer = (name: string, segs: number, R: number, cs: number, dens: number, wmul: number, lod: number[]) => {
    const mesh = stripMesh(scene, name, segs)
    const n = Math.ceil((2 * R) / cs)
    const k = Math.max(1, Math.round(dens * cs * cs))
    mesh.thinInstanceSetBuffer('matrix', instanceBuffer(n, k), 16, true)
    mesh.alwaysSelectAsActiveMesh = true
    const m = mk('glabBlade', ['position', ...iattrs], iunis)
    mesh.material = m
    layerSets.push({ m, layer: [R, cs, k, wmul], lod, bl: [T.h, T.w, 0, T.lean], bl2: [T.wind, T.hmin, 1.5, T.straw] })
    instances += n * n * k
    tris += n * n * k * (segs * 2 - 1)
  }

  if (tech === 'blades') {
    const nearR = radius * T.nearFrac
    const segs = cheap ? 2 : 3
    // near ring: dense thin blades; far ring: wider blades, thinned; they cross-fade over nearR..1.35 nearR
    bladeLayer('bladesNear', segs, nearR * 1.35, LAB.nearCell, T.near * density, 1, [0, 0, nearR, nearR * 1.35])
    bladeLayer('bladesFar', cheap ? 1 : 2, radius, LAB.farCell, T.far * density * (cheap ? 0.6 : 1), LAB.farWide, [nearR * 0.95, nearR * 1.3, radius * 0.78, radius])
  } else if (tech === 'cards') {
    const tex = new Texture(drawBladeTexture().toDataURL('image/png'), scene, false, true, Texture.TRILINEAR_SAMPLINGMODE)
    tex.hasAlpha = true
    const mesh = cardMesh(scene)
    const dens = T.cardDens * density * (cheap ? 0.5 : 1)
    const cs = 0.5
    const R = params.has('radius') ? radius : T.cardR
    const n = Math.ceil((2 * R) / cs)
    const k = Math.max(1, Math.round(dens * cs * cs))
    mesh.thinInstanceSetBuffer('matrix', instanceBuffer(n, k), 16, true)
    mesh.alwaysSelectAsActiveMesh = true
    const m = mk('glabCard', ['position', 'uv', ...iattrs], iunis)
    m.setTexture('uTex', tex)
    mesh.material = m
    const clump = T.cardW // clump width, m
    layerSets.push({ m, layer: [R, cs, k, clump], lod: [0, 0, R * 0.7, R], bl: [T.h, 1, 0, T.lean], bl2: [T.wind, T.hmin, 1.5, 0] })
    instances += n * n * k
    tris += n * n * k * 6
  } else if (tech === 'shells') {
    const L = P('shells', 8)
    const srad = P('srad', 10)
    const mesh = new Mesh('shells', scene)
    const vd = new VertexData()
    vd.positions = [-1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, 1]
    vd.indices = [0, 2, 1, 1, 2, 3]
    vd.applyToMesh(mesh)
    const buf = new Float32Array(L * 16)
    for (let i = 0; i < L; i++) { buf[i * 16] = (i + 1) / L; buf[i * 16 + 15] = 1 }
    mesh.thinInstanceSetBuffer('matrix', buf, 16, true)
    mesh.alwaysSelectAsActiveMesh = true
    const m = mk('glabShell', ['position', ...iattrs], ['uShell', 'uSh2'])
    mesh.material = m
    shellSets.push({ m, shell: [srad, T.h, T.shellDens * density, 0], sh2: [0, T.hmin, 1.2, T.straw] })
    instances = L
    tris = L * 2
  }

  let nearG: GrassNear | null = null
  if (synth && P('off', 0) !== 1) {
    nearG = new GrassNear(scene, synth, { quality: cheap ? 'medium' : 'high' })
    tris = nearG.tris
    instances = nearG.instances
    nearG.setLight(sunDir, { sky: LAB.sky, sunCol: LAB.sunCol, fog: LAB.fog, fogD: LAB.fogDensity, expo: LAB.exposure })
  }
  const setCommon = (m: ShaderMaterial) => {
    m.setFloat('uType', T.id)
    m.setColor3('uSky', LAB.sky)
    m.setColor3('uSunCol', LAB.sunCol)
    m.setVector3('uSunDir', sunDir)
    m.setColor3('uFog', LAB.fog)
    m.setFloat('uFogD', LAB.fogDensity)
    m.setFloat('uExpo', LAB.exposure)
    m.setVector3('uCam', cam.position)
  }
  ground.setFloat('uGDark', LAB.groundDark)

  const move = P('move', 0) === 1
  const z0 = P('z', 0)
  let fixedT: number | null = null
  const t0 = performance.now()
  const clock = () => (fixedT !== null ? fixedT : (performance.now() - t0) / 1000)
  scene.onBeforeRenderObservable.add(() => {
    const t = clock()
    cam.position.z = move || fixedT !== null ? z0 + t * LAB.speed : z0
    cam.position.x = P('x', 0)
    const pixel = (2 * Math.tan(cam.fov / 2)) / engine.getRenderHeight()
    for (const m of mats) setCommon(m)
    if (synth) {
      synth.near(cam.position.x, cam.position.z)
      ground.setVector3('uMaskO', new Vector3(synth.origin.x, synth.origin.z, synth.origin.size))
      nearG?.update(cam.position.x, cam.position.z, t)
    }
    for (const s of layerSets) {
      s.m.setVector4('uLayer', v4(s.layer))
      s.m.setVector4('uLod', v4(s.lod))
      s.m.setVector4('uBl', v4(s.bl))
      s.m.setVector4('uBl2', v4(s.bl2))
      s.m.setVector2('uView', new Vector2(pixel, 0))
      s.m.setFloat('uTime', t)
    }
    for (const s of shellSets) {
      s.m.setVector4('uShell', v4(s.shell))
      s.m.setVector4('uSh2', v4(s.sh2))
    }
  })

  engine.runRenderLoop(() => scene.render())
  const w = window as unknown as Record<string, unknown>
  w.__scene = scene
  w.labStats = { tris, instances }
  w.__lab = {
    setTime: (t: number | null) => { fixedT = t },
    gpu: async (n = 150) => {
      const gl = (engine as unknown as { _gl: WebGL2RenderingContext })._gl
      const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null
      if (!ext) return null
      const gx = gl as unknown as { beginQuery(t: number, q: unknown): void; endQuery(t: number): void; createQuery(): unknown; getQueryParameter(q: unknown, p: number): unknown }
      const pending: unknown[] = []
      const ms: number[] = []
      const poll = () => {
        while (pending.length) {
          const q = pending[0]
          if (!gx.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break
          pending.shift()
          if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) ms.push(Number(gx.getQueryParameter(q, gl.QUERY_RESULT)) * 1e-6)
        }
      }
      const o1 = scene.onBeforeRenderObservable.add(() => { const q = gx.createQuery(); gx.beginQuery(ext.TIME_ELAPSED_EXT, q); pending.push(q) })
      const o2 = scene.onAfterRenderObservable.add(() => { gx.endQuery(ext.TIME_ELAPSED_EXT); poll() })
      await new Promise<void>((done) => { let i = 0; const f = () => { i++; i < n ? requestAnimationFrame(f) : done() }; requestAnimationFrame(f) })
      for (let k = 0; k < 20 && pending.length; k++) { await new Promise((r) => setTimeout(r, 30)); poll() }
      scene.onBeforeRenderObservable.remove(o1)
      scene.onAfterRenderObservable.remove(o2)
      const m = ms.slice(10).sort((x, y) => x - y).slice(0, Math.max(1, Math.floor(ms.length / 2))) // lower half: ignore contention spikes
      return m.length ? m[Math.floor(m.length / 2)] : null
    },
  }
  await new Promise((r) => setTimeout(r, 300))
  w.grassReady = true
}
