// @ts-nocheck
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
