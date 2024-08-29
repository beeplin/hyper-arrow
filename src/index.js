/**
 * @typedef {number} ArrowPosition
 * @typedef {any} ArrowPayload
 * @typedef {{fn: Function,
 *            at: ArrowPosition,
 *            vel?: Vel,
 *            x?: ArrowPayload}} Arrow
 * @typedef {{el?: HTMLElement, tag: string, listeners: object, children: (Vel|String)[],
 *            style: object, attrs: object, props: object}} Vel
 * @typedef {Vel | string | (() => Vel | string)} Child
 * @typedef {Child | Child[] | (() => Child | Child[])} Children
 */
const [OBJECT, FUNCTION] = ['object', 'function']
const [WATCH, CHILDREN, CHILD, CLASS, STYLE, PROP, ATTR] = [0, 1, 2, 3, 4, 5, 6, 7]
const BRAND = Symbol('brand')
const is = (x, type) => typeof x === type
const isMatch = (x, target, prop) => x[0] === target && x[1] === prop
const isProps = (x) => is(x, OBJECT) && !Array.isArray(x) && !x.tag
const toArray = (x) => (Array.isArray(x) ? x : [x])
/**
 * arrow within which reactive object runs getter
 * @type {Arrow?}
 */
let arrow = null
/**
 * dependency map: arrow -> list of getters (target[prop]) called within the arrow
 * @type {Map<Arrow, Array<[target: object, prop: string|symbol]>>}
 */
export const deps = new Map()
/* build arrow and evaluate fn() within it, or return fn if it's not a function */
function evaluate(fn, at, vel, x) {
  if (!is(fn, FUNCTION)) return fn
  arrow = { fn, at, vel, x }
  const result = fn()
  arrow = null
  return result
}
/**
 * create a html element, setting arrows for lazy function calls
 * @param {string} type
 * @param {object|string=} props
 * @param {Array<Child|Children>} args
 * @returns {Vel}
 */
export function h(type, props, ...args) {
  const [head, ...classes] = type.split('.')
  const [tag, id] = head.replace(/\s/g, '').split('#')
  const className = classes.join(' ')
  const vel = { tag, style: {}, attrs: {}, props: {}, listeners: {}, children: [] }
  if (id) vel.props.id = id
  if (className) vel.props.className = className
  args = isProps(props) ? args.flat() : [props, ...args].flat()
  const children = Array.isArray(args) && args.length === 1 ? args[0] : args
  props = isProps(props) ? { children, ...props } : { children }
  for (const [key, x] of Object.entries(props))
    if (key.startsWith('on') && is(x, FUNCTION))
      vel.listeners[key.toLowerCase().slice(2)] = x
    else if (['children', 'childNodes'].includes(key)) {
      for (const [i, y] of toArray(evaluate(x, CHILDREN, vel)).entries()) {
        vel.children.push(evaluate(y, CHILD, vel, i))
      }
    } else if (['style', 'attributes'].includes(key) && is(x, OBJECT) && x !== null) {
      for (const [k, y] of Object.entries(x))
        if (key === 'style') vel.style[k] = evaluate(y, STYLE, vel, k)
        else if (key === 'attributes') vel.attrs[k] = evaluate(y, ATTR, vel, k)
    } else if (['class', 'className'].includes(key))
      vel.props.className += ' ' + evaluate(x, CLASS, vel, className).trim()
    else if (key === 'for') vel.props.htmlFor = evaluate(x, PROP, vel, 'htmlFor')
    else vel.props[key] = evaluate(x, PROP, vel, key)
  return vel
}
/**
 * render virtul element to real element
 * @param {Vel|string} vel
 * @returns {HTMLElement|Text}
 */
export function render(vel) {
  if (typeof vel === 'string') return document.createTextNode(vel)
  const el = document.createElement(vel.tag)
  for (const [k, v] of Object.entries(vel.style)) el.style[k] = v
  for (const [k, v] of Object.entries(vel.attrs)) el.setAttribute(k, v)
  for (const [k, v] of Object.entries(vel.props)) el[k] = v
  for (const [k, v] of Object.entries(vel.listeners)) el.addEventListener(k, v)
  for (const child of vel.children) el.append(render(child))
  vel.el = el
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
 * make object reactive, collecting arrows for getters, and updating DOM in setters
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
      if (!arrow) return reactive(result)
      if (!deps.has(arrow)) deps.set(arrow, [])
      const pairs = deps.get(arrow)
      if (pairs?.every((p) => !isMatch(p, target, prop))) pairs.push([target, prop])
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = Reflect.get(target, prop)
      const result = Reflect.set(target, prop, newValue)
      for (const [arrow, pairs] of deps.entries())
        for (const pair of pairs) {
          if (pair[0] === oldValue) pair[0] = newValue
          if (isMatch(pair, target, prop)) {
            const { fn, at, vel, x } = arrow
            const { el } = vel ?? {}
            if (at === CLASS) el.className = (x + ' ' + fn()).trim()
            else if (at === STYLE) el.style[x] = fn()
            else if (at === PROP) el[x] = fn()
            else if (at === ATTR) el.setAttribute(x, fn())
            else if (at === CHILDREN) {
              for (const arrow of deps.keys()) {
                const _el = arrow.vel?.el
                if (_el && el !== _el && el.contains(_el)) deps.delete(arrow)
              }
              el.replaceChildren(...toArray(fn()).map(render))
            } else if (at === CHILD) {
              const old = el.children[x]
              for (const arrow of deps.keys()) {
                const _el = arrow.vel?.el
                if (_el && (old === _el || old.contains(_el))) deps.delete(arrow)
              }
              el.replaceChild(render(fn()), old)
            } else if (at === WATCH) x ? x(fn()) : fn()
          }
        }
      return result
    },
  })
}
/** check if target is reactive */
export const isReactive = (x) => !!x[BRAND]
