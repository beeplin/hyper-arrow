let p = 0,
  h = 1,
  n = 1,
  v = 2,
  m = 3,
  y = 4,
  u = 5
function d(e, t, r, n) {
  ;(this[p] = e), (this[h] = t), (this[v] = r), (this[m] = n)
}
let r = 1,
  o = '__hyper_arrow__',
  i = Symbol(o),
  l = null,
  g = new Map()
var e = new Proxy(
  {},
  { get: (e, r) => new Proxy({}, { get: (e, t) => f.bind(null, r + ':' + t) }) },
)
let f = function (e, ...t) {
  var [e, r] = e.split(':'),
    [e, r] = r ? [e, r] : [r, 'html']
  if ('html' !== e && 'svg' !== e && 'mathml' !== e)
    throw new Error(`wrong tag type '${e}'. 'html', 'svg' or 'mathml' required`)
  var n,
    o = new d(e, r, { __proto__: null }, []),
    [i, e] =
      'object' == typeof t[0] && !Array.isArray(t[0]) ? [t[0], t.slice(1)] : [{}, t]
  for (n in i)
    n.startsWith('on') ? (o[v][n.toLowerCase()] = i[n]) : (o[v][n] = $(i[n], o, n))
  var l = $(
    Array.isArray(e) &&
      1 === e.length &&
      ('function' == typeof e[0] || Array.isArray(e[0]))
      ? e[0]
      : e,
    o,
    null,
  )
  if ('function' == typeof l || 'string' == typeof l || l instanceof d)
    o[m].push(w($(l, o, 0)))
  else for (var f in l) o[m].push(w($(l[f], o, +f)))
  return o
}
function w(e) {
  return 'string' == typeof e ? ['text', e, {}, []] : e
}
function t(e, t) {
  document.querySelector(e).append(x(t)[y])
}
let s = 0,
  a = 'uid',
  c = 'oncreate',
  b = 'cacheRemovedChildren',
  _ = {
    html: 'http://www.w3.org/1999/xhtml',
    svg: 'http://www.w3.org/2000/svg',
    mathml: 'http://www.w3.org/1998/Math/MathML',
  }
