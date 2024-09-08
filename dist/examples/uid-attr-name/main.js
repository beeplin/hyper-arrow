import { mount, tags, UID_ATTR_NAME } from '../../hyper-arrow.js';
const { div } = tags.html;
const view = div(div('a'), div('b'), div(div('c'), div('d')), div('e'));
mount('#app', view, { [UID_ATTR_NAME]: 'uid' });
