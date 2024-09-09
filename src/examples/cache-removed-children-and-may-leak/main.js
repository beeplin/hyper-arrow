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
  ul({ id: 'list', [CACHE_REMOVED_CHILDREN]: 100 }, () =>
    model.list.map((item) => li({ id: () => item }, item.toString())),
  ),
)

mount('#app', view, { [UID_ATTR_NAME]: 'uid' })
