/**
 * @typedef {HTMLElement} El
 * @typedef {[tag: string, props: object, vnodes: VNode[], el?: El]} VE - virtual element
 * @typedef {VE|string} VNode - virtual node
 * @typedef {VNode | (() => VNode)} VNodeOrFn
 * @typedef {VNodeOrFn[] | (() => VNodeOrFn[])} VNodesOrFn
 * @typedef {[fn: Function, ve: VE, key: string]} ElementArrow
 * @typedef {[fn: Function, undefined, undefined, effect?: Function]} WatchArrow
 * @typedef {ElementArrow | WatchArrow} Arrow
 * @typedef {[target: object, prop: string | symbol]} Trigger
 */

const BRAND = Symbol('brand')

let /**@type {Arrow?}*/ currentArrow = null

export const /**@type {Map<Arrow, Trigger[]>}*/ deps = new Map()

function evaluate(
  /**@type {unknown}*/ fn,
  /**@type {VE?}*/ ve,
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
  /**@type {VNodesOrFn?}*/ children,
) {
  const /**@type {VE}*/ ve = [tag, Object.create(null), []]
  if (typeof props !== 'object' || Array.isArray(props)) children = props
  else
    for (const k in props)
      ve[1][k] = k.startsWith('on') ? props[k] : evaluate(props[k], ve, k)
  for (const i in evaluate(children ?? [], ve, '*'))
    ve[2].push(evaluate(children[i], ve, '#' + i))
  return ve
}

/** @type {{[tag: string]: (props?: object, children?: VNodesOrFn) => VE}} */
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

export function mount(/**@type {string}*/ selector, /**@type {VE}*/ ve) {
  document.querySelector(selector).append(createNode(ve))
}

function addArrowAndTriggerToDeps(/**@type {Trigger}*/ ...[target, prop]) {
  if (!currentArrow) return
  if (!deps.has(currentArrow)) deps.set(currentArrow, [])
  const triggers = deps.get(currentArrow)
  // TODO: 好像有重复
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
        else if (k === '*') updateChildren(ve, v)
        else if (k[0] === '#') updateChild(ve, +k.slice(1), v)
        else updateProp(ve, k, v)
      }
    }
}

function updateChildren(/**@type {VE}*/ ve, /**@type {VNode[]}*/ vnodes) {
  const [, , oldVNodes, el] = ve
  ve[2] = vnodes
  updateElChildren(el, oldVNodes, vnodes)
}

function updateChild(/**@type {VE}*/ ve, /**@type {number}*/ i, /**@type {VNode}*/ vn) {
  const [, , vnodes, el] = ve
  const oldVN = vnodes[i]
  vnodes[i] = vn
  if (typeof oldVN !== 'string') removeArrowsInVeFromDeps(oldVN)
  if (typeof oldVN === 'string' || typeof vn === 'string' || oldVN[0] !== vn[0])
    el.replaceChild(createNode(vn), el.childNodes[i])
  else updateEl(oldVN, vn)
}

function updateProp(/**@type {VE}*/ ve, /**@type {string}*/ k, /**@type {any}*/ v) {
  const [, props, , el] = ve
  if (props[k] === v) return
  props[k] = v
  setElProp(el, k, v)
}

function createNode(/**@type {VNode}*/ vn) {
  return typeof vn === 'string' ? document.createTextNode(vn) : createEl(vn)
}

function createEl(/**@type {VE}*/ ve) {
  const [tag, props, vnodes] = ve
  const el = document.createElement(tag)
  ve[3] = el
  el.dataset.id = Math.random().toString().slice(2, 6) // TODO: remove
  el.append(...vnodes.map(createNode))
  for (const k in props) setElProp(el, k, props[k])
  return el
}

function updateEl(/**@type {VE}*/ oldVE, /**@type {VE}*/ ve) {
  const [, oldProps, oldVNodes, el] = oldVE
  const [, props, vnodes] = ve
  ve[3] = el
  for (const k in props) if (props[k] !== oldProps[k]) setElProp(el, k, props[k])
  for (const k in oldProps) if (!(k in props)) resetElProp(el, k)
  if (['innerText', 'textContent'].some((k) => k in props)) return
  updateElChildren(el, oldVNodes, vnodes)
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

function updateElChildren(
  /**@type {El}*/ el,
  /**@type {VNode[]}*/ old,
  /**@type {VNode[]}*/ vnodes,
) {
  // TODO: smart
  for (const vn of old) if (typeof vn !== 'string') removeArrowsInVeFromDeps(vn)
  el.replaceChildren(...vnodes.map(createNode))
}

function removeArrowsInVeFromDeps(/**@type {VE}*/ ve) {
  for (const arrow of deps.keys()) if (contains(ve, arrow[1])) deps.delete(arrow)
}

function contains(/**@type {VE}*/ ve1, /**@type {VE}*/ ve2) {
  if (ve1 === ve2) return true
  return ve1[2].filter((vn) => typeof vn !== 'string').some((vn) => contains(vn, ve2))
}
