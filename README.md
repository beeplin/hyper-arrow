# hyper-arrow

[中文版](./README.zh-CN.md)

super tiny front-end UI library, for educational purposes

- **~4.5KB** minified
- **ZERO** dependencies
- No building steps, easy use via `<script module="type">` tag in plain HTML
- Proxy-based reactivity, like [`reactive` in Vue 3](https://vuejs.org/api/reactivity-core.html#reactive) or [`makeAutoObservable` in MobX](https://mobx.js.org/observable-state.html#makeautoobservable)
- No templates or JSX. Tag functions `div`, `button` and etc. work like [`h` in hyperscript](https://github.com/hyperhype/hyperscript) or [`h` in Vue 3](https://vuejs.org/api/render-function.html#h)
- `=>` arrow functions within tag functions provide reactivity, which is how the name comes ;)
- Smart and performant element children inserting, removing, swapping and updating, if all children has unique `id` attributes

## Get started

```js
// @ts-nocheck
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
    type: 'text',
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
      type: 'button',
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
    type: 'button',
    innerText: 'clear all',
    style: () => 'margin: 4px;',
    onClick() {
      model.clear()
    },
  }),
  // the first element properties can be omitted, if none exists
  ul(
    // children can also be an arrow function, also reactive
    () => model.list.map((item) => li(item)),
  ),
)

// mount your view to the page and go!
mount('#app', view)

model.input = 'aaa'
model.add()
model.input = 'bbb'
model.add()
```

It will create the following DOM tree with proper dynamic behaviors:

```html
<div id="container-id" class="container-class" style="padding: 4px;">
  <div style="margin: 4px;">hyper-arrow demo</div>
  <input type="text" class="class4" style="margin: 4px; color: black;" />
  <button type="button" style="margin: 4px;">add</button>
  <button type="button" style="margin: 4px;">clear all</button>
  <ul>
    <li>aaa</li>
    <li>bbb</li>
  </ul>
</div>
```

See `src/examples` for more.

## Basic API

### `reactive(object)`

Create a reactive proxy for any `object`, and then it can be used in tag functions.

### `tags`

All HTML tag functions are in `tags.html`. `tags.svg` contains SVG tag functions, and `tags.mathml` contains MathML tag functions.

```js
import { mount, reactive, tags } from '../../hyper-arrow.js'

const { div, button } = tags.html
const { svg, circle } = tags.svg
const { math, mi, mn, mfrac } = tags.mathml

const model = reactive({ number: 10 })

// children can be an array, instead of being the rest parameters
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

It generates the DOM tree:

```html
<div id="root">
  <button>increase</button>
  <svg stroke="red" fill="lightyellow">
    <circle cx="50" cy="50" r="10"></circle>
  </svg>
  <math display="block">
    <mfrac><mi>x</mi><mn>10</mn></mfrac>
  </math>
</div>
```

### `mount(element_selector, view, [options])`

Mount the view onto DOM. Examples already shown above. See below for details of optional `options`

## Advanced API

### `UID_ATTR_NAME`

`mount` can accept an optional third parameter `options` for extra configuration.

`[UID_ATTR_NAME]` is a unique symbol key in `mount`'s `options`. It adds unique HTML attributes to all DOM elements created by `mount` in order to identify themselves.

```js
import { mount, tags, UID_ATTR_NAME } from '../../hyper-arrow.js'

const { div } = tags.html

const view = div(div('a'), div('b'), div(div('c'), div('d')), div('e'))

mount('#app', view, { [UID_ATTR_NAME]: 'uid' })
```

will generate:

```html
<div uid="0">
  <div uid="1">a</div>
  <div uid="2">b</div>
  <div uid="3">
    <div uid="4">c</div>
    <div uid="5">d</div>
  </div>
  <div uid="6">e</div>
</div>
```

This is useful, for example, when checking if the parent element, when doing smart children updating or caching, is reusing elements correctly instead of recreating new ones (see below).

### `CACHE_REMOVED_CHILDREN`

A unique symbol key that allows allow a parent DOM element to cache it's removed children elements, so instead of creating new children, it can reuse the cached ones when needed, as long as the children's `id` attributes match.

```js
import {
  CACHE_REMOVED_CHILDREN,
  mount,
  reactive,
  tags,
  UID_ATTR_NAME,
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
  // allows cache, with 100 as max cache size
  ul({ id: 'list', [CACHE_REMOVED_CHILDREN]: 100 }, () =>
    model.list.map((item) => li({ id: () => item }, item.toString())),
  ),
)

mount('#app', view, { [UID_ATTR_NAME]: 'uid' })
```

In the dev tool you can see that, when the list changes, the `uid` attributes of `li` elements remain the same. That shows `ul` is reusing old removed `li`s.

### `ON_CREATE`

A unique symbol key to create a special "onCreate" event handler on a DOM element.

```js
import { mount, ON_CREATE, tags } from '../../hyper-arrow.js'

const { input } = tags.html

mount(
  '#app',
  input({
    value: 'hello world',
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

The created DOM element, `el`, is passed into the event handler function.

### `isReactive(object)`

Check if an `object` is a reactive proxy.

### `watch(fn, [effectFn])`

Run `fn()` once, and whenever `fn`'s dependencies (see below) change, automatically rerun `fn()`, or, if `effectFn` provided, run `effectFn(fn())`.

### `fac2opas`

`Map<FunctionAndContext, WeakMap<Object, Set<Property>>>`. For each **function-and-context** (**FAC**), `fac2opas` stores all the **object-property-access**es (**OPA**s) appearing within the function call. When any **OPA** changes, the corresponding function of the **FAC** reruns, and with the help of its contextual info, updates the correct position of the DOM as its new returned value. `fn`s of `watch`s also go into `fac2opas`.

Keep in mind that your **FAC**s' returned value must rely only on reactive **OPA**s (like `o.p` or `o[p]`) within the **FAC**, not on any other things like non-reactive object, free variable bindings (like `let x = 1` inside the function), or global/closure variables.

## Reactive Implementation Details

The reactive system is one of hyper-arrow's core features. Let's dive into how it works.

### Basic Concepts

In hyper-arrow, there are three ways to define reactive properties:

```javascript
const model = reactive({
  count: 0,
  text: 'hello',
})

const view = div(
  // 1. Arrow function (recommended)
  { textContent: () => model.text },

  // 2. Regular function
  {
    textContent: function () {
      return model.text
    },
  },

  // 3. Method shorthand
  {
    textContent() {
      return model.text
    },
  },
)
```

### Why Functions?

The reactive system works through following steps:

1. **Dependency Collection**

Simplified implementation:

```javascript
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      // When executing a function, record which OPA it depends on
      if (currentFac) {
        trackDependency(currentFac, target, key)
      }
      return target[key]
    },
  })
}
```

2. **Function Execution**

```javascript
function runFac(fac) {
  const fn = fac[2] // Get function
  currentFac = fac // Mark currently executing function
  const result = fn() // Execute function, trigger proxy.get, collect dependencies
  currentFac = null
  return result
}
```

3. **Update Triggering**

When reactive object property changes:

- System finds all functions depending on this property
- Reruns these functions
- Updates DOM with new return values

### Dependency Tracking Mechanism

hyper-arrow uses the following data structure to track dependencies:

```typescript
// Store each function's dependencies
export const fac2opas = new Map<Fac, WeakMap<object, Set<property>>>()
```

#### Dependency Collection Process

1. Set `currentFac` when executing reactive function
2. Accessing reactive property during function execution triggers Proxy's get interceptor
3. Get interceptor records dependency between current function and accessed property

#### Update Process

1. Modifying reactive object property triggers Proxy's set interceptor
2. Look up all functions depending on this property
3. Rerun these functions
4. Update corresponding DOM elements

### Why Arrow Functions Recommended?

1. **Conciseness**: More concise syntax, easier to read
2. **this binding**: Avoids this binding issues
3. **Design intent**: Clearly expresses this is a reactive property

### Practical Example

```javascript
import { reactive, div, mount } from 'hyper-arrow'

// Create reactive data
const model = reactive({
  count: 0,
  message: 'Hello',
})

// Create view
const view = div({
  class: () => (model.count > 0 ? 'active' : ''),
  textContent: () => `${model.message} (${model.count})`,
})

// Mount to DOM
mount('#app', view)

// Data changes automatically trigger view updates
model.count++
model.message = 'Hi'
```

### Summary

1. Any form of function can be used for reactive properties
2. Arrow functions are recommended but not required
3. Core of reactive system is dependency collection and automatic updates
4. Functions are used to track property access and rerun when needed
