// @ts-check
const CLASS = 1,
  STYLE = 2,
  PROPERTY = 3,
  ATTRIBUTE = 4,
  CHILDREN = 5,
  CHILD = 6,
  WATCH = 7
const isMatch = (pair, target, prop) => pair[0] === target && pair[1] === prop
const toArray = (x) => (Array.isArray(x) ? x : [x])
const isOption = (x) =>
  typeof x === 'object' && !Array.isArray(x) && !(x instanceof Node)
const reactiveBrand = Symbol('brand')
/* reactive objet has a symbol property as brand */
export const isReactive = (target) => !!target[reactiveBrand]
/**
 * context within which reactive object runs getter
 * @typedef {1|2|3|4|5|6|7} ContextPosition
 * @typedef {string|number|Function} ContextPayload
 * @typedef {{fn: Function,
 *            at: ContextPosition,
 *            el?: HTMLElement,
 *            x?: ContextPayload}} Context
 * @typedef {Node | string | (() => Node | string)} Child
 * @typedef {Child | Child[] | (() => Child | Child[])} Children
 * /
/* @type {Context?} */
let context = null
/**
 * dependency map: context -> list of getters (target[prop]) called within the context
 * @type {Map<Context, Array<[object, string|symbol]>>}
 * */
const deps = new Map()
/**
 * build context and run function within it
 * @template T
 * @param {T | (() => T)} fn
 * @param {ContextPosition} at
 * @param {HTMLElement=} el
 * @param {ContextPayload=} x
 * @returns {T}
 */
function runInContext(fn, at, el, x) {
  if (typeof fn !== 'function') return fn
  context = { fn, at, el, x }
  // @ts-ignore
  const result = fn()
  context = null
  return result
}
/**
 * create a html element, setting contexts for lazy function calls
 * @param {string} selector
 * @param {object|string=} options
 * @param {Children=} children
 * @returns {HTMLElement}
 */
export function h(selector, options, children) {
  const [head, ...classList] = selector.split('.')
  const [tag, id] = head.replace(/\s/g, '').split('#')
  const classes = classList.join(' ')
  const el = document.createElement(tag || 'div')
  if (id) el.id = id
  if (classes) el.setAttribute('class', classes)
  options = isOption(options) ? { children, ...options } : { children: options }
  for (const [key, x] of Object.entries(options))
    if (key.startsWith('on') && typeof x === 'function')
      if (key.toLowerCase() in el) el.addEventListener(key.toLowerCase().slice(2), x)
      else throw new Error('invalid event name: ' + key)
    else if (key === 'class')
      el.className = (classes + ' ' + runInContext(x, CLASS, el, classes)).trim()
    else if (key === 'style' && typeof x === 'object' && x !== null)
      for (const [_key, y] of Object.entries(x))
        el.style[_key] = runInContext(y, STYLE, el, _key)
    else if (key === 'children')
      for (const [i, y] of toArray(runInContext(x ?? [], CHILDREN, el)).entries())
        el.append(runInContext(y, CHILD, el, i))
    else if (key in el) el[key] = runInContext(x, PROPERTY, el, key)
    else el.setAttribute(key, runInContext(x, ATTRIBUTE, el, key))
  return el
}
/**
 * auto rerun effectFn(watchFn()) whenever watchFn's dependencies change
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {(a: ReturnType<F extends (()=> any) ? F : never>) => any=} effectFn
 * @returns {() => void} stop auto rerunning
 */
export function watch(watchFn, effectFn) {
  runInContext(watchFn, WATCH, undefined, effectFn)
  return () => {
    for (const ctx of deps.keys()) if (ctx.fn === watchFn) deps.delete(ctx)
  }
}
/**
 * make object reactive, collecting contexts for getters, and updating dom in setters
 * @template T
 * @param {T} target
 * @returns {T}
 */
export function reactive(target) {
  if (target !== Object(target) || target[reactiveBrand]) return target
  // @ts-ignore
  return new Proxy(target, {
    get(target, prop) {
      if (prop === reactiveBrand) return true
      const result = Reflect.get(target, prop)
      if (typeof target === 'function' && prop === 'prototype') return result
      if (!context) return reactive(result)
      if (!deps.has(context)) deps.set(context, [])
      const pairs = deps.get(context)
      if (pairs?.every((p) => !isMatch(p, target, prop))) pairs.push([target, prop])
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = Reflect.get(target, prop)
      const result = Reflect.set(target, prop, newValue)
      for (const [{ fn, el, at, x }, pairs] of deps.entries())
        for (const pair of pairs) {
          if (pair[0] === oldValue) pair[0] = newValue
          if (isMatch(pair, target, prop))
            if (el && typeof x === 'string') {
              if (at === CLASS) el.className = (x + ' ' + fn()).trim()
              else if (at === STYLE) el.style[x] = fn()
              else if (at === PROPERTY) el[x] = fn()
              else if (at === ATTRIBUTE) el.setAttribute(x, fn())
            } else if (at === CHILDREN && el) {
              for (const ctx of deps.keys())
                if (ctx.el && el !== ctx.el && el.contains(ctx.el)) deps.delete(ctx)
              el.replaceChildren(...toArray(fn()))
            } else if (at === CHILD && el && typeof x === 'number') {
              const old = el.children[x]
              for (const ctx of deps.keys())
                if (ctx.el && (old === ctx.el || old.contains(ctx.el))) deps.delete(ctx)
              el.replaceChild(fn(), old)
            } else if (at === WATCH) typeof x === 'function' ? x(fn()) : fn()
        }
      return result
    },
  })
}
