import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    document.body.innerHTML = '<div id="app"></div>'
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

  describe('debug mode', () => {
    it('should enable console logging', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      debug(true)

      const data = reactive({ test: 1 })
      data.test = 2

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
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
      console.log(attributes)
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
})
