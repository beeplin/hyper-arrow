let [y, v] = ['object', 'function'],
  [p, h, b, m, A, g, j] = [0, 1, 2, 3, 4, 5, 6],
  n = Symbol('brand'),
  x = (e, t) => typeof e === t,
  N = (e, t, r) => e[0] === t && e[1] === r,
  k = (e) => (Array.isArray(e) ? e : [e]),
  s = null,
  w = new Map()
function C(e, t, r, l) {
  if (!x(e, v)) return e
  s = { fn: e, at: t, el: r, x: l }
  t = e()
  return (s = null), t
}
function e(e, t, r) {
  var l,
    n,
    [e, ...s] = e.split('.'),
    [e, i] = e.replace(/\s/g, '').split('#'),
    f = s.join(' '),
    o = document.createElement(e || 'div')
  i && (o.id = i),
    f && (o.className = f),
    (s = t),
    (t =
      !x(s, y) || Array.isArray(s) || s instanceof Node
        ? { children: t }
        : { children: r, ...t })
  for ([l, n] of Object.entries(t))
    if (l.startsWith('on') && x(n, v)) o.addEventListener(l.toLowerCase().slice(2), n)
    else if ('class' === l) o.className = (f + ' ' + C(n, m, o, f)).trim()
    else if ('style' === l && x(n, y) && null !== n)
      for (var [a, c] of Object.entries(n)) o.style[a] = C(c, A, o, a)
    else if ('children' === l)
      for (var [u, d] of k(C(n ?? [], h, o)).entries()) o.append(C(d, b, o, u))
    else l in o ? (o[l] = C(n, g, o, l)) : o.setAttribute(l, C(n, j, o, l))
  return o
}
function t(t, e) {
  return (
    C(t, p, void 0, e),
    () => {
      for (var e of w.keys()) e.fn === t && w.delete(e)
    }
  )
}
function i(e) {
  return e !== Object(e) || e[n]
    ? e
    : new Proxy(e, {
        get(t, r) {
          var e, l
          return (
            r === n ||
            ((e = Reflect.get(t, r)),
            x(t, v) && 'prototype' === r
              ? e
              : (s &&
                  (w.has(s) || w.set(s, []),
                  (l = w.get(s))?.every((e) => !N(e, t, r))) &&
                  l.push([t, r]),
                i(e)))
          )
        },
        set(e, t, r) {
          var l,
            n,
            s,
            i,
            f,
            o = Reflect.get(e, t),
            a = Reflect.set(e, t, r)
          for ([{ fn: l, at: n, el: s, x: i }, f] of w.entries())
            for (var c of f)
              if ((c[0] === o && (c[0] = r), N(c, e, t)))
                if (n === m) s.className = (i + ' ' + l()).trim()
                else if (n === A) s.style[i] = l()
                else if (n === g) s[i] = l()
                else if (n === j) s.setAttribute(i, l())
                else if (n === h) {
                  for (var u of w.keys())
                    u.el && s !== u.el && s.contains(u.el) && w.delete(u)
                  s.replaceChildren(...k(l()))
                } else if (n === b) {
                  var d,
                    y = s.children[i]
                  for (d of w.keys())
                    d.el && (y === d.el || y.contains(d.el)) && w.delete(d)
                  s.replaceChild(l(), y)
                } else n === p && (i ? i(l()) : l())
          return a
        },
      })
}
var r = (e) => !!e[n]
export { w as deps, e as h, r as isReactive, i as reactive, t as watch }
