import { CACHE_REMOVED_CHILDREN_AND_MAY_LEAK, mount, reactive, tags, } from '../../hyper-arrow.js';
const { div, button, ul, li } = tags.html;
const model = reactive({ list: ['0', '1'] });
const view = div(button({
    innerText: 'change',
    onClick() {
        const length = Math.floor(Math.random() * 10);
        model.list = Array.from({ length }, (_, i) => i.toString());
    },
}), ul({ id: 'list', [CACHE_REMOVED_CHILDREN_AND_MAY_LEAK]: true }, () => 
// in the dev tool you can see the `uid` attributes of `li` elements remain
// same during changing, showing `ul` is reusing old removed `li`s
model.list.map((item) => li({ id: () => item }, item.toString()))));
mount('#app', view);
