import { watch } from '../../index.js'
import { ToDoListState } from './state.js'

const pause = (ms = 500) => new Promise((r) => setTimeout(r, ms))
const raf = () => new Promise((r) => requestAnimationFrame(r))

export async function test(/** @type {ToDoListState}  */ s) {
  const count = 10

  const stopWatch = watch(() => {
    console.log(s.newInput, s.filter, s.model._currentId)
  })

  watch(
    () => s.newInput,
    (x) => console.log('aaa', x, s.filter),
  )

  for (let i = 0; i < count; i++) {
    await raf()
    const id = s.model.create(String(i))
    const item = s.model.getItemById(id)
    await raf()
    if (!item) return
    if (i % 2) s.model.toggle(item.id)
    await raf()
    if (i % 3) {
      s.editingId = item.id
      await raf()
      s.update(item.id, item.text + ' edited!')
    }
  }
  await pause()
  s.filter = 'active'
  await pause()
  s.filter = 'completed'
  await pause()
  s.filter = 'all'
  await pause()
  s.model.deleteAllCompleted()
  await pause()
  for (let i = 0; i < count; i++) {
    await raf()
    const id = s.model.create(String(i))
    const item = s.model.getItemById(id)
    if (!item) return
    if (i % 2) s.model.toggle(item.id)
  }
  await pause()
  s.filter = 'active'
  await pause()
  s.filter = 'completed'
  await pause()
  s.filter = 'all'
  await pause()
  const length = s.model.list.length
  for (let i = 0; i < length; i++) {
    await raf()
    s.model.list.pop()
  }
  s.model.create('aaa')
  s.model.create('bbb')
  s.model.create('ccc')
  stopWatch()
}
