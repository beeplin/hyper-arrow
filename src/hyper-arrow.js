// @ts-check
let DEBUG = false
export function debug(value = true) {
  DEBUG = value
}

// reassign built-in objects and methods for better minification
const LENGTH = 'length'
const TEXT = 'text'
const OBJECT = Object
const PROXY = Proxy
const REFLECT = Reflect
const DOCUMENT = document
const isArray = Array.isArray
const removeFirst = (/** @type {any} */ x) => x.slice(1)
const toLowerCase = (/** @type {string} */ str) => str.toLowerCase()
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
 * @_______ {[null, Tag, Props, VNode[], ElType]} VEl - virtual element (class)
 * @typedef {[El,   Tag, Props, RNode[], ElType, Cache?]} REl - real element
 * @typedef {[null, Txt, Empty, [],     'text']} VText - virtual text node
 * @typedef {[Text, Txt, Empty, [],     'text']} RText - real text node
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

/** virtual element, array-like class @constructor */
export function VEl(
  /** @type {ElType} */ type,
  /** @type {string} */ tag,
  /** @type {Props} */ props,
  /** @type {VNode[]} */ children,
) {
  this[TYPE] = type
  this[TAG] = tag
  this[PROPS] = props
  this[CHILDREN] = children
}

// FAWC: Function Associated With Context
/** @typedef {string | number | null} Key - props | child | children */
/** @template F @typedef {F extends () => any ? F : never} ZI - Zero Input fn */
/** @template F @typedef {F extends ZI<F> ? ReturnType<ZI<F>> : F} Evaluated */
/** @template F @typedef {(arg: ReturnType<ZI<F>>) => void} Effect */
/** @template T @typedef {[null, null, ZI<T>, Effect<T>?]} WatchFawc */
/** @template T @typedef {[VEl, Key, ZI<T>]} ElFawc */
/** @template T @typedef {[VEl, Key, T]} NotFawc */
/** @template T @typedef {ElFawc<T> | WatchFawc<T>} AllFawc */
/** @typedef {AllFawc<() => any>} Fawc */
const VEL = 0
const ZIF = 2

let /** @type {Fawc?} */ currentFawc = null

// ROPA: Reactive Object Property Access
/** @typedef {object} Ro - reactive object */
/** @typedef {string | symbol} Pa property access */
/** @type {Map<Fawc, WeakMap<Ro, Set<Pa>>>} */
export const fawc2ropas = new Map()
/** @type {WeakMap<Ro, Record<Pa, WeakSet<Fawc>>>} */
export const ropa2fawcs = new WeakMap()

/**
 * @typedef {VEl | string | (() => (VEl | string))} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[Props, Children] | [Props, ...Child[]] | [Children] | Child[]} Args
 * @type {{[type: string]: {[tag: string]: (...args: Args) => VEl}}}
 */
export const tags = new PROXY(
  {},
  {
    get: (_, /** @type {ElType} */ type) =>
      new PROXY(
        {},
        {
          get: (_, /** @type {string} */ tag) =>
            createVEl.bind(null, type, tag),
        },
      ),
  },
)

let isFirstCreateVEl = true

/** @param {ElType} type @param {string} tag @param {Args} args @return {VEl} */
function createVEl(type, tag, ...args) {
  if (DEBUG && isFirstCreateVEl) {
    isFirstCreateVEl = false
    console.groupCollapsed('init')
  }
  const vel = new VEl(type, tag, OBJECT.create(null), [])
  const /** @type {[Props, [Children] | Child[]]} */ [props, x] =
      typeof args[0] === 'object' &&
      !isArray(args[0]) &&
      !(args[0] instanceof VEl)
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
  // but cannot foresee whether fn returns Child or Child[] before it runs
  // so the wrong FAWC key (null) must be corrected later in reactive/set
  // @ts-ignore ok. guaranteed by x.length === 1
  const /** @type {Children | (() => Child)} */ children =
      isArray(x) &&
      x[LENGTH] === 1 &&
      (typeof x[0] === 'function' || isArray(x[0]))
        ? x[0]
        : x
  const y = runFawc([vel, null, children])
  const z = isArray(y) ? y : [y]
  for (const i in z) {
    vel[CHILDREN].push(createVNode(runFawc([vel, +i, z[i]])))
  }
  return vel
}

