/**
 * @typedef {HTMLElement} El
 * @typedef {{[k:string]: unknown}} Props
 * @typedef {[tag: string, props: Props, vnodes: Vn[], el: El]} Ve (virtual element)
 * @typedef {Ve|string} Vn (virtual node)
 * @typedef {Vn | (() => Vn)} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[fn: Function, ve: Ve, key?: string]} VeArrow
 * @typedef {[fn: Function, undefined, undefined,effect?: Function]} WatchArrow
 * @typedef {VeArrow | WatchArrow} Arrow
 * @typedef {[target: object, prop: string | symbol]} Trigger
 * @typedef {(propsOrChildren?: Props|Children, children?: Children) => Ve} TagFn
 */

const BRAND = Symbol('brand')
const NO_EL = document.createElement('a')

/**@type {Arrow?}*/
let currentArrow = null

/**@type {Map<Arrow, Trigger[]>}*/
export const deps = new Map()

/** create virtual element */
export function h(
  /**@type {string}*/ tag,
  /**@type {Props|Children=}*/ p,
  /**@type {Children=}*/ c,
) {
  const /**@type {Ve}*/ ve = [tag, Object.create(null), [], NO_EL]
  if (typeof p !== 'object' || Array.isArray(p)) c = p
  else for (const k in p) ve[1][k] = k.startsWith('on') ? p[k] : evaluate(p[k], ve, k)
  const /**@type {Child[]}*/ children = evaluate(c, ve) ?? []
  for (const i in children) ve[2].push(evaluate(children[i], ve, '#' + i))
  return ve
}

/** @type {{[tag: string]: TagFn}} */
// @ts-ignore
export const tags = new Proxy({}, { get: (_, p) => h.bind(null, p) })

export function mount(/**@type {string}*/ selector, /**@type {Ve}*/ ve) {
  // @ts-ignore
  document.querySelector(selector).append(createNode(ve))
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
  evaluate(watchFn, undefined, undefined, effectFn)
  return () => {
    for (const arrow of deps.keys()) if (arrow[0] === watchFn) deps.delete(arrow)
  }
}

/**
 * make object reactive, collecting arrows for getters, and updating DOM in setters
 * @template T
 * @param {T} target
 * @returns {T}
 */
export function reactive(target) {
  if (target !== Object(target) || isReactive(target)) return target
  // @ts-ignore
  return new Proxy(target, {
    get(t, p) {
      if (p === BRAND) return true
      const result = Reflect.get(t, p)
      if (typeof t === 'function' && p === 'prototype') return result
      if (currentArrow) {
        if (!deps.has(currentArrow)) deps.set(currentArrow, [])
        const triggers = deps.get(currentArrow)
        // @ts-ignore
        if (!triggers.some((t) => t[0] === t && t[1] === p)) triggers.push([t, p])
      }
      return reactive(result)
    },
    set(t, p, newValue) {
      const oldValue = Reflect.get(t, p)
      const result = Reflect.set(t, p, newValue)
      if (!Object.is(oldValue, newValue) || p === 'length')
        for (const [arrow, triggers] of deps.entries())
          for (const trigger of triggers) {
            if (trigger[0] === oldValue) trigger[0] = newValue
            if (trigger[0] === t && trigger[1] === p) {
              const [fn, ve, k, effect] = arrow
              const v = fn()
              if (!ve) effect ? effect(v) : v
              else if (!k) {
                for (const vn of ve[2]) removeArrowsInVeFromDeps(vn)
                updateVeChildren(ve, v)
              } else if (k[0] === '#') {
                const i = +k.slice(1)
                removeArrowsInVeFromDeps(ve[2][i])
                updateVeChild(ve, i, v)
              } else updateVeProp(ve, k, v)
            }
          }
      return result
    },
  })
}

export const isReactive = (/**@type {any}*/ x) => !!x[BRAND]

// @ts-ignore
function evaluate(fn, ve, key, effect) {
  if (typeof fn !== 'function') return fn
  currentArrow = ve ? [fn, ve, key] : [fn, , , effect]
  const result = fn()
  currentArrow = null
  return result
}

function createNode(/**@type {Vn}*/ vn) {
  if (typeof vn === 'string') return document.createTextNode(vn)
  const [tag, props, vnodes] = vn
  const el = document.createElement(tag)
  vn[3] = el
  el.dataset.id = Math.random().toString().slice(2, 5) // TODO: remove
  el.append(...vnodes.map(createNode))
  for (const k in props) setElProp(el, k, props[k])
  return el
}

function removeArrowsInVeFromDeps(/**@type {Vn}*/ vn) {
  if (typeof vn !== 'string')
    for (const arrow of deps.keys()) if (contains(vn, arrow[1])) deps.delete(arrow)
}

function contains(/**@type {Vn}*/ ancestor, /**@type {Vn=}*/ offspring) {
  if (typeof ancestor === 'string' || offspring === undefined) return false
  if (ancestor === offspring) return true
  const result = ancestor[2].some((vn) => contains(vn, offspring))
  return result
}

function updateVeChildren(/**@type {Ve}*/ ve, /**@type {Vn[]}*/ vnodes) {
  const [, , oldVnodes, el] = ve
  for (const i in vnodes)
    if (+i < oldVnodes.length) updateVeChild(ve, +i, vnodes[i])
    else el.append(createNode(vnodes[i]))
  for (let i = vnodes.length; i < oldVnodes.length; i++) el.removeChild(el.lastChild)
  ve[2] = vnodes
}

function updateVeChild(/**@type {Ve}*/ ve, /**@type {number}*/ i, /**@type {Vn}*/ vn) {
  const oldVn = ve[2][i]
  if (typeof oldVn !== 'string' && typeof vn !== 'string' && oldVn[0] === vn[0]) {
    const [, oldProps, , el] = oldVn
    const [, props, vnodes] = vn
    vn[3] = el
    for (const k in props) if (props[k] !== oldProps[k]) setElProp(el, k, props[k])
    for (const k in oldProps) if (!(k in props)) resetElProp(el, k)
    if (!['innerText', 'textContent'].some((k) => k in props))
      updateVeChildren(oldVn, vnodes)
  } else ve[3].replaceChild(createNode(vn), ve[3].childNodes[i])
  ve[2][i] = vn
}

function updateVeProp(/**@type {Ve}*/ ve, /**@type {string}*/ k, /**@type {any}*/ v) {
  const [, props, , el] = ve
  if (props[k] === v) return
  props[k] = v
  setElProp(el, k, v)
}

function setElProp(/**@type {any}*/ el, /**@type {string}*/ k, /**@type {any}*/ v) {
  if (k === 'class' || k === 'for') k = '_' + k
  if (k[0] === '$') el.style[k.slice(1)] = v
  else if (k[0] === '_') el.setAttribute(k.slice(1), v)
  else if (k.startsWith('on')) el[k.toLowerCase()] = v
  else el[k] = v
}

function resetElProp(/**@type {any}*/ el, /**@type {string}*/ k) {
  if (k[0] === '$') el.style[k.slice(1)] = null
  else if (k[0] === '_' || k.toLowerCase() in el.attributes)
    el.removeAttribute(k.replace(/^_/, '').toLowerCase())
  else el[k] = undefined // TODO: 需要研究正确性
}
