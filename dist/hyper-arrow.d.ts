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
export function reactive<T>(target: T): T;
/** map for dependencies @type {Map<Arrow, Trigger[]>} */
export const deps: Map<Arrow, Trigger[]>;
/** create virtual el @type {(tag: string, p?: Props|Children, c?: Children) => Ve} */
export const h: (tag: string, p?: Props | Children, c?: Children) => Ve;
/** tag functions @type {{[tag: string]: (p?: Props|Children, c?: Children) => Ve}} */
export const tags: {
    [tag: string]: (p?: Props | Children, c?: Children) => Ve;
};
export function isReactive(x: any): boolean;
export type El = HTMLElement;
export type Props = {
    [k: string]: unknown;
};
export type Cache = Map<unknown, Node>;
export type Ve = [node: Node, tag: string, props: Props, children: Vn[], cache?: Cache];
export type Vt = [node: Node, null, props: Props, children: Vn[], null, text: string];
export type Vn = Ve | Vt;
export type Child = Ve | string | (() => (Ve | string));
export type Children = Child[] | (() => Child[]);
export type VeArrow = [fn: Function, ve: Ve, key?: string];
export type WatchArrow = [fn: Function, undefined, undefined, effect?: Function];
export type Arrow = VeArrow | WatchArrow;
export type Trigger = [target: object, prop: string | symbol];
//# sourceMappingURL=hyper-arrow.d.ts.map