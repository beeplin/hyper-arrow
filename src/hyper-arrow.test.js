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
  VEl,
  watch,
} from './hyper-arrow'

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
      const { html } = tags
      const div = html.div({ class: 'test' }, 'content')

      expect(div instanceof VEl).toBe(true)
      expect(div[TAG]).toBe('div')
      expect(div[PROPS].class).toBe('test')
    })

    it('should create SVG elements', () => {
      const { svg } = tags
      const circle = svg.circle({ r: 5 })

      expect(circle[TYPE]).toBe('svg')
      expect(circle[TAG]).toBe('circle')
      expect(circle[PROPS].r).toBe(5)
    })
  })

  describe('mount function', () => {
    it('should mount virtual element to DOM', () => {
      const { html } = tags
      const vel = html.div({ id: 'test' }, 'Hello')

      mount('#app', vel)

      const mountedEl = document.querySelector('#test')
      expect(mountedEl).not.toBeNull()
      expect(mountedEl?.textContent).toBe('Hello')
    })

    it('should handle lifecycle hooks', () => {
      const onCreate = vi.fn()
      const { html } = tags
      const vel = html.div({
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
      const { div } = tags.html
      const child1 = { id: 'child1' }
      const child2 = { id: 'child2' }
      const children = reactive([child1, child2])
      const vel = div({ id: 'parent', [CACHE_REMOVED_CHILDREN]: 2 }, () =>
        children.map((c) => div(c)),
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
})
