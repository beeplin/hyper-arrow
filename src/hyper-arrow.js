// @ts-check
const DEBUG = true

// reassign built-in objects and methods for better minification
const LENGTH = 'length'
const TEXT = 'text'
const OBJECT = Object
const PROXY = Proxy
const REFLECT = Reflect
const DOCUMENT = document
const isArray = Array.isArray
const removeFirst = (/**@type {any}*/ x) => x.slice(1)
const toLowerCase = (/**@type {string}*/ str) => str.toLowerCase()
/** @type {(el: El, k: string, v: unknown) => void} */
// @ts-ignore ok. setAttribute can coerce
const setAttribute = (el, k, v) => el.setAttribute(k, v)
/** @type {(el: El, k: string) => void} */
const removeAttribute = (el, k) => el.removeAttribute(k)

export const ON_CREATE = Symbol()
export const CACHE_REMOVED_CHILDREN = Symbol()

/**
 * @typedef {'html' | 'svg' | 'mathml'} ElType
 * @typedef {HTMLElement | SVGElement | MathMLElement} El
 * @typedef {string} Tag
 * @typedef {string} Txt
 * @typedef {{[k: string | symbol]: unknown,
 *            [CACHE_REMOVED_CHILDREN]?: number,
 *            [ON_CREATE]?: (el: Element) => void}} Props
 * @typedef {{[k: string]: never}} Empty
 * @typedef {{[k: string]: RNode}} Cache
 * @typedef {number} CacheSize
 * @_______ {[null, Tag, Props, VNode[], ElType]} VEl virtual element, array-like class
 * @typedef {[El,   Tag, Props, RNode[], ElType, Cache?, CacheSize?]} REl real element
 * @typedef {[null, Txt, Empty, [],     'text']} VText virtual text node
 * @typedef {[Text, Txt, Empty, [],     'text']} RText real text node
 * @typedef {VEl | VText} VNode virtual node
 * @typedef {REl | RText} RNode real node
 * @typedef {VNode | RNode} ANode any node
 */
const NODE = 0
const TAG = 1
const TXT = 1
const PROPS = 2
const CHILDREN = 3
const TYPE = 4
const CACHE = 5
const CACHE_SIZE = 6

/** virtual element @constructor */
export function VEl(
  /**@type {ElType}*/ type,
  /**@type {string}*/ tag,
  /**@type {Props}*/ props,
  /**@type {VNode[]}*/ children,
) {
  this[TYPE] = type
  this[TAG] = tag
  this[PROPS] = props
  this[CHILDREN] = children
}

// FAWC: Function Associated With Context
/** @typedef {string | number | null} Key */
/** @template F @typedef {F extends () => any ? F : never} ZIF Zero Input Function */
/** @template F @typedef {F extends () => any ? ReturnType<ZIF<F>> : F} Evaluated */
/** @template F @typedef {(v: ReturnType<ZIF<F>>) => unknown} Effect */
/** @template T @typedef {[null, null, ZIF<T>, Effect<T>?]} WatchFawc */
/** @template T @typedef {[VEl, Key, ZIF<T>]} ElFawc */
/** @template T @typedef {[VEl, Key, T]} NotFawc */
/** @template T @typedef {ElFawc<T> | WatchFawc<T>} Fawc */
const VEL = 0
const ZIF = 2

/** @typedef {Fawc<() => any>} AnyFawc */
let /**@type {AnyFawc?}*/ currentFawc = null

// ROPA: Reactive Object Property Access
/** @type {Map<AnyFawc, WeakMap<object, Set<string | symbol>>>} */
export const fawc2ropa = new Map()
/** @type {WeakMap<object, Record<string | symbol, WeakSet<AnyFawc>>>} */
export const ropa2fawc = new WeakMap()

/**
 * @typedef {VEl | string | (() => (VEl | string))} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[Props, Children] | [Props, ...Child[]] | [Children] | Child[]} Args
 * @type {{[type: string]: {[tag: string]: (...args: Args) => VEl}}}
 */
export const tags = new PROXY(
  {},
  {
    get: (_, /**@type {ElType}*/ type) =>
      new PROXY(
        {},
        { get: (_, /**@type {string}*/ tag) => createVEl.bind(null, type, tag) },
      ),
  },
)
;('  aaaa    ')
let isFirstCreateVEl = true

