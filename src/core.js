/**
 * @typedef {[fn: Function, velOrEffect: VEl|Function|undefined, key: string]} Arrow
 * @typedef {[tag: string, props: object, children: VNode[], el?: HTMLElement]} VEl
 * @typedef {VEl|string} VNode
 * @typedef {VNode|(()=>VNode)} Child
 * @typedef {Child[]|(()=>Child[])} Children
 * @typedef {[target: object, prop: string|symbol]} Trigger
 */
/** @type {Arrow?} arrow within which reactive object runs trigger */
let currentArrow = null
/** @type {Map<Arrow, Trigger[]>} dependency map: arrow -> triggers of the arrow */
export const deps = new Map()
/* build arrow and evaluate fn() within it, or return fn if it's not a function */
function evaluate(fn, x, key) {
  if (typeof fn !== 'function') return fn
  currentArrow = [fn, x, key]
  const result = fn()
  currentArrow = null
  return result
}
/**
 * create a virtual element, and create arrows for lazy function calls
 * @param {string} tag
 * @param {object=} props
 * @param {Array<Child|Children> =} children
 * @returns {VEl}
 */
export function h(tag, props, children) {
  const hasProps = typeof props === 'object' && !Array.isArray(props)
  /** @type {VEl} */ const vel = [tag, {}, []]
  for (const [k, v] of Object.entries(hasProps ? props : {}))
    vel[1][k] = k.startsWith('on') ? v : evaluate(v, vel, k)
  for (const [i, v] of evaluate(hasProps ? children ?? [] : props, vel, '*').entries())
    vel[2].push(evaluate(v, vel, '#' + i))
  return vel
}
/**
 * convert virtul node to real node
 * @param {VNode} vnode
 * @returns {Node}
 */
function realize(vnode) {
  if (typeof vnode === 'string') return document.createTextNode(vnode)
  const el = document.createElement(vnode[0])
  for (const [k, v] of Object.entries(vnode[1]))
    if (k === 'class') el.className = v
    else if (k === 'for') el['htmlFor'] = v
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k.startsWith('$')) el.style[k.slice(1)] = v
    else if (k.startsWith('_')) el.setAttribute(k.slice(1), v)
    else el[k] = v
  for (const vn of vnode[2]) el.append(realize(vn))
  vnode[3] = el
  return el
}
/**
 * mount vel to DOM tree
 * @param {string} selector
 * @param {VEl} vel
 */
export function mount(selector, vel) {
  document.querySelector(selector).append(realize(vel))
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
  evaluate(watchFn, effectFn, '')
  return () => {
    for (const arrow of deps.keys()) if (arrow[0] === watchFn) deps.delete(arrow)
  }
}
const BRAND = Symbol('brand')
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
      if (typeof target === 'function' && prop === 'prototype') return result
      if (!currentArrow) return reactive(result)
      if (!deps.has(currentArrow)) deps.set(currentArrow, [])
      const triggers = deps.get(currentArrow)
      if (triggers?.every((trigger) => !(trigger[0] === target && trigger[1] === prop)))
        triggers.push([target, prop])
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = Reflect.get(target, prop)
      const result = Reflect.set(target, prop, newValue)
      for (const [[fn, x, key], triggers] of deps.entries())
        for (const trigger of triggers) {
          if (trigger[0] === oldValue) trigger[0] = newValue
          if (trigger[0] === target && trigger[1] === prop)
            if (typeof x === 'function' || typeof x === 'undefined') x ? x(fn()) : fn()
            else {
              const el = x[3]
              if (key === 'class') el.className = fn()
              else if (key === 'for') el['htmlFor'] = fn()
              else if (key.startsWith('$')) el.style[key.slice(1)] = fn()
              else if (key.startsWith('_')) el.setAttribute(key.slice(1), fn())
              else if (key.startsWith('#')) {
                const old = el.children[key.slice(1)]
                for (const arrow of deps.keys()) {
                  const _el = arrow[1]?.[3]
                  if (_el && (old === _el || old.contains(_el))) deps.delete(arrow)
                }
                // TODO: smart update child
                el.replaceChild(realize(fn()), old)
              } else if (key === '*') {
                for (const arrow of deps.keys()) {
                  const _el = arrow[1]?.[3]
                  if (_el && el !== _el && el.contains(_el)) deps.delete(arrow)
                }
                // TODO: smart update children
                el.replaceChildren(...fn().map(realize))
              } else el[key] = fn()
            }
        }
      return result
    },
  })
}
/** check if target is reactive */
export const isReactive = (x) => !!x[BRAND]
