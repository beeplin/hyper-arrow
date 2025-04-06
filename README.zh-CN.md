# hyper-arrow

[English version](./README.md)

超轻量级前端 UI 库（教学用途）

- 最小化后**~4KB**，压缩后仅 **~2KB**
- **零依赖**
- **100%**测试覆盖率
- 无需构建步骤，可以通过 `<script type="module">` 标签在普通 HTML 中直接使用
- 基于 Proxy 的响应式系统，类似 [Vue 3 的 `reactive`](https://vuejs.org/api/reactivity-core.html#reactive) 或 [MobX 的 `makeAutoObservable`](https://mobx.js.org/observable-state.html#makeautoobservable)
- 无模板，无 JSX。标签函数 `div`、`button` 等的工作方式类似 [hyperscript 的 `h`](https://github.com/hyperhype/hyperscript) 或 [Vue 3 的 `h`](https://vuejs.org/api/render-function.html#h)
- HTML 标签函数中的 `=>` 箭头函数提供响应式能力，这也是库名称的由来 ;)
- 智能高效的元素子节点插入、删除、交换和更新，前提是所有子元素都有唯一的 `id` 属性

## 快速开始

```js
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

// 创建响应式对象
const model = reactive(new Model())

// 使用嵌套的 HTML 标签函数设计视图
const { button, div, input, li, ul } = tags.html

const view = div(
  // 第一个参数设置元素属性
  {
    id: 'container-id',
    class: 'container-class',
    style: 'padding: 4px;',
  },
  // 剩余参数为子元素
  div({ style: 'margin: 4px' }, 'hyper-arrow 演示'),
  input({
    type: 'text',
    // 箭头函数使属性具有响应性
    value: () => model.input,
    class: () => (model.input ? 'class3' : 'class4'),
    // 使用 '$' 前缀设置内联样式
    $margin: '4px',
    // 响应式样式
    $color: () => (model.input.length > 5 ? 'red' : 'black'),
    // 事件监听器使用 'on' 前缀
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
    '添加',
  ),
  // 也可以使用 'innerText' 设置文本作为单个子元素
  // 就像 DOM API 中的 `el.innerText = 'xxx'` 一样
  button({
    type: 'button',
    innerText: '清空',
    style: 'margin: 4px',
    onClick() {
      model.clear()
    },
  }),
  // 如果没有属性，可以省略第一个属性参数
  ul(
    // 子元素也可以放在箭头函数内，这样也是响应式的
    () => model.list.map((item) => li(item)),
  ),
)

// 将视图挂载到页面并运行！
mount('#app', view)

model.input = 'aaa'
model.add()
model.input = 'bbb'
model.add()
```

这将创建以下具有正确动态行为的 DOM 树：

```html
<div id="container-id" class="container-class" style="padding: 4px;">
  <div style="margin: 4px;">hyper-arrow 演示</div>
  <input type="text" class="class4" style="margin: 4px; color: black;" />
  <button type="button" style="margin: 4px;">添加</button>
  <button type="button" style="margin: 4px;">清空</button>
  <ul>
    <li>aaa</li>
    <li>bbb</li>
  </ul>
</div>
```

更多示例请查看 `src/examples` 目录。

## 基础 API

### `reactive(object)`

为任何 `object` 创建响应式代理，然后可以在标签函数中使用。

### `tags`

所有 HTML 标签函数都在 `tags.html` 中。`tags.svg` 包含 SVG 标签函数，`tags.mathml` 包含 MathML 标签函数。

```js
import { mount, reactive, tags } from '../../hyper-arrow.js'

const { div, button } = tags.html
const { svg, circle } = tags.svg
const { math, mi, mn, mfrac } = tags.mathml

const model = reactive({ number: 10 })

// 子元素也可以放在一个数组中，而不是写成多个剩余参数
const view = div({ id: 'root' }, [
  button({
    innerText: '增加',
    onClick() {
      model.number++
    },
  }),
  // 如果第一个属性参数是单行的，那么数组形式的子元素格式往往更美观
  svg({ stroke: 'red', fill: 'lightyellow' }, [
    circle({ cx: '50', cy: '50', r: () => model.number.toString() }),
  ]),
  // 这里也一样，子元素使用数组
  math({ display: 'block' }, [
    // 没有属性参数时，子元素不使用数组，写起来更容易，看起来更美观
    mfrac(
      mi('x'),
      mn(() => model.number.toString()),
    ),
  ]),
])

mount('#app', view)
```

它会生成以下 DOM 树：

```html
<div id="root">
  <button>增加</button>
  <svg stroke="red" fill="lightyellow">
    <circle cx="50" cy="50" r="10"></circle>
  </svg>
  <math display="block">
    <mfrac><mi>x</mi><mn>10</mn></mfrac>
  </math>
</div>
```

### `mount(element_selector, view, [options])`

将视图挂载到 DOM。示例已在上面展示。可选的 `options` 详情见下文。

## 高级 API

### `UID_ATTR_NAME`

`mount` 可以接受可选的第三个参数 `options` 用于额外配置。

`[UID_ATTR_NAME]` 是 `mount` 的 `options` 中的一个唯一符号键 (unique symbol key)。它为 `mount` 创建的所有 DOM 元素添加唯一的 HTML 属性以标识自己。

```js
import { mount, tags, UID_ATTR_NAME } from '../../hyper-arrow.js'

const { div } = tags.html

const view = div(div('a'), div('b'), div(div('c'), div('d')), div('e'))

mount('#app', view, { [UID_ATTR_NAME]: 'uid' })
```

将生成：

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

这有助于用户在父元素在进行智能子元素更新或缓存时观察是否正确地重用元素而不是创建新元素（见下）。

### `CACHE_REMOVED_CHILDREN`

一个唯一符号键 (unique symbol key)，值为允许父 DOM 元素缓存被移除的子元素的最大数量。这样可以在需要时重用已缓存的元素，而不是创建新的元素，前提是子元素的 `id` 属性匹配。

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
    innerText: '改变',
    onClick() {
      const length = Math.floor(Math.random() * 10)
      model.list = Array.from({ length }, (_, i) => i.toString())
    },
  }),
  // 允许缓存，最大缓存大小为 100
  ul({ id: 'list', [CACHE_REMOVED_CHILDREN]: 100 }, () =>
    model.list.map((item) => li({ id: () => item }, item.toString())),
  ),
)

