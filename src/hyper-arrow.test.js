import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CACHE_REMOVED_CHILDREN,
  CHILDREN,
  debug,
  fawc2ropas,
  isReactive,
  mount,
  ON_CREATE,
  PROPS,
  reactive,
  ropa2fawcs,
  TAG,
  tags,
  TYPE,
  UID_ATTR_NAME,
  VEl,
  watch,
} from './hyper-arrow'

// Extract commonly used tags
const { div, button, p, span, ul, li } = tags.html

const { circle } = tags.svg

describe('hyper-arrow', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app"></main>'
    debug(false) // Reset debug mode
  })

  describe('VEl constructor', () => {
    it('should create virtual element with correct properties', () => {
      const vel = new VEl('html', 'div', {}, [])
      expect(vel[TYPE]).toBe('html')
      expect(vel[TAG]).toBe('div')
      expect(vel[PROPS]).toEqual({})
      expect(vel[CHILDREN]).toEqual([])
    })
  })

  describe('reactive system', () => {
    it('should make objects reactive', () => {
      const obj = { count: 0 }
      const reactiveObj = reactive(obj)

      expect(isReactive(reactiveObj)).toBe(true)
      expect(isReactive(obj)).toBe(false)
    })

    it('should track property access and trigger updates', () => {
      const data = reactive({ count: 0 })
      let triggered = false

      watch(
        () => data.count,
        (newValue) => {
          triggered = true
          expect(newValue).toBe(1)
        },
      )

      data.count = 1
      expect(triggered).toBe(true)
    })

    it('should handle nested reactive objects', () => {
      const obj = { nested: { count: 0 } }
      const reactiveObj = reactive(obj)

      expect(isReactive(reactiveObj.nested)).toBe(true)
    })
  })

  describe('tags factory', () => {
    it('should create HTML elements', () => {
      const vel = div({ class: 'test' }, 'content')
      expect(vel instanceof VEl).toBe(true)
      expect(vel[TAG]).toBe('div')
      expect(vel[PROPS].class).toBe('test')
    })

    it('should create SVG elements', () => {
      const vel = circle({ r: 5 })
      expect(vel[TYPE]).toBe('svg')
      expect(vel[TAG]).toBe('circle')
      expect(vel[PROPS].r).toBe(5)
    })
  })

  describe('mount function', () => {
    it('should mount virtual element to DOM', () => {
      const vel = div({ id: 'test' }, 'Hello')
      mount('#app', vel)

      const mountedEl = document.querySelector('#test')
      expect(mountedEl).not.toBeNull()
      expect(mountedEl?.textContent).toBe('Hello')
    })

    it('should handle lifecycle hooks', () => {
      const onCreate = vi.fn()
      const vel = div({
        id: 'test',
        [ON_CREATE]: onCreate,
      })

      mount('#app', vel)
      expect(onCreate).toHaveBeenCalled()
    })
  })

  describe('watch function', () => {
    it('should return cleanup function', () => {
      const data = reactive({ count: 0 })
      let triggerCount = 0

      const cleanup = watch(
        () => data.count,
        () => {
          triggerCount++
        },
      )

      data.count = 1
      cleanup()
      data.count = 2

      expect(triggerCount).toBe(1)
    })

    it('should handle nested property changes', () => {
      const data = reactive({ nested: { count: 0 } })
      let triggered = false

      watch(
        () => data.nested.count,
        () => {
          triggered = true
        },
      )

      data.nested.count = 1
      expect(triggered).toBe(true)
    })
  })

  describe('caching system', () => {
    it('should reuse cached elements when re-adding children', async () => {
      const child1 = { id: 'child1' }
      const child2 = { id: 'child2' }
      const children = reactive([child1, child2])
      const vel = div(
        {
          id: 'parent',
          [CACHE_REMOVED_CHILDREN]: 2,
        },
        () => children.map((c) => div(c)),
      )

      mount('#app', vel)

      // Initial check
      const parent = document.querySelector('#parent')
      const initialChild1 = document.querySelector('#child1')
      expect(parent?.children.length).toBe(2)

      // Remove children
      children.length = 0
      await Promise.resolve()
      expect(parent?.children.length).toBe(0)

      // Re-add same children
      children.push(child1, child2)
      await Promise.resolve()

      // Check if the same DOM element is reused
      const reusedChild1 = document.querySelector('#child1')
      expect(reusedChild1).toBe(initialChild1)
      expect(parent?.children.length).toBe(2)
    })
  })

  describe('dependency tracking', () => {
    it('should track dependencies with fawc2ropas', () => {
      const data = reactive({ count: 0 })
      const af = () => data.count
      watch(af)
      expect(fawc2ropas.keys().some((fawc) => fawc[2] === af)).toBe(true)
    })

    it('should track reverse dependencies with ropa2fawcs', () => {
      const obj = { count: 0 }
      const data = reactive(obj)
      const af = () => data.count
      watch(af)
      expect(ropa2fawcs.has(obj)).toBe(true)
    })
  })

  describe('UID_ATTR_NAME feature', () => {
    it('should add uids to elements when UID_ATTR_NAME is specified', () => {
      const vel = div({ id: 'parent' }, [
        div({ id: 'child1' }),
        div({ id: 'child2' }),
      ])

      mount('#app', vel, { [UID_ATTR_NAME]: 'data-uid' })

      const parent = document.querySelector('#parent')
      const child1 = document.querySelector('#child1')
      const child2 = document.querySelector('#child2')

      expect(parent?.getAttribute('data-uid')).toBeDefined()
      expect(child1?.getAttribute('data-uid')).toBeDefined()
      expect(child2?.getAttribute('data-uid')).toBeDefined()

      // IDs should be unique
      expect(parent?.getAttribute('data-uid')).not.toBe(
        child1?.getAttribute('data-uid'),
      )
      expect(child1?.getAttribute('data-uid')).not.toBe(
        child2?.getAttribute('data-uid'),
      )
      expect(parent?.getAttribute('data-uid')).not.toBe(
        child2?.getAttribute('data-uid'),
      )
    })

    it('should not add uid attrs when UID_ATTR_NAME is not specified', () => {
      const vel = div({ id: 'parent' }, [div({ id: 'child' })])

      mount('#app', vel)

      const parent = document.querySelector('#parent')
      const child = document.querySelector('#child')

      expect(parent?.getAttribute('data-uid')).toBeNull()
      expect(child?.getAttribute('data-uid')).toBeNull()
    })

    it('should increment uid values for each new element', () => {
      const vel1 = div({ id: 'first' })
      const vel2 = div({ id: 'second' })

      mount('#app', vel1, { [UID_ATTR_NAME]: 'data-uid' })
      const firstUid = document
        .querySelector('#first')
        ?.getAttribute('data-uid')

      const appElement = document.querySelector('#app')
      if (appElement) appElement.innerHTML = ''
      mount('#app', vel2, { [UID_ATTR_NAME]: 'data-uid' })
      const secondUid = document
        .querySelector('#second')
        ?.getAttribute('data-uid')

      expect(firstUid).toBeDefined()
      expect(secondUid).toBeDefined()
      expect(Number(secondUid)).toBeGreaterThan(Number(firstUid))
    })
  })

  describe('dom events', () => {
    it('should handle onclick events', () => {
      const onClick = vi.fn()
      const vel = button({ onclick: onClick }, 'Click me')

      mount('#app', vel)

      const buttonEl = document.querySelector('button')
      buttonEl?.click()

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should handle mixed case events', () => {
      const onClick = vi.fn()
      const onMouseDown = vi.fn()
      const onMOUSEUP = vi.fn()
      const vel = button(
        {
          onClick,
          onMouseDown,
          onMOUSEUP,
        },
        'Click me',
      )

      mount('#app', vel)

      const buttonEl = document.querySelector('button')
      buttonEl?.click()
      buttonEl?.dispatchEvent(new MouseEvent('mousedown'))
      buttonEl?.dispatchEvent(new MouseEvent('mouseup'))

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onMouseDown).toHaveBeenCalledTimes(1)
      expect(onMOUSEUP).toHaveBeenCalledTimes(1)
    })

    it('should handle event removal when updating props', () => {
      const onClick1 = vi.fn()
      const onClick2 = vi.fn()
      const data = reactive({ handler: onClick1 })
      const vel = button({ onClick: () => data.handler() }, 'Click me')

      mount('#app', vel)

      const buttonEl = document.querySelector('button')
      buttonEl?.click()
      expect(onClick1).toHaveBeenCalledTimes(1)
      expect(onClick2).toHaveBeenCalledTimes(0)

      data.handler = onClick2
      buttonEl?.click()
      expect(onClick1).toHaveBeenCalledTimes(1)
      expect(onClick2).toHaveBeenCalledTimes(1)
    })
  })

  describe('DOM elements with children', () => {
    it('should handle elements with no attributes, only children', () => {
      const vel = p(span('First'), p('Second'), 'Text node')

      mount('#app', vel)

      const pEl = document.querySelector('p')
      expect(pEl).not.toBeNull()

      const attributes = pEl?.attributes
      expect(attributes?.length).toBe(0)
      expect(pEl?.children.length).toBe(2)
      expect(pEl?.childNodes.length).toBe(3)

      expect(pEl?.children[0].tagName.toLowerCase()).toBe('span')
      expect(pEl?.children[0].textContent).toBe('First')

      expect(pEl?.children[1].tagName.toLowerCase()).toBe('p')
      expect(pEl?.children[1].textContent).toBe('Second')

      expect(pEl?.childNodes[2].nodeType).toBe(3) // Text node
      expect(pEl?.childNodes[2].textContent).toBe('Text node')
    })
  })

  describe('style properties', () => {
    it('should handle style properties with $ prefix', () => {
      const vel = div({
        $color: 'red',
        $backgroundColor: 'blue',
        '$font-size': '16px',
      })

      mount('#app', vel)
      const divEl = document.querySelector('div')
      expect(divEl?.style.getPropertyValue('color')).toBe('red')
      expect(divEl?.style.getPropertyValue('background-color')).toBe('blue')
      expect(divEl?.style.getPropertyValue('font-size')).toBe('16px')
    })

    it('should handle dynamic style properties', () => {
      const data = reactive({ color: 'red' })
      const vel = div({
        $color: () => data.color,
        $padding: '10px',
        $backgroundColor: 'yellow',
      })

      mount('#app', vel)
      const divEl = document.querySelector('div')
      expect(divEl?.style.getPropertyValue('color')).toBe('red')
      expect(divEl?.style.getPropertyValue('padding')).toBe('10px')
      expect(divEl?.style.getPropertyValue('background-color')).toBe('yellow')

      data.color = 'blue'
      expect(divEl?.style.getPropertyValue('color')).toBe('blue')
    })

    it('should remove style properties when value is null or undefined', () => {
      const data = reactive({ color: 'red' })
      const vel = div({
        $color: () => data.color,
      })

      mount('#app', vel)
      const divEl = document.querySelector('div')
      expect(divEl?.style.getPropertyValue('color')).toBe('red')

      // @ts-ignore
      data.color = undefined
      expect(divEl?.style.getPropertyValue('color')).toBe('')
    })
  })

  describe('reactive arrays', () => {
    it('should handle array methods properly', () => {
      const data = reactive({ items: ['a', 'b', 'c'] })
      const vel = ul(() => data.items.map((item) => li(item)))

      mount('#app', vel)
      const lis = document.querySelectorAll('li')
      expect(lis.length).toBe(3)
      expect(lis[0].textContent).toBe('a')

      data.items.push('d')
      const lisAfterPush = document.querySelectorAll('li')
      expect(lisAfterPush.length).toBe(4)
      expect(lisAfterPush[3].textContent).toBe('d')

      data.items.pop()
      const lisAfterPop = document.querySelectorAll('li')
      expect(lisAfterPop.length).toBe(3)

      data.items.unshift('x')
      const lisAfterUnshift = document.querySelectorAll('li')
      expect(lisAfterUnshift.length).toBe(4)
      expect(lisAfterUnshift[0].textContent).toBe('x')
    })

    it('should handle deeply nested reactive arrays', () => {
      const data = reactive({
        nested: {
          items: [
            { id: 1, text: 'a' },
            { id: 2, text: 'b' },
          ],
        },
      })

      const vel = ul(() =>
        data.nested.items.map((item) =>
          li({ id: item.id.toString() }, item.text),
        ),
      )

      mount('#app', vel)
      const lis = document.querySelectorAll('li')
      expect(lis.length).toBe(2)
      expect(lis[0].textContent).toBe('a')

      data.nested.items[0].text = 'modified'
      expect(lis[0].textContent).toBe('modified')

      data.nested.items.push({ id: 3, text: 'c' })
      const lisAfterPush = document.querySelectorAll('li')
      expect(lisAfterPush.length).toBe(3)
      expect(lisAfterPush[2].textContent).toBe('c')
    })
  })

  describe('special properties', () => {
    it('should handle attributes with _ prefix', () => {
      const vel = div({
        '_custom-attr': 'test',
        _data: '123',
        _complex_multi_word_attr: 'value',
        _myCustomComplexAttr: 'camelCase',
      })

      mount('#app', vel)
      const divEl = document.querySelector('div')
      expect(divEl?.getAttribute('custom-attr')).toBe('test')
      expect(divEl?.getAttribute('data')).toBe('123')
      expect(divEl?.getAttribute('complex_multi_word_attr')).toBe('value')
      expect(divEl?.getAttribute('my-custom-complex-attr')).toBe('camelCase')
    })

    it('should handle camelCase to kebab-case conversion', () => {
      const vel = div({
        dataTestId: 'test',
        _ariaLabel: 'label',
      })

      mount('#app', vel)
      const divEl = document.querySelector('div')
      expect(divEl?.getAttribute('data-test-id')).toBe('test')
      expect(divEl?.getAttribute('aria-label')).toBe('label')
    })
  })

  describe('textContent and innerHTML', () => {
    it('should handle textContent property', () => {
      const data = reactive({ text: 'hello' })
      const vel = div({ textContent: () => data.text })

      mount('#app', vel)
      const divEl = document.querySelector('div')
      expect(divEl?.textContent).toBe('hello')

      data.text = 'world'
      expect(divEl?.textContent).toBe('world')
    })

    it('should handle innerHTML property', () => {
      const data = reactive({ html: '<span>test</span>' })
      const vel = div({ innerHTML: () => data.html })

      mount('#app', vel)
      const divEl = document.querySelector('div')
      expect(divEl?.innerHTML).toBe('<span>test</span>')

      data.html = '<p>changed</p>'
      expect(divEl?.innerHTML).toBe('<p>changed</p>')
    })
  })

  describe('error handling', () => {
    it('should handle invalid mount selector gracefully', () => {
      const vel = div('test')
      expect(() => mount('#nonexistent', vel)).toThrow()
    })

    it('should handle setting invalid properties', () => {
      const vel = div({ invalidProp: 'value' })
      mount('#app', vel)
      // Should not throw
    })

    it('should handle undefined children', () => {
      const data = reactive({ items: [1, 2, 3] })
      const vel = ul(() =>
        data.items
          .map((item) => (item === 2 ? undefined : li(item.toString())))
          .filter((item) => item !== undefined),
      )

      mount('#app', vel)
      const lis = document.querySelectorAll('li')
      expect(lis.length).toBe(2)
      expect(lis[0].textContent).toBe('1')
      expect(lis[1].textContent).toBe('3')
    })
  })

  describe('MathML and SVG elements', () => {
    it('should create and update MathML elements', () => {
      const { math, mn, mi, mfrac } = tags.mathml
      const data = reactive({ value: 10 })
      const vel = math(
        mfrac(
          mi('x'),
          mn(() => data.value.toString()),
        ),
      )

      mount('#app', vel)
      const mathEl = document.querySelector('math')
      expect(mathEl).not.toBeNull()
      expect(mathEl?.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')

      const mnEl = document.querySelector('mn')
      expect(mnEl?.textContent).toBe('10')

      data.value = 20
      expect(mnEl?.textContent).toBe('20')
    })

    it('should handle nested SVG elements with attributes', () => {
      const { svg, g, circle, path } = tags.svg
      const data = reactive({ radius: 5, color: 'red' })

      const vel = svg(
        { width: '100', height: '100' },
        g(
          { transform: 'translate(50,50)' },
          circle({
            r: () => data.radius.toString(),
            fill: () => data.color,
          }),
          path({ d: 'M0,0L10,10' }),
        ),
      )

      mount('#app', vel)
      const svgEl = document.querySelector('svg')
      expect(svgEl?.namespaceURI).toBe('http://www.w3.org/2000/svg')

      const circleEl = document.querySelector('circle')
      expect(circleEl?.getAttribute('r')).toBe('5')
      expect(circleEl?.getAttribute('fill')).toBe('red')

      data.radius = 10
      data.color = 'blue'
      expect(circleEl?.getAttribute('r')).toBe('10')
      expect(circleEl?.getAttribute('fill')).toBe('blue')
    })
  })

  describe('complex watch scenarios', () => {
    it('should handle multiple nested watches', () => {
      const data = reactive({
        a: { value: 1 },
        b: { value: 2 },
      })

      let aCount = 0
      let bCount = 0
      let sumCount = 0
      let currentSum = 0

      watch(
        () => data.a.value,
        () => {
          aCount++
        },
      )
      watch(
        () => data.b.value,
        () => {
          bCount++
        },
      )
      watch(() => {
        currentSum = data.a.value + data.b.value
        sumCount++
      })

      expect(currentSum).toBe(3)
      expect(aCount).toBe(0)
      expect(bCount).toBe(0)
      expect(sumCount).toBe(1)

      data.a.value = 10
      expect(currentSum).toBe(12)
      expect(aCount).toBe(1)
      expect(bCount).toBe(0)
      expect(sumCount).toBe(2)

      data.b.value = 20
      expect(currentSum).toBe(30)
      expect(aCount).toBe(1)
      expect(bCount).toBe(1)
      expect(sumCount).toBe(3)
    })

    it('should handle cleanup in nested watch scenarios', () => {
      const data = reactive({
        show: true,
        value: 0,
      })

      let innerCount = 0
      /**
       * @type {(() => void) | null}
       */
      let innerCleanup = null
      const cleanup = watch(() => {
        if (data.show) {
          if (innerCleanup) innerCleanup()
          innerCleanup = watch(
            () => data.value,
            () => {
              innerCount++
            },
          )
        } else if (innerCleanup) {
          innerCleanup()
          innerCleanup = null
        }
      })

      data.value = 1
      expect(innerCount).toBe(1)

      data.show = false
      data.value = 2
      expect(innerCount).toBe(1)

      data.show = true
      data.value = 3
      expect(innerCount).toBe(2)

      cleanup()
      data.show = false
      data.value = 4
      expect(innerCount).toBe(3)
    })
  })

  describe('complex children updates', () => {
    it('should handle conditional children rendering', () => {
      const data = reactive({
        show: true,
        items: ['a', 'b', 'c'],
      })

      const vel = div([
        div(() => (data.show ? [p('Visible')] : [])),
        ul(() => (data.show ? data.items.map((item) => li(item)) : [])),
      ])

      mount('#app', vel)
      expect(document.querySelector('p')?.textContent).toBe('Visible')
      expect(document.querySelectorAll('li').length).toBe(3)

      data.show = false
      expect(document.querySelector('p')).toBeNull()
      expect(document.querySelectorAll('li').length).toBe(0)

      data.show = true
      data.items.push('d')
      expect(document.querySelector('p')?.textContent).toBe('Visible')
      expect(document.querySelectorAll('li').length).toBe(4)
    })
  })

  describe('utility functions and edge cases', () => {
    it('should handle property descriptor edge cases', () => {
      const vel = div({
        get testProp() {
          return 'test'
        },
      })
      mount('#app', vel)
      // Should not throw when handling getter properties
    })

    it('should handle cache management with non-unique ids', () => {
      const data = reactive({
        items: [
          { id: '1', text: 'a' },
          { id: '1', text: 'b' }, // Duplicate id
          { text: 'c' }, // Missing id
        ],
      })

      const vel = div({ [CACHE_REMOVED_CHILDREN]: 2 }, () =>
        data.items.map((item) => div({ id: item.id }, item.text)),
      )

      mount('#app', vel)
      // Should handle non-unique and missing ids gracefully
      const divs = document.querySelectorAll('div > div')
      expect(divs.length).toBe(3)

      data.items.length = 0
      const divsAfterClear = document.querySelectorAll('div > div')
      expect(divsAfterClear.length).toBe(0)

      data.items.push({ id: '1', text: 'new' })
      const divsAfterAdd = document.querySelectorAll('div > div')
      expect(divsAfterAdd.length).toBe(1)
    })

    it('should handle special attribute cases', () => {
      const data = reactive({ show: true })
      const vel = div({
        'data-test': 'test',
        role: undefined,
        ariaLabel: null,
        class: () => (data.show ? 'visible' : ''), // Changed from className to class
      })

      mount('#app', vel)
      const divEl = document.querySelector('div')
      expect(divEl?.getAttribute('data-test')).toBe('test')
      expect(divEl?.hasAttribute('role')).toBe(false)
      expect(divEl?.hasAttribute('aria-label')).toBe(false)
      expect(divEl?.className).toBe('visible')

      data.show = false
      expect(divEl?.className).toBe('')
    })

    it('should handle prototype chain property lookups', () => {
      class CustomElement extends HTMLDivElement {}
      const proto = Object.getPrototypeOf(CustomElement.prototype)
      const vel = div({
        [Object.getOwnPropertyNames(proto)[0]]: 'test',
      })

      mount('#app', vel)
      // Should handle properties from prototype chain
    })

    it('should handle string conversion edge cases', () => {
      const data = reactive({ value: 0 })
      const multilineFunc = () => {
        return data.value
      }

      const vel = div({
        onClick: multilineFunc,
      })

      mount('#app', vel)
      // Should handle multiline function string conversion
    })
  })

  describe('property handling', () => {
    it('should properly unset properties from elements', () => {
      const data = reactive({ show: true })
      const vel = div({
        id: () => (data.show ? 'test-id' : undefined),
        class: () => (data.show ? 'test-class' : null),
        title: () => (data.show ? 'Test Title' : null),
        'data-custom': () => (data.show ? 'custom' : undefined),
      })

      mount('#app', vel)
      const divEl = document.querySelector('div')

      // Initial state check
      expect(divEl?.id).toBe('test-id')
      expect(divEl?.className).toBe('test-class')
      expect(divEl?.title).toBe('Test Title')
      expect(divEl?.getAttribute('data-custom')).toBe('custom')

      // Trigger property removal
      data.show = false

      // Verify properties are removed
      expect(divEl?.hasAttribute('id')).toBe(false)
      expect(divEl?.hasAttribute('class')).toBe(false)
      expect(divEl?.hasAttribute('title')).toBe(false)
      expect(divEl?.hasAttribute('data-custom')).toBe(false)
    })

    it('should handle special property unset cases', () => {
      const data = reactive({ props: true })
      const vel = div({
        style: () => (data.props ? 'color: red' : null),
        $backgroundColor: () => (data.props ? 'blue' : undefined),
        _ariaLabel: () => (data.props ? 'test' : null),
        innerText: () => (data.props ? 'text' : null),
      })

      mount('#app', vel)
      const divEl = document.querySelector('div')

      // Initial state check
      expect(divEl?.style.color).toBe('red')
      expect(divEl?.style.backgroundColor).toBe('blue')
      expect(divEl?.getAttribute('aria-label')).toBe('test')
      expect(divEl?.innerText).toBe('text')

      // Trigger property removal
      data.props = false

      // Verify properties are removed
      expect(divEl?.hasAttribute('style')).toBe(false)
      expect(divEl?.style.backgroundColor).toBe('')
      expect(divEl?.hasAttribute('aria-label')).toBe(false)
      expect(divEl?.innerText).toBe('')
    })

    it('should handle unset props with reactive arrays', () => {
      debug(true)
      const data = reactive({ items: ['a', 'b', 'c'] })
      const vel = ul(() =>
        data.items.map((item) =>
          li({
            'data-value': () => item,
            class: () => (item === 'b' ? 'selected' : undefined),
          }),
        ),
      )

      mount('#app', vel)
      const liElements = document.querySelectorAll('li')

      // Check initial state
      expect(liElements[0].getAttribute('data-value')).toBe('a')
      expect(liElements[1].getAttribute('data-value')).toBe('b')
      expect(liElements[1].classList.contains('selected')).toBe(true)

      // Remove middle item
      data.items.splice(1, 1)

      const updatedLiElements = document.querySelectorAll('li')
      expect(updatedLiElements.length).toBe(2)
      expect(updatedLiElements[0].getAttribute('data-value')).toBe('a')
      expect(updatedLiElements[1].getAttribute('data-value')).toBe('c')
      // Verify the 'selected' class was removed with the element
      expect(document.querySelector('.selected')).toBeNull()
    })
  })

  describe('debug mode console output', () => {
    /**
     * @type {import("vitest").MockInstance<(...data: any[]) => void>}
     */
    let consoleSpy

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log')
      consoleSpy.mockClear()
      vi.spyOn(console, 'group')
      vi.spyOn(console, 'groupCollapsed')
      vi.spyOn(console, 'groupEnd')
      debug(true)
    })

    afterEach(() => {
      consoleSpy.mockRestore()
      debug(false)
    })

    it('should log element creation and mounting', () => {
      const vel = div({ id: 'test' }, 'Hello')
      mount('#app', vel)

      expect(console.groupCollapsed).toHaveBeenCalledWith('mount')
      expect(console.log).toHaveBeenCalledWith(
        '+ prop',
        expect.any(String),
        'id',
        '=',
        'test',
      )
      expect(console.log).toHaveBeenCalledWith(
        'append',
        expect.any(String),
        '<',
        '"Hello"',
      )
    })

    it('should log style property changes', () => {
      const data = reactive({ color: 'red' })
      const vel = div({
        $color: () => data.color,
        $background: 'blue',
      })

      mount('#app', vel)
      data.color = 'green'

      expect(console.log).toHaveBeenCalledWith(
        '+ styl',
        expect.any(String),
        '$color',
        '=',
        'red',
      )
      expect(console.log).toHaveBeenCalledWith(
        '* styl',
        expect.any(String),
        '$color',
        ':',
        'red',
        '->',
        'green',
      )
    })

    it('should log reactive property access and changes', () => {
      const data = reactive({ count: 0 })

      watch(() => {
        data.count
      })

      consoleSpy.mockClear()

      data.count = 1

      const calls = consoleSpy.mock.calls.map((call) => call[0])
      expect(calls).toContain('set ')
      expect(calls.some((call) => call === 'get ')).toBe(true)
    })

    it('should log conditional rendering changes', () => {
      const data = reactive({ show: true })
      const vel = div(() => (data.show ? [p('Visible')] : []))

      mount('#app', vel)
      consoleSpy.mockClear()

      data.show = false

      const setCall = consoleSpy.mock.calls.find((call) => call[0] === 'set ')
      expect(setCall).toBeDefined()
      expect(setCall?.[2]).toBe('.show')
      expect(setCall?.[3]).toBe(true)
      expect(setCall?.[5]).toBe(false)
    })

    it('should log array operations', () => {
      const data = reactive({ items: ['a', 'b'] })
      const vel = ul(() => data.items.map((item) => li(item)))

      mount('#app', vel)
      consoleSpy.mockClear()

      data.items.push('c')

      const calls = consoleSpy.mock.calls
      const setCalls = calls.filter((call) => call[0] === 'set ')

      expect(
        setCalls.some(
          (call) =>
            call[2] === '.2' && call[3] === undefined && call[5] === 'c',
        ),
      ).toBe(true)
    })

    it('should log multiline function string conversion', () => {
      const multilineFunc = () => {
        return 'test'
      }
      const vel = div({
        onClick: multilineFunc,
      })

      mount('#app', vel)

      // Should have logged the first line with ...
      expect(console.log).toHaveBeenCalledWith(
        '+ prop',
        expect.any(String),
        'onclick',
        '=',
        'func',
      )
    })

    it('should log cache operations', () => {
      const data = reactive({ items: [{ id: '1', text: 'a' }] })
      const vel = div({ [CACHE_REMOVED_CHILDREN]: 1 }, () =>
        data.items.map((item) => div({ id: item.id }, item.text)),
      )

      mount('#app', vel)
      data.items.length = 0
      data.items.push({ id: '1', text: 'new' })

      expect(console.log).toHaveBeenCalledWith(
        'remove',
        expect.any(String),
        0,
        '>',
        expect.any(String),
        '> cache',
      )
    })
  })
})
