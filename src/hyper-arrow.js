// @ts-check

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

/**
 * @typedef {'html' | 'svg' | 'mathml'} ElType
 * @typedef {HTMLElement | SVGElement | MathMLElement} El
 * @typedef {{[k: string | symbol]: unknown, id?: string}} Props
 * @typedef {{[k: string]: RNode}} Cache
 * @typedef {{[k: string]: never}} Empty
 * @_______ {[null, tag: string, Props, VNode[], ElType]} VEl is a class, can use instanceof
 * @typedef {[El,   tag: string, Props, RNode[], ElType, Cache?]} REl real element
 * @typedef {[null, txt: string, Empty, [],     'text']} VText virtual textnode
 * @typedef {[Text, txt: string, Empty, [],     'text']} RText real element
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

/**
 * @typedef {[REl, key: string | number | null, Function]} ElArrow
 * @typedef {[null, null, Function, effect?: Function]} WatchArrow
 * @typedef {ElArrow | WatchArrow} Arrow
 */
const REL = 0
const FN = 2
/** @type {Arrow?} */
let currentArrow = null

// ROPA: Reactive Object Property Access
/** @type {Map<Arrow, WeakMap<object, Set<string | symbol>>>} */
export const arrow2ropa = new Map()
/** @type {WeakMap<object, Record<string | symbol, WeakSet<Arrow>>>} */
export const ropa2arrow = new WeakMap()

const BRAND_KEY = '__hyper_arrow__'
const BRAND_SYMBOL = Symbol(BRAND_KEY)
export const isReactive = (/**@type {any}*/ x) => !!x[BRAND_SYMBOL]

export const ON_CREATE = Symbol()
export const CACHE_REMOVED_CHILDREN_AND_MAY_LEAK = Symbol()

let uid = 0
const UID = 'uid'
const /**@type {{[k:string]: string}}*/ prop2attr = {
    defaultValue: 'value',
    htmlFor: 'for',
    className: 'class',
  }

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

function createVEl(
  /**@type {ElType}*/ type,
  /**@type {string}*/ tag,
  /**@type {Args}*/ ...args
) {
  const vel = new VEl(type, tag, OBJECT.create(null), [])
  const [props, x] =
    typeof args[0] === 'object' && !isArray(args[0]) && !(args[0] instanceof VEl)
      ? [args[0], removeFirst(args)]
      : [{}, args]
  for (const key of OBJECT.getOwnPropertySymbols(props)) vel[PROPS][key] = props[key]
  for (const key in props) {
    // on* event handlers, all lowercase, have no arrow, not evaluted
    if (key.startsWith('on')) vel[PROPS][toLowerCase(key)] = props[key]
    else vel[PROPS][key] = evaluate(props[key], vel, key)
  }
  // args may be tag(() => VEl), not tag(() => VEl[]).
  // in this case arrow key should be 0, not null.
  // but cannot foresee whether fn returns VEl or VEl[] before it's actually evaluted
  // so the wrong arrow key (null) must be handled later in reactive/set
  const children =
    isArray(x) && x[LENGTH] === 1 && (typeof x[0] === 'function' || isArray(x[0]))
      ? x[0]
      : x
  const /**@type {Child[] | Child}*/ y = evaluate(children, vel, null)
  if (typeof y === 'function' || typeof y === 'string' || y instanceof VEl)
    vel[CHILDREN].push(createVNode(evaluate(y, vel, 0)))
  else for (const i in y) vel[CHILDREN].push(createVNode(evaluate(y[i], vel, +i)))
  return vel
}

function createVNode(/**@type {VEl | string}*/ x) {
  return typeof x === 'string' ? createVText(x) : x
}

function createVText(/**@type {string}*/ txt) {
  const /**@type {VText}*/ vtext = [null, txt, {}, [], TEXT]
  return vtext
}

/** mount virtual element to DOM */
export function mount(/**@type {string}*/ selector, /**@type {VEl}*/ vel) {
  // @ts-ignore let it crash if selector not found
  DOCUMENT.querySelector(selector).append(createREl(vel)[NODE])
}

