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
const CHILDREN_MAKERS = ['innerText', 'innerHTML', 'textContent']

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
export const NODE = 0
export const TAG = 1
export const TXT = 1
export const PROPS = 2
export const CHILDREN = 3
export const TYPE = 4
export const CACHE = 5

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

// FAC: Function And Context
/** @typedef {string | number | null} Key - props | child | children */
/** @template F @typedef {F extends () => any ? F : never} ZI - Zero Input fn */
/** @template F @typedef {F extends ZI<F> ? ReturnType<ZI<F>> : F} Evaluated */
/** @template F @typedef {(arg: ReturnType<ZI<F>>) => void} Effect */
/** @template T @typedef {[null, null, ZI<T>, Effect<T>?]} WatchFac */
/** @template T @typedef {[VEl, Key, ZI<T>]} ElFac */
/** @template T @typedef {[VEl, Key, T]} NotFac */
/** @template T @typedef {ElFac<T> | WatchFac<T>} AllFac */
/** @typedef {AllFac<() => any>} Fac */
const VEL = 0
const ZIF = 2

let /** @type {Fac?} */ currentFac = null

// OPA: Object Property Access
/** @type {Map<Fac, WeakMap<object, Set<string | symbol>>>} */
export const fac2opas = new Map()
// /** @type {WeakMap<object, Record<string | symbol, WeakSet<Fac>>>} */
// export const opa2facs = new WeakMap()

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
    // on* event handlers, all lowercase, not FAC, not evaluated
    if (key.startsWith('on')) {
      vel[PROPS][toLowerCase(key)] = props[key]
    } else {
      vel[PROPS][key] = runFac([vel, key, props[key]])
    }
  }
  // args may be like tag(() => Child), not tag(() => Child[]).
  // in this case FAC key should be 0, not null.
  // but cannot foresee whether fn returns Child or Child[] before it runs
  // so the wrong FAC key (null) must be corrected later in reactive/set
  // @ts-ignore ok. guaranteed by x.length === 1
  const /** @type {Children | (() => Child)} */ children =
      isArray(x) &&
      x[LENGTH] === 1 &&
      (typeof x[0] === 'function' || isArray(x[0]))
        ? x[0]
        : x
  const y = runFac([vel, null, children])
  const z = isArray(y) ? y : [y]
  for (const i in z) {
    vel[CHILDREN].push(createVNode(runFac([vel, +i, z[i]])))
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
export const uidAttr = {
  /** @type {string | undefined} */ name: undefined,
  count: 0,
}

/** mount virtual element to DOM
 * @typedef {{[UID_ATTR_NAME]?: string}} Options
 * @param {string} selector @param {VEl} vel @param {Options} options
 */
export function mount(selector, vel, options = {}) {
  uidAttr.name = options[UID_ATTR_NAME]
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
  runFac([null, null, fn, effect])
  return () => {
    for (const fac of fac2opas.keys()) {
      if (fac[ZIF] === fn) {
        fac2opas.delete(fac)
      }
    }
  }
}

/** @template F @param {AllFac<F>|NotFac<F>} fac @return {Evaluated<F>} */
function runFac(fac) {
  const zif = fac[ZIF]
  if (typeof zif !== 'function') {
    // @ts-ignore ok. difficult typing!
    return zif
  }
  const previousFac = currentFac
  // @ts-ignore ok. difficult typing!
  currentFac = fac
  // @ts-ignore ok. difficult typing!
  const result = zif()
  currentFac = previousFac
  return result
}

export const BRAND_KEY = '__hyper_arrow__'
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
      // collect current OPA for current FAC
      if (currentFac) {
        if (DEBUG) {
          console.log(
            '   get',
            ...string(currentFac),
            JSON.stringify(obj) + '.' + String(prop),
            '\n',
          )
        }
        if (!fac2opas.has(currentFac)) {
          fac2opas.set(currentFac, new WeakMap())
        }
        /** @type {  WeakMap<object, Set<string | symbol>>} */
        // @ts-ignore ok. guaranteed by previous if condition
        const opas = fac2opas.get(currentFac)
        if (!opas.has(obj)) {
          opas.set(obj, new Set())
        }
        opas.get(obj)?.add(prop)
        // // collect current FAC for current OPA, only for debugging purposes
        // if (!opa2facs.has(obj)) {
        //   opa2facs.set(obj, OBJECT.create(null))
        // }
        // const props = opa2facs.get(obj)
        // if (props) {
        //   if (!(prop in props)) {
        //     props[prop] = new WeakSet()
        //   }
        //   props[prop].add(currentFac)
        // }
      }
      return reactive(result)
    },
    set(obj, prop, newValue) {
      const oldValue = REFLECT.get(obj, prop)
      const result = REFLECT.set(obj, prop, newValue)
      // skip noop change unless touching array.length inside array.push() etc.
      if (oldValue === newValue && !(isArray(obj) && prop === LENGTH)) {
        return result
      }
      if (DEBUG) {
        console.log(
          ' ! set',
          JSON.stringify(obj) + '.' + String(prop),
          ':',
          JSON.stringify(oldValue),
          '->',
          JSON.stringify(newValue),
          '\n',
        )
      }
      for (const [fac, opas] of fac2opas.entries()) {
        if (opas.get(obj)?.has(prop)) {
          if (DEBUG) {
            console.groupCollapsed(
              'rerun ',
              ...string(fac),
              JSON.stringify(obj),
              '.' + String(prop),
              JSON.stringify(oldValue),
              '->',
              JSON.stringify(newValue),
              '\n',
            )
          }
          const [vel, key, , effect] = fac
          // @ts-ignore ok. guaranteed by createREl(). vel now becomes rel
          const /** @type {REl} */ rel = vel
          const value = runFac(fac)
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
            removeFacsInRNodeFromDeps(rel[CHILDREN][index])
            updateChild(rel, index, createVNode(value))
          } else if (key === null) {
            rel[CHILDREN].map(removeFacsInRNodeFromDeps)
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
        console.log(' ! del', JSON.stringify(obj) + '.' + String(prop), '\n')
      }
      for (const opas of fac2opas.values()) {
        opas.get(obj)?.delete(prop)
      }
      // delete opa2facs.get(obj)?.[prop]
      return result
    },
  })
}