function createVEl(
  /**@type {ElType}*/ type,
  /**@type {string}*/ tag,
  /**@type {Args}*/ ...args
) {
  if (DEBUG && isFirstCreateVEl) {
    isFirstCreateVEl = false
    console.groupCollapsed('init')
  }
  const vel = new VEl(type, tag, OBJECT.create(null), [])
  const /**@type {[Props, [Children] | Child[]]}*/ [props, x] =
      typeof args[0] === 'object' && !isArray(args[0]) && !(args[0] instanceof VEl)
        ? [args[0], removeFirst(args)]
        : [{}, args]
  for (const key of OBJECT.getOwnPropertySymbols(props)) {
    vel[PROPS][key] = props[key]
  }
  for (const key in props) {
    // on* event handlers, all lowercase, not FAWC, not evaluated
    if (key.startsWith('on')) {
      vel[PROPS][toLowerCase(key)] = props[key]
    } else {
      vel[PROPS][key] = runFawc([vel, key, props[key]])
    }
  }
  // args may be like tag(() => Child), not tag(() => Child[]).
  // in this case FAWC key should be 0, not null.
  // but cannot foresee whether fn returns Child or Child[] before it actually runs
  // so the wrong FAWC key (null) must be corrected later in reactive/set
  // @ts-ignore ok. guaranteed by x.length === 1
  const /**@type {Children | (() => Child)}*/ children =
      isArray(x) && x[LENGTH] === 1 && (typeof x[0] === 'function' || isArray(x[0]))
        ? x[0]
        : x
  const y = runFawc([vel, null, children])
  if (typeof y === 'function' || typeof y === 'string' || y instanceof VEl) {
    vel[CHILDREN].push(createVNode(runFawc([vel, 0, y])))
  } else {
    for (const i in y) {
      vel[CHILDREN].push(createVNode(runFawc([vel, +i, y[i]])))
    }
  }
  return vel
}

function createVNode(/**@type {VEl | string}*/ x) {
  return typeof x === 'string' ? createVText(x) : x
}

function createVText(/**@type {string}*/ txt) {
  const /**@type {VText}*/ vtext = [null, txt, {}, [], TEXT]
  return vtext
}

export const UID_ATTR_NAME = Symbol()
let /**@type {string | undefined}*/ uidAttrName
let currentUid = 0

/** mount virtual element to DOM */
export function mount(
  /**@type {string}*/ selector,
  /**@type {VEl}*/ vel,
  /**@type {{[UID_ATTR_NAME]?: string}}*/ options = {},
) {
  uidAttrName = options[UID_ATTR_NAME]
  DEBUG && console.groupEnd()
  DEBUG && console.groupCollapsed('mount')
  // @ts-ignore let it crash if selector not found
  appendVNodes(DOCUMENT.querySelector(selector), [vel])
  DEBUG && console.groupEnd()
}

/**
 * run fn() once, and when triggered, rerun fn(), or effectFn(fn()) if has effectFn
 * returns a function that can stop fn from rerunning by removing it from fawc2ropa
 * @template F @param {ZIF<F>} fn @param {Effect<F>=} effectFn @returns {() => void}
 */
export function watch(fn, effectFn) {
  runFawc([null, null, fn, effectFn])
  return () => {
    for (const fawc of fawc2ropa.keys()) if (fawc[ZIF] === fn) fawc2ropa.delete(fawc)
  }
}

/** @template F @param {ElFawc<F>|NotFawc<F>|WatchFawc<F>} fawc @returns {Evaluated<F>} */
function runFawc(/**@type {any}*/ fawc) {
  const zif = fawc[ZIF]
  if (typeof zif !== 'function') {
    return zif
  }
  const previousFawc = currentFawc
  currentFawc = fawc
  const result = zif()
  currentFawc = previousFawc
  return result
}

const BRAND_KEY = '__hyper_arrow__'
const BRAND_SYMBOL = Symbol(BRAND_KEY)
export const isReactive = (/**@type {any}*/ x) => !!x[BRAND_SYMBOL]

