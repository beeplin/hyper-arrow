// @ts-nocheck
import { mount, reactive, tags } from '../../hyper-arrow.js';
class Model {
    constructor() {
        this.input = '';
        this.list = [];
    }
    add() {
        this.list.push(this.input);
        this.input = '';
    }
    clear() {
        this.list = [];
    }
}
// create a reactive object
const model = reactive(new Model());
// design your view with nested HTML tag functions
const { button, div, input, li, ul } = tags.html;
const view = div(
// element properties in the first parameter
{
    id: 'container-id',
    class: 'container-class',
    style: 'padding: 4px;',
}, 
// children in the rest parameters
div({ style: 'margin: 4px' }, 'hyper-arrow demo'), input({
    // arrow functions make properties reactive
    value: () => model.input,
    class: () => (model.input ? 'class3' : 'class4'),
    // your can set inline styles here with prefix '$'
    $margin: '4px',
    // again, arrow function for reactive style
    $color: () => (model.input.length > 5 ? 'red' : 'black'),
    // event listeners with prefix 'on'
    onInput(event) {
        model.input = event.target.value;
    },
    onKeydown(event) {
        if (event.code === 'Enter')
            model.add();
    },
}), button({
    style: 'margin: 4px',
    onClick() {
        model.add();
    },
}, 'add'), 
// can also using 'innerText' to set text as single child
// just like `el.innerText = 'xxx'` in DOM API
button({
    innerText: 'clear all',
    style: () => 'margin: 4px;',
    onClick() {
        model.clear();
    },
}), 
// element properties can be omitted, if none exists
ul(
// children can also be an arrow function, also reactive
() => model.list.map((item) => li(item))));
// mount your view to the page and go!
mount('#app', view);
