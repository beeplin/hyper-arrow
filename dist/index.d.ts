/** create virtual element */
export function h(tag: string, p: (Props | Children) | undefined, c: Children | undefined): Ve;
export function mount(selector: string, ve: Ve): void;
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
/**@type {Map<Arrow, Trigger[]>}*/
export const deps: Map<Arrow, Trigger[]>;
/** @type {{[tag: string]: TagFn}} */
export const tags: {
    [tag: string]: TagFn;
};
export function isReactive(x: any): boolean;
export type El = HTMLElement;
export type Props = {
    [k: string]: unknown;
};
/**
 * (virtual element)
 */
export type Ve = [tag: string, props: Props, vnodes: Vn[], el: El];
/**
 * (virtual node)
 */
export type Vn = Ve | string;
export type Child = Vn | (() => Vn);
export type Children = Child[] | (() => Child[]);
export type VeArrow = [fn: Function, ve: Ve, key?: string];
export type WatchArrow = [fn: Function, undefined, undefined, effect?: Function];
export type Arrow = VeArrow | WatchArrow;
export type Trigger = [target: object, prop: string | symbol];
export type TagFn = (propsOrChildren?: Props | Children, children?: Children) => Ve;
//# sourceMappingURL=index.d.ts.map