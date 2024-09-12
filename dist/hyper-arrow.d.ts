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
    [UID_ATTR_NAME]?: string;
}): void;
/**
 * run fn() once, and when triggered, rerun fn(), or effectFn(fn()) if has effectFn
 * returns a function that can stop fn from rerunning by removing it from fawc2ropa
 * @template F @param {ZIF<F>} fn @param {Effect<F>=} effectFn @returns {() => void}
 */
export function watch<F>(fn: ZIF<F>, effectFn?: Effect<F> | undefined): () => void;
export function reactive<T extends object>(obj: T): T;
export const ON_CREATE: unique symbol;
export const CACHE_REMOVED_CHILDREN: unique symbol;
/** @type {Map<AnyFawc, WeakMap<object, Set<string | symbol>>>} */
export const fawc2ropa: Map<AnyFawc, WeakMap<object, Set<string | symbol>>>;
/** @type {WeakMap<object, Record<string | symbol, WeakSet<AnyFawc>>>} */
export const ropa2fawc: WeakMap<object, Record<string | symbol, WeakSet<AnyFawc>>>;
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
export type CacheSize = number;
/**
 * real element
 */
export type REl = [El, Tag, Props, RNode[], ElType, Cache?, CacheSize?];
/**
 * virtual text node
 */
export type VText = [null, Txt, Empty, [], "text"];
/**
 * real text node
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
export type Key = string | number | null;
/**
 * Zero Input Function
 */
export type ZIF<F> = F extends () => any ? F : never;
export type Evaluated<F> = F extends () => any ? ReturnType<ZIF<F>> : F;
export type Effect<F> = (v: ReturnType<ZIF<F>>) => unknown;
export type WatchFawc<T> = [null, null, ZIF<T>, Effect<T>?];
export type ElFawc<T> = [VEl, Key, ZIF<T>];
export type NotFawc<T> = [VEl, Key, T];
export type Fawc<T> = ElFawc<T> | WatchFawc<T>;
export type AnyFawc = Fawc<() => any>;
export type Child = VEl | string | (() => (VEl | string));
export type Children = Child[] | (() => Child[]);
export type Args = [Props, Children] | [Props, ...Child[]] | [Children] | Child[];
//# sourceMappingURL=hyper-arrow.d.ts.map