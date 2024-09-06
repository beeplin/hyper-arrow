// @ts-check

// these are for better minification
const LENGTH = 'length'
const OBJECT = Object
const ERROR = Error
const PROXY = Proxy
const REFLECT = Reflect
const DOCUMENT = document
const isArray = Array.isArray
// const createElementNS = DOCUMENT.createElementNS.bind(DOCUMENT)
const removeFirst = (/**@type {any}*/ x) => x.slice(1)
const toLowerCase = (/**@type {string}*/ str) => str.toLowerCase()
/** @type {(el: El, k: string, v: string) => void} */
const setAttribute = (el, k, v) => el.setAttribute(k, v)
/** @type {(el: El, k: string) => void} */
const removeAttribute = (el, k) => el.removeAttribute(k)

/**
 * @typedef {'html' | 'svg' | 'mathml'} ElType
 * @typedef {HTMLElement | SVGElement | MathMLElement} El
 * @typedef {{[k: string]: unknown}} Props
 * @typedef {{[k: string]: RNode}} Cache
 * @typedef {{[k: string]: never}} Empty
 * @xxxxxxx {[ElType, tag: string, Props, VNode[]]} VEl defined by function VEl below
 * @typedef {[ElType, tag: string, Props, RNode[], El, Cache?]} REl real element
 * @typedef {['text', txt: string, Empty, []]} VText virtual textnode
 * @typedef {['text', txt: string, Empty, [], Text]} RText real element
 * @typedef {VEl | VText} VNode virtual node
 * @typedef {REl | RText} RNode real node
 * @typedef {VNode | RNode} ANode any node
 */
const TYPE = 0
const TAG = 1
const TXT = 1
const PROPS = 2
const CHILDREN = 3
const NODE = 4
const CACHE = 5

/**
 * @typedef {[Function, REl, key: ?string|number]} ElArrow
 * @typedef {[Function, null, null, effect?: Function]} WatchArrow
 * @typedef {ElArrow | WatchArrow} Arrow
 */
const FN = 0
const REL = 1
let /**@type {Arrow?}*/ currentArrow = null

/** @typedef {[target: object, prop: string | symbol]} Trigger */
const TARGET = 0
const PROP = 1
export const /** dependency map @type {Map<Arrow, Trigger[]>}*/ deps = new Map()

const BRAND_KEY = '__hyper_arrow__'
const BRAND_SYMBOL = Symbol(BRAND_KEY)
export const isReactive = (/**@type {any}*/ x) => !!x[BRAND_SYMBOL]

let uid = 0
const UID = 'uid'
const ONCREATE = 'oncreate'
const CACHE_REMOVED_CHILDREN = 'cacheRemovedChildren'

const /**@type {{[k:string]: string}}*/ prop2attr = {
    defaultValue: 'value',
    htmlFor: 'for',
    className: 'class',
  }

/**
 * @typedef {VEl | string | (() => (VEl | string))} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[Props, Children] | [Props, ...Child[]] | [Children] | Child[]} Args
 * @type {{[ns: string]: {[tag: string]: (...args: Args) => VEl}}}
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
  for (const key in props) {
    // on* event handlers, all lowercase, have no arrow, not evaluted
    if (key.startsWith('on')) vel[PROPS][toLowerCase(key)] = props[key]
    else vel[PROPS][key] = evaluate(props[key], vel, key)
  }
  // NOTE: args may be tag(() => VEl), not tag(() => VEl[]).
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
  const /**@type {VText}*/ vtext = ['text', txt, {}, []]
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
  setAttribute(el, UID, uid++ + '')
  for (const key in vel[PROPS]) setProp(el, key, vel[PROPS][key])
  el.append(...vel[CHILDREN].map(createRNode).map((rnode) => rnode[NODE]))
  const rel = convertVNodeToRNode(vel, el)
  // @ts-ignore let it crash if oncreate is not function
  rel[PROPS][ONCREATE]?.(el)
  return rel
}

function createRNode(/**@type {VNode}*/ vnode) {
  return vnode[TYPE] === 'text' ? createRText(vnode) : createREl(vnode)
}

function createRText(/**@type {VText}*/ vtext) {
  const node = DOCUMENT.createTextNode(vtext[TXT])
  const rtext = convertVNodeToRNode(vtext, node)
  return rtext
}

/**
 * @overload @param {VEl} vel @param {El} el @returns {REl}
 * @overload @param {VText} vtext @param {Text} text @returns {RText}
 */
