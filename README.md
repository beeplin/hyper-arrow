# hyper-arrow

super tiny front-end UI library, for educational purposes

- **~4.5KB** minified
- **ZERO** dependencies
- No building steps, easy use via `<script module="type">` tag in plain HTML
- Proxy-based reactivity, like [`reactive` in Vue 3](https://vuejs.org/api/reactivity-core.html#reactive) or [`makeAutoObservable` in MobX](https://mobx.js.org/observable-state.html#makeautoobservable)
- No templates or JSX. Tag functions `div`, `button` and etc. work like [`h` in hyperscript](https://github.com/hyperhype/hyperscript) or [`h` in Vue 3](https://vuejs.org/api/render-function.html#h)
- `=>` arrow functions within tag functions provide reactivity (that's where the name comes ;))

## Get started

```js
import { mount, reactive, tags } from '../../hyper-arrow.js'

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

// design your view with nested HTML tag functions
const { button, div, input, li, ul } = tags.html

const view = div(
  // element properties in the first parameter
  {
    id: 'container-id',
    class: 'container-class',
    style: 'padding: 4px;',
  },
  // children in the rest parameters
  div({ style: 'margin: 4px' }, 'hyper-arrow demo'),
  input({
    // arrow functions make properties reactive
    value: () => model.input,
    class: () => (model.input ? 'class3' : 'class4'),
    // your can set inline styles here with prefix '$'
    $margin: '4px',
    // again, arrow function for reactive style
    $color: () => (model.input.length > 5 ? 'red' : 'black'),
    // event listeners with prefix 'on'
    onInput(event) {
      model.input = event.target.value
    },
    onKeydown(event) {
      if (event.code === 'Enter') model.add()
    },
  }),
  button(
    {
      style: 'margin: 4px',
      onClick() {
        model.add()
      },
    },
    'add',
  ),
  // can also using 'innerText' to set text as single child
  // just like `el.innerText = 'xxx'` in DOM API
  button({
    innerText: 'clear all',
    style: () => 'margin: 4px;',
    onClick() {
      model.clear()
    },
  }),
  // element properties can be omitted, if none exists
  ul(
    // children can also be an arrow function, also reactive
    () => model.list.map((item) => li(item)),
  ),
)

// mount your view to the page and go!
mount('#app', view)
```

See `src/examples` for more.

## Basic API

### `reactive(object)`

Create a reactive proxy for any `object`, and then it can be used in tag functions.

### `tags`

All HTML tag functions are in `tags.html`. `tags.svg` has SVG tag functions, and `tags.mathml` has MathML tag functions.

```js
import { mount, reactive, tags } from '../../hyper-arrow.js'

const { div, button } = tags.html
const { svg, circle } = tags.svg
const { math, mi, mn, mfrac } = tags.mathml

const model = reactive({ number: 10 })

// children can be an array, instead of being the rest paramaters
const view = div({ id: 'root' }, [
  button({
    innerText: 'increase',
    onClick() {
      model.number++
    },
  }),
  // if you have single-line props, then children as array formats better
  svg({ stroke: 'red', fill: 'lightyellow' }, [
    circle({ cx: '50', cy: '50', r: () => model.number.toString() }),
  ]),
  // same here, children in array
  math({ display: 'block' }, [
    // here children are not in array. writes easier and looks better
    mfrac(
      mi('x'),
      mn(() => model.number.toString()),
    ),
  ]),
])

mount('#app', view)
```

### `mount(element_selector, view)`

Mount the view onto DOM.

## Advanced API

### `ON_CREATE`

A unique symbol for creating special "oncreate" event handlers for DOM elements.

```js
import { mount, ON_CREATE, tags } from '../../hyper-arrow.js'

const { input } = tags.html

mount(
  '#app',
  input({
    value: 'hello world',
    // `el` is the created DOM element
    [ON_CREATE](el) {
      requestAnimationFrame(() => {
        el.focus()
        setTimeout(() => {
          el.select()
        }, 1000)
      })
    },
  }),
)
```

### `CACHE_REMOVED_CHILDREN_AND_MAY_LEAK`

A unique symbol to allow a DOM element to cache all it's removed children elements, so instead of recreating a new child, it can reuse the cached one when needed, if the child's `id` matches.

```js
import {
  CACHE_REMOVED_CHILDREN_AND_MAY_LEAK,
  mount,
  reactive,
  tags,
} from '../../hyper-arrow.js'

const { div, button, ul, li } = tags.html

const model = reactive({ list: ['0', '1'] })

const view = div(
  button({
    innerText: 'change',
    onClick() {
      const length = Math.floor(Math.random() * 10)
      model.list = Array.from({ length }, (_, i) => i.toString())
    },
  }),
  ul({ id: 'list', [CACHE_REMOVED_CHILDREN_AND_MAY_LEAK]: true }, () =>
    // in dev tool you can see the `uid` attributes of `li` elements remain
    // same during list changing, because `ul` is reusing old removed `li`s
    model.list.map((item) => li({ id: () => item }, item.toString())),
  ),
)

mount('#app', view)
```

NOTE: this may be leaking! Currently there is no cache invalidation mechanism provided, so if the parent element keeps alive forever and keeps removing more and more new children into cache, the removed children cannot be garbage collected.

### `isReactive(object)`

Check if an `object` is a reactive proxy.

### `watch(fn, [effectFn])`

Run `fn()` once, and whenever `fn`'s dependencies (all **reactive-object-property-access**, or **ROPA**s, happened within `fn`) change, automatically rerun `fn()`, or, if `effectFn` provided, run `effectFn(fn())`.

### `arrow2ropa`

`Map<ArrowFunctionWithContext, WeakMap<ReactiveObject, Set<PropertyKey>>>`. Internal dependency map. `arrow2ropa` stores all **ROPA**s for each arrow function, so when any **ROPA** changes, the coresponding arrow function reruns. `fn`s of `watch`s and arrow functions within tag functions all go into `arrow2ropa`.

You may never need to use `arrow2ropa` directly. Exposed only for debugging purposes.

### `ropa2arrow`

`WeakMap<ReactiveObject, Record<PropertyKey, WeakSet<ArrowFunctionWithContext>>>`. For each **ROPA**, `ropa2arrow` stores all arrow functions it would trigger.

`ropa2arrow` is also only for debugging purposes. It's collected but not even actually used in `hyper-arrow`'s own source code.