function removeFacsInRNodeFromDeps(/** @type {RNode} */ rnode) {
  for (const fac of fac2opas.keys()) {
    if (facIsInRNode(fac, rnode)) {
      fac2opas.delete(fac)
    }
  }
}

function facIsInRNode(/** @type {Fac} */ fac, /** @type {RNode} */ rnode) {
  // @ts-ignore ok. guaranteed by createVEl. now vel is rel and has node
  return fac[VEL] && rnode[NODE].contains(fac[VEL]?.[NODE])
}

function appendVNodes(/** @type {El} */ el, /** @type {VNode[]} */ vnodes) {
  el.append(
    ...vnodes.map(createRNode).map((rnode) => {
      if (DEBUG) {
        console.log('append', string(rnode[NODE]), '>', string(el), '\n')
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
  if (uidAttr.name) {
    setAttribute(el, uidAttr.name, uidAttr.count++)
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
    console.log('create', string(node), '\n')
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
        console.log(
          'update',
          '"' + oldRNode[TXT] + '"',
          '->',
          '"' + newVNode[TXT] + '"',
          '\n',
        )
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
    if (!CHILDREN_MAKERS.some((k) => k in newVNode[PROPS])) {
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
      '@',
      index,
      ':',
      string(node),
      fromCache ? '< cache' : '',
      '\n',
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
      '@',
      index,
      ':',
      string(rnode[NODE]),
      intoCache ? '> cache' : '',
      '\n',
    )
  }
  return rnode
}

/** @param {REl} rel @param {string} key @param {unknown} value */
function setProp(rel, key, value) {
  if (value == null) {
    unsetProp(rel, key)
    return
  }
  const type = _setProp(rel, key, value)
  if (DEBUG) {
    console.log(
      '+' + type,
      string(rel[NODE]),
      key,
      '=',
      typeof value === 'function' ? 'func' : value,
      '\n',
    )
  }
}

/** @param {REl} rel @param {string} key @param {unknown} value */
function resetProp(rel, key, value) {
  if (value == null) {
    unsetProp(rel, key)
    return
  }
  const oldValue = rel[PROPS][key]
  if (oldValue == null) {
    setProp(rel, key, value)
    return
  }
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
      '\n',
    )
  }
}

/** @param {REl} rel @param {string} key @param {unknown} value */
function _setProp(rel, key, value) {
  rel[PROPS][key] = value
  const el = rel[NODE]
  if (getObjectPropertyTypes(el, key).includes('set')) {
    // IDL properties are getter/setters, proxies of attributes. For example:
    // getter/setter: on* aria* id className classList style innerHTML ...
    // getter: client* tagName dataset attributes children firstChild ...
    // plain value: blur() focus() after() append() ... (all methods)
    // @ts-ignore ok, guaranteed by getObjectPropertyType having 'set'
    el[key] = value
    return ' prop'
  }
  if (key[0] === '$') {
    // Remove $ prefix and convert camelCase to kebab-case
    const propertyName = camel2kebab(removeFirst(key))
    el.style.setProperty(propertyName, String(value))
    return ' styl'
  }
  if (key[0] === '_') {
    setAttribute(el, camel2kebab(removeFirst(key)), value)
    return ' attr'
  }
  // Convert camelCase to kebab-case for other attributes
  setAttribute(el, camel2kebab(key), value)
  return ' attr'
}

const /** @type {Record<string, string>} */ prop2attr = {
    defaultValue: 'value',
    htmlFor: 'for',
    className: 'class',
  }

function unsetProp(/** @type {REl} */ rel, /** @type {string} */ key) {
  delete rel[PROPS][key]
  const el = rel[NODE]
  if (key[0] === '$') {
    const remained = removeFirst(key)
    el.style.removeProperty(remained)
    if (DEBUG) {
      console.log('- styl', string(el), remained, '\n')
    }
    return
  }
  if (key[0] === '_') key = removeFirst(key)
  // unset attrs. some IDL props can also be unset by lowercasing into attr
  const lowercased = toLowerCase(key)
  if (lowercased in el.attributes) {
    removeAttribute(el, lowercased)
    if (DEBUG) {
      console.log('- attr', string(el), lowercased, '\n')
    }
    return
  }
  // some IDL props can also be unset by converting into kebab attr
  const converted = camel2kebab(key)
  if (converted in el.attributes) {
    removeAttribute(el, converted)
    if (DEBUG) {
      console.log('- attr', string(el), converted, '\n')
    }
    return
  }
  // special cases for IDL prop naming
  if (key in prop2attr) {
    const mapped = prop2attr[key]
    removeAttribute(el, mapped)
    if (DEBUG) {
      console.log('- attr', string(el), mapped, '\n')
    }
    return
  }
  if (getObjectPropertyTypes(el, key).includes('set')) {
    // @ts-ignore ok. guaranteed by if condition
    el[key] = null
    if (DEBUG) {
      console.log('- prop', string(el), key, '\n')
    }
    return
  }
  removeAttribute(el, key)
  if (DEBUG) {
    console.log('- attr', string(el), key, '\n')
  }
  return
  // throw Error(`unknown prop '${key}' to unset from <${el.nodeName}>`)
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
  // // only used for el here, not possible to have no prototype
  // if (!proto) {
  //   return []
  // }
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
 * @overload @param {Fac} x @returns {string[]}
 */
function string(/** @type {Element|Text|VEl|Fac} */ x) {
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
  const fnStr = zif
    .toString()
    .replace(/[\r\n]/g, ';')
    .replace(/ +/g, ' ')
    .replace(/ +;/g, ';')
    .replace(/;+/g, ';')
    .replace(/\{;/g, '{')
    .replace(/=>;/g, '=>')
  const result = fnStr.length > 20 ? fnStr.substring(0, 20) + '...' : fnStr
  return vel ? [string(vel), key, result] : ['watch', result, effect]
}