function createVNode(/** @type {VEl | string} */ x) {
  return typeof x === 'string' ? createVText(x) : x
}

function createVText(/** @type {string} */ txt) {
  const /** @type {VText} */ vtext = [null, txt, {}, [], TEXT]
  return vtext
}

export const UID_ATTR_NAME = Symbol()
let /** @type {string | undefined} */ uidAttrName
let currentUid = 0

/** mount virtual element to DOM
 * @typedef {{[UID_ATTR_NAME]?: string}} Options
 * @param {string} selector @param {VEl} vel @param {Options} options
 */
export function mount(selector, vel, options = {}) {
  uidAttrName = options[UID_ATTR_NAME]
  if (DEBUG) {
    console.groupEnd()
    console.groupCollapsed('mount')
  }
  // @ts-ignore let it crash if selector not found
  appendVNodes(DOCUMENT.querySelector(selector), [vel])
  if (DEBUG) {
    console.groupEnd()
  }
}

/**
 * run fn() once, and when triggered, rerun fn(), or effect(fn()) if has effect
 * returns a function that stops fn from rerunning
 * @template F @param {ZI<F>} fn @param {Effect<F>=} effect @return {() => void}
 */
export function watch(fn, effect) {
  runFawc([null, null, fn, effect])
  return () => {
    for (const fawc of fawc2ropas.keys()) {
      if (fawc[ZIF] === fn) {
        fawc2ropas.delete(fawc)
      }
    }
  }
}

/** @template F @param {AllFawc<F>|NotFawc<F>} fawc @return {Evaluated<F>} */
function runFawc(fawc) {
  const zif = fawc[ZIF]
  if (typeof zif !== 'function') {
    // @ts-ignore ok. difficult typing!
    return zif
  }
  const previousFawc = currentFawc
  // @ts-ignore ok. difficult typing!
  currentFawc = fawc
  // @ts-ignore ok. difficult typing!
  const result = zif()
  currentFawc = previousFawc
  return result
}

const BRAND_KEY = '__hyper_arrow__'
const BRAND_SYMBOL = Symbol(BRAND_KEY)
export const isReactive = (/** @type {any} */ x) => !!x[BRAND_SYMBOL]

