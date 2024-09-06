/** virtual element @constructor */
export function VEl(type: ElType, tag: string, props: Props, children: VNode[]): void;
export class VEl {
    /** virtual element @constructor */
    constructor(type: ElType, tag: string, props: Props, children: VNode[]);
    0: ElType;
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
export const deps: Map<Arrow, Trigger[]>;
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
/** @type {(name: string, ...args: Args) => VEl} */
export const h: (name: string, ...args: Args) => VEl;
export function isReactive(x: any): boolean;
export type ElType = "html" | "svg" | "mathml";
export type El = HTMLElement | SVGElement | MathMLElement;
export type Props = {
    [k: string]: unknown;
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
export type REl = [ElType, tag: string, Props, RNode[], El, Cache?];
/**
 * virtual textnode
 */
export type VText = ["text", txt: string, Empty, []];
/**
 * real element
 */
export type RText = ["text", txt: string, Empty, [], Text];
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
export type ElArrow = [Function, REl, key: (string | number) | null];
export type WatchArrow = [Function, null, null, effect?: Function];
export type Arrow = ElArrow | WatchArrow;
export type Trigger = [target: object, prop: string | symbol];
export type Child = VEl | string | (() => (VEl | string));
export type Children = Child[] | (() => Child[]);
export type Args = [Props, Children] | [Props, ...Child[]] | [Children] | Child[];
//# sourceMappingURL=hyper-arrow.d.ts.map