// @ts-check
// reassign built-in objects and methods for better minification
const LENGTH = 'length';
const OBJECT = Object;
// const ERROR = Error
const PROXY = Proxy;
const REFLECT = Reflect;
const DOCUMENT = document;
const isArray = Array.isArray;
// const createElementNS = DOCUMENT.createElementNS.bind(DOCUMENT)
const removeFirst = (/**@type {any}*/ x) => x.slice(1);
const toLowerCase = (/**@type {string}*/ str) => str.toLowerCase();
/** @type {(el: El, k: string, v: string) => void} */
const setAttribute = (el, k, v) => el.setAttribute(k, v);
/** @type {(el: El, k: string) => void} */
const removeAttribute = (el, k) => el.removeAttribute(k);
/**
 * @typedef {'html' | 'svg' | 'mathml'} ElType
 * @typedef {HTMLElement | SVGElement | MathMLElement} El
 * @typedef {{[k: string | symbol]: unknown}} Props
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
const NODE = 0;
const TAG = 1;
const TXT = 1;
const PROPS = 2;
const CHILDREN = 3;
const TYPE = 4;
const CACHE = 5;
/**
 * @typedef {[REl, key: string | number | null, Function]} ElArrow
 * @typedef {[null, null, Function, effect?: Function]} WatchArrow
 * @typedef {ElArrow | WatchArrow} Arrow
 */
const REL = 0;
const FN = 2;
/** @type {Arrow?} */
let currentArrow = null;
/** @type {Map<Arrow, WeakMap<object, Set<string | symbol>>>}*/
export const deps = new Map();
/** @type {WeakMap<object, Record<string | symbol, WeakSet<Arrow>>>} */
export const reverseDeps = new WeakMap();
const BRAND_KEY = '__hyper_arrow__';
const BRAND_SYMBOL = Symbol(BRAND_KEY);
export const isReactive = (/**@type {any}*/ x) => !!x[BRAND_SYMBOL];
export const ON_CREATE = Symbol();
export const CACHE_REMOVED_CHILDREN_AND_MAY_LEAK = Symbol();
let uid = 0;
const UID = 'uid';
const /**@type {{[k:string]: string}}*/ prop2attr = {
    defaultValue: 'value',
    htmlFor: 'for',
    className: 'class',
};
/**
 * @typedef {VEl | string | (() => (VEl | string))} Child
 * @typedef {Child[] | (() => Child[])} Children
 * @typedef {[Props, Children] | [Props, ...Child[]] | [Children] | Child[]} Args
 * @type {{[ns: string]: {[tag: string]: (...args: Args) => VEl}}}
 */
