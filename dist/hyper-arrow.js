function c(e,t,n,r){this[$]=e,this[E]=t,this[O]=n,this[W]=r}function p(e){return"string"==typeof e?[null,e,{},[],S]:e}function e(e,t,n={}){q=n[R],h,h,l(f.querySelector(e),[t]),h}function n(t,e){return y([null,null,t,e]),()=>{for(var e of j.keys())e[2]===t&&j.delete(e)}}function y(e){var t,n=e[2];return"function"!=typeof n?n:(t=T,T=e,e=n(),T=t,e)}function o(e){return e!==P(e)||J(e)?e:new t(e,{get(e,t){var n,r;return t===G||(n=k.get(e,t),"function"==typeof e&&"prototype"===t?n:(T&&(h,j.has(T)||j.set(T,new WeakMap),(r=j.get(T))&&(r.has(e)||r.set(e,new Set),null!=(r=r.get(e)))&&r.add(t),C.has(e)||C.set(e,P.create(null)),r=C.get(e))&&(t in r||(r[t]=new WeakSet),r[t].add(T)),o(n)))},set(e,t,n){var r,o,l,i,f=k.get(e,t),u=k.set(e,t,n);if(f!==n||x(e)&&t===b)for(var[a,s]of j.entries())null!=(s=s.get(e))&&s.has(t)&&(h,[s,r,o,l]=a,i=s,a=y(a),h,s?"number"==typeof r||null===r&&("string"==typeof a||a instanceof c)?(s=null!=r?r:0,z(i[W][s]),d(i,s,p(a))):null===r?(i[W].map(z),v(i,a.map(p))):w(i[N],r,a):null!=l&&l(a));return u},deleteProperty(e,t){var n,r,o,l=k.deleteProperty(e,t);h;for(o of j.values())null!=(n=o.get(e))&&n.delete(t);return null!=(r=C.get(e))&&delete r[t],l}})}function l(e,t){if(e.append(...t.map(i).map(e=>e[N])),h)for(var n of Array.from(e.children));}function i(e){return(e[$]===S?e=>{var t=f.createTextNode(e[D]);return h,s(e,t)}:e=>{var t,n,r,o="html"===e[$]?f.createElement(e[E]):"svg"===e[$]?f.createElementNS("http://www.w3.org/2000/svg",e[E]):f.createElementNS("http://www.w3.org/1998/Math/MathML",e[E]);for(r in h,q&&u(o,q,V++),e[O])w(o,r,e[O][r]);return h,l(o,e[W]),null!=(n=(t=e[O])[B])&&n.call(t,o),s(e,o)})(e)}function s(e,t){return e[N]=t,e instanceof c&&"number"==typeof e[O][r]&&a(e[W])&&(e[L]={}),t[Z]=e}function v(n,r){var t=a(n[W]),o=a(r);if(t&&o){for(let e=t[b]-1;0<=e;e--)o.includes(t[e])||g(n,e);for(let[e,t]of o.entries()){var l=n[W].findIndex(e=>e[O].id===t),i=r[e];(e===l?d:n[W][l]?(m(n,e,g(n,l)),d):null!=(l=n[L])&&l[t]?(m(n,e,n[L][t]),d):m)(n,e,i)}}else{var f=r[b],u=n[W][b];for(let e=0;e<f||e<u;e++)e<f&&e<u?d(n,e,r[e]):e>=u?m(n,e,r[e]):g(n,u+f-1-e)}}function d(e,t,n){var r=e[W][t];if(r[$]!==S&&n[$]!==S&&r[E]===n[E]){var o,l,i=r[N];for(o in n[O])r[O][o]!==n[O][o]&&w(i,o,n[O][o]);for(l in r[O])if(!(l in n[O])){var f=void 0,f=i,u=l,a=_(u);if(a in f.attributes)A(f,a);else{a=[...u].reduce((e,t)=>"A"<=t&&t<="Z"?e+"-"+_(t):e+t,"");if(a in f.attributes)A(f,a);else if(u in K){a=K[u];A(f,a)}else if("_"===u[0]){a=M(u);A(f,a)}else{if("$"!==u[0])throw Error(`unknown prop '${u}' to unset from <${f.nodeName}>`);a=M(u);f.style.removeProperty(a)}}h}["innerText","innerHTML","textContent"].some(e=>e in n[O])||v(r,n[W]),e[W][t]=s(n,r[N])}else g(e,t),m(e,t,n)}function m(e,t,n){var r=e[N],n=n[N]?n:i(n),o=n[N];r.insertBefore(o,r.childNodes.item(t)),h,e[W].splice(t,0,n),e[L]&&(o=n[O].id,h&&0 in e[L],delete e[L][o])}function g(e,t){var n,t=e[W].splice(t,1)[0];return t[N].remove(),h,e[L]&&null!=e[O][r]&&P.keys(e[L]).length<e[O][r]&&(n=t[O].id,h&&0 in t[O],e[L][n]=t),t}function w(e,t,n){!function e(t,n){var r;return n in t?(r=P.getOwnPropertyDescriptor(t,n))?P.entries(r).map(([e,t])=>t?e:null).filter(e=>e):(r=P.getPrototypeOf(t))?e(r,n):[]:[]}(e,t).includes("set")?"$"===t[0]?e.style.setProperty(M(t),n):"_"===t[0]?u(e,M(t),n):u(e,t,n):e[t]=n,h}function a(e){var t=e.map(e=>e[O].id).filter(e=>"string"==typeof e);return t[b]===e[b]&&t[b]===new Set(t).size?t:null}function z(e){for(var t of j.keys())n=t,r=e,n[F]&&r[N].contains(null==(r=n[F])?void 0:r[N])&&j.delete(t);var n,r}let h=!0,b="length",S="text",P=Object,t=Proxy,k=Reflect,f=document,x=Array.isArray,M=e=>e.slice(1),_=e=>e.toLowerCase(),u=(e,t,n)=>e.setAttribute(t,n),A=(e,t)=>e.removeAttribute(t),B=Symbol(),r=Symbol(),N=0,E=1,D=1,O=2,W=3,$=4,L=5,F=0,T=null,j=new Map,C=new WeakMap,H=new t({},{get:(e,n)=>new t({},{get:(e,t)=>function(e,t,...n){h&&(I=I&&!1);var r,o,l=new c(e,t,P.create(null),[]),[i,e]="object"!=typeof n[0]||x(n[0])||n[0]instanceof c?[{},n]:[n[0],M(n)];for(r of P.getOwnPropertySymbols(i))l[O][r]=i[r];for(o in i)o.startsWith("on")?l[O][_(o)]=i[o]:l[O][o]=y([l,o,i[o]]);var f=y([l,null,x(e)&&1===e[b]&&("function"==typeof e[0]||x(e[0]))?e[0]:e]);if("function"==typeof f||"string"==typeof f||f instanceof c)l[W].push(p(y([l,0,f])));else for(var u in f)l[W].push(p(y([l,+u,f[u]])));return l}.bind(null,n,t)})}),I=!0,R=Symbol(),q,V=0,Z="__hyper_arrow__",G=Symbol(Z),J=e=>!!e[G],K={defaultValue:"value",htmlFor:"for",className:"class"};export{B as ON_CREATE,r as CACHE_REMOVED_CHILDREN,c as VEl,j as fawc2ropas,C as ropa2fawcs,H as tags,R as UID_ATTR_NAME,e as mount,n as watch,J as isReactive,o as reactive};