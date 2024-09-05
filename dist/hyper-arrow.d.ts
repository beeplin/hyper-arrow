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
 * @typedef {{[k: string]: unknown}} TagProps
 * @typedef {VEl | string | (() => (VEl | string))} TagChild
 * @typedef {TagChild[] | (() => TagChild[])} TagChildren
 * @typedef {[propsOrChildren?: TagProps|TagChildren, children?: TagChildren]} TagArgs
 * @type {{[ns: string]: {[tag: string]: (...args: TagArgs) => VEl}}}
 */
export const tags: {
    [ns: string]: {
        [tag: string]: (...args: TagArgs) => VEl;
    };
};
/** @type {(name: string, ...args: TagArgs) => VEl} */
export const h: (name: string, ...args: TagArgs) => VEl;
export function isReactive(x: any): boolean;
export type ElType = "html" | "svg" | "mathml";
export type El = HTMLElement | SVGElement | MathMLElement;
export type Props = {
    [k: string]: unknown;
    id?: string;
};
export type Cache = {
    [k: string]: VNode;
};
export type Empty = {
    [k: string]: never;
};
/**
 * virtal element
 */
export type VEl = [ElType, tag: string, Props, VNode[], El?, Cache?];
/**
 * virtual textnode
 */
export type VText = ["text", txt: string, Empty, [], Text?];
/**
 * virtual node
 */
export type VNode = VEl | VText;
export type ElArrow = [Function, VEl, key: (string | number) | null];
export type WatchArrow = [Function, null, null, effect?: Function];
export type Arrow = ElArrow | WatchArrow;
export type Trigger = [target: object, prop: string | symbol];
export type TagProps = {
    [k: string]: unknown;
};
export type TagChild = VEl | string | (() => (VEl | string));
export type TagChildren = TagChild[] | (() => TagChild[]);
export type TagArgs = [propsOrChildren?: TagProps | TagChildren, children?: TagChildren];
//# sourceMappingURL=hyper-arrow.d.ts.map