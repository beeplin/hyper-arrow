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
export function mount(selector: string, vel: VEl, options?: {
    [k: symbol | null]: string;
}): void;
/**
 * run fn() once, and when triggered, rerun fn(), or effectFn(fn()) if has effectFn
 * @template F
 * @param {F extends (() => any) ? F : never} fn
 * @param {((a: ReturnType<F extends (() => any) ? F : never>) => any)=} effectFn
 * @returns {() => void} function to stop fn rerunning by removing it from faci2ropa
 */
export function watch<F>(fn: F extends (() => any) ? F : never, effectFn?: ((a: ReturnType<F extends (() => any) ? F : never>) => any) | undefined): () => void;
export function reactive<T extends object>(obj: T): T;
/** @type {Map<Faci, WeakMap<object, Set<string | symbol>>>} */
export const faci2ropa: Map<Faci, WeakMap<object, Set<string | symbol>>>;
/** @type {WeakMap<object, Record<string | symbol, WeakSet<Faci>>>} */
export const ropa2faci: WeakMap<object, Record<string | symbol, WeakSet<Faci>>>;
export function isReactive(x: any): boolean;
export const ON_CREATE: symbol;
export const CACHE_REMOVED_CHILDREN_AND_MAY_LEAK: symbol;
export const UID_ATTR_NAME: symbol;
/**
 * @typedef {VEl | string | (() => (VEl | string))} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[Props, Children] | [Props, ...Child[]] | [Children] | Child[]} Args
 * @type {{[type: string]: {[tag: string]: (...args: Args) => VEl}}}
 */
export const tags: {
    [type: string]: {
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
 * real textnode
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
/**
 * FACI: Function And Contextual Info
 */
export type ElFaci = [REl, key: string | number | null, Function];
/**
 * FACI: Function And Contextual Info
 */
export type WatchFaci = [null, null, Function, effect?: Function];
/**
 * FACI: Function And Contextual Info
 */
export type Faci = ElFaci | WatchFaci;
export type Child = VEl | string | (() => (VEl | string));
export type Children = Child[] | (() => Child[]);
export type Args = [Props, Children] | [Props, ...Child[]] | [Children] | Child[];
//# sourceMappingURL=hyper-arrow.d.ts.map