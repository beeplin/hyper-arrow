import { deps, isReactive, mount, reactive, watch } from '../../core.js'
import { button, div, input, li, ul } from '../../full.js'

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
