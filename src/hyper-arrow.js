// @ts-check

/**
 * @typedef {'html' | 'svg' | 'mathml'} ElType
 * @typedef {HTMLElement | SVGElement | MathMLElement} El
 * @typedef {{[k: string]: unknown, id?: string}} Props
 * @typedef {{[k: string]: VNode}} Cache
 * @typedef {{[k: string]: never}} Empty
 * @typedef {[ElType, tag: string, Props, VNode[], El?, Cache?]} VEl virtal element
 * @typedef {['text', txt: string, Empty, [], Text?]} VText virtual textnode
 * @typedef {VEl | VText} VNode virtual node
 */
const TYPE = 0
const TAG = 1
const TXT = 1
const PROPS = 2
const CHILDREN = 3
const NODE = 4
const CACHE = 5

/**
 * @typedef {[Function, VEl, key: ?string|number]} ElArrow
 * @typedef {[Function, null, null, effect?: Function]} WatchArrow
 * @typedef {ElArrow | WatchArrow} Arrow
 */
const FN = 0
const VEL = 1

/** @typedef {[target: object, prop: string | symbol]} Trigger */
const TARGET = 0
const PROP = 1

const BRAND_KEY = '__hyper_arrow__'
const BRAND_SYMBOL = Symbol(BRAND_KEY)

let /**@type {Arrow?}*/ currentArrow = null

export const /** dependency map @type {Map<Arrow, Trigger[]>}*/ deps = new Map()

/**
 * @typedef {{[k: string]: unknown}} TagProps
 * @typedef {VEl | string | (() => (VEl | string))} TagChild
 * @typedef {TagChild[] | (() => TagChild[])} TagChildren
 * @typedef {[propsOrChildren?: TagProps|TagChildren, children?: TagChildren]} TagArgs
 * @type {{[ns: string]: {[tag: string]: (...args: TagArgs) => VEl}}}
 */
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

/** @type {(name: string, ...args: TagArgs) => VEl} */
export const h = function createVel(name, props, children) {
  const [a, b] = name.split(':')
  const [type, tag] = b ? [a, b] : [b, 'html']
  // @ts-ignore let it crash if type is not ElType
  if (type !== 'html' && type !== 'svg' && type !== 'mathml')
    throw new Error("tag type must be 'html', 'svg' or 'mathml'")
  const /**@type {VEl}*/ ve = [type, tag, { __proto__: null }, []]
  if (typeof props !== 'object' || Array.isArray(props)) children = props
  else
    for (const key in props) {
      // on* event handlers, all lowercase, have no arrow, so not evaluted
      if (key.startsWith('on')) ve[PROPS][key.toLowerCase()] = props[key]
      // set currentArrow and run arrow function within it
      else ve[PROPS][key] = evaluate(props[key], ve, key)
    }
  const /**@type {TagChild[]}*/ childList = evaluate(children, ve, null) ?? []
  for (const i in childList)
    ve[CHILDREN].push(createVnode(evaluate(childList[i], ve, +i)))
  return ve
}

function createVnode(/**@type {VEl | string}*/ x) {
  return typeof x === 'string' ? createVtext(x) : x
}

function createVtext(/**@type {string}*/ txt) {
  const /**@type {VText}*/ vtext = ['text', txt, {}, []]
  return vtext
}

/** mount virtual element to DOM */
export function mount(/**@type {string}*/ selector, /**@type {VEl}*/ vel) {
  // @ts-ignore let it crash if selector not found
  document.querySelector(selector).append(createElement(vel))
}

const UID = 'uid'
const ONCREATE = 'oncreate'
const CACHE_REMOVED_CHILDREN = 'cacheRemovedChildren'
const ELEMENT_NS = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  mathml: 'http://www.w3.org/1998/Math/MathML',
}
let uid = 0

