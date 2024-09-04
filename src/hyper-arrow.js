// @ts-check

/**
 * @typedef {'html' | 'svg' | 'mathml'} ElType
 * @typedef {{[k: string]: unknown, id?: string}} Props
 * @typedef {{[k: string]: VN}} Cache
 * @typedef {{[k: string]: never}} Empty
 * @typedef {[ElType, tag: string, Props, VN[], Element?, Cache?]} VE virtal element
 * @typedef {['text', txt: string, Empty, [], Text?]} VT virtual textnode
 * @typedef {VE | VT} VN virtual node
 * @typedef {[Function, VE, k: ?string|number]} ElementArrow
 * @typedef {[Function, null, null, effect?: Function]} WatchArrow
 * @typedef {ElementArrow | WatchArrow} Arrow
 * @typedef {[target: object, prop: string | symbol]} Trigger
 * @typedef {{[k: string]: unknown}} HProps
 * @typedef {VE | string | (() => (VE | string))} HChild
 * @typedef {HChild[] | (() => HChild[])} HChildren
 * @typedef {[propsOrChildren?: HProps|HChildren, children?: HChildren]} HArgs
 */

const CACHE_KEY = 'cacheChildren'
const BRAND_KEY = '__hyper_arrow__'
const BRAND_SYMBOL = Symbol(BRAND_KEY)
const ELEMENT_NS = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  mathml: 'http://www.w3.org/1998/Math/MathML',
}

let /**@type {Arrow?}*/ currentArrow = null

export const /**@type {Map<Arrow, Trigger[]>}*/ deps = new Map()

/** @type {{[ns: string]: {[tag: string]: (...args: HArgs) => VE}}} */
export const tags = new Proxy(
  {},
  {
    get: (_, /**@type {string}*/ type) =>
      new Proxy(
        {},
        { get: (_, /**@type {string}*/ tag) => h.bind(null, type + ':' + tag) },
      ),
  },
)

/** @type {(name: string, ...args: HArgs) => VE} */
export const h = function createVE(name, props, children) {
  const [a, b] = name.split(':')
  const [type, tag] = b ? [a, b] : [b, 'html']
  // @ts-ignore let it crash if type is not ElType
  const /**@type {VE}*/ ve = [type, tag, Object.create(null), []]
  if (typeof props !== 'object' || Array.isArray(props)) children = props
  else
    for (const k in props)
      if (k.startsWith('on')) ve[2][k.toLowerCase()] = props[k]
      else ve[2][k] = evaluate(props[k], ve, k)
  const /**@type {HChild[]}*/ childList = evaluate(children, ve, null) ?? []
  for (const i in childList) ve[3].push(createVN(evaluate(childList[i], ve, +i)))
  return ve
}

function createVN(/**@type {VE | string}*/ x) {
  return typeof x === 'string' ? createVT(x) : x
}

function createVT(/**@type {string}*/ data) {
  const /**@type {VT}*/ vt = ['text', data, Object.create(null), []]
  return vt
}

/**
 * run watchFn() once, and whenever watchFn's dependencies change,
 * auto rerun watchFn(), or effectFn(watchFn()) if effectFn provided,
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {(a: ReturnType<F extends (()=> any) ? F : never>) => any=} effectFn
 * @returns {() => void} function to stop auto rerunning
 */
export function watch(watchFn, effectFn) {
  evaluate(watchFn, null, null, effectFn)
  return () => {
    for (const arrow of deps.keys()) if (arrow[0] === watchFn) deps.delete(arrow)
  }
}

/** @type {(fn: unknown, ve: ?VE, k: ?string|number, effect?: Function) => any} */
function evaluate(fn, ve, k, effect) {
  if (typeof fn !== 'function') return fn
  currentArrow = ve ? [fn, ve, k] : [fn, null, null, effect]
  const result = fn()
  currentArrow = null
  return result
}

/** mount virtual element to DOM */
export function mount(/**@type {string}*/ selector, /**@type {VE}*/ ve) {
  // @ts-ignore let it crash if selector not found
  document.querySelector(selector).append(getOrCreateElement(ve))
}

function getOrCreateElement(/**@type {VE}*/ ve) {
  if (ve[4]) return ve[4]
  const [type, tag, props, children] = ve
  const el = document.createElementNS(ELEMENT_NS[type], tag)
  ve[4] = el
  el.setAttribute('uid', Math.random().toString().slice(2, 4)) // TODO: 测试用，待删除
  el.append(...children.map(getOrCreateNode))
  for (const k in props) setProp(ve, k, props[k])
  const ids = getChildIds(children)
  if (props[CACHE_KEY] && ids) {
    ve[5] = ids.reduce((acc, id, i) => ({ ...acc, [id]: children[i] }), {})
  }
  // @ts-ignore let it crash if oncreate is not function
  props.oncreate?.(el)
  // @ts-ignore in fact works`
  el[BRAND_KEY] = ve
  return el
}

function getOrCreateNode(/**@type {VN}*/ vn) {
  return vn[0] === 'text' ? getOrCreateTextNode(vn) : getOrCreateElement(vn)
}

function getOrCreateTextNode(/**@type {VT}*/ vt) {
  if (vt[4]) return vt[4]
  const textNode = document.createTextNode(vt[1])
  vt[4] = textNode
  // @ts-ignore in fact works
  textNode[BRAND_KEY] = vt
  return textNode
}

function getChildIds(/**@type {VN[]}*/ vnodes) {
  const ids = vnodes.map((vn) => vn[2].id).filter((id) => typeof id === 'string')
  if (new Set(ids).size !== ids.length) throw new Error('duplicate child id')
  else return ids.length === vnodes.length ? ids : null
}

