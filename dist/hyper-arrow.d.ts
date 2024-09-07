/** virtual element @constructor */
export function VEl(type: ElType, tag: string, props: Props, children: VNode[]): void;
export class VEl {
    /** virtual element @constructor */
    constructor(type: ElType, tag: string, props: Props, children: VNode[]);
    4: ElType;
    1: string;
    2: Props;
    3: VNode[];
}
/** mount virtual element to DOM */
export function mount(selector: string, vel: VEl): void;
/**
 * run watchFn() once, and whenever watchFn's dependencies change,
 * auto rerun watchFn(), and run effectFn(watchFn()) if effectFn provided
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {((a: ReturnType<F extends (() => any) ? F : never>) => any)=} effectFn
 * @returns {() => void} fn to stop watchFn from rerunning by removing it from deps
 */
export function watch<F>(watchFn: F extends (() => any) ? F : never, effectFn?: ((a: ReturnType<F extends (() => any) ? F : never>) => any) | undefined): () => void;
export function reactive<T extends object>(target: T): T;
/** @type {Map<Arrow, WeakMap<object, Set<string | symbol>>>}*/
export const deps: Map<Arrow, WeakMap<object, Set<string | symbol>>>;
/** @type {WeakMap<object, Record<string | symbol, WeakSet<Arrow>>>} */
export const reverseDeps: WeakMap<object, Record<string | symbol, WeakSet<Arrow>>>;
export function isReactive(x: any): boolean;
export const ON_CREATE: unique symbol;
export const CACHE_REMOVED_CHILDREN_AND_MAY_LEAK: unique symbol;
/**
 * @typedef {VEl | string | (() => (VEl | string))} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[Props, Children] | [Props, ...Child[]] | [Children] | Child[]} Args
 * @type {{[ns: string]: {[tag: string]: (...args: Args) => VEl}}}
 */
export const tags: {
    [ns: string]: {
        [tag: string]: (...args: Args) => VEl;
    };
};
export type ElType = "html" | "svg" | "mathml";
export type El = HTMLElement | SVGElement | MathMLElement;
export type Props = {
    [k: string | symbol]: unknown;
};
export type Cache = {
    [k: string]: RNode;
};
export type Empty = {
    [k: string]: never;
};
/**
 * real element
 */
export type REl = [El, tag: string, Props, RNode[], ElType, Cache?];
/**
 * virtual textnode
 */
export type VText = [null, txt: string, Empty, [], "text"];
/**
 * real element
 */
export type RText = [Text, txt: string, Empty, [], "text"];
/**
 * virtual node
 */
export type VNode = VEl | VText;
/**
 * real node
 */
export type RNode = REl | RText;
/**
 * any node
 */
export type ANode = VNode | RNode;
export type ElArrow = [REl, key: string | number | null, Function];
export type WatchArrow = [null, null, Function, effect?: Function];
export type Arrow = ElArrow | WatchArrow;
export type Child = VEl | string | (() => (VEl | string));
export type Children = Child[] | (() => Child[]);
export type Args = [Props, Children] | [Props, ...Child[]] | [Children] | Child[];
//# sourceMappingURL=hyper-arrow.d.ts.map