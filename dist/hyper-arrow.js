function c(e, t, n, r) {
  ;(this[$] = e), (this[E] = t), (this[O] = n), (this[W] = r)
}
function p(e) {
  return 'string' == typeof e ? [null, e, {}, [], S] : e
}
function e(e, t, n = {}) {
  ;(z = n[G]), l(u.querySelector(e), [t])
}
function l(e, t) {
  if ((e.append(...t.map(i).map((e) => e[A])), h))
    for (var n of Array.from(e.children));
}
function i(e) {
  return (
    e[$] === S
      ? (e) => {
          var t = u.createTextNode(e[o])
          return h, a(e, t)
        }
      : (e) => {
          var t,
            n,
            r,
            o =
              'html' === e[$]
                ? u.createElement(e[E])
                : 'svg' === e[$]
                ? u.createElementNS('http://www.w3.org/2000/svg', e[E])
                : u.createElementNS('http://www.w3.org/1998/Math/MathML', e[E])
          for (r in (h, z && k(o, z, J++), e[O])) g(o, r, e[O][r])
          return h, l(o, e[W]), null != (n = (t = e[O])[V]) && n.call(t, o), a(e, o)
        }
  )(e)
}
function a(e, t) {
  return (
    (e[A] = t),
    e instanceof c &&
      'number' == typeof e[O][n] &&
      w(e[W]) &&
      ((e[L] = {}), (e[T] = 0)),
    (t[H] = e)
  )
}
function r(t, e) {
  return (
    y([null, null, t, e]),
    () => {
      for (var e of C.keys()) e[2] === t && C.delete(e)
    }
  )
}
function y(e) {
  var t,
    n = e[2]
  return 'function' != typeof n ? n : ((t = j), (j = e), (e = n()), (j = t), e)
}
function f(e) {
  return e !== P(e) || R(e)
    ? e
    : new t(e, {
        get(e, t) {
          var n, r, o, l, i
          return (
            t === I ||
            ((n = x.get(e, t)),
            'function' == typeof e && 'prototype' === t
              ? n
              : (j &&
                  (h && ([r, o, l] = j),
                  C.has(j) || C.set(j, new WeakMap()),
                  (i = C.get(j)) &&
                    (i.has(e) || i.set(e, new Set()), null != (i = i.get(e))) &&
                    i.add(t),
                  q.has(e) || q.set(e, P.create(null)),
                  (i = q.get(e))) &&
                  (t in i || (i[t] = new WeakSet()), i[t].add(j)),
                f(n)))
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
            for (var [a, s] of C.entries())
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
                    ? ((s = null != r ? r : 0), v(i[W][s]), d(i, s, p(a)))
                    : null === r
                    ? (i[W].map(v), B(i, a.map(p)))
                    : g(i[A], r, a)
                  : null != l && l(a))
          return u
        },
        deleteProperty(e, t) {
          var n,
            r,
            o,
            l = x.deleteProperty(e, t)
          h
          for (o of C.values()) null != (n = o.get(e)) && n.delete(t)
          return null != (r = q.get(e)) && delete r[t], l
        },
      })
}
function v(e) {
  for (var t of C.keys())
    (n = t),
      (r = e),
      n[F] && r[A].contains(null == (r = n[F]) ? void 0 : r[A]) && C.delete(t)
  var n, r
}
function B(n, r) {
  var t = w(n[W]),
    o = w(r)
  if (t && o) {
    for (let e = t[b] - 1; 0 <= e; e--) o.includes(t[e]) || m(n, e)
    for (let [e, t] of o.entries()) {
      var l = n[W].findIndex((e) => e[O].id === t),
        i = r[e]
      ;(e === l
        ? d
        : n[W][l]
        ? (s(n, e, m(n, l)), d)
        : null != (l = n[L]) && l[t]
        ? (s(n, e, n[L][t]), d)
        : s)(n, e, i)
    }
  } else {
    var f = r[b],
      u = n[W][b]
    for (let e = 0; e < f || e < u; e++)
      e < f && e < u ? d(n, e, r[e]) : e >= u ? s(n, e, r[e]) : m(n, u + f - 1 - e)
  }
}
function d(e, t, n) {
  var r = e[W][t]
  if (r[$] !== S && n[$] !== S && r[E] === n[E]) {
    var o,
      l,
      i = r[A]
    for (o in n[O]) r[O][o] !== n[O][o] && g(i, o, n[O][o])
    for (l in r[O])
      if (!(l in n[O])) {
        var f = void 0,
          f = i,
          u = l
        let e
        if (D(u) in f.attributes) N(f, u), (e = '- attr')
        else if (u in K) N(f, K[u]), (e = '- attr')
        else if ('_' === u[0]) N(f, _(u)), (e = '- attr')
        else {
          if ('$' !== u[0])
            throw Error(`unknown prop '${u}' to unset from <${f.nodeName}>`)
          f.style.removeProperty(_(u)), (e = '-style')
        }
        h
      }
    ;['innerText', 'innerHTML', 'textContent'].some((e) => e in n[O]) || B(r, n[W]),
      (e[W][t] = a(n, r[A]))
  } else m(e, t), s(e, t, n)
}
function s(e, t, n) {
  var r = e[A],
    n = n[A] ? n : i(n),
    o = n[A]
  r.insertBefore(o, r.childNodes.item(t)),
    h,
    e[W].splice(t, 0, n),
    e[L] && e[T] && (delete e[L][n[O].id], e[T]--)
}
function m(e, t) {
  t = e[W].splice(t, 1)[0]
  return (
    t[A].remove(),
    h,
    e[L] &&
      null != e[T] &&
      null != e[O][n] &&
      e[T] < e[O][n] &&
      ((e[L][t[O].id] = t), e[T]++),
    t
  )
}
function w(e) {
  var t = e.map((e) => e[O].id).filter((e) => 'string' == typeof e)
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
      ? k(e, _(t), n)
      : k(e, t, n)
    : (e[t] = n),
    h
}
let h = !0,
  b = 'length',
  S = 'text',
  P = Object,
  t = Proxy,
  x = Reflect,
  u = document,
  M = Array.isArray,
  _ = (e) => e.slice(1),
  D = (e) => e.toLowerCase(),
  k = (e, t, n) => e.setAttribute(t, n),
  N = (e, t) => e.removeAttribute(t),
  A = 0,
  E = 1,
  o = 1,
  O = 2,
  W = 3,
  $ = 4,
  L = 5,
  T = 6,
  F = 0,
  j = null,
  C = new Map(),
  q = new WeakMap(),
  H = '__hyper_arrow__',
  I = Symbol(H),
  R = (e) => !!e[I],
  V = Symbol(),
  n = Symbol(),
  G = Symbol(),
  z,
  J = 0,
  K = { defaultValue: 'value', htmlFor: 'for', className: 'class' },
  Q = new t(
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
                for (r of P.getOwnPropertySymbols(i)) l[O][r] = i[r]
                for (o in i)
                  o.startsWith('on') ? (l[O][D(o)] = i[o]) : (l[O][o] = y([l, o, i[o]]))
                var f = y([
                  l,
                  null,
                  M(e) && 1 === e[b] && ('function' == typeof e[0] || M(e[0]))
                    ? e[0]
                    : e,
                ])
                if ('function' == typeof f || 'string' == typeof f || f instanceof c)
                  l[W].push(p(y([l, 0, f])))
                else for (var u in f) l[W].push(p(y([l, +u, f[u]])))
                return l
              }.bind(null, n, t),
          },
        ),
    },
  )
export {
  n as CACHE_REMOVED_CHILDREN,
  V as ON_CREATE,
  G as UID_ATTR_NAME,
  c as VEl,
  C as fawc2ropa,
  R as isReactive,
  e as mount,
  f as reactive,
  q as ropa2fawc,
  Q as tags,
  r as watch,
}
