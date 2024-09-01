/**
 * @typedef {HTMLElement} El
 * @typedef {[tag: string, props: object, vnodes: Vn[], el?: El]} Ve - virtual element
 * @typedef {Ve|string} Vn - virtual node
 * @typedef {Vn | (() => Vn)} VnOrFn
 * @typedef {VnOrFn[] | (() => VnOrFn[])} VnsOrFn
 * @typedef {[fn: Function, ve: Ve, key: string]} ElementArrow
 * @typedef {[fn: Function, undefined, undefined, effect?: Function]} WatchArrow
 * @typedef {ElementArrow | WatchArrow} Arrow
 * @typedef {[target: object, prop: string | symbol]} Trigger
 */

const BRAND = Symbol('brand')

let /**@type {Arrow?}*/ currentArrow = null

export const /**@type {Map<Arrow, Trigger[]>}*/ deps = new Map()

function evaluate(
  /**@type {unknown}*/ fn,
  /**@type {Ve?}*/ ve,
  /**@type {string?}*/ key,
  /**@type {Function?}*/ effect,
) {
  if (typeof fn !== 'function') return fn
  currentArrow = ve ? [fn, ve, key] : [fn, , , effect]
  const result = fn()
  currentArrow = null
  return result
}

export const h = function createVElement(
  /**@type {string}*/ tag,
  /**@type {object?}*/ props,
  /**@type {VnsOrFn?}*/ children,
) {
  const /**@type {Ve}*/ ve = [tag, Object.create(null), []]
  if (typeof props !== 'object' || Array.isArray(props)) children = props
  else
    for (const k in props)
      ve[1][k] = k.startsWith('on') ? props[k] : evaluate(props[k], ve, k)
  for (const i in evaluate(children ?? [], ve, '*'))
    ve[2].push(evaluate(children[i], ve, '#' + i))
  return ve
}

/** @type {{[tag: string]: (props?: object, children?: VnsOrFn) => Ve}} */
export const tags = new Proxy({}, { get: (_, tag) => h.bind(null, tag) })

/**
 * run watchFn() once, and whenever watchFn's dependencies change,
 * auto rerun watchFn(), or effectFn(watchFn()) if effectFn provided,
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {(a: ReturnType<F extends (()=> any) ? F : never>) => any=} effectFn
 * @returns {() => void} stop auto rerunning
 */
export function watch(watchFn, effectFn) {
  evaluate(watchFn, null, null, effectFn)
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
    get(target, prop) {
      if (prop === BRAND) return true
      const result = Reflect.get(target, prop)
      if (typeof target === 'function' && prop === 'prototype') return result
      addArrowAndTriggerToDeps(target, prop)
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = Reflect.get(target, prop)
      const result = Reflect.set(target, prop, newValue)
      triggerArrowsInDeps(target, prop, oldValue, newValue)
      return result
    },
  })
}

export const isReactive = (/**@type {unknown}*/ x) => !!x[BRAND]

export function mount(/**@type {string}*/ selector, /**@type {Ve}*/ ve) {
  document.querySelector(selector).append(createNode(ve))
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

function addArrowAndTriggerToDeps(/**@type {Trigger}*/ ...[target, prop]) {
  if (!currentArrow) return
  if (!deps.has(currentArrow)) deps.set(currentArrow, [])
  const triggers = deps.get(currentArrow)
  if (triggers.some((trigger) => trigger[0] === target && trigger[1] === prop)) return
  triggers.push([target, prop])
}

function triggerArrowsInDeps(target, prop, oldValue, newValue) {
  if (oldValue === newValue && prop !== 'length') return
  for (const [arrow, triggers] of deps.entries())
    for (const trigger of triggers) {
      if (trigger[0] === oldValue) trigger[0] = newValue
      if (trigger[0] === target && trigger[1] === prop) {
        const [fn, ve, k, effect] = arrow
        const v = fn()
        if (!ve) effect ? effect(v) : v
        else if (k === '*') {
          for (const vn of ve[2]) removeArrowsInVeFromDeps(vn)
          updateVeChildren(ve, v)
        } else if (k[0] === '#') {
          const i = +k.slice(1)
          removeArrowsInVeFromDeps(ve[2][i])
          updateVeChild(ve, i, v)
        } else updateVeProp(ve, k, v)
      }
    }
}

function removeArrowsInVeFromDeps(/**@type {Vn}*/ vn) {
  if (typeof vn !== 'string')
    for (const arrow of deps.keys()) if (contains(vn, arrow[1])) deps.delete(arrow)
}

function contains(/**@type {Ve}*/ ve1, /**@type {Ve}*/ ve2) {
  if (ve1 === ve2) return true
  return ve1[2].filter((vn) => typeof vn !== 'string').some((vn) => contains(vn, ve2))
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

function setElProp(/**@type {El}*/ el, /**@type {string}*/ k, /**@type {any}*/ v) {
  if (k === 'class' || k === 'for') k = '_' + k
  if (k[0] === '$') el.style[k.slice(1)] = v
  else if (k[0] === '_') el.setAttribute(k.slice(1), v)
  else if (k.startsWith('on')) el[k.toLowerCase()] = v
  else el[k] = v
}

function resetElProp(/**@type {El}*/ el, /**@type {string}*/ k) {
  if (k[0] === '$') el.style[k.slice(1)] = null
  else if (k[0] === '_' || k.toLowerCase() in el.attributes)
    el.removeAttribute(k.replace(/^_/, '').toLowerCase())
  else el[k] = undefined // TODO: 需要研究正确性
}