/** create a reactive proxy @type {<T extends object>(obj: T) => T} */
export function reactive(obj) {
  if (obj !== OBJECT(obj) || isReactive(obj)) return obj
  return new PROXY(obj, {
    get(obj, prop) {
      // this is how isReactive() works
      if (prop === BRAND_SYMBOL) return true
      const result = REFLECT.get(obj, prop)
      // would throw if try to proxy function.prototype, so skip it
      if (typeof obj === 'function' && prop === 'prototype') return result
      // collect current ROPA for current FAWC
      if (currentFawc) {
        DEBUG && console.log('get', ...print(currentFawc), obj, prop)
        if (!fawc2ropa.has(currentFawc)) fawc2ropa.set(currentFawc, new WeakMap())
        const ropas = fawc2ropa.get(currentFawc)
        if (ropas) {
          if (!ropas.has(obj)) ropas.set(obj, new Set())
          ropas.get(obj)?.add(prop)
        }
        // collect current FAWC for current ROPA, only for debugging purposes
        if (!ropa2fawc.has(obj)) ropa2fawc.set(obj, OBJECT.create(null))
        const props = ropa2fawc.get(obj)
        if (props) {
          if (!(prop in props)) props[prop] = new WeakSet()
          props[prop].add(currentFawc)
        }
      }
      return reactive(result)
    },
    set(obj, prop, newValue) {
      const oldValue = REFLECT.get(obj, prop)
      const result = REFLECT.set(obj, prop, newValue)
      // skip meaningless change, unless touching array[LENGTH] inside array.push() etc.
      if (oldValue === newValue && !(isArray(obj) && prop === LENGTH)) return result
      for (const [fawc, ropas] of fawc2ropa.entries())
        if (ropas.get(obj)?.has(prop)) {
          DEBUG &&
            console.groupCollapsed('set', ...print(fawc), obj, prop, oldValue, newValue)
          const [vel, key, zif, effect] = fawc
          // @ts-ignore ok. guaranteed by createREl(). vel now becomes rel
          const /**@type {REl}*/ rel = vel
          const value = runFawc(fawc)
          DEBUG && console.groupEnd()
          if (!vel) {
            effect?.(value)
          } else if (
            typeof key === 'number' ||
            // createVEl can't tell tag(() => Child) from tag(() => Child[]),
            // so key may be wrongly null.
            (key === null && (typeof value === 'string' || value instanceof VEl))
          ) {
            const index = key ?? 0
            removeFawcsInRNodeFromDeps(rel[CHILDREN][index])
            updateChild(rel, index, createVNode(value))
          } else if (key === null) {
            rel[CHILDREN].map(removeFawcsInRNodeFromDeps)
            updateChildren(rel, value.map(createVNode))
          } else {
            setProp(rel[NODE], key, value)
          }
        }
      return result
    },
    deleteProperty(obj, prop) {
      const result = REFLECT.deleteProperty(obj, prop)
      DEBUG && console.log('del', obj, prop)
      for (const ropas of fawc2ropa.values()) ropas.get(obj)?.delete(prop)
      delete ropa2fawc.get(obj)?.[prop]
      return result
    },
  })
}

function appendVNodes(/**@type {El}*/ el, /**@type {VNode[]}*/ vnodes) {
  el.append(...vnodes.map(createRNode).map((rnode) => rnode[NODE]))
  if (DEBUG) {
    for (const c of Array.from(el.children)) {
      console.log('append', print(el), '<', print(c))
    }
  }
}

function createRNode(/**@type {VNode}*/ vnode) {
  return vnode[TYPE] === TEXT ? createRText(vnode) : createREl(vnode)
}

function createREl(/**@type {VEl}*/ vel) {
  const el =
    vel[TYPE] === 'html'
      ? DOCUMENT.createElement(vel[TAG])
      : vel[TYPE] === 'svg'
      ? DOCUMENT.createElementNS('http://www.w3.org/2000/svg', vel[TAG])
      : DOCUMENT.createElementNS('http://www.w3.org/1998/Math/MathML', vel[TAG])
  DEBUG && console.group('create', print(vel))
  // use uid to track el's identity, only for debugging purposes
  if (uidAttrName) setAttribute(el, uidAttrName, currentUid++)
  for (const key in vel[PROPS]) setProp(el, key, vel[PROPS][key])
  DEBUG && console.groupEnd()
  appendVNodes(el, vel[CHILDREN])
  // @ts-ignore let it crash if onCreate is not function
  vel[PROPS][ON_CREATE]?.(el)
  return convertVNodeToRNode(vel, el)
}

function createRText(/**@type {VText}*/ vtext) {
  const node = DOCUMENT.createTextNode(vtext[TXT])
  DEBUG && console.log('create', print(node))
  return convertVNodeToRNode(vtext, node)
}

/**
 * @overload @param {VEl} vel @param {El} el @returns {REl}
 * @overload @param {VText} vtext @param {Text} text @returns {RText}
 */
function convertVNodeToRNode(/**@type {VNode}*/ vnode, /**@type {El|Text}*/ node) {
  // @ts-ignore ok. tricky type coercion. rnode and vnode point to the same object
  const /**@type {RNode}*/ rnode = vnode
  rnode[NODE] = node
  const hasCache =
    rnode instanceof VEl &&
    typeof rnode[PROPS][CACHE_REMOVED_CHILDREN] === 'number' &&
    getFullUniqueIds(rnode[CHILDREN])
  if (hasCache) {
    rnode[CACHE] = {}
    rnode[CACHE_SIZE] = 0
  }
  // @ts-ignore ok
  node[BRAND_KEY] = rnode
  return rnode
}

