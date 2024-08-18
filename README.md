# hyper-arrow (h=>)

super tiny front-end UI library, for learning purposes

- **ZERO** dependencies
- less than **100** lines of plain JavaScript (prettiered, without comments)
- less than **2KB** in size minified
- no building steps, easy use via `<script module="type">` tag in plain HTML
- proxy-based reactivity, like [`reactive()` in Vue 3](https://vuejs.org/api/reactivity-core.html#reactive) or [`makeAutoObservable()` in MobX](https://mobx.js.org/observable-state.html#makeautoobservable)
- `h` function like [`h()` in hyperscript](https://github.com/hyperhype/hyperscript) or [`h()` in Vue 3](https://vuejs.org/api/render-function.html#h) to build DOM tree, no templates or JSX
- `=>` arrow function within `h` provides reactivity in DOM

## Usage

```js
import { deps, h, isReactive, reactive, watch } from '../../index.js'

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

// create DOM tree with nested h() functions
const view = h(
  // create an DOM element, with tag as the first parameter
  'div',
  // add element properties through the second parameter
  {
    id: 'container-id',
    class: 'container-class',
    style: 'padding: 4px;',
  },
  // add DOM children through the third parameter
  [
    // children can be a single node or string
    h('div', { style: 'margin: 4px' }, 'hyper-arrow demo'),
    // can also add id and classes here after the tag name
    h('input#input-id.input-class1.input-class2', {
      // arrow function makes it dynamic and reactive
      value: () => model.input,
      // dynamic classes are combined with static classes
      // ('input-class1' and 'input-class2' above)
      class: () => (model.input ? 'class3' : 'class4'),
      // can also add style as an object instead of a string
      style: {
        margin: '4px',
        // again, arrow function for reactivity
        color: () => (model.input.length > 5 ? 'red' : 'black'),
      },
      // event listeners can modify reactive objects
      // and causing DOM updates
      onInput(event) {
        model.input = event.target.value
      },
      onKeydown(event) {
        if (event.code === 'Enter') model.add()
      },
    }),
    h('button', {
      // can also add children here if you like
      children: [h('span', 'all')],
      style: 'margin: 4px',
      onClick() {
        model.add()
      },
    }),
    h('button', {
      // children can be non-array if only has one child
      children: h('span', 'clear'),
      style: { margin: '4px' },
      onClick() {
        model.input = ''
      },
    }),
    h('button', {
      // single text node can be replaced by a string
      children: 'clear all',
      style: () => 'margin: 4px;',
      onClick() {
        model.clear()
      },
    }),
    // arrow function as children, also reactive,
    h('ul', () => model.list.map((item) => h('li', item))),
  ],
)

document.getElementById('app')?.append(view)

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

`reactive` and `watch` work mostly like Vue3's `reactive`, `watch` and `watchEffect`

See `src/examples` for more details of `h`, `reactive` and `watch` API.

## Super Tiny ^o^~~

`h`, `reactive` and `watch` all together add up to no more than 100 lines of plain JavaScript (prettiered, not including documentary comments) with NO extra code from external dependencies. After minification it reduces down to ~2KB in size (see `dist/index.js`).

Check `src/index.js` for how it works.
