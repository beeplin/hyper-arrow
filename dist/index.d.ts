/**
 * create a virtual element, and create arrows for lazy function calls
 * @param {string} tag
 * @param {object=} props
 * @param {Array<Child|Children> =} children
 * @returns {VEl}
 */
export function h(tag: string, props?: object | undefined, children?: Array<Child | Children> | undefined): VEl;
/**
 * mount vel to DOM tree
 * @param {string} selector
 * @param {VEl} vel
 */
export function mount(selector: string, vel: VEl): void;
/**
 * run watchFn() once, and whenever watchFn's dependencies change,
 * auto rerun watchFn(), or effectFn(watchFn()) if effectFn provided,
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {(a: ReturnType<F extends (()=> any) ? F : never>) => any=} effectFn
 * @returns {() => void} stop auto rerunning
 */
export function watch<F>(watchFn: F extends (() => any) ? F : never, effectFn?: ((a: ReturnType<F extends (() => any) ? F : never>) => any) | undefined): () => void;
/**
 * make object reactive, collecting arrows for getters, and updating DOM in setters
 * @template T
 * @param {T} target
 * @returns {T}
 */
export function reactive<T>(target: T): T;
/** @type {Map<Arrow, Trigger[]>} dependency map: arrow -> triggers of the arrow */
export const deps: Map<Arrow, Trigger[]>;
export function isReactive(x: any): boolean;
export const a: any;
export const abbr: any;
export const address: any;
export const area: any;
export const article: any;
export const aside: any;
export const audio: any;
export const b: any;
export const base: any;
export const bdi: any;
export const bdo: any;
export const blockquote: any;
export const body: any;
export const br: any;
export const button: any;
export const canvas: any;
export const caption: any;
export const cite: any;
export const code: any;
export const col: any;
export const colgroup: any;
export const data: any;
export const datalist: any;
export const dd: any;
export const del: any;
export const details: any;
export const dfn: any;
export const dialog: any;
export const div: any;
export const dl: any;
export const dt: any;
export const em: any;
export const embed: any;
export const fieldset: any;
export const figcaption: any;
export const figure: any;
export const footer: any;
export const form: any;
export const h1: any;
export const h2: any;
export const h3: any;
export const h4: any;
export const h5: any;
export const h6: any;
export const head: any;
export const header: any;
export const hgroup: any;
export const hr: any;
export const html: any;
export const i: any;
export const iframe: any;
export const img: any;
export const input: any;
export const ins: any;
export const kbd: any;
export const label: any;
export const legend: any;
export const li: any;
export const link: any;
export const main: any;
export const map: any;
export const mark: any;
export const math: any;
export const menu: any;
export const menuitem: any;
export const meta: any;
export const meter: any;
export const nav: any;
export const noscript: any;
export const object: any;
export const ol: any;
export const optgroup: any;
export const option: any;
export const output: any;
export const p: any;
export const param: any;
export const picture: any;
export const pre: any;
export const progress: any;
export const q: any;
export const rb: any;
export const rp: any;
export const rt: any;
export const rtc: any;
export const ruby: any;
export const s: any;
export const samp: any;
export const script: any;
export const search: any;
export const section: any;
export const select: any;
export const slot: any;
export const small: any;
export const source: any;
export const span: any;
export const strong: any;
export const style: any;
export const sub: any;
export const summary: any;
export const sup: any;
export const svg: any;
export const table: any;
export const tbody: any;
export const td: any;
export const template: any;
export const textarea: any;
export const tfoot: any;
export const th: any;
export const thead: any;
export const time: any;
export const title: any;
export const tr: any;
export const track: any;
export const u: any;
export const ul: any;
export const var_: any;
export const video: any;
export const wbr: any;
export type Arrow = [fn: Function, velOrEffect: VEl | Function | undefined, key: string];
export type VEl = [tag: string, props: object, children: VNode[], el?: HTMLElement];
export type VNode = VEl | string;
export type Child = VNode | (() => VNode);
export type Children = Child[] | (() => Child[]);
export type Trigger = [target: object, prop: string | symbol];
//# sourceMappingURL=index.d.ts.map