export const tags = new PROXY({}, {
    get: (_, /**@type {ElType}*/ type) => new PROXY({}, { get: (_, /**@type {string}*/ tag) => createVEl.bind(null, type, tag) }),
});
/** virtual element @constructor */
export function VEl(
/**@type {ElType}*/ type, 
/**@type {string}*/ tag, 
/**@type {Props}*/ props, 
/**@type {VNode[]}*/ children) {
    this[TYPE] = type;
    this[TAG] = tag;
    this[PROPS] = props;
    this[CHILDREN] = children;
}
function createVEl(
/**@type {ElType}*/ type, 
/**@type {string}*/ tag, 
/**@type {Args}*/ ...args) {
    const vel = new VEl(type, tag, OBJECT.create(null), []);
    const [props, x] = typeof args[0] === 'object' && !isArray(args[0]) && !(args[0] instanceof VEl)
        ? [args[0], removeFirst(args)]
        : [{}, args];
    for (const key of OBJECT.getOwnPropertySymbols(props))
        vel[PROPS][key] = props[key];
    for (const key in props) {
        // on* event handlers, all lowercase, have no arrow, not evaluted
        if (key.startsWith('on'))
            vel[PROPS][toLowerCase(key)] = props[key];
        else
            vel[PROPS][key] = evaluate(props[key], vel, key);
    }
    // args may be tag(() => VEl), not tag(() => VEl[]).
    // in this case arrow key should be 0, not null.
    // but cannot foresee whether fn returns VEl or VEl[] before it's actually evaluted
    // so the wrong arrow key (null) must be handled later in reactive/set
    const children = isArray(x) && x[LENGTH] === 1 && (typeof x[0] === 'function' || isArray(x[0]))
        ? x[0]
        : x;
    const /**@type {Child[] | Child}*/ y = evaluate(children, vel, null);
    if (typeof y === 'function' || typeof y === 'string' || y instanceof VEl)
        vel[CHILDREN].push(createVNode(evaluate(y, vel, 0)));
    else
        for (const i in y)
            vel[CHILDREN].push(createVNode(evaluate(y[i], vel, +i)));
    return vel;
}
function createVNode(/**@type {VEl | string}*/ x) {
    return typeof x === 'string' ? createVText(x) : x;
}
function createVText(/**@type {string}*/ txt) {
    const /**@type {VText}*/ vtext = [null, txt, {}, [], 'text'];
    return vtext;
}
/** mount virtual element to DOM */
export function mount(/**@type {string}*/ selector, /**@type {VEl}*/ vel) {
    // @ts-ignore let it crash if selector not found
    DOCUMENT.querySelector(selector).append(createREl(vel)[NODE]);
}
function createREl(/**@type {VEl}*/ vel) {
    var _a, _b;
    const el = vel[TYPE] === 'html'
        ? DOCUMENT.createElement(vel[TAG])
        : vel[TYPE] === 'svg'
            ? DOCUMENT.createElementNS('http://www.w3.org/2000/svg', vel[TAG])
            : DOCUMENT.createElementNS('http://www.w3.org/1998/Math/MathML', vel[TAG]);
    // use uid to track el's identity for debugging purpose
    setAttribute(el, UID, uid++ + '');
    for (const key in vel[PROPS])
        setProp(el, key, vel[PROPS][key]);
    el.append(...vel[CHILDREN].map(createRNode).map((rnode) => rnode[NODE]));
    const rel = convertVNodeToRNode(vel, el);
    // @ts-ignore let it crash if oncreate is not function
    (_b = (_a = rel[PROPS])[ON_CREATE]) === null || _b === void 0 ? void 0 : _b.call(_a, el);
    return rel;
}
function createRNode(/**@type {VNode}*/ vnode) {
    return vnode[TYPE] === 'text' ? createRText(vnode) : createREl(vnode);
}
function createRText(/**@type {VText}*/ vtext) {
    const node = DOCUMENT.createTextNode(vtext[TXT]);
    const rtext = convertVNodeToRNode(vtext, node);
    return rtext;
}
/**
 * @overload @param {VEl} vel @param {El} el @returns {REl}
 * @overload @param {VText} vtext @param {Text} text @returns {RText}
 */
function convertVNodeToRNode(/**@type {VNode}*/ vnode, /**@type {El|Text}*/ node) {
    // @ts-ignore ok. trickky type coersion. rnode and vnode point to the same object
    const /**@type {RNode}*/ rnode = vnode;
    rnode[NODE] = node;
    if (rnode instanceof VEl &&
        rnode[PROPS][CACHE_REMOVED_CHILDREN_AND_MAY_LEAK] &&
        getFullUniqueIds(rnode[CHILDREN]))
        rnode[CACHE] = {};
    // @ts-ignore ok
    node[BRAND_KEY] = rnode;
    return rnode;
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
    evaluate(watchFn, null, null, effectFn);
    return () => {
        for (const arrow of deps.keys())
            if (arrow[FN] === watchFn)
                deps.delete(arrow);
    };
}
/**
 * create a new arrow with contextual info and run fn within it, if fn is function
 * @type {(fn: unknown, vel: ?VEl, k: ?string|number, effect?: Function) => any}
 */