/** create a reactive proxy @type {<T extends object>(obj: T) => T} */
export function reactive(obj) {
  if (obj !== OBJECT(obj) || isReactive(obj)) {
    return obj
  }
  return new PROXY(obj, {
    get(obj, prop) {
      // this is how isReactive() works
      if (prop === BRAND_SYMBOL) {
        return true
      }
      const result = REFLECT.get(obj, prop)
      // would throw if try to proxy function.prototype, so skip it
      if (typeof obj === 'function' && prop === 'prototype') {
        return result
      }
      // collect current ROPA for current FAWC
      if (currentFawc) {
        if (DEBUG) {
          console.log('get ', ...string(currentFawc), obj, '.' + String(prop))
        }
        if (!fawc2ropas.has(currentFawc)) {
          fawc2ropas.set(currentFawc, new WeakMap())
        }
        const ropas = fawc2ropas.get(currentFawc)
        if (ropas) {
          if (!ropas.has(obj)) {
            ropas.set(obj, new Set())
          }
          ropas.get(obj)?.add(prop)
        }
        // collect current FAWC for current ROPA, only for debugging purposes
        if (!ropa2fawcs.has(obj)) {
          ropa2fawcs.set(obj, OBJECT.create(null))
        }
        const props = ropa2fawcs.get(obj)
        if (props) {
          if (!(prop in props)) {
            props[prop] = new WeakSet()
          }
          props[prop].add(currentFawc)
        }
      }
      return reactive(result)
    },
    set(obj, prop, newValue) {
      const oldValue = REFLECT.get(obj, prop)
      const result = REFLECT.set(obj, prop, newValue)
      // skip fake change unless touching array.length inside array.push() etc.
      if (oldValue === newValue && !(isArray(obj) && prop === LENGTH)) {
        return result
      }
      if (DEBUG) {
        console.log('set', obj, '.' + String(prop), oldValue, '->', newValue)
      }
      for (const [fawc, ropas] of fawc2ropas.entries()) {
        if (ropas.get(obj)?.has(prop)) {
          if (DEBUG) {
            console.groupCollapsed(
              'rerun',
              ...string(fawc),
              obj,
              '.' + String(prop),
              oldValue,
              '->',
              newValue,
            )
          }
          const [vel, key, , effect] = fawc
          // @ts-ignore ok. guaranteed by createREl(). vel now becomes rel
          const /** @type {REl} */ rel = vel
          const value = runFawc(fawc)
          if (DEBUG) {
            console.groupEnd()
          }
          if (!vel) {
            effect?.(value)
          } else if (
            typeof key === 'number' ||
            // createVEl can't tell tag(() => Child) from tag(() => Child[]),
            // so key may be wrongly null.
            (key === null &&
              (typeof value === 'string' || value instanceof VEl))
          ) {
            const index = key ?? 0
            removeFawcsInRNodeFromDeps(rel[CHILDREN][index])
            updateChild(rel, index, createVNode(value))
          } else if (key === null) {
            rel[CHILDREN].map(removeFawcsInRNodeFromDeps)
            updateChildren(rel, value.map(createVNode))
          } else {
            resetProp(rel, key, value)
          }
        }
      }
      return result
    },
    deleteProperty(obj, prop) {
      const result = REFLECT.deleteProperty(obj, prop)
      if (DEBUG) {
        console.log('del', obj, prop)
      }
      for (const ropas of fawc2ropas.values()) {
        ropas.get(obj)?.delete(prop)
      }
      delete ropa2fawcs.get(obj)?.[prop]
      return result
    },
  })
}

function removeFawcsInRNodeFromDeps(/** @type {RNode} */ rnode) {
  for (const fawc of fawc2ropas.keys()) {
    if (fawcIsInRNode(fawc, rnode)) {
      fawc2ropas.delete(fawc)
    }
  }
}

function fawcIsInRNode(/** @type {Fawc} */ fawc, /** @type {RNode} */ rnode) {
  // @ts-ignore ok. guaranteed by createVEl. now vel is rel and has node
  return fawc[VEL] && rnode[NODE].contains(fawc[VEL]?.[NODE])
}

function appendVNodes(/** @type {El} */ el, /** @type {VNode[]} */ vnodes) {
  el.append(
    ...vnodes.map(createRNode).map((rnode) => {
      if (DEBUG) {
        console.log('append', string(el), '<', string(rnode[NODE]))
      }
      return rnode[NODE]
    }),
  )
}

function createRNode(/** @type {VNode} */ vnode) {
  return vnode[TYPE] === TEXT ? createRText(vnode) : createREl(vnode)
}

function createREl(/** @type {VEl} */ vel) {
  const el =
    vel[TYPE] === 'html'
      ? DOCUMENT.createElement(vel[TAG])
      : vel[TYPE] === 'svg'
      ? DOCUMENT.createElementNS('http://www.w3.org/2000/svg', vel[TAG])
      : DOCUMENT.createElementNS('http://www.w3.org/1998/Math/MathML', vel[TAG])
  if (DEBUG) {
    console.group('create', string(vel))
  }
  const rel = vnode2rnode(vel, el)
  // use uid to track el's identity, only for debugging purposes
  if (uidAttrName) {
    setAttribute(el, uidAttrName, currentUid++)
  }
  for (const key in rel[PROPS]) {
    setProp(rel, key, rel[PROPS][key])
  }
  if (DEBUG) {
    console.groupEnd()
  }
  appendVNodes(el, vel[CHILDREN])
  // @ts-ignore let it crash if onCreate is not function
  const hasCache =
    typeof rel[PROPS][CACHE_REMOVED_CHILDREN] === 'number' &&
    getFullUniqueIds(rel[CHILDREN])
  if (hasCache) {
    rel[CACHE] = {}
  }
  rel[PROPS][ON_CREATE]?.(el)
  return rel
}

