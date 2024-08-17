# hyper-arrow (h=>)

super tiny front-end UI library, for learning purposes

- **ZERO** dependencies
- just **80+** lines of plain JavaScript (prettiered, comments purged)
- **~1.6KB** in size after minified
- no building steps
- easy use via `<script module="type">` tag in plain HTML
- proxy-based reactivity, same as [Vue](https://vuejs.org/api/reactivity-core.html#reactive)'s `reactive` API
- `h` function as in [hyperscript](https://github.com/hyperhype/hyperscript), no templates or JSX
- `=>` arrow function within `h` becomes reactive parts in DOM three

## Basic Usage

```js
import { h, isReactive, reactive, watch } from 'hyper-arrow'

function render(r) {
  // building DOM tree with nested `h` function
  return h(
    // can add static id and classes here after tag name
    'div#id.class1.class2',
    // DOM element properties and attributes
    {
      id: 'id',
      // arrow function means dynamic and reactive parts in DOM tree
      style: { color: () => r.prop2.deepProp },
      // static classes above and dynamic classes here are combined
      class: () => (r.prop1 === 1 ? 'class3' : 'class4'),
    },
    [
      h('input.class4', {
        // reactive property, again
        value: () => r.prop3,
        // event listeners can modify reactive proxies and causing DOM updates
        onInput(event) {
          r.prop3 = event.target.value
        },
      }),
    ],
  )
}

// make the target object reactive
const reactiveProxy = reactive(target)
console.log(isReactive(reactiveProxy)) // true

// create reactive DOM tree
const el = render(reactiveProxy)
document.getElementById('app')?.append(el)

// auto rerun effets whenever reactiveProxy.prop changes
watch(() => console.log(reactiveProxy.prop3))

// print prop1 and prop1 whenever prop3 changes
const stop = watch(
  () => reactiveProxy.prop3,
  () => console.log(reactiveProxy.prop1, reactiveProxy.prop2),
)
```

`reactive` and `watch` work mostly like Vue3's `reactive`, `watch` and `watchEffect`

See `src/examples` for more details of `h`, `reactive` and `watch` API.

## Super Tiny ^o^~~

`h`, `reactive` and `watch` all together add up to no more than 80 lines of plain JavaScript (prettiered, not including documentary comments). And it has NO dependencies. After minification it reduces down to ~1.6KB of code (see `disr/index.js`).

Check `src/index.js` to see how it works.