function createElement(/**@type {VEl}*/ vel) {
  const [type, tag, props, children] = vel
  // @ts-ignore ok
  const /**@type {El}*/ el = document.createElementNS(ELEMENT_NS[type], tag)
  // use uid to track el's identity for debugging purpose
  el.setAttribute(UID, uid++ + '')
  for (const key in props) setProp(el, key, props[key])
  el.append(...children.map(createNode))
  // @ts-ignore ok
  el[BRAND_KEY] = vel
  vel[NODE] = el
  if (props[CACHE_REMOVED_CHILDREN] && getIds(children)) vel[CACHE] = {}
  // @ts-ignore let it crash if oncreate is not function
  props[ONCREATE]?.(el)
  return el
}

function createNode(/**@type {VNode}*/ vnode) {
  return vnode[TYPE] === 'text' ? createTextNode(vnode) : createElement(vnode)
}

function createTextNode(/**@type {VText}*/ vtext) {
  const textNode = document.createTextNode(vtext[TXT])
  // @ts-ignore ok
  textNode[BRAND_KEY] = vtext
  vtext[NODE] = textNode
  return textNode
}

/**
 * run watchFn() once, and whenever watchFn's dependencies change,
 * auto rerun watchFn(), and run effectFn(watchFn()) if effectFn provided
 * @template F
 * @param {F extends (() => any) ? F : never} watchFn
 * @param {((a: ReturnType<F extends (() => any) ? F : never>) => any)=} effectFn
 * @returns {() => void} fn to stop watchFn from rerunning by removing it from deps
 */
export function watch(watchFn, effectFn) {
  evaluate(watchFn, null, null, effectFn)
  return () => {
    for (const arrow of deps.keys()) if (arrow[FN] === watchFn) deps.delete(arrow)
  }
}

/**
 * create a new arrow with contextual info and run fn within it, if fn is function
 * @type {(fn: unknown, ve: ?VEl, k: ?string|number, effect?: Function) => any}
 */
function evaluate(fn, ve, key, effect) {
  if (typeof fn !== 'function') return fn
  currentArrow = ve ? [fn, ve, key] : [fn, null, null, effect]
  const result = fn()
  currentArrow = null
  return result
}

export const isReactive = (/**@type {any}*/ x) => !!x[BRAND_SYMBOL]

/** create a reactive proxy @type {<T extends object>(target: T) => T} */
export function reactive(target) {
  if (target !== Object(target) || isReactive(target)) return target
  return new Proxy(target, {
    get(target, prop) {
      // this is how isReactive() works
      if (prop === BRAND_SYMBOL) return true
      const result = Reflect.get(target, prop)
      // function.prototype cannot be proxied, so skip it
      if (typeof target === 'function' && prop === 'prototype') return result
      // collect trigger as dependency of current arrow
      if (currentArrow) {
        if (!deps.has(currentArrow)) deps.set(currentArrow, [])
        // @ts-ignore ok, map key checked above
        const /**@type {Trigger[]}*/ triggers = deps.get(currentArrow)
        if (!triggers.some((t) => t[TARGET] === target && t[PROP] === prop))
          triggers.push([target, prop])
      }
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = Reflect.get(target, prop)
      const result = Reflect.set(target, prop, newValue)
      // skip meaningless change, unless touching array.length inside array.push() etc.
      if (oldValue === newValue && prop !== 'length') return result
      for (const [arrow, triggers] of deps.entries()) {
        for (const trigger of triggers) {
          // update target object in all related triggers in deps
          if (trigger[TARGET] === oldValue) trigger[TARGET] = newValue
          // dependent arrows found! Action!
          if (trigger[TARGET] === target && trigger[PROP] === prop) {
            const [fn, vel, key, effect] = arrow
            const value = fn()
            // console.log('-----')
            // console.log({ target, prop, oldValue, newValue })
            // console.log({ ...ve, k, v })
            if (!vel) {
              effect?.(value)
            } else if (key === null) {
              vel[CHILDREN].map(removeArrowsInVnFromDeps)
              updateChildren(vel, value.map(createVnode))
            } else if (typeof key === 'number') {
              removeArrowsInVnFromDeps(vel[CHILDREN][key])
              updateChild(vel, key, createVnode(value))
            } else {
              // @ts-ignore ok, now vel has el TODO:
              setProp(vel[NODE], key, value)
            }
          }
        }
      }
      return result
    },
  })
}