function updateChildren(/**@type {REl}*/ rel, /**@type {VNode[]}*/ newVNodes) {
  const oldIds = getFullUniqueIds(rel[CHILDREN])
  const newIds = getFullUniqueIds(newVNodes)
  // if both have full unique ids, smart update
  if (oldIds && newIds) {
    // remove unmatched children. MUST REMOVE FROM TAIL, otherwise index messed up
    for (let i = oldIds[LENGTH] - 1; i >= 0; i--)
      if (!newIds.includes(oldIds[i])) removeChild(rel, i)
    // build from head to tail
    for (const [i, id] of newIds.entries()) {
      const j = rel[CHILDREN].findIndex((vnode) => vnode[PROPS].id === id)
      const newVNode = newVNodes[i]
      if (i === j) {
        // matched in current position, update
        updateChild(rel, i, newVNode)
      } else if (rel[CHILDREN][j]) {
        // matched in latter position, bring it up, then update. REMOVE FIRST!!!
        insertChild(rel, i, removeChild(rel, j)) // ok, j > i always
        updateChild(rel, i, newVNode)
      } else if (rel[CACHE]?.[id]) {
        // matched in cache, bring it out, then update
        insertChild(rel, i, rel[CACHE][id])
        // TODO: log cache action
        updateChild(rel, i, newVNode)
      } else {
        // matched nothing, create and insert
        insertChild(rel, i, newVNode)
      }
    }
  } else {
    // no full unique ids, silly update
    const newLen = newVNodes[LENGTH]
    const oldLen = rel[CHILDREN][LENGTH]
    // build from head to tail
    for (let i = 0; i < newLen || i < oldLen; i++) {
      if (i < newLen && i < oldLen) {
        // update existing ones in place
        updateChild(rel, i, newVNodes[i])
      } else if (i >= oldLen) {
        // insert new ones in tail
        insertChild(rel, i, newVNodes[i])
      } else {
        // REMOVE unneeded old ones FROM TAIL!!!
        removeChild(rel, oldLen + newLen - 1 - i)
      }
    }
  }
}

function updateChild(
  /**@type {REl}*/ rel,
  /**@type {number}*/ index,
  /**@type {VNode}*/ newVNode,
) {
  const oldRNode = rel[CHILDREN][index]
  // if both vel with same tag, patch the existing el
  if (
    oldRNode[TYPE] !== TEXT &&
    newVNode[TYPE] !== TEXT &&
    oldRNode[TAG] === newVNode[TAG]
  ) {
    const el = oldRNode[NODE]
    for (const key in newVNode[PROPS])
      if (oldRNode[PROPS][key] !== newVNode[PROPS][key])
        setProp(el, key, newVNode[PROPS][key])
    for (const key in oldRNode[PROPS]) if (!(key in newVNode[PROPS])) unsetProp(el, key)
    // innerText, innerHTML, textContent already deals with children, so skip children
    if (!['innerText', 'innerHTML', 'textContent'].some((k) => k in newVNode[PROPS]))
      updateChildren(oldRNode, newVNode[CHILDREN])
    rel[CHILDREN][index] = convertVNodeToRNode(newVNode, oldRNode[NODE])
  } else {
    // replace whole node. REMOVE FIRST!!!
    removeChild(rel, index)
    insertChild(rel, index, newVNode)
  }
}

function insertChild(
  /**@type {REl}*/ rel,
  /**@type {number}*/ index,
  /**@type {ANode}*/ newANode,
) {
  const el = rel[NODE]
  // @ts-ignore ok. stupid ts！
  const /**@type {RNode}*/ newRNode = newANode[NODE] ? newANode : createRNode(newANode)
  const node = newRNode[NODE]
  el.insertBefore(node, el.childNodes.item(index))
  DEBUG && console.log('insert', print(el), index, print(node))
  rel[CHILDREN].splice(index, 0, newRNode)
  // already brought out, so remove from cache
  if (rel[CACHE] && rel[CACHE_SIZE]) {
    // @ts-ignore ok. partly guaranteed by getFullUniqueIds, and can coerce
    delete rel[CACHE][newRNode[PROPS].id]
    rel[CACHE_SIZE]-- // FIXME: duplicate id
  }
  // TODO: log cache action
}

