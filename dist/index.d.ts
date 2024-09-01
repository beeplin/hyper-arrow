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
export function mount(selector: string, ve: VE): void;
export const deps: Map<Arrow, Trigger[]>;
export function h(tag: string, props?: object, children?: VNodesOrFn): VE;
/** @type {{[tag: string]: (props?: object, children?: VNodesOrFn) => VE}} */
export const tags: {
    [tag: string]: (props?: object, children?: VNodesOrFn) => VE;
};
export function isReactive(x: unknown): boolean;
export type El = HTMLElement;
/**
 * - virtual element
 */
export type VE = [tag: string, props: object, vnodes: VNode[], el?: El];
/**
 * - virtual node
 */
export type VNode = VE | string;
export type VNodeOrFn = VNode | (() => VNode);
export type VNodesOrFn = VNodeOrFn[] | (() => VNodeOrFn[]);
export type ElementArrow = [fn: Function, ve: VE, key: string];
export type WatchArrow = [fn: Function, undefined, undefined, effect?: Function];
export type Arrow = ElementArrow | WatchArrow;
export type Trigger = [target: object, prop: string | symbol];
//# sourceMappingURL=index.d.ts.map