// TODO: vel -> rel 之后，用 dom contains 代替
function removeArrowsInVnFromDeps(/**@type {VNode}*/ vnode) {
  for (const arrow of deps.keys()) if (contains(vnode, arrow[VEL])) deps.delete(arrow)
}

/** @returns {boolean} */
function contains(/**@type {VNode}*/ ancestor, /**@type {?VNode}*/ descendant) {
  if (!descendant) return false
  if (ancestor === descendant) return true
  const result = ancestor[CHILDREN].some((vnode) => contains(vnode, descendant))
  return result
}

function updateChildren(/**@type {VEl}*/ vel, /**@type {VNode[]}*/ newVnodes) {
  const oldIds = getIds(vel[CHILDREN])
  const newIds = getIds(newVnodes)
  // if both have unique ids, smart update
  if (oldIds && newIds) {
    // remove unmatched. MUST REMOVE FROM TAIL!!! otherwise index would be messed up
    for (let i = oldIds.length - 1; i >= 0; i--) {
      if (!newIds.includes(oldIds[i])) removeChild(vel, i)
    }
    // build from head to tail
    for (const [i, id] of newIds.entries()) {
      const j = vel[CHILDREN].findIndex((vnode) => vnode[PROPS].id === id)
      const newVnode = newVnodes[i]
      if (i === j) {
        // matched in current position, update
        updateChild(vel, i, newVnode)
      } else if (vel[CHILDREN][j]) {
        // matched in latter position, bring it up, then update. REMOVE FIRST!!!
        insertChild(vel, i, removeChild(vel, j)) // ok, j > i always
        updateChild(vel, i, newVnode)
      } else if (vel[CACHE]?.[id]) {
        // matched in removed cache, bring it out, then update
        insertChild(vel, i, vel[CACHE][id])
        updateChild(vel, i, newVnode)
      } else {
        // matched nothing, create and insert
        insertChild(vel, i, newVnode)
      }
    }
  } else {
    // no unique ids, silly update
    const newLen = newVnodes.length
    const oldLen = vel[CHILDREN].length
    // build from head to tail
    for (let i = 0; i < newLen || i < oldLen; i++) {
      if (i < newLen && i < oldLen) {
        // update existing ones in place
        updateChild(vel, i, newVnodes[i])
      } else if (i >= oldLen) {
        // insert new ones in tail
        insertChild(vel, i, newVnodes[i])
      } else {
        // REMOVE unneeded old ones FROM TAIL!!!
        removeChild(vel, oldLen + newLen - 1 - i)
      }
    }
  }
}

function getIds(/**@type {VNode[]}*/ vnodes) {
  const ids = vnodes.map((vn) => vn[PROPS].id).filter((id) => typeof id === 'string')
  if (new Set(ids).size !== ids.length) throw new Error(`duplicate children id: ${ids}`)
  else return ids.length === vnodes.length ? ids : null
}

function updateChild(
  /**@type {VEl}*/ vel,
  /**@type {number}*/ index,
  /**@type {VNode}*/ newVnode,
) {
  const oldVNode = vel[CHILDREN][index]
  // if both vel with same tag, patch the existing el
  if (
    oldVNode[TYPE] !== 'text' &&
    newVnode[TYPE] !== 'text' &&
    oldVNode[TAG] === newVnode[TAG]
  ) {
    // @ts-ignore ok, vel has children nodes TODO:
    const /**@type {El}*/ el = oldVNode[NODE]
    for (const key in newVnode[PROPS])
      if (oldVNode[PROPS][key] !== newVnode[PROPS][key])
        setProp(el, key, newVnode[PROPS][key])
    for (const key in oldVNode[PROPS]) if (!(key in newVnode[PROPS])) unsetProp(el, key)
    // innerText, innerHTML, textContent prop already deals with children, so skip
    if (!['innerText', 'innerHTML', 'textContent'].some((k) => k in newVnode[PROPS]))
      updateChildren(oldVNode, newVnode[CHILDREN])
    newVnode[NODE] = oldVNode[NODE]
    vel[CHILDREN][index] = newVnode
  } else {
    // replace whole node. REMOVE FIRST!!!
    removeChild(vel, index)
    insertChild(vel, index, newVnode)
  }
}