function convertVNodeToRNode(/**@type {VNode}*/ vnode, /**@type {El|Text}*/ node) {
  // @ts-ignore ok. trickky type coersion. rnode and vnode point to the same object
  const /**@type {RNode}*/ rnode = vnode
  rnode[NODE] = node
  if (rnode[PROPS][CACHE_REMOVED_CHILDREN] && getIds(rnode[CHILDREN])) rnode[CACHE] = {}
  // @ts-ignore ok
  node[BRAND_KEY] = rnode
  return rnode
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
 * @type {(fn: unknown, vel: ?VEl, k: ?string|number, effect?: Function) => any}
 */
function evaluate(fn, vel, key, effect) {
  if (typeof fn !== 'function') return fn
  // @ts-ignore ok. tickky type coersion. vel will become rel after createVEl()
  const /**@type {REl}*/ rel = vel
  currentArrow = vel ? [fn, rel, key] : [fn, null, null, effect]
  const result = fn()
  currentArrow = null
  return result
}

/** create a reactive proxy @type {<T extends object>(target: T) => T} */
export function reactive(target) {
  if (target !== OBJECT(target) || isReactive(target)) return target
  return new PROXY(target, {
    get(target, prop) {
      // this is how isReactive() works
      if (prop === BRAND_SYMBOL) return true
      const result = REFLECT.get(target, prop)
      // function.prototype cannot be proxied, so skip it
      if (typeof target === 'function' && prop === 'prototype') return result
      // collect trigger as dependency of current arrow
      if (currentArrow) {
        if (!deps.has(currentArrow)) deps.set(currentArrow, [])
        // @ts-ignore ok, guaranteed by deps.set
        const /**@type {Trigger[]}*/ triggers = deps.get(currentArrow)
        if (!triggers.some((t) => t[TARGET] === target && t[PROP] === prop))
          triggers.push([target, prop])
      }
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = REFLECT.get(target, prop)
      const result = REFLECT.set(target, prop, newValue)
      // skip meaningless change, unless touching array[LENGTH] inside array.push() etc.
      if (oldValue === newValue && prop !== LENGTH) return result
      for (const [arrow, triggers] of deps.entries()) {
        for (const trigger of triggers) {
          // update target in all triggers, so oldValue can be garbage collected
          if (trigger[TARGET] === oldValue) trigger[TARGET] = newValue
          // dependent arrows found! Action!
          if (trigger[TARGET] === target && trigger[PROP] === prop) {
            const [fn, rel, key, effect] = arrow
            const value = fn()
            // console.log('set')
            // console.log({ target, prop, oldValue, newValue })
            // console.log({ ...rel, key, value })
            if (!rel) {
              effect?.(value)
            } else if (
              typeof key === 'number' ||
              // NOTE: createVEl can't tell tag(() => VEl) from tag(() => VEl[]).
              // so key may be wrongly null. this special case is handled here
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
        }
      }
      return result
    },
  })
}

function removeArrowsInRNodeFromDeps(/**@type {RNode}*/ rnode) {
  for (const arrow of deps.keys())
    if (arrow[REL] && rnode[NODE].contains(arrow[REL]?.[NODE])) deps.delete(arrow)
}

function updateChildren(/**@type {REl}*/ rel, /**@type {VNode[]}*/ newVNodes) {
  const oldIds = getIds(rel[CHILDREN])
  const newIds = getIds(newVNodes)
  // if both have unique ids, smart update
  if (oldIds && newIds) {
    // remove unmatched. MUST REMOVE FROM TAIL!!! otherwise index would be messed up
    for (let i = oldIds[LENGTH] - 1; i >= 0; i--) {
      if (!newIds.includes(oldIds[i])) removeChild(rel, i)
    }
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
        // matched in removed cache, bring it out, then update
        insertChild(rel, i, rel[CACHE][id])
        updateChild(rel, i, newVNode)
      } else {
        // matched nothing, create and insert
        insertChild(rel, i, newVNode)
      }
    }
  } else {
    // no unique ids, silly update
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
    oldRNode[TYPE] !== 'text' &&
    newVNode[TYPE] !== 'text' &&
    oldRNode[TAG] === newVNode[TAG]
  ) {
    const el = oldRNode[NODE]
    for (const key in newVNode[PROPS])
      if (oldRNode[PROPS][key] !== newVNode[PROPS][key])
        setProp(el, key, newVNode[PROPS][key])
    for (const key in oldRNode[PROPS]) if (!(key in newVNode[PROPS])) unsetProp(el, key)
    // innerText, innerHTML, textContent prop already deals with children, so skip
    if (!['innerText', 'innerHTML', 'textContent'].some((k) => k in newVNode[PROPS]))
      updateChildren(oldRNode, newVNode[CHILDREN])
    const newRNode = convertVNodeToRNode(newVNode, oldRNode[NODE])
    rel[CHILDREN][index] = newRNode
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
  if (rel[CACHE] && typeof newRNode[PROPS].id === 'string')
    delete rel[CACHE][newRNode[PROPS].id]
}

function removeChild(/**@type {REl}*/ rel, /**@type {number}*/ index) {
  const rnode = rel[CHILDREN].splice(index, 1)[0]
  rnode[NODE].remove()
  // put into cache
  if (rel[CACHE] && typeof rnode[PROPS].id === 'string')
    rel[CACHE][rnode[PROPS].id] = rnode
  return rnode
}

function getIds(/**@type {ANode[]}*/ anodes) {
  const ids = anodes.map((vn) => vn[PROPS].id).filter((id) => typeof id === 'string')
  if (new Set(ids).size !== ids[LENGTH]) throw ERROR(`duplicate children id: ${ids}`)
  else return ids[LENGTH] === anodes[LENGTH] ? ids : null
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
  // @ts-ignore ok, guaranteed by getObjectPropertyType has 'set'
  if (getObjectPropertyType(el, key).includes('set')) el[key] = value
  else if (typeof value !== 'string')
    throw ERROR(`<${el.nodeName}> attr/style must be string: ${key} = ${value}`)
  else if (key[0] === '$') el.style.setProperty(removeFirst(key), value)
  else if (key[0] === '_') setAttribute(el, removeFirst(key), value)
  else setAttribute(el, key, value)
}

function unsetProp(/**@type {El}*/ el, /**@type {string}*/ key) {
  // remove attr and IDL prop. most IDL props can also be unset by lowercasing into attr
  if (toLowerCase(key) in el.attributes) removeAttribute(el, key)
  // special cases for IDL prop naming
  else if (key in prop2attr) removeAttribute(el, prop2attr[key])
  // TODO: test more cases for how to unset arbitary non-attr props
  // @ts-ignore ok. guaranteed by key in el
  else if (key in el) el[key] = typeof el[key] === 'string' ? '' : undefined
  else {
    const start = key[0]
    const remained = removeFirst(key)
    if (start === '_') removeAttribute(el, remained)
    else if (start === '$') el.style.removeProperty(remained)
    else throw ERROR(`unset invalid prop '${key}' from <${el.nodeName}>`)
  }
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
