function c(e, t, n, r) {
  ;(this[W] = e), (this[A] = t), (this[E] = n), (this[O] = r)
}
function p(e) {
  return 'string' == typeof e ? [null, e, {}, [], S] : e
}
function e(t, e) {
  return (
    y([null, null, t, e]),
    () => {
      for (var e of j.keys()) e[2] === t && j.delete(e)
    }
  )
}
function y(e) {
  var t,
    n = e[2]
  return 'function' != typeof n ? n : ((t = T), (T = e), (e = n()), (T = t), e)
}
function o(e) {
  return e !== P(e) || G(e)
    ? e
    : new t(e, {
        get(e, t) {
          var n, r
          return (
            t === V ||
            ((n = x.get(e, t)),
            'function' == typeof e && 'prototype' === t
              ? n
              : (T &&
                  (h,
                  j.has(T) || j.set(T, new WeakMap()),
                  (r = j.get(T)) &&
                    (r.has(e) || r.set(e, new Set()), null != (r = r.get(e))) &&
                    r.add(t),
                  C.has(e) || C.set(e, P.create(null)),
                  (r = C.get(e))) &&
                  (t in r || (r[t] = new WeakSet()), r[t].add(T)),
                o(n)))
          )
        },
        set(e, t, n) {
          var r,
            o,
            l,
            i,
            f = x.get(e, t),
            u = x.set(e, t, n)
          if (f !== n || (M(e) && t === b))
            for (var [a, s] of j.entries())
              null != (s = s.get(e)) &&
                s.has(t) &&
                (([s, r, o, l] = a),
                (i = s),
                h,
                (a = y(a)),
                h,
                s
                  ? 'number' == typeof r ||
                    (null === r && ('string' == typeof a || a instanceof c))
                    ? ((s = null != r ? r : 0), v(i[O][s]), d(i, s, p(a)))
                    : null === r
                    ? (i[O].map(v), z(i, a.map(p)))
                    : g(i[N], r, a)
                  : null != l && l(a))
          return u
        },
        deleteProperty(e, t) {
          var n,
            r,
            o,
            l = x.deleteProperty(e, t)
          h
          for (o of j.values()) null != (n = o.get(e)) && n.delete(t)
          return null != (r = C.get(e)) && delete r[t], l
        },
      })
}
function v(e) {
  for (var t of j.keys())
    (n = t),
      (r = e),
      n[H] && r[N].contains(null == (r = n[H]) ? void 0 : r[N]) && j.delete(t)
  var n, r
}
function r(e, t, n = {}) {
  ;(q = n[J]), l(f.querySelector(e), [t])
}
function l(e, t) {
  if ((e.append(...t.map(i).map((e) => e[N])), h))
    for (var n of Array.from(e.children));
}
function i(e) {
  return (
    e[W] === S
      ? (e) => {
          var t = f.createTextNode(e[F])
          return h, a(e, t)
        }
      : (e) => {
          var t,
            n,
            r,
            o =
              'html' === e[W]
                ? f.createElement(e[A])
                : 'svg' === e[W]
                ? f.createElementNS('http://www.w3.org/2000/svg', e[A])
                : f.createElementNS('http://www.w3.org/1998/Math/MathML', e[A])
          for (r in (h, q && u(o, q, K++), e[E])) g(o, r, e[E][r])
          return h, l(o, e[O]), null != (n = (t = e[E])[D]) && n.call(t, o), a(e, o)
        }
  )(e)
}
function a(e, t) {
  return (
    (e[N] = t),
    e instanceof c &&
      'number' == typeof e[E][n] &&
      w(e[O]) &&
      ((e[$] = {}), (e[L] = 0)),
    (t[R] = e)
  )
}
function z(n, r) {
  var t = w(n[O]),
    o = w(r)
  if (t && o) {
    for (let e = t[b] - 1; 0 <= e; e--) o.includes(t[e]) || m(n, e)
    for (let [e, t] of o.entries()) {
      var l = n[O].findIndex((e) => e[E].id === t),
        i = r[e]
      ;(e === l
        ? d
        : n[O][l]
        ? (s(n, e, m(n, l)), d)
        : null != (l = n[$]) && l[t]
        ? (s(n, e, n[$][t]), d)
        : s)(n, e, i)
    }
  } else {
    var f = r[b],
      u = n[O][b]
    for (let e = 0; e < f || e < u; e++)
      e < f && e < u ? d(n, e, r[e]) : e >= u ? s(n, e, r[e]) : m(n, u + f - 1 - e)
  }
}
function d(e, t, n) {
  var r = e[O][t]
  if (r[W] !== S && n[W] !== S && r[A] === n[A]) {
    var o,
      l,
      i = r[N]
    for (o in n[E]) r[E][o] !== n[E][o] && g(i, o, n[E][o])
    for (l in r[E])
      if (!(l in n[E])) {
        var f = void 0,
          f = i,
          u = l
        let e
        if (B(u) in f.attributes) k(f, u), (e = '- attr')
        else if (u in Q) k(f, Q[u]), (e = '- attr')
        else if ('_' === u[0]) k(f, _(u)), (e = '- attr')
        else {
          if ('$' !== u[0])
            throw Error(`unknown prop '${u}' to unset from <${f.nodeName}>`)
          f.style.removeProperty(_(u)), (e = '-style')
        }
        h
      }
    ;['innerText', 'innerHTML', 'textContent'].some((e) => e in n[E]) || z(r, n[O]),
      (e[O][t] = a(n, r[N]))
  } else m(e, t), s(e, t, n)
}
function s(e, t, n) {
  var r = e[N],
    n = n[N] ? n : i(n),
    o = n[N]
  r.insertBefore(o, r.childNodes.item(t)),
    h,
    e[O].splice(t, 0, n),
    e[$] && e[L] && (delete e[$][n[E].id], e[L]--)
}
function m(e, t) {
  t = e[O].splice(t, 1)[0]
  return (
    t[N].remove(),
    h,
    e[$] &&
      null != e[L] &&
      null != e[E][n] &&
      e[L] < e[E][n] &&
      ((e[$][t[E].id] = t), e[L]++),
    t
  )
}
function w(e) {
  var t = e.map((e) => e[E].id).filter((e) => 'string' == typeof e)
  return t[b] === e[b] && t[b] === new Set(t).size ? t : null
}
function g(e, t, n) {
  !(function e(t, n) {
    var r
    return n in t
      ? (r = P.getOwnPropertyDescriptor(t, n))
        ? P.entries(r)
            .map(([e, t]) => (t ? e : null))
            .filter((e) => e)
        : (r = P.getPrototypeOf(t))
        ? e(r, n)
        : []
      : []
  })(e, t).includes('set')
    ? '$' === t[0]
      ? e.style.setProperty(_(t), n)
      : '_' === t[0]
      ? u(e, _(t), n)
      : u(e, t, n)
    : (e[t] = n),
    h
}
let h = !0,
  b = 'length',
  S = 'text',
  P = Object,
  t = Proxy,
  x = Reflect,
  f = document,
  M = Array.isArray,
  _ = (e) => e.slice(1),
  B = (e) => e.toLowerCase(),
  u = (e, t, n) => e.setAttribute(t, n),
  k = (e, t) => e.removeAttribute(t),
  D = Symbol(),
  n = Symbol(),
  N = 0,
  A = 1,
  F = 1,
  E = 2,
  O = 3,
  W = 4,
  $ = 5,
  L = 6,
  H = 0,
  T = null,
  j = new Map(),
  C = new WeakMap(),
  I = new t(
    {},
    {
      get: (e, n) =>
        new t(
          {},
          {
            get: (e, t) =>
              function (e, t, ...n) {
                var r,
                  o,
                  l = new c(e, t, P.create(null), []),
                  [i, e] =
                    'object' != typeof n[0] || M(n[0]) || n[0] instanceof c
                      ? [{}, n]
                      : [n[0], _(n)]
                for (r of P.getOwnPropertySymbols(i)) l[E][r] = i[r]
                for (o in i)
                  o.startsWith('on') ? (l[E][B(o)] = i[o]) : (l[E][o] = y([l, o, i[o]]))
                var f = y([
                  l,
                  null,
                  M(e) && 1 === e[b] && ('function' == typeof e[0] || M(e[0]))
                    ? e[0]
                    : e,
                ])
                if ('function' == typeof f || 'string' == typeof f || f instanceof c)
                  l[O].push(p(y([l, 0, f])))
                else for (var u in f) l[O].push(p(y([l, +u, f[u]])))
                return l
              }.bind(null, n, t),
          },
        ),
    },
  ),
  R = '__hyper_arrow__',
  V = Symbol(R),
  G = (e) => !!e[V],
  J = Symbol(),
  q,
  K = 0,
  Q = { defaultValue: 'value', htmlFor: 'for', className: 'class' }
export {
  n as CACHE_REMOVED_CHILDREN,
  D as ON_CREATE,
  J as UID_ATTR_NAME,
  c as VEl,
  j as fawc2ropa,
  G as isReactive,
  r as mount,
  o as reactive,
  C as ropa2fawc,
  I as tags,
  e as watch,
}
