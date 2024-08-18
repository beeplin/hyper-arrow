/**
 * create a html element, setting contexts for lazy function calls
 * @param {string} selector
 * @param {object|string=} options
 * @param {Children=} children
 * @returns {HTMLElement}
 */
export function h(selector: string, options?: (object | string) | undefined, children?: Children | undefined): HTMLElement;
/**
 * auto rerun effectFn(watchFn()) whenever watchFn's dependencies change
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {(a: ReturnType<F extends (()=> any) ? F : never>) => any=} effectFn
 * @returns {() => void} stop auto rerunning
 */
export function watch<F>(watchFn: F extends (() => any) ? F : never, effectFn?: ((a: ReturnType<F extends (() => any) ? F : never>) => any) | undefined): () => void;
/**
 * make object reactive, collecting contexts for getters, and updating dom in setters
 * @template T
 * @param {T} target
 * @returns {T}
 */
export function reactive<T>(target: T): T;
/**
 * dependency map: context -> list of getters (target[prop]) called within the context
 * @type {Map<Context, Array<[object, string|symbol]>>}
 * */
export const deps: Map<Context, Array<[object, string | symbol]>>;
export function isReactive(x: any): boolean;
/**
 * context within which reactive object runs getter
 */
export type ContextPosition = number;
/**
 * context within which reactive object runs getter
 */
export type ContextPayload = any;
/**
 * context within which reactive object runs getter
 */
export type Context = {
    fn: Function;
    at: ContextPosition;
    el?: HTMLElement;
    x?: ContextPayload;
};
/**
 * context within which reactive object runs getter
 */
export type Child = Node | string | (() => Node | string);
/**
 * /
 * /*
 */
export type Children = Child | Child[] | (() => Child | Child[]);
//# sourceMappingURL=index.d.ts.map