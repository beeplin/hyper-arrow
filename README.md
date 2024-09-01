# hyper-arrow (h=>)

super tiny front-end UI library, for learning purposes

- **ZERO** dependencies
- less than **3KB** in size minified
- no building steps, easy use via `<script module="type">` tag in plain HTML
- proxy-based reactivity, like [`reactive()` in Vue 3](https://vuejs.org/api/reactivity-core.html#reactive) or [`makeAutoObservable()` in MobX](https://mobx.js.org/observable-state.html#makeautoobservable)
- `h` function like [`h()` in hyperscript](https://github.com/hyperhype/hyperscript) or [`h()` in Vue 3](https://vuejs.org/api/render-function.html#h) to build DOM tree, no templates or JSX
- `=>` arrow function within `h` provides reactivity in DOM
- more conveneint tag functions like `div()` and `button()` instead of `h()`

## Usage

```js
import { deps, isReactive, mount, reactive, tags, watch } from '../../index.js'

const { button, div, input, li, ul } = tags

class Model {
  input = ''
  list = []
  add() {
    this.list.push(this.input)
    this.input = ''
  }
  clear() {
    this.list = []
  }
}
// create a reactive object
const model = reactive(new Model())

// check if it is reactive
console.log(isReactive(model)) // true

// create DOM tree with nested tag functions
const view = div(
  // element properties as the first parameter
  {
    id: 'container-id',
    class: 'container-class',
    style: 'padding: 4px;',
  },
  // DOM children as the second parameter
  [
    div({ style: 'margin: 4px' }, ['hyper-arrow demo']),
    // can also add id and classes here after the tag name
    input({
      // arrow function makes the property reactive
      value: () => model.input,
      class: () => (model.input ? 'class3' : 'class4'),
      // can also set individual inline style here, with prefix '$'
      $margin: '4px',
      // again, arrow function for reactive style
      $color: () => (model.input.length > 5 ? 'red' : 'black'),
      // event listeners (with prefix 'on') can modify reactive objects
      // and causing DOM updates
      onInput(event) {
        model.input = event.target.value
      },
      onKeydown(event) {
        if (event.code === 'Enter') model.add()
      },
    }),
    button({
      innerText: 'add',
      style: 'margin: 4px',
      onClick() {
        model.add()
      },
    }),
    button({
      innerText: 'clear',
      $margin: '4px',
      onClick() {
        model.input = ''
      },
    }),
    button({
      innerText: 'clear all',
      style: () => 'margin: 4px;',
      onClick() {
        model.clear()
      },
    }),
    // element properties can be omitted, if none exists
    // children can be an arrow function, also reactive,
    ul(() => model.list.map((item) => li([item]))),
  ],
)

mount('#app', view)

// auto print whenever model.input changes
watch(() => console.log('input:', model.input))

// auto print input and list whenever list's length changes
const stop = watch(
  () => model.list.length,
  () => console.log('input & list:', model.input, model.list),
)

setTimeout(() => {
  //   stop this auto watch
  stop()
}, 30000)

// check dependencies as a Map from context to getters
console.log(deps)
```

`reactive()` and `watch()` work mostly like Vue3's `reactive()`, `watch()` or `watchEffect()`

See `src/examples` for more details of `h`, `tags`, `reactive` and `watch` API.

## Super Tiny ^o^~~

`h`, `tags`, `reactive` and `watch` reduces down to ~3KB in size
after minification, with NO extra code from external dependencies. (see `dist/index.js`).

Check `src/core.js` for how it works.
