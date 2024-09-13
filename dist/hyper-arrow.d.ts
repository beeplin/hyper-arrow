export function debug(value?: boolean): void;
/** virtual element, array-like class @constructor */
export function VEl(type: ElType, tag: string, props: Props, children: VNode[]): void;
export class VEl {
    /** virtual element, array-like class @constructor */
    constructor(type: ElType, tag: string, props: Props, children: VNode[]);
    4: ElType;
    1: string;
    2: Props;
    3: VNode[];
}
/** mount virtual element to DOM
 * @typedef {{[UID_ATTR_NAME]?: string}} Options
 * @param {string} selector @param {VEl} vel @param {Options} options
 */
export function mount(selector: string, vel: VEl, options?: Options): void;
/**
 * run fn() once, and when triggered, rerun fn(), or effect(fn()) if has effect
 * returns a function that stops fn from rerunning
 * @template F @param {ZI<F>} fn @param {Effect<F>=} effect @return {() => void}
 */
export function watch<F>(fn: ZI<F>, effect?: Effect<F> | undefined): () => void;
export function reactive<T extends object>(obj: T): T;
export const ON_CREATE: unique symbol;
export const CACHE_REMOVED_CHILDREN: unique symbol;
/** @typedef {object} Ro - reactive object */
/** @typedef {string | symbol} Pa property access */
/** @type {Map<Fawc, WeakMap<Ro, Set<Pa>>>} */
export const fawc2ropas: Map<Fawc, WeakMap<Ro, Set<Pa>>>;
/** @type {WeakMap<Ro, Record<Pa, WeakSet<Fawc>>>} */
export const ropa2fawcs: WeakMap<Ro, Record<Pa, WeakSet<Fawc>>>;
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
export const UID_ATTR_NAME: unique symbol;
export function isReactive(x: any): boolean;
/**
 * mount virtual element to DOM
 */
export type Options = {
    [UID_ATTR_NAME]?: string;
};
export type ElType = "html" | "svg" | "mathml";
export type El = HTMLElement | SVGElement | MathMLElement;
export type Tag = string;
export type Txt = string;
export type Props = {
    [k: string | symbol]: unknown;
    [CACHE_REMOVED_CHILDREN]?: number;
    [ON_CREATE]?: (el: Element) => void;
};
export type Empty = {
    [k: string]: never;
};
export type Cache = {
    [k: string]: RNode;
};
/**
 * - real element
 */
export type REl = [El, Tag, Props, RNode[], ElType, Cache?];
/**
 * - virtual text node
 */
export type VText = [null, Txt, Empty, [], "text"];
/**
 * - real text node
 */
export type RText = [Text, Txt, Empty, [], "text"];
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
 * - props | child | children
 */
export type Key = string | number | null;
/**
 * - Zero Input fn
 */
export type ZI<F> = F extends () => any ? F : never;
export type Evaluated<F> = F extends ZI<F> ? ReturnType<ZI<F>> : F;
export type Effect<F> = (arg: ReturnType<ZI<F>>) => void;
export type WatchFawc<T> = [null, null, ZI<T>, Effect<T>?];
export type ElFawc<T> = [VEl, Key, ZI<T>];
export type NotFawc<T> = [VEl, Key, T];
export type AllFawc<T> = ElFawc<T> | WatchFawc<T>;
export type Fawc = AllFawc<() => any>;
/**
 * - reactive object
 */
export type Ro = object;
/**
 * property access
 */
export type Pa = string | symbol;
export type Child = VEl | string | (() => (VEl | string));
export type Children = Child[] | (() => Child[]);
export type Args = [Props, Children] | [Props, ...Child[]] | [Children] | Child[];
//# sourceMappingURL=hyper-arrow.d.ts.map