function x(e) {
  var t,
    r = document.createElementNS(_[e[p]], e[h])
  for (t in (r.setAttribute(a, s++ + ''), e[v])) S(r, t, e[v][t])
  console.log('vel:', e), r.append(...e[m].map(A).map((e) => e[y]))
  var n = P(e, r)
  return n[v][c]?.(r), n
}
function A(e) {
  return 'text' === e[p]
    ? ((t = e), (r = document.createTextNode(t[n])), (t = P(t, r)))
    : x(e)
}
function P(e, t) {
  return (e[y] = t), e[v][b] && R(e[m]) && (e[u] = {}), (t[o] = e)
}
function k(t, e) {
  return (
    $(t, null, null, e),
    () => {
      for (var e of g.keys()) e[0] === t && g.delete(e)
    }
  )
}
function $(e, t, r, n) {
  var o
  return 'function' != typeof e
    ? e
    : ((o = t), (l = t ? [e, o, r] : [e, null, null, n]), (t = e()), (l = null), t)
}
let N = (e) => !!e[i]
function O(e) {
  return e !== Object(e) || N(e)
    ? e
    : new Proxy(e, {
        get(t, r) {
          var e, n
          return (
            r === i ||
            ((e = Reflect.get(t, r)),
            'function' == typeof t && 'prototype' === r
              ? e
              : (l &&
                  (g.has(l) || g.set(l, []),
                  (n = g.get(l)).some((e) => e[0] === t && e[1] === r) ||
                    n.push([t, r])),
                O(e)))
          )
        },
        set(e, t, r) {
          var n,
            o,
            i,
            l,
            f = Reflect.get(e, t),
            s = Reflect.set(e, t, r)
          if (f !== r || 'length' === t)
            for (var [u, a] of g.entries())
              for (var c of a)
                c[0] === f && (c[0] = r),
                  c[0] === e &&
                    c[1] === t &&
                    (([c, n, o, i] = u),
                    (c = c()),
                    n
                      ? 'number' == typeof o ||
                        (null === o && ('string' == typeof c || c instanceof d))
                        ? ((l = o ?? 0), j(n[m][l]), M(n, l, w(c)))
                        : null === o
                        ? (n[m].map(j), E(n, c.map(w)))
                        : S(n[y], o, c)
                      : i?.(c))
          return s
        },
      })
}
function j(e) {
  for (var t of g.keys()) t[r] && e[y].contains(t[r]?.[y]) && g.delete(t)
}
function E(r, n) {
  var t = R(r[m]),
    o = R(n)
  if (t && o) {
    for (let e = t.length - 1; 0 <= e; e--) o.includes(t[e]) || L(r, e)
    for (let [e, t] of o.entries()) {
      var i = r[m].findIndex((e) => e[v].id === t),
        l = n[e]
      ;(e === i
        ? M
        : r[m][i]
        ? (C(r, e, L(r, i)), M)
        : r[u]?.[t]
        ? (C(r, e, r[u][t]), M)
        : C)(r, e, l)
    }
  } else {
    var f = n.length,
      s = r[m].length
    for (let e = 0; e < f || e < s; e++)
      e < f && e < s ? M(r, e, n[e]) : e >= s ? C(r, e, n[e]) : L(r, s + f - 1 - e)
  }
}
function M(e, t, r) {
  var n = e[m][t]
  if ('text' !== n[p] && 'text' !== r[p] && n[h] === r[h]) {
    var o,
      i,
      l = n[y]
    for (o in r[v]) n[v][o] !== r[v][o] && S(l, o, r[v][o])
    for (i in n[v])
      if (!(i in r[v])) {
        a = u = s = f = void 0
        var f = l,
          s = i
        if (s.toLowerCase() in f.attributes) f.removeAttribute(s)
        else if (s in T) f.removeAttribute(T[s])
        else if (s in f) f[s] = 'string' == typeof f[s] ? '' : void 0
        else {
          var u = s[0],
            a = s.slice(1)
          if ('_' === u) f.removeAttribute(a)
          else {
            if ('$' !== u)
              throw new Error(`invalid prop '${s}' to unset from <${f.nodeName}>`)
            f.style.removeProperty(a)
          }
        }
      }
    ;['innerText', 'innerHTML', 'textContent'].some((e) => e in r[v]) || E(n, r[m])
    var c = P(r, n[y])
    e[m][t] = c
  } else L(e, t), C(e, t, r)
}
function C(e, t, r) {
  var n = e[y],
    r = r[y] ? r : A(r),
    o = r[y]
  n.insertBefore(o, n.childNodes.item(t)),
    e[m].splice(t, 0, r),
    e[u] && 'string' == typeof r[v].id && delete e[u][r[v].id]
}
function L(e, t) {
  t = e[m].splice(t, 1)[0]
  return t[y].remove(), e[u] && 'string' == typeof t[v].id && (e[u][t[v].id] = t), t
}
function R(e) {
  var t = e.map((e) => e[v].id).filter((e) => 'string' == typeof e)
  if (new Set(t).size !== t.length) throw new Error('duplicate children id: ' + t)
  return t.length === e.length ? t : null
}
function S(e, t, r) {
  if (![c, b].includes(t))
    if (
      (function e(t, r) {
        if (!(r in t)) return []
        let n = Object.getOwnPropertyDescriptor(t, r)
        if (n)
          return Object.entries(n)
            .map(([e, t]) => (t ? e : null))
            .filter((e) => e)
        let o = Object.getPrototypeOf(t)
        if (!o) return []
        return e(o, r)
      })(e, t).includes('set')
    )
      e[t] = r
    else {
      if ('string' != typeof r)
        throw new Error(`<${e.nodeName}> attr/style must be string: ${t} = ` + r)
      '$' === t[0]
        ? e.style.setProperty(t.slice(1), r)
        : '_' === t[0]
        ? e.setAttribute(t.slice(1), r)
        : e.setAttribute(t, r)
    }
}
let T = { defaultValue: 'value', htmlFor: 'for', className: 'class', __proto__: null }
export {
  d as VEl,
  g as deps,
  f as h,
  N as isReactive,
  t as mount,
  O as reactive,
  e as tags,
  k as watch,
}