function evaluate(fn, vel, key, effect) {
    if (typeof fn !== 'function')
        return fn;
    // @ts-ignore ok. tickky type coersion. vel will become rel after createVEl()
    const /**@type {REl}*/ rel = vel;
    currentArrow = vel ? [rel, key, fn] : [null, null, fn, effect];
    const result = fn();
    currentArrow = null;
    return result;
}
/** create a reactive proxy @type {<T extends object>(target: T) => T} */
export function reactive(target) {
    if (target !== OBJECT(target) || isReactive(target))
        return target;
    return new PROXY(target, {
        get(target, prop) {
            var _a;
            // this is how isReactive() works
            if (prop === BRAND_SYMBOL)
                return true;
            const result = REFLECT.get(target, prop);
            // would throw if proxying function.prototype, so skip it
            if (typeof target === 'function' && prop === 'prototype')
                return result;
            // collect dependencies of current arrow
            if (currentArrow) {
                // console.log('--get--')
                // console.log(currentArrow[0], currentArrow[1]?.[TAG], currentArrow[2])
                // console.log(target, prop)
                if (!deps.has(currentArrow))
                    deps.set(currentArrow, new WeakMap());
                const targetMap = deps.get(currentArrow);
                if (!(targetMap === null || targetMap === void 0 ? void 0 : targetMap.has(target)))
                    targetMap === null || targetMap === void 0 ? void 0 : targetMap.set(target, new Set());
                (_a = targetMap === null || targetMap === void 0 ? void 0 : targetMap.get(target)) === null || _a === void 0 ? void 0 : _a.add(prop);
                // build reverse deps for debugging purpose
                if (!reverseDeps.has(target))
                    reverseDeps.set(target, Object.create(null));
                const propRecord = reverseDeps.get(target);
                if (propRecord) {
                    if (!(prop in propRecord))
                        propRecord[prop] = new WeakSet();
                    propRecord[prop].add(currentArrow);
                }
            }
            return reactive(result);
        },
        set(target, prop, newValue) {
            const oldValue = REFLECT.get(target, prop);
            const result = REFLECT.set(target, prop, newValue);
            // skip meaningless change, unless touching array[LENGTH] inside array.push() etc.
            if (oldValue === newValue && !(isArray(target) && prop === LENGTH))
                return result;
            for (const [arrow, targetMap] of deps.entries()) {
                const propSet = targetMap.get(target);
                if (propSet === null || propSet === void 0 ? void 0 : propSet.has(prop)) {
                    const [rel, key, fn, effect] = arrow;
                    currentArrow = arrow;
                    const value = fn();
                    currentArrow = null;
                    // console.log('--set--')
                    // console.log(target, prop, oldValue, newValue)
                    // console.log(rel?.[TAG], rel?.[PROPS], rel?.[CHILDREN])
                    // console.log(key, value)
                    if (!rel) {
                        effect === null || effect === void 0 ? void 0 : effect(value);
                    }
                    else if (typeof key === 'number' ||
                        // createVEl can't tell tag(() => VEl) from tag(() => VEl[]).
                        // so key may be wrongly null. this special case is handled here
                        (key === null && (typeof value === 'string' || value instanceof VEl))) {
                        const index = key !== null && key !== void 0 ? key : 0;
                        removeArrowsInRNodeFromDeps(rel[CHILDREN][index]);
                        updateChild(rel, index, createVNode(value));
                    }
                    else if (key === null) {
                        rel[CHILDREN].map(removeArrowsInRNodeFromDeps);
                        updateChildren(rel, value.map(createVNode));
                    }
                    else {
                        setProp(rel[NODE], key, value);
                    }
                }
            }
            return result;
        },
        deleteProperty(target, prop) {
            var _a, _b;
            const result = REFLECT.deleteProperty(target, prop);
            // console.log('--delete--')
            // console.log(target, prop)
            for (const targetMap of deps.values())
                (_a = targetMap.get(target)) === null || _a === void 0 ? void 0 : _a.delete(prop);
            (_b = reverseDeps.get(target)) === null || _b === void 0 ? true : delete _b[prop];
            return result;
        },
    });
}
function removeArrowsInRNodeFromDeps(/**@type {RNode}*/ rnode) {
    for (const arrow of deps.keys())
        if (arrowIsInRNode(arrow, rnode))
            deps.delete(arrow);
}
function arrowIsInRNode(/**@type {Arrow}*/ arrow, /**@type {RNode}*/ rnode) {
    var _a;
    return arrow[REL] && rnode[NODE].contains((_a = arrow[REL]) === null || _a === void 0 ? void 0 : _a[NODE]);
}
function updateChildren(/**@type {REl}*/ rel, /**@type {VNode[]}*/ newVNodes) {
    var _a;
    const oldIds = getFullUniqueIds(rel[CHILDREN]);
    const newIds = getFullUniqueIds(newVNodes);
    // if both have full unique ids, smart update
    if (oldIds && newIds) {
        // remove unmatched. MUST REMOVE FROM TAIL!!! otherwise index would be messed up
        for (let i = oldIds[LENGTH] - 1; i >= 0; i--) {
            if (!newIds.includes(oldIds[i]))
                removeChild(rel, i);
        }
        // build from head to tail
        for (const [i, id] of newIds.entries()) {
            const j = rel[CHILDREN].findIndex((vnode) => vnode[PROPS].id === id);
            const newVNode = newVNodes[i];
            if (i === j) {
                // matched in current position, update
                updateChild(rel, i, newVNode);
            }
            else if (rel[CHILDREN][j]) {
                // matched in latter position, bring it up, then update. REMOVE FIRST!!!
                insertChild(rel, i, removeChild(rel, j)); // ok, j > i always
                updateChild(rel, i, newVNode);
            }
            else if ((_a = rel[CACHE]) === null || _a === void 0 ? void 0 : _a[id]) {
                // matched in removed cache, bring it out, then update
                insertChild(rel, i, rel[CACHE][id]);
                updateChild(rel, i, newVNode);
            }
            else {
                // matched nothing, create and insert
                insertChild(rel, i, newVNode);
            }
        }
    }
    else {
        // no unique ids, silly update
        const newLen = newVNodes[LENGTH];
        const oldLen = rel[CHILDREN][LENGTH];
        // build from head to tail
        for (let i = 0; i < newLen || i < oldLen; i++) {
            if (i < newLen && i < oldLen) {
                // update existing ones in place
                updateChild(rel, i, newVNodes[i]);
            }
            else if (i >= oldLen) {
                // insert new ones in tail
                insertChild(rel, i, newVNodes[i]);
            }
            else {
                // REMOVE unneeded old ones FROM TAIL!!!
                removeChild(rel, oldLen + newLen - 1 - i);
            }
        }
    }
}
function updateChild(
/**@type {REl}*/ rel, 
/**@type {number}*/ index, 
/**@type {VNode}*/ newVNode) {
    const oldRNode = rel[CHILDREN][index];
    // if both vel with same tag, patch the existing el
    if (oldRNode[TYPE] !== 'text' &&
        newVNode[TYPE] !== 'text' &&
        oldRNode[TAG] === newVNode[TAG]) {
        const el = oldRNode[NODE];
        for (const key in newVNode[PROPS])
            if (oldRNode[PROPS][key] !== newVNode[PROPS][key])
                setProp(el, key, newVNode[PROPS][key]);
        for (const key in oldRNode[PROPS])
            if (!(key in newVNode[PROPS]))
                unsetProp(el, key);
        // innerText, innerHTML, textContent prop already deals with children, so skip
        if (!['innerText', 'innerHTML', 'textContent'].some((k) => k in newVNode[PROPS]))
            updateChildren(oldRNode, newVNode[CHILDREN]);
        const newRNode = convertVNodeToRNode(newVNode, oldRNode[NODE]);
        rel[CHILDREN][index] = newRNode;
    }
    else {
        // replace whole node. REMOVE FIRST!!!
        removeChild(rel, index);
        insertChild(rel, index, newVNode);
    }
}
function insertChild(
/**@type {REl}*/ rel, 
/**@type {number}*/ index, 
/**@type {ANode}*/ newANode) {
    const el = rel[NODE];
    // @ts-ignore ok. stupid ts！
    const /**@type {RNode}*/ newRNode = newANode[NODE] ? newANode : createRNode(newANode);
    const node = newRNode[NODE];
    el.insertBefore(node, el.childNodes.item(index));
    rel[CHILDREN].splice(index, 0, newRNode);
    // already brought out, so remove from cache
    if (rel[CACHE] && typeof newRNode[PROPS].id === 'string')
        delete rel[CACHE][newRNode[PROPS].id];
}
function removeChild(/**@type {REl}*/ rel, /**@type {number}*/ index) {
    const rnode = rel[CHILDREN].splice(index, 1)[0];
    rnode[NODE].remove();
    // put into cache
    if (rel[CACHE] && typeof rnode[PROPS].id === 'string')
        rel[CACHE][rnode[PROPS].id] = rnode;
    return rnode;
}
function getFullUniqueIds(/**@type {ANode[]}*/ anodes) {
    const ids = anodes.map((vn) => vn[PROPS].id).filter((id) => typeof id === 'string');
    // if (new Set(ids).size !== ids[LENGTH]) throw ERROR(`duplicate children id: ${ids}`)
    return ids[LENGTH] === anodes[LENGTH] && ids[LENGTH] === new Set(ids).size
        ? ids
        : null;
}
function setProp(
/**@type {El}*/ el, 
/**@type {string}*/ key, 
/**@type {unknown}*/ value) {
    // IDL properties are getter/setters, proxies of attributes. For example:
    // getter/setter: on* aria* autofocus id className classList style innerHTML ...
    // getter only: client* scrollTop tagName dataset attributes children firstChild ...
    // plain value: blur() focus() after() append() ... (all methods)
    // @ts-ignore ok, guaranteed by getObjectPropertyType has 'set'
    if (getObjectPropertyType(el, key).includes('set'))
        el[key] = value;
    // @ts-ignore ok. DOM can coerse type
    else if (key[0] === '$')
        el.style.setProperty(removeFirst(key), value);
    // @ts-ignore ok. DOM can coerse type
    else if (key[0] === '_')
        setAttribute(el, removeFirst(key), value);
    // @ts-ignore ok. DOM can coerse type
    else
        setAttribute(el, key, value);
}
function unsetProp(/**@type {El}*/ el, /**@type {string}*/ key) {
    // remove attr and IDL prop. most IDL props can also be unset by lowercasing into attr
    if (toLowerCase(key) in el.attributes)
        removeAttribute(el, key);
    // special cases for IDL prop naming
    else if (key in prop2attr)
        removeAttribute(el, prop2attr[key]);
    // TODO: test more cases for how to unset arbitary non-attr props
    // @ts-ignore ok. guaranteed by key in el
    else if (key in el)
        el[key] = typeof el[key] === 'string' ? '' : undefined;
    else if (key[0] === '_')
        removeAttribute(el, removeFirst(key));
    else if (key[0] === '$')
        el.style.removeProperty(removeFirst(key));
    else
        throw Error(`unknown prop '${key}' to unset from <${el.nodeName}>`);
}
function getObjectPropertyType(/**@type {object}}*/ object, /**@type {string}*/ prop) {
    if (!(prop in object))
        return [];
    const pd = OBJECT.getOwnPropertyDescriptor(object, prop);
    if (pd)
        return OBJECT.entries(pd)
            .map(([k, v]) => (v ? k : null))
            .filter((x) => x);
    const proto = OBJECT.getPrototypeOf(object);
    if (!proto)
        return [];
    return getObjectPropertyType(proto, prop);
}
