# hyper-arrow (h=>)

super tiny front-end UI library, for learning purposes

- **ZERO** dependencies
- less than **100** lines of plain JavaScript (prettiered, without comments)
- less than **2KB** in size minified
- no building steps, easy use via `<script module="type">` tag in plain HTML
- proxy-based reactivity, like [`reactive()` in Vue 3](https://vuejs.org/api/reactivity-core.html#reactive) or [`makeAutoObservable()` in MobX](https://mobx.js.org/observable-state.html#makeautoobservable)
- `h` function like [`h()` in hyperscript](https://github.com/hyperhype/hyperscript) or [h`()` in Vue 3](https://vuejs.org/api/render-function.html#h) to build DOM tree, no templates or JSX
- `=>` arrow function within `h` provides reactivity in DOM

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

`h`, `reactive` and `watch` all together add up to no more than 100 lines of plain JavaScript (prettiered, not including documentary comments) with NO extra code from external dependencies. After minification it reduces down to ~2KB in size (see `dist/index.js`).

Check `src/index.js` for how it works.