export const isReactive = (/**@type {any}*/ x) => !!x[BRAND_SYMBOL]

/** make object reactive @type {<T extends object>(target: T) => T} */
export function reactive(target) {
  if (target !== Object(target) || isReactive(target)) return target
  return new Proxy(target, {
    get(t, p) {
      if (p === BRAND_SYMBOL) return true
      const result = Reflect.get(t, p)
      if (typeof t === 'function' && p === 'prototype') return result
      if (currentArrow) {
        if (!deps.has(currentArrow)) deps.set(currentArrow, [])
        const triggers = deps.get(currentArrow)
        // @ts-ignore in fact works, map key checked above
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
              // console.log({ t, p, newValue, el: ve?.[4], k })
              const v = fn()
              if (!ve) effect?.(v)
              else if (k === null) {
                for (const vn of ve[3]) removeArrowsInVnFromDeps(vn)
                updateChildren(ve, v.map(createVN))
              } else if (typeof k === 'number') {
                removeArrowsInVnFromDeps(ve[3][k])
                updateChild(ve, k, createVN(v))
              } else updateProp(ve, k, v)
            }
          }
      return result
    },
  })
}

function removeArrowsInVnFromDeps(/**@type {VN}*/ vn) {
  for (const arrow of deps.keys()) if (contains(vn, arrow[1])) deps.delete(arrow)
}

/** @returns {boolean} */
function contains(/**@type {VN}*/ ancestor, /**@type {?VN}*/ descendant) {
  if (!descendant) return false
  if (ancestor === descendant) return true
  const result = ancestor[3].some((vn) => contains(vn, descendant))
  return result
}

function updateChildren(/**@type {VE}*/ ve, /**@type {VN[]}*/ vnodes) {
  const oldIds = getChildIds(ve[3])
  const ids = getChildIds(vnodes)
  if (oldIds && ids) {
    // has unique ids, smart update
    for (let i = oldIds.length - 1; i >= 0; i--)
      if (!ids.includes(oldIds[i])) removeChild(ve, i)
    for (const [i, id] of ids.entries()) {
      const j = ve[3].findIndex((vn) => vn[2].id === id)
      const vn = vnodes[i]
      if (i === j) updateChild(ve, i, vn)
      else if (ve[3][j]) {
        insertChild(ve, i, removeChild(ve, j))
        updateChild(ve, i, vn)
      } else if (ve[5]?.[id]) {
        insertChild(ve, i, ve[5][id])
        updateChild(ve, i, vn)
      } else insertChild(ve, i, vn)
    }
  } else {
    // no unique ids, simple update
    const newLen = vnodes.length
    const oldLen = ve[3].length
    for (let i = 0; i < newLen || i < oldLen; i++)
      if (i < newLen && i < oldLen) updateChild(ve, i, vnodes[i])
      else if (i >= oldLen) insertChild(ve, i, vnodes[i])
      else removeChild(ve, i)
  }
}

function updateChild(/**@type {VE}*/ ve, /**@type {number}*/ i, /**@type {VN}*/ vn) {
  const _vn = ve[3][i]
  if (_vn[0] !== 'text' && vn[0] !== 'text' && _vn[1] === vn[1]) {
    // both ve, same tag, change in place
    const props = vn[2]
    for (const k in props) updateProp(_vn, k, props[k])
    for (const k in _vn[2]) if (!(k in props)) unsetProp(_vn, k)
    if (!['innerText', 'innerHTML', 'textContent'].some((k) => k in props))
      updateChildren(_vn, vn[3])
  } else {
    // replace whole node
    removeChild(ve, i)
    insertChild(ve, i, vn)
  }
}

function insertChild(/**@type {VE}*/ ve, /**@type {number}*/ i, /**@type {VN}*/ vn) {
  ve[3].splice(i, 0, vn)
  const el = getOrCreateElement(ve)
  el.insertBefore(getOrCreateNode(vn), el.childNodes.item(i))
  if (ve[5] && vn[2].id) ve[5][vn[2].id] = vn
}

function removeChild(/**@type {VE}*/ ve, /**@type {number}*/ i) {
  const vn = ve[3].splice(i, 1)[0]
  const node = getOrCreateNode(vn)
  // @ts-ignore let it crash if onremove is not function
  vn[2].onremove?.(node)
  node.remove()
  return vn
}

function updateProp(/**@type {VE}*/ ve, /**@type {string}*/ k, /**@type {unknown}*/ v) {
  if (ve[2][k] !== v) setProp(ve, k, v)
}

function setProp(/**@type {VE}*/ ve, /**@type {string}*/ k, /**@type {unknown}*/ v) {
  ve[2][k] = v
  const el = getOrCreateElement(ve)
  if (k === 'class' || k === 'for') k = '_' + k
  // @ts-ignore let it crash if no el.style (not html, svg, mathml) or v is not string
  if (k[0] === '$') el.style.setProperty(k.slice(1), v)
  // @ts-ignore let it crash if v is not string
  else if (k[0] === '_') el.setAttribute(k.slice(1), v)
  // @ts-ignore in fact arbitray property name works
  else el[k] = v
}

function unsetProp(/**@type {VE}*/ ve, /**@type {string}*/ k) {
  delete ve[2][k]
  const el = getOrCreateElement(ve)
  // @ts-ignore let it crash if no el.style (not html, svg, mathml)
  if (k[0] === '$') el.style.removeProperty(k.slice(1))
  else if (k[0] === '_' || k.toLowerCase() in el.attributes)
    el.removeAttribute(k.replace(/^_/, ''))
  // @ts-ignore in fact arbitray property name works
  else el[k] = undefined // TODO: how to unset js properties??
}