function insertChild(
  /**@type {VEl}*/ vel,
  /**@type {number}*/ index,
  /**@type {VNode}*/ newVnode, // TODO: VN or VEL
) {
  // @ts-ignore ok. TODO:
  const /**@type {El}*/ el = vel[NODE]
  const node = newVnode[NODE] ?? createNode(newVnode)
  el.insertBefore(node, el.childNodes.item(index))
  vel[CHILDREN].splice(index, 0, newVnode)
  // alrady brought out, so remove from cache
  if (vel[CACHE] && newVnode[PROPS].id) delete vel[CACHE][newVnode[PROPS].id]
}

function removeChild(/**@type {VEl}*/ vel, /**@type {number}*/ index) {
  const vnode = vel[CHILDREN].splice(index, 1)[0]
  // @ts-ignore ok TODO:
  vnode[NODE].remove()
  // put into cache
  if (vel[CACHE] && vnode[PROPS].id) vel[CACHE][vnode[PROPS].id] = vnode
  return vnode
}

function setProp(
  /**@type {El}*/ el,
  /**@type {string}*/ key,
  /**@type {unknown}*/ value,
) {
  // special keys only goes into Vel, not el
  if ([ONCREATE, CACHE_REMOVED_CHILDREN].includes(key)) return
  // IDL properties are getter/setters, proxies of attributes. For example:
  // getter/setter: on* aria* autofocus id className classList style innerHTML ...
  // getter only: client* scrollTop tagName dataset attributes children firstChild ...
  // plain value: blur() focus() after() append() ... (all methods)
  // @ts-ignore ok, getPropType has 'set'
  if (getPropType(el, key).includes('set')) el[key] = value
  else if (typeof value !== 'string')
    throw new Error(`<${el.nodeName}> attr/style must be string: ${key} = ${value}`)
  else if (key[0] === '$') el.style.setProperty(key.slice(1), value)
  else if (key[0] === '_') el.setAttribute(key.slice(1), value)
  else el.setAttribute(key, value)
}

function getPropType(/**@type {object}}*/ object, /**@type {string}*/ prop) {
  if (!(prop in object)) return []
  const pd = Object.getOwnPropertyDescriptor(object, prop)
  if (pd)
    return Object.entries(pd)
      .map(([k, v]) => (v ? k : null))
      .filter((x) => x)
  const proto = Object.getPrototypeOf(object)
  if (!proto) return []
  return getPropType(proto, prop)
}

const /**@type {{[k:string]: string}}*/ prop2attr = {
    defaultValue: 'value',
    htmlFor: 'for',
    className: 'class',
    // @ts-ignore ok. __proto__ is special. dumb TS!!
    __proto__: null,
  }

function unsetProp(/**@type {El}*/ el, /**@type {string}*/ key) {
  // remove attr and IDL prop. most IDL props can also be unset by lowercasing into attr
  if (key.toLowerCase() in el.attributes) el.removeAttribute(key)
  // special cases for IDL prop naming
  else if (key in prop2attr) el.removeAttribute(prop2attr[key])
  // @ts-ignore ok. TODO: test more cases for how to unset arbitary non-attr props
  else if (key in el) el[key] = typeof el[key] === 'string' ? '' : undefined
  else {
    const start = key[0]
    const remained = key.slice(1)
    if (start === '_') el.removeAttribute(remained)
    else if (start === '$') el.style.removeProperty(remained)
    else throw new Error(`invalid prop '${key}' to unset from <${el.nodeName}>`)
  }
}
