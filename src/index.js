// @ts-check

/**
 * @typedef {HTMLElement} El
 * @typedef {{[k:string]: unknown}} Props
 * @typedef {Map<unknown, El>} ElCache
 * @typedef {[tag: string, props: Props, vnodes: Vn[], el: El, cache?: ElCache]} Ve
 * @typedef {Ve|string} Vn
 * @typedef {Vn | (() => Vn)} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[fn: Function, ve: Ve, key?: string]} VeArrow
 * @typedef {[fn: Function, undefined, undefined,effect?: Function]} WatchArrow
 * @typedef {VeArrow | WatchArrow} Arrow
 * @typedef {[target: object, prop: string | symbol]} Trigger
 */

const BRAND = Symbol('brand')
const NO_EL = document.createElement('a')

/** set current arrow context where function runs @type {Arrow?} */
let currentArrow = null

/** map for dependencies @type {Map<Arrow, Trigger[]>} */
export const deps = new Map()

/** create virtual el @type {(tag: string, p?: Props|Children, c?: Children) => Ve} */
export function h(tag, p, c) {
  const /** @type {Ve} */ ve = [tag, Object.create(null), [], NO_EL]
  if (typeof p !== 'object' || Array.isArray(p)) c = p
  else for (const k in p) ve[1][k] = k.startsWith('on') ? p[k] : evaluate(p[k], ve, k)
  const /** @type {Child[]} */ children = evaluate(c, ve) ?? []
  for (const i in children) ve[2].push(evaluate(children[i], ve, '#' + i))
  return ve
}

/** tag functions @type {{[tag: string]: (p?: Props|Children, c?: Children) => Ve}} */
// @ts-ignore
export const tags = new Proxy({}, { get: (_, p) => h.bind(null, p) })

/** mount virtual element to DOM @type {(selector: string, ve: Ve) => void} */
export function mount(selector, ve) {
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

/** make object reactive @template T @param {T} target @returns {T} */
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

export const isReactive = (/** @type {any} */ x) => !!x[BRAND]

// @ts-ignore
function evaluate(fn, ve, key, effect) {
  if (typeof fn !== 'function') return fn
  currentArrow = ve ? [fn, ve, key] : [fn, , , effect]
  const result = fn()
  currentArrow = null
  return result
}

function removeArrowsInVeFromDeps(/** @type {Vn} */ vn) {
  for (const arrow of deps.keys()) if (contains(vn, arrow[1])) deps.delete(arrow)
}

function contains(/** @type {Vn} */ ancestor, /** @type {Vn=} */ offspring) {
  if (typeof ancestor === 'string' || offspring === undefined) return false
  if (ancestor === offspring) return true
  const result = ancestor[2].some((vn) => contains(vn, offspring))
  return result
}

function createNode(/** @type {Vn} */ vn) {
  return typeof vn === 'string' ? document.createTextNode(vn) : createEl(vn)
}

function createEl(/** @type {Ve} */ ve) {
  const [tag, props, vnodes] = ve
  const el = document.createElement(tag)
  el.dataset.id = Math.random().toString().slice(2, 5) // TODO: remove
  el.append(...vnodes.map(createNode))
  for (const k in props) setElProp(el, k, props[k])
  ve[3] = el
  if (props.cacheChildrenByKey && getKeysFromVnodes(vnodes)) {
    ve[4] = new Map()
    for (const v of vnodes) if (typeof v !== 'string') ve[4].set(v[1].key, v[3])
  }
  // @ts-ignore
  el.__hyper_arrow__ = ve
  return el
}

function getKeysFromVnodes(/** @type {Vn[]} */ vnodes) {
  const ves = vnodes.filter((vn) => typeof vn !== 'string')
  const keys = ves.filter((vn) => 'key' in vn[1]).map((ve) => ve[1].key)
  if (new Set(keys).size !== keys.length) throw new Error('duplicate keys')
  return keys.length === vnodes.length ? keys : null
}

/** @type {(ve: Ve, vnodes: Vn[]) => void} */
function updateVeChildren(ve, vnodes) {
  const el = ve[3]
  const keys = getKeysFromVnodes(vnodes)
  const oldVes = ve[2].filter((vn) => typeof vn !== 'string')
  const oldKeys = oldVes.filter((vn) => 'key' in vn[1]).map((ve) => ve[1].key)
  if (keys && oldKeys.length === ve[2].length) {
    ve[2] = oldVes.filter((ve) => keys.includes(ve[1].key))
    for (const vn of oldVes) if (!ve[2].includes(vn)) vn[3].remove()
    // TODO: sort oldVnodes by key here
    const cache = ve[4]
    for (const [i, vn] of vnodes.entries())
      if (typeof vn !== 'string' && typeof ve[2][i] !== 'string') {
        const { key } = vn[1]
        if (key === ve[2][i]?.[1].key) updateVeChild(ve, i, vn)
        else {
          ve[2].splice(i, 0, vn)
          const node = cache?.get(key) ?? createEl(vn)
          vn[3] = node
          if (cache && !cache.has(key)) cache.set(key, node)
          if (i === 0) el.prepend(node)
          else el.childNodes[i - 1].after(node)
        }
      }
  } else {
    const len = vnodes.length
    const oldLen = ve[2].length
    for (let i = 0; i < len || i < oldLen; i++)
      if (i < len && i < oldLen) updateVeChild(ve, i, vnodes[i])
      else if (i >= oldLen) el.append(createNode(vnodes[i]))
      else el.lastChild?.remove()
    ve[2] = vnodes
  }
}

/** @type {(ve: Ve, i: number, vn: Vn) => void} */
function updateVeChild(ve, i, vn) {
  const oldVn = ve[2][i]
  if (typeof oldVn !== 'string' && typeof vn !== 'string' && oldVn[0] === vn[0]) {
    const [, oldProps, , el] = oldVn
    const [, props, vnodes] = vn
    vn[3] = el
    for (const k in props) if (props[k] !== oldProps[k]) setElProp(el, k, props[k])
    for (const k in oldProps) if (!(k in props)) resetElProp(el, k)
    if (!['innerText', 'innerHTML', 'textContent'].some((k) => k in props))
      updateVeChildren(oldVn, vnodes)
  } else {
    const node = createNode(vn)
    ve[3].replaceChild(node, ve[3].childNodes[i])
    const cache = ve[4]
    // @ts-ignore
    if (typeof vn !== 'string' && cache) cache.set(vn[1].key, node)
  }
  ve[2][i] = vn
}

/** @type {(ve: Ve, k: string, v: any) => void} */
function updateVeProp(ve, k, v) {
  const [, props, , el] = ve
  if (props[k] === v) return
  props[k] = v
  setElProp(el, k, v)
}

// @ts-ignore
function setElProp(el, k, v) {
  if (k === 'class' || k === 'for') k = '_' + k
  if (k[0] === '$') el.style[k.slice(1)] = v
  else if (k[0] === '_') el.setAttribute(k.slice(1), v)
  else if (k.startsWith('on')) el[k.toLowerCase()] = v
  else el[k] = v
}

// @ts-ignore
function resetElProp(el, k) {
  if (k[0] === '$') el.style[k.slice(1)] = null
  else if (k[0] === '_' || k.toLowerCase() in el.attributes)
    el.removeAttribute(k.replace(/^_/, '').toLowerCase())
  else el[k] = undefined // TODO: 需要研究正确性
}