function createREl(/**@type {VEl}*/ vel) {
  const el =
    vel[TYPE] === 'html'
      ? DOCUMENT.createElement(vel[TAG])
      : vel[TYPE] === 'svg'
      ? DOCUMENT.createElementNS('http://www.w3.org/2000/svg', vel[TAG])
      : DOCUMENT.createElementNS('http://www.w3.org/1998/Math/MathML', vel[TAG])
  // use uid to track el's identity for debugging purpose
  setAttribute(el, UID, uid++)
  for (const key in vel[PROPS]) setProp(el, key, vel[PROPS][key])
  el.append(...vel[CHILDREN].map(createRNode).map((rnode) => rnode[NODE]))
  // @ts-ignore let it crash if oncreate is not function
  vel[PROPS][ON_CREATE]?.(el)
  return convertVNodeToRNode(vel, el)
}

function createRNode(/**@type {VNode}*/ vnode) {
  return vnode[TYPE] === TEXT ? createRText(vnode) : createREl(vnode)
}

function createRText(/**@type {VText}*/ vtext) {
  return convertVNodeToRNode(vtext, DOCUMENT.createTextNode(vtext[TXT]))
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
    rnode[PROPS][CACHE_REMOVED_CHILDREN_AND_MAY_LEAK] &&
    getFullUniqueIds(rnode[CHILDREN])
  if (hasCache) rnode[CACHE] = {}
  // @ts-ignore ok
  node[BRAND_KEY] = rnode
  return rnode
}

/**
 * run fn() once, and when triggered, rerun fn(), or effectFn(fn()) if has effectFn
 * @template F
 * @param {F extends (() => any) ? F : never} fn
 * @param {((a: ReturnType<F extends (() => any) ? F : never>) => any)=} effectFn
 * @returns {() => void} function to stop fn rerunning by removing it from arrow2ropa
 */
export function watch(fn, effectFn) {
  evaluate(fn, null, null, effectFn)
  return () => {
    for (const arrow of arrow2ropa.keys())
      if (arrow[FN] === fn) arrow2ropa.delete(arrow)
  }
}

/**
 * create a new arrow with contextual info and run fn within it, if fn is function
 * @type {(fn: unknown, vel: ?VEl, k: ?string|number, effect?: Function) => any}
 */
function evaluate(fn, vel, key, effect) {
  if (typeof fn !== 'function') return fn
  // @ts-ignore ok. ticky type coercion. vel will become rel after createVEl()
  const /**@type {REl}*/ rel = vel
  currentArrow = rel ? [rel, key, fn] : [null, null, fn, effect]
  const result = fn()
  currentArrow = null
  return result
}

