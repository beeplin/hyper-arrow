/**
 * run watchFn() once, and whenever watchFn's dependencies change,
 * auto rerun watchFn(), or effectFn(watchFn()) if effectFn provided,
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {(a: ReturnType<F extends (()=> any) ? F : never>) => any=} effectFn
 * @returns {() => void} function to stop auto rerunning
 */
export function watch<F>(watchFn: F extends (() => any) ? F : never, effectFn?: ((a: ReturnType<F extends (() => any) ? F : never>) => any) | undefined): () => void;
/** mount virtual element to DOM */
export function mount(selector: string, ve: VE): void;
export function reactive<T extends object>(target: T): T;
export const deps: Map<Arrow, Trigger[]>;
/** @type {{[ns: string]: {[tag: string]: (...args: HArgs) => VE}}} */
export const tags: {
    [ns: string]: {
        [tag: string]: (...args: HArgs) => VE;
    };
};
/** @type {(name: string, ...args: HArgs) => VE} */
export const h: (name: string, ...args: HArgs) => VE;
export function isReactive(x: any): boolean;
export type ElType = "html" | "svg" | "mathml";
export type Props = {
    [k: string]: unknown;
    id?: string;
};
export type Cache = {
    [k: string]: VN;
};
export type Empty = {
    [k: string]: never;
};
/**
 * virtal element
 */
export type VE = [ElType, tag: string, Props, VN[], Element?, Cache?];
/**
 * virtual textnode
 */
export type VT = ["text", txt: string, Empty, [], Text?];
/**
 * virtual node
 */
export type VN = VE | VT;
export type ElementArrow = [Function, VE, k: (string | number) | null];
export type WatchArrow = [Function, null, null, effect?: Function];
export type Arrow = ElementArrow | WatchArrow;
export type Trigger = [target: object, prop: string | symbol];
export type HProps = {
    [k: string]: unknown;
};
export type HChild = VE | string | (() => (VE | string));
export type HChildren = HChild[] | (() => HChild[]);
export type HArgs = [propsOrChildren?: HProps | HChildren, children?: HChildren];
//# sourceMappingURL=hyper-arrow.d.ts.map