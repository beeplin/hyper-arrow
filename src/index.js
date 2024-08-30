/**
 * @typedef {[fn: Function, velOrEffect: VEl|Function|undefined, key: string]} Arrow
 * @typedef {[tag: string, props: object, children: VNode[], el?: HTMLElement]} VEl
 * @typedef {VEl|string} VNode
 * @typedef {VNode|(()=>VNode)} Child
 * @typedef {Child[]|(()=>Child[])} Children
 * @typedef {[target: object, prop: string|symbol]} Trigger
 */
/** @type {Arrow?} arrow within which reactive object runs trigger */
let currentArrow = null
/** @type {Map<Arrow, Trigger[]>} dependency map: arrow -> triggers of the arrow */
export const deps = new Map()
/* build arrow and evaluate fn() within it, or return fn if it's not a function */
function evaluate(fn, x, key) {
  if (typeof fn !== 'function') return fn
  currentArrow = [fn, x, key]
  const result = fn()
  currentArrow = null
  return result
}
/**
 * create a virtual element, and create arrows for lazy function calls
 * @param {string} tag
 * @param {object=} props
 * @param {Array<Child|Children> =} children
 * @returns {VEl}
 */
export function h(tag, props, children) {
  const hasProps = typeof props === 'object' && !Array.isArray(props)
  /** @type {VEl} */ const vel = [tag, {}, []]
  for (const [k, v] of Object.entries(hasProps ? props : {}))
    vel[1][k] = k.startsWith('on') ? v : evaluate(v, vel, k)
  for (const [i, v] of evaluate(hasProps ? children ?? [] : props, vel, '*').entries())
    vel[2].push(evaluate(v, vel, '#' + i))
  return vel
}
/**
 * convert virtul node to real node
 * @param {VNode} vnode
 * @returns {Node}
 */
function realize(vnode) {
  if (typeof vnode === 'string') return document.createTextNode(vnode)
  const el = document.createElement(vnode[0])
  for (const [k, v] of Object.entries(vnode[1]))
    if (k === 'class') el.className = v
    else if (k === 'for') el['htmlFor'] = v
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k.startsWith('$')) el.style[k.slice(1)] = v
    else if (k.startsWith('_')) el.setAttribute(k.slice(1), v)
    else el[k] = v
  for (const vn of vnode[2]) el.append(realize(vn))
  vnode[3] = el
  return el
}
/**
 * mount vel to DOM tree
 * @param {string} selector
 * @param {VEl} vel
 */
export function mount(selector, vel) {
  document.querySelector(selector).append(realize(vel))
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
  evaluate(watchFn, effectFn, '')
  return () => {
    for (const arrow of deps.keys()) if (arrow[0] === watchFn) deps.delete(arrow)
  }
}
const BRAND = Symbol('brand')
/**
 * make object reactive, collecting arrows for getters, and updating DOM in setters
 * @template T
 * @param {T} target
 * @returns {T}
 */
export function reactive(target) {
  if (target !== Object(target) || target[BRAND]) return target
  // @ts-ignore
  return new Proxy(target, {
    get(target, prop) {
      if (prop === BRAND) return true
      const result = Reflect.get(target, prop)
      if (typeof target === 'function' && prop === 'prototype') return result
      if (!currentArrow) return reactive(result)
      if (!deps.has(currentArrow)) deps.set(currentArrow, [])
      const triggers = deps.get(currentArrow)
      if (triggers?.every((trigger) => !(trigger[0] === target && trigger[1] === prop)))
        triggers.push([target, prop])
      return reactive(result)
    },
    set(target, prop, newValue) {
      const oldValue = Reflect.get(target, prop)
      const result = Reflect.set(target, prop, newValue)
      for (const [[fn, x, key], triggers] of deps.entries())
        for (const trigger of triggers) {
          if (trigger[0] === oldValue) trigger[0] = newValue
          if (trigger[0] === target && trigger[1] === prop)
            if (typeof x === 'function' || typeof x === 'undefined') x ? x(fn()) : fn()
            else {
              const el = x[3]
              if (key === 'class') el.className = fn()
              else if (key === 'for') el['htmlFor'] = fn()
              else if (key.startsWith('$')) el.style[key.slice(1)] = fn()
              else if (key.startsWith('_')) el.setAttribute(key.slice(1), fn())
              else if (key.startsWith('#')) {
                const old = el.children[key.slice(1)]
                for (const arrow of deps.keys()) {
                  const _el = arrow[1]?.[3]
                  if (_el && (old === _el || old.contains(_el))) deps.delete(arrow)
                }
                // TODO: smart update child
                el.replaceChild(realize(fn()), old)
              } else if (key === '*') {
                for (const arrow of deps.keys()) {
                  const _el = arrow[1]?.[3]
                  if (_el && el !== _el && el.contains(_el)) deps.delete(arrow)
                }
                // TODO: smart update children
                el.replaceChildren(...fn().map(realize))
              } else el[key] = fn()
            }
        }
      return result
    },
  })
}
/** check if target is reactive */
export const isReactive = (x) => !!x[BRAND]

