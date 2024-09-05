// @ts-check

/**
 * @typedef {'html' | 'svg' | 'mathml'} ElType
 * @typedef {HTMLElement | SVGElement | MathMLElement} El
 * @typedef {{[k: string]: unknown, id?: string}} Props
 * @typedef {{[k: string]: RNode}} Cache
 * @typedef {{[k: string]: never}} Empty
 * @typedef {[ElType, tag: string, Props, VNode[]]} VEl virtal element
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
  const /**@type {VEl}*/ rel = [type, tag, { __proto__: null }, []]
  if (typeof props !== 'object' || Array.isArray(props)) children = props
  else
    for (const key in props) {
      // on* event handlers, all lowercase, have no arrow, so not evaluted
      if (key.startsWith('on')) rel[PROPS][key.toLowerCase()] = props[key]
      // set currentArrow and run arrow function within it
      else rel[PROPS][key] = evaluate(props[key], rel, key)
    }
  const /**@type {TagChild[]}*/ childList = evaluate(children, rel, null) ?? []
  for (const i in childList)
    rel[CHILDREN].push(createVnode(evaluate(childList[i], rel, +i)))
  return rel
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
  document.querySelector(selector).append(createREl(vel)[NODE])
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

function createREl(/**@type {VEl}*/ vel) {
  // @ts-ignore ok
  const /**@type {El}*/ el = document.createElementNS(ELEMENT_NS[vel[TYPE]], vel[TAG])
  // use uid to track el's identity for debugging purpose
  el.setAttribute(UID, uid++ + '')
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
  const node = document.createTextNode(vtext[TXT])
  const rtext = convertVNodeToRNode(vtext, node)
  return rtext
}

/**
 * @overload @param {VEl}   vel   @param {El}   el   @returns {REl}
 * @overload @param {VText} vtext @param {Text} text @returns {RText}
 */
function convertVNodeToRNode(/**@type {VNode}*/ vnode, /**@type {El|Text}*/ node) {
  // @ts-ignore trickky type coersion. rnode and vnode point to the same object
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
  // @ts-ignore tickky type coersion. vel will become rel after createVel()
  const /**@type {REl}*/ rel = vel
  currentArrow = vel ? [fn, rel, key] : [fn, null, null, effect]
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
            const [fn, rel, key, effect] = arrow
            const value = fn()
            // console.log('-----set------')
            // console.log({ target, prop, oldValue, newValue })
            // console.log({ ...rel, k, v })
            if (!rel) {
              effect?.(value)
            } else if (key === null) {
              rel[CHILDREN].map(removeArrowsInRNodeFromDeps)
              updateChildren(rel, value.map(createVnode))
            } else if (typeof key === 'number') {
              removeArrowsInRNodeFromDeps(rel[CHILDREN][key])
              updateChild(rel, key, createVnode(value))
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
    for (let i = oldIds.length - 1; i >= 0; i--) {
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
    const newLen = newVNodes.length
    const oldLen = rel[CHILDREN].length
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
  // alrady brought out, so remove from cache
  if (rel[CACHE] && newRNode[PROPS].id) delete rel[CACHE][newRNode[PROPS].id]
}

function removeChild(/**@type {REl}*/ rel, /**@type {number}*/ index) {
  const rnode = rel[CHILDREN].splice(index, 1)[0]
  rnode[NODE].remove()
  // put into cache
  if (rel[CACHE] && rnode[PROPS].id) rel[CACHE][rnode[PROPS].id] = rnode
  return rnode
}

function getIds(/**@type {ANode[]}*/ anodes) {
  const ids = anodes.map((vn) => vn[PROPS].id).filter((id) => typeof id === 'string')
  if (new Set(ids).size !== ids.length) throw new Error(`duplicate children id: ${ids}`)
  else return ids.length === anodes.length ? ids : null
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
  // TODO: test more cases for how to unset arbitary non-attr props
  // @ts-ignore ok.
  else if (key in el) el[key] = typeof el[key] === 'string' ? '' : undefined
  else {
    const start = key[0]
    const remained = key.slice(1)
    if (start === '_') el.removeAttribute(remained)
    else if (start === '$') el.style.removeProperty(remained)
    else throw new Error(`invalid prop '${key}' to unset from <${el.nodeName}>`)
  }
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
