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
  // create an DOM element, tag name as the first parameter
  'div',
  // add element properties via the second parameter
  {
    id: 'container-id',
    class: 'container-class',
    style: 'padding: 4px;',
  },
  // add DOM children via the third parameter
  [
    // children can be a single node or string
    h('div', { style: 'margin: 4px' }, 'hyper-arrow demo'),
    // can also add id and classes here after the tag name
    h('input#input-id.input-class1.input-class2', {
      // arrow function makes the property dynamic/reactive
      value: () => model.input,
      // can combine dynamic classes with static classes
      // ('input-class1' and 'input-class2' above)
      class: () => (model.input ? 'class3' : 'class4'),
      // style can be an object instead of a string
      style: {
        margin: '4px',
        // again, arrow function for reactive style
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
      // can also add children here as a property if you like
      children: [h('span', 'all')],
      style: 'margin: 4px',
      onClick() {
        model.add()
      },
    }),
    h('button', {
      // children can be non-array if it only has one element
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
    // children can be arrow function, also reactive,
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