const tag = (name) => h.bind(null, name)

export const a = tag('a')
export const abbr = tag('abbr')
export const address = tag('address')
export const area = tag('area')
export const article = tag('article')
export const aside = tag('aside')
export const audio = tag('audio')
export const b = tag('b')
export const base = tag('base')
export const bdi = tag('bdi')
export const bdo = tag('bdo')
export const blockquote = tag('blockquote')
export const body = tag('body')
export const br = tag('br')
export const button = tag('button')
export const canvas = tag('canvas')
export const caption = tag('caption')
export const cite = tag('cite')
export const code = tag('code')
export const col = tag('col')
export const colgroup = tag('colgroup')
export const data = tag('data')
export const datalist = tag('datalist')
export const dd = tag('dd')
export const del = tag('del')
export const details = tag('details')
export const dfn = tag('dfn')
export const dialog = tag('dialog')
export const div = tag('div')
export const dl = tag('dl')
export const dt = tag('dt')
export const em = tag('em')
export const embed = tag('embed')
export const fieldset = tag('fieldset')
export const figcaption = tag('figcaption')
export const figure = tag('figure')
export const footer = tag('footer')
export const form = tag('form')
export const h1 = tag('h1')
export const h2 = tag('h2')
export const h3 = tag('h3')
export const h4 = tag('h4')
export const h5 = tag('h5')
export const h6 = tag('h6')
export const head = tag('head')
export const header = tag('header')
export const hgroup = tag('hgroup')
export const hr = tag('hr')
export const html = tag('html')
export const i = tag('i')
export const iframe = tag('iframe')
export const img = tag('img')
export const input = tag('input')
export const ins = tag('ins')
export const kbd = tag('kbd')
export const label = tag('label')
export const legend = tag('legend')
export const li = tag('li')
export const link = tag('link')
export const main = tag('main')
export const map = tag('map')
export const mark = tag('mark')
export const math = tag('math')
export const menu = tag('menu')
export const menuitem = tag('menuitem')
export const meta = tag('meta')
export const meter = tag('meter')
export const nav = tag('nav')
export const noscript = tag('noscript')
export const object = tag('object')
export const ol = tag('ol')
export const optgroup = tag('optgroup')
export const option = tag('option')
export const output = tag('output')
export const p = tag('p')
export const param = tag('param')
export const picture = tag('picture')
export const pre = tag('pre')
export const progress = tag('progress')
export const q = tag('q')
export const rb = tag('rb')
export const rp = tag('rp')
export const rt = tag('rt')
export const rtc = tag('rtc')
export const ruby = tag('ruby')
export const s = tag('s')
export const samp = tag('samp')
export const script = tag('script')
export const search = tag('search')
export const section = tag('section')
export const select = tag('select')
export const slot = tag('slot')
export const small = tag('small')
export const source = tag('source')
export const span = tag('span')
export const strong = tag('strong')
export const style = tag('style')
export const sub = tag('sub')
export const summary = tag('summary')
export const sup = tag('sup')
export const svg = tag('svg')
export const table = tag('table')
export const tbody = tag('tbody')
export const td = tag('td')
export const template = tag('template')
export const textarea = tag('textarea')
export const tfoot = tag('tfoot')
export const th = tag('th')
export const thead = tag('thead')
export const time = tag('time')
export const title = tag('title')
export const tr = tag('tr')
export const track = tag('track')
export const u = tag('u')
export const ul = tag('ul')
export const var_ = tag('var')
export const video = tag('video')
export const wbr = tag('wbr')
