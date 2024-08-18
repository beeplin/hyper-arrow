/**
 * @typedef {number} ContextPosition
 * @typedef {any} ContextPayload
 * @typedef {{fn: Function,
 *            at: ContextPosition,
 *            el?: HTMLElement,
 *            x?: ContextPayload}} Context
 * @typedef {Node | string | (() => Node | string)} Child
 * @typedef {Child | Child[] | (() => Child | Child[])} Children
 */
const [OBJECT, FUNCTION] = ['object', 'function']
const [WATCH, CHILDREN, CHILD, CLASS, STYLE, PROP, ATTR] = [0, 1, 2, 3, 4, 5, 6, 7]
const BRAND = Symbol('brand')
const is = (x, type) => typeof x === type
const isMatch = (x, target, prop) => x[0] === target && x[1] === prop
const isProps = (x) => is(x, OBJECT) && !Array.isArray(x) && !(x instanceof Node)
const toArray = (x) => (Array.isArray(x) ? x : [x])
/**
 * context within which reactive object runs getter
 * @type {Context?}
 */
let context = null
/**
 * dependency map: context -> list of getters (target[prop]) called within the context
 * @type {Map<Context, Array<[target: object, prop: string|symbol]>>}
 */
export const deps = new Map()
/* build context and evaluate fn() within it, or return fn if it's not a function */
function evaluate(fn, at, el, x) {
  if (!is(fn, FUNCTION)) return fn
  context = { fn, at, el, x }
  const result = fn()
  context = null
  return result
}
/**
 * create a html element, setting contexts for lazy function calls
 * @param {string} type
 * @param {object|string=} props
 * @param {Array<Child|Children>} args
 * @returns {HTMLElement}
 */
export function h(type, props, ...args) {
  const [head, ...classes] = type.split('.')
  const [tag, id] = head.replace(/\s/g, '').split('#')
  const className = classes.join(' ')
  const el = document.createElement(tag || 'div')
  if (id) el.id = id
  if (className) el.className = className
  args = isProps(props) ? args.flat() : [props, ...args].flat()
  const children = Array.isArray(args) && args.length === 1 ? args[0] : args
  props = isProps(props) ? { children, ...props } : { children }
  for (const [key, x] of Object.entries(props))
    if (key.startsWith('on') && is(x, FUNCTION))
      el.addEventListener(key.toLowerCase().slice(2), x)
    else if (key === 'class')
      el.className = (className + ' ' + evaluate(x, CLASS, el, className)).trim()
    else if (key === 'style' && is(x, OBJECT) && x !== null)
      for (const [k, y] of Object.entries(x)) el.style[k] = evaluate(y, STYLE, el, k)
    else if (key === 'children')
      for (const [i, y] of toArray(evaluate(x, CHILDREN, el)).entries())
        el.append(evaluate(y, CHILD, el, i))
    else if (key in el) el[key] = evaluate(x, PROP, el, key)
    else el.setAttribute(key, evaluate(x, ATTR, el, key))
  return el
}
/**
 * run watchFn() once, and whenever watchFn's dependencies change,
 * auto rerun watchFn(), or effectFn(watchFn()) if effectFn provided,
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {(a: ReturnType<F extends (()=> any) ? F : never>) => any=} effectFn
 * @returns {() => void} stop auto rerunning
 */
export function watch(watchFn, effectFn) {
  evaluate(watchFn, WATCH, undefined, effectFn)
  return () => {
    for (const ctx of deps.keys()) if (ctx.fn === watchFn) deps.delete(ctx)
  }
}
/**
 * make object reactive, collecting contexts for getters, and updating DOM in setters
 * @template T
 * @param {T} target
 * @returns {T}
 */
export function reactive(target) {
  if (target !== Object(target) || target[BRAND]) return target
  // @ts-ignore
  return new Proxy(target, {
    get(target, prop) {
      if (prop === BRAND) return true
      const result = Reflect.get(target, prop)
      if (is(target, FUNCTION) && prop === 'prototype') return result
      if (!context) return reactive(result)
      if (!deps.has(context)) deps.set(context, [])
      const pairs = deps.get(context)
      if (pairs?.every((p) => !isMatch(p, target, prop))) pairs.push([target, prop])
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = Reflect.get(target, prop)
      const result = Reflect.set(target, prop, newValue)
      for (const [{ fn, at, el, x }, pairs] of deps.entries())
        for (const pair of pairs) {
          if (pair[0] === oldValue) pair[0] = newValue
          if (isMatch(pair, target, prop))
            if (at === CLASS) el.className = (x + ' ' + fn()).trim()
            else if (at === STYLE) el.style[x] = fn()
            else if (at === PROP) el[x] = fn()
            else if (at === ATTR) el.setAttribute(x, fn())
            else if (at === CHILDREN) {
              for (const ctx of deps.keys())
                if (ctx.el && el !== ctx.el && el.contains(ctx.el)) deps.delete(ctx)
              el.replaceChildren(...toArray(fn()))
            } else if (at === CHILD) {
              const old = el.children[x]
              for (const ctx of deps.keys())
                if (ctx.el && (old === ctx.el || old.contains(ctx.el))) deps.delete(ctx)
              el.replaceChild(fn(), old)
            } else if (at === WATCH) x ? x(fn()) : fn()
        }
      return result
    },
  })
}
/** check if target is reactive */
export const isReactive = (x) => !!x[BRAND]
