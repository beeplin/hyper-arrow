/**
 * create a html element, setting contexts for lazy function calls
 * @param {string} type
 * @param {object|string=} props
 * @param {Array<Child|Children>} args
 * @returns {HTMLElement}
 */
export function h(type: string, props?: (object | string) | undefined, ...args: Array<Child | Children>): HTMLElement;
/**
 * run watchFn() once, and whenever watchFn's dependencies change,
 * auto rerun watchFn(), or effectFn(watchFn()) if effectFn provided,
 *
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
 */
export const deps: Map<Context, Array<[object, string | symbol]>>;
export function isReactive(x: any): boolean;
export type ContextPosition = number;
export type ContextPayload = any;
export type Context = {
    fn: Function;
    at: ContextPosition;
    el?: HTMLElement;
    x?: ContextPayload;
};
export type Child = Node | string | (() => Node | string);
export type Children = Child | Child[] | (() => Child | Child[]);
//# sourceMappingURL=index.d.ts.map