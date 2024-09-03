// @ts-check

/**
 * @typedef {{[k:string]: unknown}} Props
 * @typedef {Map<unknown, Node>} Cache
 * @typedef {[el: Element, tag: string, props: Props, children: Vn[], cache?: Cache]} Ve
 * @typedef {[node: Text, text: string, props: Props, children: Vn[], mark: 0]} Vt
 * @typedef {Ve | Vt} Vn
 * @typedef {Ve | string | (() => (Ve | string))} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[fn: Function, ve: Ve, key?: string]} VeArrow
 * @typedef {[fn: Function, undefined, undefined,effect?: Function]} WatchArrow
 * @typedef {VeArrow | WatchArrow} Arrow
 * @typedef {[target: object, prop: string | symbol]} Trigger
 */

const BRAND = Symbol('brand')
const NOELE = document.createElement('_')
const NOTXT = document.createTextNode('_')
const VNKEY = '__hyper_arrow__'

/** set current arrow context where function runs @type {Arrow?} */
let currentArrow = null

/** map for dependencies @type {Map<Arrow, Trigger[]>} */
export const deps = new Map()

/** create virtual el @type {(tag: string, p?: Props|Children, c?: Children) => Ve} */
export const h = function createVe(tag, p, c) {
  const /**@type {Ve}*/ ve = [NOELE, tag, Object.create(null), []]
  if (typeof p !== 'object' || Array.isArray(p)) c = p
  else
    for (const k in p)
      if (k.startsWith('on')) ve[2][k.toLowerCase()] = p[k]
      else ve[2][k] = evaluate(p[k], ve, k)
  const /**@type {Child[]}*/ children = evaluate(c, ve) ?? []
  for (const i in children) ve[3].push(createVn(evaluate(children[i], ve, '#' + i)))
  return ve
}

/** tag functions @type {{[tag: string]: (p?: Props|Children, c?: Children) => Ve}} */
// @ts-ignore
export const tags = new Proxy({}, { get: (_, p) => h.bind(null, p) })

/** mount virtual element to DOM */
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