function createRText(/** @type {VText} */ vtext) {
  const node = DOCUMENT.createTextNode(vtext[TXT])
  if (DEBUG) {
    console.log('create', string(node))
  }
  return vnode2rnode(vtext, node)
}

/**
 * @overload @param {VEl} vel @param {El} el @returns {REl}
 * @overload @param {VText} vtext @param {Text} text @returns {RText}
 */
function vnode2rnode(/** @type {VNode} */ vnode, /** @type {El|Text} */ node) {
  // @ts-ignore ok. tricky coercion. rnode and vnode point to the same object
  const /** @type {RNode} */ rnode = vnode
  rnode[NODE] = node
  // @ts-ignore ok
  node[BRAND_KEY] = rnode
  return rnode
}

/** @param {REl} rel @param {VNode[]} newVNodes */
function updateChildren(rel, newVNodes) {
  const oldIds = getFullUniqueIds(rel[CHILDREN])
  const newIds = getFullUniqueIds(newVNodes)
  // if both have full unique ids, smart update
  if (oldIds && newIds) {
    // remove unmatched children. MUST REMOVE FROM TAIL, otherwise will mess up
    for (let i = oldIds[LENGTH] - 1; i >= 0; i--) {
      if (!newIds.includes(oldIds[i])) {
        removeChild(rel, i)
      }
    }
    // build from head to tail
    for (const [i, id] of newIds.entries()) {
      const newVNode = newVNodes[i]
      const j = rel[CHILDREN].findIndex((vnode) => vnode[PROPS].id === id)
      if (i === j) {
        // matched in current position, update
        updateChild(rel, i, newVNode)
      } else if (rel[CHILDREN][j]) {
        // matched in latter position, bring it up and update. REMOVE FIRST!!!
        insertChild(rel, i, removeChild(rel, j)) // ok, j > i always
        updateChild(rel, i, newVNode)
      } else if (rel[CACHE]?.[id]) {
        // matched in cache, bring it out, then update
        insertChild(rel, i, rel[CACHE][id])
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
        // insert new ones to tail
        insertChild(rel, i, newVNodes[i])
      } else {
        // REMOVE unneeded old ones FROM TAIL!!!
        removeChild(rel, oldLen + newLen - 1 - i)
      }
    }
  }
}

/** @param {REl} rel @param {number} index @param {VNode} newVNode */
function updateChild(rel, index, newVNode) {
  const oldRNode = rel[CHILDREN][index]
  if (oldRNode[TYPE] === TEXT && newVNode[TYPE] === TEXT) {
    if (oldRNode[TXT] !== newVNode[TXT]) {
      // if both text node
      if (DEBUG) {
        console.log('update', oldRNode[TXT], '->', newVNode[TXT])
      }
      oldRNode[NODE].data = newVNode[TXT]
    }
    rel[CHILDREN][index] = vnode2rnode(newVNode, oldRNode[NODE])
  } else if (
    oldRNode[TYPE] !== TEXT &&
    newVNode[TYPE] !== TEXT &&
    oldRNode[TAG] === newVNode[TAG]
  ) {
    // if both vel with same tag, patch the existing el
    for (const key in newVNode[PROPS]) {
      resetProp(oldRNode, key, newVNode[PROPS][key])
    }
    for (const key in oldRNode[PROPS]) {
      if (!(key in newVNode[PROPS])) {
        unsetProp(oldRNode, key)
      }
    }
    // innerText, innerHTML, textContent already deal with children, so skip it
    const childrenMakers = ['innerText', 'innerHTML', 'textContent']
    if (!childrenMakers.some((k) => k in newVNode[PROPS])) {
      updateChildren(oldRNode, newVNode[CHILDREN])
    }
    rel[CHILDREN][index] = vnode2rnode(newVNode, oldRNode[NODE])
  } else {
    // replace whole node. REMOVE FIRST!!!
    removeChild(rel, index)
    insertChild(rel, index, newVNode)
  }
}