mount('#app', view, { [UID_ATTR_NAME]: 'uid' })
```

在开发者工具中可以看到，当列表变化时，`li` 元素的 `uid` 属性保持不变。这表明 `ul` 正在重用旧的被移除的 `li` 元素。

### `ON_CREATE`

一个唯一符号键，用于在 DOM 元素上创建特殊的 "onCreate" 事件处理器。

```js
import { mount, ON_CREATE, tags } from '../../hyper-arrow.js'

const { input } = tags.html

mount(
  '#app',
  input({
    value: '你好世界',
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

创建的 DOM 元素 `el` 会被传入事件处理函数。

### `isReactive(object)`

检查一个 `object` 是否是响应式代理。

### `watch(fn, [effectFn])`

运行一次 `fn()`，并且当 `fn` 的依赖（见下文）发生变化时，自动重新运行 `fn()`，或者如果提供了 `effectFn`，则运行 `effectFn(fn())`。

### `fac2opas`

`Map<FunctionAndContext, WeakMap<Object, Set<Property>>>`。对于每个**函数及上下文**（**FAC**），`fac2opas` 存储函数调用中出现的所有**对象属性访问**（**OPA**）。当任何 **OPA** 发生变化时，相应的 **FAC** 函数会重新运行，并借助其上下文信息把 DOM 中相应位置更新为其新的返回值。`watch` 中的 `fn` 也会进入 `fac2opas`。

请注意，你的 **FAC** 返回值必须只依赖于 **FAC** 内的响应式 **OPA**（如 `o.p` 或 `o[p]`），而不能依赖其他内容，比如非响应式对象、自由变量绑定（如函数内的 `let x = 1`）或全局/闭包变量。

你可能永远不需要直接使用 `fac2opas`。它仅供内部使用，暴露出来只是为了调试目的。

## 响应式实现原理

响应式系统是 hyper-arrow 的核心特性之一。让我们深入了解它是如何工作的。

### 基本概念

在 hyper-arrow 中，有三种定义响应式属性的方式：

```javascript
const model = reactive({
  count: 0,
  text: 'hello',
})

const view = div(
  // 1. 箭头函数 (推荐写法)
  { textContent: () => model.text },

  // 2. 普通函数
  {
    textContent: function () {
      return model.text
    },
  },

  // 3. 方法简写
  {
    textContent() {
      return model.text
    },
  },
)
```

### 为什么需要函数？

响应式系统通过以下步骤工作：

1. **依赖收集**

简化实现：

```javascript
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      // 当正在执行某个函数时，记录这个函数依赖了哪个 OPA
      if (currentFac) {
        trackDependency(currentFac, target, key)
      }
      return target[key]
    },
  })
}
```

1. **函数执行**

```javascript
function runFac(fac) {
  const fn = fac[2] // 获取函数
  currentFac = fac // 标记当前正在执行的函数
  const result = fn() // 执行函数，触发 proxy.get，收集依赖
  currentFac = null
  return result
}
```

3. **更新触发**

当响应式对象的属性发生变化时：

- 系统找到所有依赖这个属性的函数
- 重新执行这些函数
- 用新的返回值更新 DOM

### 依赖追踪机制

hyper-arrow 使用以下数据结构来追踪依赖关系：

```typescript
// 存储每个函数的依赖关系
export const fac2opas = new Map<Fac, WeakMap<object, Set<property>>>()
```

#### 依赖收集过程

1. 当执行响应式函数时，设置 `currentFac`
2. 函数执行过程中访问响应式属性会触发 Proxy 的 get 拦截器
3. get 拦截器记录当前函数与被访问的属性之间的依赖关系

#### 更新过程

1. 响应式对象的属性被修改时触发 Proxy 的 set 拦截器
2. 查找依赖这个属性的所有函数
3. 重新执行这些函数
4. 更新相应的 DOM 元素

### 为什么推荐箭头函数？

1. **简洁性**：语法更简洁，易于阅读
2. **this 绑定**：避免 this 指向问题
3. **设计意图**：清晰表达这是一个响应式属性

### 实际应用示例

```javascript
import { reactive, div, mount } from 'hyper-arrow'

// 创建响应式数据
const model = reactive({
  count: 0,
  message: 'Hello',
})

// 创建视图
const view = div({
  class: () => (model.count > 0 ? 'active' : ''),
  textContent: () => `${model.message} (${model.count})`,
})

// 挂载到 DOM
mount('#app', view)

// 数据变化会自动触发视图更新
model.count++
model.message = 'Hi'
```

### 总结

1. 任何形式的函数都可以用于创建响应式属性
2. 箭头函数是推荐的写法，但不是强制要求
3. 响应式系统的核心是依赖收集和自动更新
4. 使用函数是为了能够追踪属性访问并在需要时重新执行
