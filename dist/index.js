let o=Symbol("brand"),l=document.createElement("a"),i=null,g=new Map;function r(e,t,r){var n=[e,Object.create(null),[],l];if("object"!=typeof t||Array.isArray(t))r=t;else for(var o in t)n[1][o]=o.startsWith("on")?t[o]:a(t[o],n,o);var i,f=a(r,n)??[];for(i in f)n[2].push(a(f[i],n,"#"+i));return n}var e=new Proxy({},{get:(e,t)=>r.bind(null,t)});function t(e,t){document.querySelector(e).append(d(t))}function n(t,e){return a(t,void 0,void 0,e),()=>{for(var e of g.keys())e[0]===t&&g.delete(e)}}function f(e){return e!==Object(e)||s(e)?e:new Proxy(e,{get(e,t){var r,n;return t===o||(r=Reflect.get(e,t),"function"==typeof e&&"prototype"===t?r:(i&&(g.has(i)||g.set(i,[]),(n=g.get(i)).some(e=>e[0]===e&&e[1]===t)||n.push([e,t])),f(r)))},set(e,t,r){var n=Reflect.get(e,t),o=Reflect.set(e,t,r);if(!Object.is(n,r)||"length"===t)for(var[i,f]of g.entries())for(var l of f)if(l[0]===n&&(l[0]=r),l[0]===e&&l[1]===t){var s,a,c,u,[l,y,p,d]=i,l=l();if(y)if(p)"#"===p[0]?(c=+p.slice(1),h(y[2][c]),w(y,c,l)):(u=a=s=c=void 0,s=p,a=l,[,c,,u]=c=y,c[s]!==a&&b(u,s,c[s]=a));else{for(var v of y[2])h(v);k(y,l)}else d&&d(l)}return o}})}let s=e=>!!e[o];function a(e,t,r,n){if("function"!=typeof e)return e;i=t?[e,t,r]:[e,,,n];t=e();return i=null,t}function h(e){for(var t of g.keys())!function t(e,r){if("string"==typeof e||void 0===r)return!1;if(e===r)return!0;let n=e[2].some(e=>t(e,r));return n}(e,t[1])||g.delete(t)}function d(e){return"string"==typeof e?document.createTextNode(e):v(e)}function v(e){var t,[r,n,o]=e,i=document.createElement(r);for(t in i.dataset.id=Math.random().toString().slice(2,5),i.append(...o.map(d)),n)b(i,t,n[t]);if(e[3]=i,n.cacheChildrenByKey&&m(o)){e[4]=new Map;for(var f of o)"string"!=typeof f&&e[4].set(f[1].key,f[3])}return i.__hyper_arrow__=e,i}function m(e){var t=e.filter(e=>"string"!=typeof e).filter(e=>"key"in e[1]).map(e=>e[1].key);if(new Set(t).size!==t.length)throw new Error("duplicate keys");return t.length===e.length?t:null}function k(t,r){var n=t[3];let o=m(r);var e=t[2].filter(e=>"string"!=typeof e),i=e.filter(e=>"key"in e[1]).map(e=>e[1].key);if(o&&i.length===t[2].length){t[2]=e.filter(e=>o.includes(e[1].key));for(var f of e)t[2].includes(f)||f[3].remove();var l,s,a,c,u=t[4];for([l,s]of r.entries())"string"!=typeof s&&"string"!=typeof t[2][l]&&(a=s[1].key,a===t[2][l]?.[1].key?w(t,l,s):(t[2].splice(l,0,s),c=u?.get(a)??v(s),s[3]=c,u&&!u.has(a)&&u.set(a,c),0===l?n.prepend(c):n.childNodes[l-1].after(c)))}else{var y=r.length,p=t[2].length;for(let e=0;e<y||e<p;e++)e<y&&e<p?w(t,e,r[e]):e>=p?n.append(d(r[e])):n.lastChild?.remove();t[2]=r}}function w(e,t,r){var n,o,i=e[2][t];if("string"!=typeof i&&"string"!=typeof r&&i[0]===r[0]){var f,[,l,,s]=i;let[,t,e]=r;for(f in r[3]=s,t)t[f]!==l[f]&&b(s,f,t[f]);for(let e in l)e in t||(n=s,"$"===(o=e)[0]?n.style[o.slice(1)]=null:"_"===o[0]||o.toLowerCase()in n.attributes?n.removeAttribute(o.replace(/^_/,"").toLowerCase()):n[o]=void 0);["innerText","innerHTML","textContent"].some(e=>e in t)||k(i,e)}else{var i=d(r),a=(e[3].replaceChild(i,e[3].childNodes[t]),e[4]);"string"!=typeof r&&a&&a.set(r[1].key,i)}e[2][t]=r}function b(e,t,r){"$"===(t="class"!==t&&"for"!==t?t:"_"+t)[0]?e.style[t.slice(1)]=r:"_"===t[0]?e.setAttribute(t.slice(1),r):t.startsWith("on")?e[t.toLowerCase()]=r:e[t]=r}export{g as deps,r as h,e as tags,t as mount,n as watch,f as reactive,s as isReactive};