function removeChild(/**@type {REl}*/ rel, /**@type {number}*/ index) {
  const rnode = rel[CHILDREN].splice(index, 1)[0]
  rnode[NODE].remove()
  DEBUG && console.log('remove', print(rel[NODE]), index, print(rnode[NODE]))
  // move into cache
  if (
    rel[CACHE] &&
    rel[CACHE_SIZE] != null &&
    rel[PROPS][CACHE_REMOVED_CHILDREN] != null &&
    rel[CACHE_SIZE] < rel[PROPS][CACHE_REMOVED_CHILDREN]
  ) {
    // @ts-ignore ok. partly guaranteed by getFullUniqueIds, and can coerce
    rel[CACHE][rnode[PROPS].id] = rnode
    rel[CACHE_SIZE]++
  }
  // TODO: log cache action
  return rnode
}

function setProp(
  /**@type {El}*/ el,
  /**@type {string}*/ key,
  /**@type {unknown}*/ value,
) {
  // IDL properties are getter/setters, proxies of attributes. For example:
  // getter/setter: on* aria* autofocus id className classList style innerHTML ...
  // getter only: client* scrollTop tagName dataset attributes children firstChild ...
  // plain value: blur() focus() after() append() ... (all methods)
  let type
  if (getObjectPropertyType(el, key).includes('set')) {
    // @ts-ignore ok, guaranteed by getObjectPropertyType having 'set'
    el[key] = value
    type = '+ prop'
  } else if (key[0] === '$') {
    // @ts-ignore ok. style.setProperty can coerce
    el.style.setProperty(removeFirst(key), value)
    type = '+style'
  } else if (key[0] === '_') {
    setAttribute(el, removeFirst(key), value)
    type = '+ attr'
  } else {
    setAttribute(el, key, value)
    type = '+ attr'
  }
  DEBUG && console.log(type, print(el), key, '=', value)
}

const /**@type {{[k:string]: string}}*/ prop2attr = {
    defaultValue: 'value',
    htmlFor: 'for',
    className: 'class',
  }

function unsetProp(/**@type {El}*/ el, /**@type {string}*/ key) {
  // remove attr and IDL prop. most IDL props can also be unset by lowercasing into attr
  let type
  if (toLowerCase(key) in el.attributes) {
    removeAttribute(el, key)
    type = '- attr'
    // special cases for IDL prop naming
  } else if (key in prop2attr) {
    removeAttribute(el, prop2attr[key])
    type = '- attr'
  } else if (key[0] === '_') {
    removeAttribute(el, removeFirst(key))
    type = '- attr'
  } else if (key[0] === '$') {
    el.style.removeProperty(removeFirst(key))
    type = '-style'
  } else {
    // TODO: test more cases for how to unset arbitrary non-attr props
    throw Error(`unknown prop '${key}' to unset from <${el.nodeName}>`)
  }
  DEBUG && console.log(type, print(el), key)
}

function getFullUniqueIds(/**@type {ANode[]}*/ anodes) {
  const ids = anodes.map((an) => an[PROPS].id).filter((id) => typeof id === 'string')
  return ids[LENGTH] === anodes[LENGTH] && ids[LENGTH] === new Set(ids).size
    ? ids
    : null
}

function removeFawcsInRNodeFromDeps(/**@type {RNode}*/ rnode) {
  for (const fawc of fawc2ropa.keys()) {
    if (fawcIsInRNode(fawc, rnode)) fawc2ropa.delete(fawc)
  }
}

function fawcIsInRNode(/**@type {Fawc<() => any>}*/ fawc, /**@type {RNode}*/ rnode) {
  // @ts-ignore ok. guaranteed by createVEl. now vel is rel and has node
  return fawc[VEL] && rnode[NODE].contains(fawc[VEL]?.[NODE])
}

function getObjectPropertyType(/**@type {object}}*/ object, /**@type {string}*/ prop) {
  if (!(prop in object)) return []
  const pd = OBJECT.getOwnPropertyDescriptor(object, prop)
  if (pd)
    return OBJECT.entries(pd)
      .map(([k, v]) => (v ? k : null))
      .filter((x) => x)
  const proto = OBJECT.getPrototypeOf(object)
  if (!proto) return []
  return getObjectPropertyType(proto, prop)
}

/**
 * @overload @param {Element|Text|VEl} x @returns {string}
 * @overload @param {AnyFawc} x @returns {string[]}
 */
function print(/**@type {Element|Text|VEl|AnyFawc}*/ x) {
  if (x instanceof Text) return `"${x.data}"`
  if (x instanceof Element) return `${x.localName} #${x.id}`
  if (x instanceof VEl) return `${x[TAG]} #${x[PROPS].id ?? ''}`
  const [vel, key, zif, effect] = x
  return vel ? [print(vel), key, zif] : ['watch', zif, effect]
}