/** create a reactive proxy @type {<T extends object>(obj: T) => T} */
export function reactive(obj) {
  if (obj !== OBJECT(obj) || isReactive(obj)) return obj
  return new PROXY(obj, {
    get(obj, prop) {
      // this is how isReactive() works
      if (prop === BRAND_SYMBOL) return true
      const result = REFLECT.get(obj, prop)
      // would throw if proxying function.prototype, so skip it
      if (typeof obj === 'function' && prop === 'prototype') return result
      // collect ROPAs for current arrow
      if (currentArrow) {
        // console.log('--get--')
        // console.log(currentArrow[0]?.[TAG], currentArrow[1], currentArrow[2])
        // console.log(obj, prop)
        if (!arrow2ropa.has(currentArrow)) arrow2ropa.set(currentArrow, new WeakMap())
        const ropas = arrow2ropa.get(currentArrow)
        if (ropas) {
          if (!ropas.has(obj)) ropas.set(obj, new Set())
          ropas.get(obj)?.add(prop)
        }
        // build ropa2arrow only for debugging purpose
        if (!ropa2arrow.has(obj)) ropa2arrow.set(obj, OBJECT.create(null))
        const props = ropa2arrow.get(obj)
        if (props) {
          if (!(prop in props)) props[prop] = new WeakSet()
          props[prop].add(currentArrow)
        }
      }
      return reactive(result)
    },
    set(obj, prop, newValue) {
      const oldValue = REFLECT.get(obj, prop)
      const result = REFLECT.set(obj, prop, newValue)
      // skip meaningless change, unless touching array[LENGTH] inside array.push() etc.
      if (oldValue === newValue && !(isArray(obj) && prop === LENGTH)) return result
      for (const [arrow, ropas] of arrow2ropa.entries())
        if (ropas.get(obj)?.has(prop)) {
          const [rel, key, fn, effect] = arrow
          currentArrow = arrow
          const value = fn()
          currentArrow = null
          // console.log('--set--')
          // console.log(obj, prop, oldValue, newValue)
          // console.log(rel?.[TAG], rel?.[PROPS], rel?.[CHILDREN])
          // console.log(key, value)
          if (!rel) {
            effect?.(value)
          } else if (
            typeof key === 'number' ||
            // createVEl can't tell tag(() => Child) from tag(() => Child[]),
            // so key may be wrongly null.
            (key === null && (typeof value === 'string' || value instanceof VEl))
          ) {
            const index = key ?? 0
            removeArrowsInRNodeFromDeps(rel[CHILDREN][index])
            updateChild(rel, index, createVNode(value))
          } else if (key === null) {
            rel[CHILDREN].map(removeArrowsInRNodeFromDeps)
            updateChildren(rel, value.map(createVNode))
          } else {
            setProp(rel[NODE], key, value)
          }
        }
      return result
    },
    deleteProperty(obj, prop) {
      const result = REFLECT.deleteProperty(obj, prop)
      // console.log('--delete--')
      // console.log(obj, prop)
      for (const ropas of arrow2ropa.values()) ropas.get(obj)?.delete(prop)
      delete ropa2arrow.get(obj)?.[prop]
      return result
    },
  })
}

function removeArrowsInRNodeFromDeps(/**@type {RNode}*/ rnode) {
  for (const arrow of arrow2ropa.keys())
    if (arrowIsInRNode(arrow, rnode)) arrow2ropa.delete(arrow)
}

function arrowIsInRNode(/**@type {Arrow}*/ arrow, /**@type {RNode}*/ rnode) {
  return arrow[REL] && rnode[NODE].contains(arrow[REL]?.[NODE])
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
  rel[CHILDREN].splice(index, 0, newRNode)
  // already brought out, so remove from cache
  if (rel[CACHE] && newRNode[PROPS].id) delete rel[CACHE][newRNode[PROPS].id]
}

function removeChild(/**@type {REl}*/ rel, /**@type {number}*/ index) {
  const rnode = rel[CHILDREN].splice(index, 1)[0]
  rnode[NODE].remove()
  // move into cache
  if (rel[CACHE] && rnode[PROPS].id) rel[CACHE][rnode[PROPS].id] = rnode
  return rnode
}

function getFullUniqueIds(/**@type {ANode[]}*/ anodes) {
  const ids = anodes.map((vn) => vn[PROPS].id).filter((id) => typeof id === 'string')
  return ids[LENGTH] === anodes[LENGTH] && ids[LENGTH] === new Set(ids).size
    ? ids
    : null
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
  // @ts-ignore ok, guaranteed by getObjectPropertyType having 'set'
  if (getObjectPropertyType(el, key).includes('set')) el[key] = value
  // @ts-ignore ok. style.setProperty can coerce
  else if (key[0] === '$') el.style.setProperty(removeFirst(key), value)
  else if (key[0] === '_') setAttribute(el, removeFirst(key), value)
  else setAttribute(el, key, value)
}

function unsetProp(/**@type {El}*/ el, /**@type {string}*/ key) {
  // remove attr and IDL prop. most IDL props can also be unset by lowercasing into attr
  if (toLowerCase(key) in el.attributes) removeAttribute(el, key)
  // special cases for IDL prop naming
  else if (key in prop2attr) removeAttribute(el, prop2attr[key])
  else if (key[0] === '_') removeAttribute(el, removeFirst(key))
  else if (key[0] === '$') el.style.removeProperty(removeFirst(key))
  // TODO: test more cases for how to unset arbitary non-attr props
  else throw Error(`unknown prop '${key}' to unset from <${el.nodeName}>`)
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
