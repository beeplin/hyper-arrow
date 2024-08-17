// @ts-check
/**
 * context within which reactive object runs getter
 * @typedef {'class'|'style'|'property'|'attribute'|
 *           'children'|'child'|'effect'|'watch'} ContextType
 * @typedef {string|number|Function} ContextPayload
 * @typedef {{fn: Function, type: ContextType,
 *           el?: HTMLElement, x?: ContextPayload}} Context
 * @type {Context?}
 */
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
 * @param {ContextType} type
 * @param {HTMLElement=} el
 * @param {ContextPayload=} x
 * @returns {T}
 */
function runInContext(fn, type, el, x) {
  if (typeof fn !== 'function') return fn
  context = { fn, type, el, x }
  // @ts-ignore
  const result = fn()
  context = null
  return result
}
const toArray = (x) => (Array.isArray(x) ? x : [x])
const isOption = (x) =>
  typeof x === 'object' && !Array.isArray(x) && !(x instanceof Node)
/**
 * create a html element, setting contexts for lazy function calls
 * @typedef {Node | string | (() => Node | string)} Child
 * @typedef {Child | Child[] | (() => Child | Child[])} Children
 * @param {string} selector
 * @param {object=} options
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
      el.className = (classes + ' ' + runInContext(x, 'class', el, classes)).trim()
    else if (key === 'style' && typeof x === 'object' && x !== null)
      for (const [_key, y] of Object.entries(x))
        el.style[_key] = runInContext(y, 'style', el, _key)
    else if (key === 'children')
      for (const [i, y] of toArray(runInContext(x ?? [], 'children', el)).entries())
        el.append(runInContext(y, 'child', el, i))
    else if (key in el) el[key] = runInContext(x, 'property', el, key)
    else el.setAttribute(key, runInContext(x, 'attribute', el, key))
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
  runInContext(watchFn, 'watch', undefined, effectFn)
  return function stop() {
    for (const ctx of deps.keys()) if (ctx.fn === watchFn) deps.delete(ctx)
  }
}
const matched = (pair, target, prop) => pair[0] === target && pair[1] === prop
/* brand for reactive objects: object[isReactive] === true */
const reactiveBrand = Symbol('reactiveBrand')
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
      if (pairs?.every((p) => !matched(p, target, prop))) pairs.push([target, prop])
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = Reflect.get(target, prop)
      const result = Reflect.set(target, prop, newValue)
      for (const [{ fn, el, type, x }, pairs] of deps.entries())
        for (const pair of pairs) {
          if (pair[0] === oldValue) pair[0] = newValue
          if (matched(pair, target, prop))
            if (el && typeof x === 'string') {
              if (type === 'class') el.className = (x + ' ' + fn()).trim()
              else if (type === 'style') el.style[x] = fn()
              else if (type === 'property') el[x] = fn()
              else if (type === 'attribute') el.setAttribute(x, fn())
            } else if (type === 'children' && el) {
              for (const ctx of deps.keys())
                if (ctx.el && el !== ctx.el && el.contains(ctx.el)) deps.delete(ctx)
              el.replaceChildren(...toArray(fn()))
            } else if (type === 'child' && el && typeof x === 'number') {
              const old = el.children[x]
              for (const ctx of deps.keys())
                if (ctx.el && (old === ctx.el || old.contains(ctx.el))) deps.delete(ctx)
              el.replaceChild(fn(), old)
            } else if (type === 'watch') typeof x === 'function' ? x(fn()) : fn()
        }
      return result
    },
  })
}
export function isReactive(target) {
  return !!target[reactiveBrand]
}