/** @param {REl} rel @param {number} index @param {ANode} newANode */
function insertChild(rel, index, newANode) {
  const el = rel[NODE]
  // @ts-ignore ok. stupid ts！
  const /** @type {RNode} */ newRNode = newANode[NODE]
      ? newANode
      : // @ts-ignore ok. stupid ts！
        createRNode(newANode)
  const node = newRNode[NODE]
  el.insertBefore(node, el.childNodes.item(index))
  rel[CHILDREN].splice(index, 0, newRNode)
  // already brought out, so remove from cache
  let fromCache = false
  if (rel[CACHE]) {
    // @ts-ignore ok. partly guaranteed by getFullUniqueIds, and can coerce
    const /** @type {string} */ id = newRNode[PROPS].id
    fromCache = id in rel[CACHE]
    delete rel[CACHE][id]
  }
  if (DEBUG) {
    console.log(
      'insert',
      string(el),
      index,
      '<',
      string(node),
      fromCache ? '< cache' : '',
    )
  }
}

function removeChild(/** @type {REl} */ rel, /** @type {number} */ index) {
  const rnode = rel[CHILDREN].splice(index, 1)[0]
  rnode[NODE].remove()
  // move into cache
  let intoCache = false
  if (
    rel[CACHE] &&
    rel[PROPS][CACHE_REMOVED_CHILDREN] != null &&
    OBJECT.keys(rel[CACHE]).length < rel[PROPS][CACHE_REMOVED_CHILDREN]
  ) {
    intoCache = true
    // @ts-ignore ok. partly guaranteed by getFullUniqueIds, and can coerce
    const /** @type {string} */ id = rnode[PROPS].id
    rel[CACHE][id] = rnode
  }
  if (DEBUG) {
    console.log(
      'remove',
      string(rel[NODE]),
      index,
      '>',
      string(rnode[NODE]),
      intoCache ? '> cache' : '',
    )
  }
  return rnode
}

/** @param {REl} rel @param {string} key @param {unknown} value */
function setProp(rel, key, value) {
  const type = _setProp(rel, key, value)
  if (DEBUG) {
    console.log(
      '+' + type,
      string(rel[NODE]),
      key,
      '=',
      typeof value === 'function' ? 'func' : value,
    )
  }
}

/** @param {REl} rel @param {string} key @param {unknown} value */
function resetProp(rel, key, value) {
  const oldValue = rel[PROPS][key]
  if (oldValue === value) return
  const type = _setProp(rel, key, value)
  if (DEBUG) {
    console.log(
      '*' + type,
      string(rel[NODE]),
      key,
      ':',
      typeof oldValue === 'function' ? 'func' : oldValue,
      '->',
      typeof value === 'function' ? 'func' : value,
    )
  }
}

