import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CACHE_REMOVED_CHILDREN,
  isReactive,
  mount,
  ON_CREATE,
  reactive,
  tags,
  UID_ATTR_NAME,
  uidAttr,
  watch,
} from './hyper-arrow'

const { div, input, button, ul, li, select, option, label } = tags.html
const { svg, circle, path } = tags.svg

// debug(true)

describe('Hyper Arrow', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app"></div>'
    uidAttr.name = undefined
    uidAttr.count = 0
  })

  it('reactive system core features', () => {
    const obj = {
      items: [
        {
          children: [{ tags: ['a', 'b'] }, { tags: ['c'] }],
          config: { visible: true },
        },
        {
          children: [{ tags: ['d'] }],
          config: { visible: false },
        },
      ],
    }
    // 三层嵌套的复杂数据结构
    const data = reactive(obj)

    // 测试 watch 返回值和 cleanup
    let computedValue = 0
    let watchCount = 0
    const stop = watch(
      () => {
        watchCount++
        return data.items.reduce(
          (sum, item) =>
            item.config.visible
              ? sum +
                item.children.reduce((acc, child) => acc + child.tags.length, 0)
              : sum,
          0,
        )
      },
      (value) => {
        computedValue = value
      },
    )

    expect(isReactive(obj)).toBe(false)
    expect(isReactive(data)).toBe(true)
    expect(isReactive(data.items)).toBe(true)
    expect(isReactive(data.items[0])).toBe(true)
    expect(isReactive(data.items[0].children)).toBe(true)
    expect(isReactive(data.items[0].children[1])).toBe(true)
    expect(isReactive(data.items[0].children[1].tags)).toBe(true)
    expect(isReactive(data.items[0].children[1].tags[0])).toBe(false)

    // 初始值检查
    expect(computedValue).toBe(0) // effect 第一次不会运行
    expect(watchCount).toBe(1)

    // 测试嵌套数组操作
    data.items[0].children[0].tags.push('x')
    expect(computedValue).toBe(4)

    // 测试数组元素删除
    data.items[0].children.splice(1, 1)
    expect(computedValue).toBe(3)

    // 测试对象属性修改
    data.items[1].config.visible = true
    expect(computedValue).toBe(4)

    // 测试数组整体替换
    data.items = [{ children: [{ tags: ['new'] }], config: { visible: true } }]
    expect(computedValue).toBe(1)

    // 测试 cleanup
    stop()
    data.items[0].children[0].tags.push('y')
    expect(computedValue).toBe(1) // 不应该更新
    expect(watchCount).toBe(5)
  })

  it('DOM operations comprehensive test', () => {
    const events = {
      click: vi.fn(),
      INPUT: vi.fn(),
      mouseDown: vi.fn(),
      created: vi.fn(),
    }

    const data = reactive({
      items: ['a', 'b', 'c'],
      props: {
        id: 'test',
        label: 'Test Label',
        disabled: false,
        style: { color: 'red', fontSize: '12px' },
      },
      show: true,
    })

    // 创建一个包含各种元素和属性的复杂结构
    const vel = div(
      {
        // 测试不同形式的属性名
        id: () => data.props.id,
        class: () => (data.show ? 'active' : ''),
        for: 'input',
        '_data-test': 'custom',
        '_aria-label': () => data.props.label,

        // 测试样式属性
        $color: () => data.props.style.color,
        $fontSize: () => data.props.style.fontSize,

        // 测试混合大小写的事件处理
        onclick: events.click,
        onINPUT: events.INPUT,
        onMouseDown: events.mouseDown,

        // 测试特殊处理函数
        [ON_CREATE]: events.created,
      },
      [
        // 表单元素测试
        input({
          value: () => data.props.label,
          defaultValue: 'default',
          disabled: () => data.props.disabled,
        }),

        // 列表渲染和缓存测试
        ul(
          {
            className: 'container',
            htmlFor: 'input',
            [CACHE_REMOVED_CHILDREN]: 10,
          },
          () =>
            data.items.map((item) =>
              li(
                {
                  id: item,
                  onclick: () => events.click(item),
                },
                item,
              ),
            ),
        ),
      ],
    )

    mount('#app', vel, { [UID_ATTR_NAME]: 'uid' })

    // @ts-ignore
    const /** @type {HTMLDivElement} */ rootEl = document.querySelector('div')
    // @ts-ignore
    const /** @type {HTMLInputElement} */ inputEl =
        document.querySelector('input')
    const listItems = () => document.querySelectorAll('li')

    // 测试初始渲染和 UID
    expect(rootEl.getAttribute('uid')).toBe('0')
    expect(listItems().length).toBe(3)
    expect(Array.from(listItems()).map((li) => li.getAttribute('uid'))).toEqual(
      ['2', '3', '4'],
    )

    // 测试各种属性设置
    expect(rootEl.className).toBe('container active')
    expect(rootEl.getAttribute('data-test')).toBe('custom')
    expect(rootEl.getAttribute('aria-label')).toBe('Test Label')
    expect(rootEl.style.color).toBe('red')
    expect(inputEl.value).toBe('Test Label')
    expect(inputEl.defaultValue).toBe('default')

    // 测试属性更新
    data.props.label = 'Updated'
    data.props.style.color = 'blue'
    data.show = false
    expect(rootEl.getAttribute('aria-label')).toBe('Updated')
    expect(rootEl.style.color).toBe('blue')
    expect(rootEl.className).toBe('container')

    // 测试属性删除
    data.props.label = undefined
    data.props.style.fontSize = null
    expect(rootEl.hasAttribute('aria-label')).toBe(false)
    expect(rootEl.style.fontSize).toBe('')

    // 测试事件处理
    rootEl.click()
    rootEl.dispatchEvent(new Event('input'))
    rootEl.dispatchEvent(new MouseEvent('mousedown'))
    expect(events.click).toHaveBeenCalled()
    expect(events.INPUT).toHaveBeenCalled()
    expect(events.mouseDown).toHaveBeenCalled()
    expect(events.created).toHaveBeenCalledWith(rootEl)

    // 测试列表操作
    // 在中间位置插入
    data.items.splice(1, 0, 'x')
    expect(listItems().length).toBe(4)
    expect(listItems()[1].id).toBe('x')

    // 删除并检查 UID 是否复用
    const secondItemUid = listItems()[1].getAttribute('uid')
    data.items.splice(1, 1)
    data.items.splice(1, 0, 'y')
    expect(listItems()[1].getAttribute('uid')).toBe(secondItemUid)

    // 交换位置
    const temp = data.items[0]
    data.items[0] = data.items[2]
    data.items[2] = temp
    expect(Array.from(listItems()).map((li) => li.id)).toEqual(['c', 'y', 'a'])

    // 替换整个列表
    data.items = ['new']
    expect(listItems().length).toBe(1)
    expect(listItems()[0].id).toBe('new')

    // 原位修改
    data.items[0] = 'modified'
    expect(listItems()[0].id).toBe('modified')
  })
})