/** make object reactive @type {<T>(target: T) => T} */
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
      if (oldValue !== newValue || p === 'length')
        for (const [arrow, triggers] of deps.entries())
          for (const trigger of triggers) {
            if (trigger[0] === oldValue) trigger[0] = newValue
            if (trigger[0] === t && trigger[1] === p) {
              const [fn, ve, k, effect] = arrow
              const v = fn()
              if (!ve) effect ? effect(v) : v
              else if (!k) {
                for (const vn of ve[3]) removeArrowsInVeFromDeps(vn)
                updateChildren(ve, v)
              } else if (k[0] === '#') {
                const i = +k.slice(1)
                removeArrowsInVeFromDeps(ve[3][i])
                updateChild(ve, i, createVn(v))
              } else updateProp(ve, k, v)
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

function createVn(/**@type {Ve|string}*/ x) {
  if (typeof x !== 'string') return x
  const /**@type {Vt}*/ vt = [NOTXT, x, Object.create(null), [], 0]
  return vt
}

function createNode(/**@type {Vn}*/ vn) {
  return vn[4] === 0 ? createTextNode(vn) : createElement(vn)
}

function createTextNode(/**@type {Vt}*/ vt) {
  const text = document.createTextNode(vt[1])
  vt[0] = text
  // @ts-ignore
  text[VNKEY] = vt
  return text
}

function createElement(/**@type {Ve}*/ ve) {
  const [, tag, props, children] = ve
  const el = document.createElement(tag)
  el.dataset.id = Math.random().toString().slice(2, 4) // TODO: 测试用，待删除
  el.append(...children.map(createNode))
  for (const k in props) setElementProp(el, k, props[k])
  ve[0] = el
  if (props.cacheChildrenByKey && getKeysFromVnodes(children)) {
    ve[4] = new Map()
    for (const child of children) ve[4].set(child[2].key, child[0])
  }
  // @ts-ignore
  el[VNKEY] = ve
  const fn = props.oncreate
  if (typeof fn === 'function') fn(...ve)
  return el
}

function removeNode(/**@type {Vn}*/ vn) {
  if (vn[4] !== 0) {
    const fn = vn[2].onremove
    if (typeof fn === 'function') fn(...vn)
  }
  vn[0].parentNode?.removeChild(vn[0])
}

function updateChildren(/**@type {Ve}*/ ve, /**@type {Vn[]}*/ vnodes) {
  const keys = getKeysFromVnodes(vnodes)
  const children = ve[3]
  if (keys && getKeysFromVnodes(children)) {
    const remained = (ve[3] = children.filter((vn) => keys.includes(vn[2].key)))
    for (const vn of children) if (!remained.includes(vn)) removeNode(vn)
    for (const [i, vn] of vnodes.entries()) {
      const key = vn[2].key
      if (key !== remained[i]?.[2].key) {
        const index = remained.findIndex((c) => c[2].key === key)
        const oldVn = remained[index]
        const cache = ve[4]
        const node = oldVn?.[0] ?? cache?.get(key) ?? createNode(vn)
        if (oldVn) {
          removeNode(oldVn)
          remained.splice(index, 1)
          remained.splice(i, 0, oldVn)
        } else {
          if (cache && !cache.has(key)) cache.set(key, node)
          vn[0] = node
          remained.splice(i, 0, vn)
        }
        ve[0].insertBefore(node, ve[0].childNodes.item(i))
      }
      updateChild(ve, i, vn)
    }
  } else {
    const len = vnodes.length
    const oldLen = ve[3].length
    for (let i = 0; i < len || i < oldLen; i++)
      if (i < len && i < oldLen) updateChild(ve, i, vnodes[i])
      else if (i >= oldLen) ve[0].appendChild(createNode(vnodes[i]))
      else removeNode(ve[3][i])
    ve[3] = vnodes
  }
}

function updateChild(/**@type {Ve}*/ ve, /**@type {number}*/ i, /**@type {Vn}*/ vn) {
  const oldVn = ve[3][i]
  if (oldVn[4] !== 0 && vn[4] !== 0 && oldVn[1] === vn[1]) {
    const [el, , oldProps] = oldVn
    const [, , props, vnodes] = vn
    vn[0] = el
    for (const k in props) if (props[k] !== oldProps[k]) setElementProp(el, k, props[k])
    for (const k in oldProps) if (!(k in props)) resetElementProp(el, k)
    if (!['innerText', 'innerHTML', 'textContent'].some((k) => k in props))
      updateChildren(oldVn, vnodes)
  } else {
    const node = createNode(vn)
    removeNode(ve[3][i])
    ve[0].insertBefore(node, ve[0].childNodes.item(i))
    ve[4]?.set(vn[2].key, node)
  }
  ve[3][i] = vn
}

function updateProp(/**@type {Ve}*/ ve, /**@type {string}*/ k, /**@type {any}*/ v) {
  const [el, , props] = ve
  if (props[k] === v) return
  props[k] = v
  setElementProp(el, k, v)
}

function getKeysFromVnodes(/**@type {Vn[]}*/ vnodes) {
  const keys = vnodes.filter((vn) => 'key' in vn[2]).map((vn) => vn[2].key)
  if (new Set(keys).size !== keys.length) throw new Error('duplicate keys')
  else return keys.length === vnodes.length ? keys : null
}

function removeArrowsInVeFromDeps(/**@type {Vn}*/ vn) {
  for (const arrow of deps.keys()) if (contains(vn, arrow[1])) deps.delete(arrow)
}

function contains(/**@type {Vn}*/ ancestor, /**@type {Vn=}*/ descendant) {
  if (!descendant) return false
  if (ancestor === descendant) return true
  const result = ancestor[3].some((vn) => contains(vn, descendant))
  return result
}

// @ts-ignore
function setElementProp(el, k, v) {
  if (k === 'class' || k === 'for') k = '_' + k
  if (k[0] === '$') el.style[k.slice(1)] = v
  else if (k[0] === '_') el.setAttribute(k.slice(1), v)
  else if (k.startsWith('on')) el[k.toLowerCase()] = v
  else el[k] = v
}

// @ts-ignore
function resetElementProp(el, k) {
  if (k[0] === '$') el.style[k.slice(1)] = null
  else if (k[0] === '_' || k in el.attributes) el.removeAttribute(k.replace(/^_/, ''))
  else el[k] = undefined // TODO: 需要研究正确性
}