/** @param {REl} rel @param {string} key @param {unknown} value */
function _setProp(rel, key, value) {
  rel[PROPS][key] = value
  const el = rel[NODE]
  let type
  if (getObjectPropertyTypes(el, key).includes('set')) {
    // IDL properties are getter/setters, proxies of attributes. For example:
    // getter/setter: on* aria* id className classList style innerHTML ...
    // getter: client* tagName dataset attributes children firstChild ...
    // plain value: blur() focus() after() append() ... (all methods)
    // @ts-ignore ok, guaranteed by getObjectPropertyType having 'set'
    el[key] = value
    type = ' prop'
  } else if (key[0] === '$') {
    // @ts-ignore ok. style.setProperty can coerce
    el.style.setProperty(removeFirst(key), value)
    type = 'style'
  } else if (key[0] === '_') {
    setAttribute(el, removeFirst(key), value)
    type = ' attr'
  } else {
    // set every unknown thing as attribute
    setAttribute(el, key, value)
    type = ' attr'
  }
  return type
}

const /** @type {Record<string, string>} */ prop2attr = {
    defaultValue: 'value',
    htmlFor: 'for',
    className: 'class',
  }

function unsetProp(/** @type {REl} */ rel, /** @type {string} */ key) {
  const el = rel[NODE]
  // unset attrs. some IDL props can also be unset by lowercasing into attr
  const lowercased = toLowerCase(key)
  if (lowercased in el.attributes) {
    removeAttribute(el, lowercased)
    if (DEBUG) {
      console.log('- attr', string(el), lowercased)
    }
    return
  }
  // some IDL props can also be unset by converting into kebab attr
  const converted = camel2kebab(key)
  if (converted in el.attributes) {
    removeAttribute(el, converted)
    if (DEBUG) {
      console.log('- attr', string(el), converted)
    }
    return
  }
  // special cases for IDL prop naming
  if (key in prop2attr) {
    const mapped = prop2attr[key]
    removeAttribute(el, mapped)
    if (DEBUG) {
      console.log('- attr', string(el), mapped)
    }
    return
  }
  if (key[0] === '_') {
    const remained = removeFirst(key)
    removeAttribute(el, remained)
    if (DEBUG) {
      console.log('- attr', string(el), remained)
    }
    return
  }
  if (key[0] === '$') {
    const remained = removeFirst(key)
    el.style.removeProperty(remained)
    if (DEBUG) {
      console.log('-style', string(el), remained)
    }
    return
  }
  throw Error(`unknown prop '${key}' to unset from <${el.nodeName}>`)
}

function getFullUniqueIds(/** @type {ANode[]} */ anodes) {
  const ids = anodes
    .map((an) => an[PROPS].id)
    .filter((id) => typeof id === 'string')
  return ids[LENGTH] === anodes[LENGTH] && ids[LENGTH] === new Set(ids).size
    ? ids
    : null
}

/** @param {object} object @param {string} prop */
function getObjectPropertyTypes(object, prop) {
  if (!(prop in object)) {
    return []
  }
  const pd = OBJECT.getOwnPropertyDescriptor(object, prop)
  if (pd) {
    return OBJECT.entries(pd)
      .map(([k, v]) => (v ? k : null))
      .filter((x) => x)
  }
  const proto = OBJECT.getPrototypeOf(object)
  if (!proto) {
    return []
  }
  return getObjectPropertyTypes(proto, prop)
}

function camel2kebab(/** @type {string} */ camel) {
  return [...camel].reduce(
    (acc, cur) =>
      cur >= 'A' && cur <= 'Z' ? acc + '-' + toLowerCase(cur) : acc + cur,
    '',
  )
}

/**
 * @overload @param {Node|VEl} x @returns {string}
 * @overload @param {Fawc} x @returns {string[]}
 */
function string(/** @type {Element|Text|VEl|Fawc} */ x) {
  if (x instanceof Text) {
    return `"${x.data}"`
  }
  if (x instanceof Element) {
    return `${x.localName}-#${x.id}`
  }
  if (x instanceof VEl) {
    return `${x[TAG]}-#${x[PROPS].id ?? ''}`
  }
  const [vel, key, zif, effect] = x
  const lines = zif.toString().split('\n')
  const firstLine = lines[0]
  const result = lines.length === 1 ? firstLine : firstLine + ' ...'
  return vel ? [string(vel), key, result] : ['watch', result, effect]
}
