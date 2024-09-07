import { mount, reactive, tags } from '../../hyper-arrow.js';
const { div, button } = tags.html;
const { svg, circle } = tags.svg;
const { math, mi, mn, mfrac } = tags.mathml;
const model = reactive({ number: 10 });
// children can be in array
const view = div({ id: 'root' }, [
    button({
        innerText: 'increase',
        onClick() {
            model.number++;
        },
    }),
    // if you have single-line props, then children in array formats better
    svg({ stroke: 'red', fill: 'lightyellow' }, [
        circle({ cx: '50', cy: '50', r: () => model.number.toString() }),
    ]),
    // same children in array here
    math({ display: 'block' }, [
        // here children not in array writes easier and looks better
        mfrac(mi('x'), mn(() => model.number.toString())),
    ]),
]);
mount('#app', view);
