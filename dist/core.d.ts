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
export type Arrow = [fn: Function, velOrEffect: VEl | Function | undefined, key: string];
export type VEl = [tag: string, props: object, children: VNode[], el?: HTMLElement];
export type VNode = VEl | string;
export type Child = VNode | (() => VNode);
export type Children = Child[] | (() => Child[]);
export type Trigger = [target: object, prop: string | symbol];
//# sourceMappingURL=core.d.ts.map