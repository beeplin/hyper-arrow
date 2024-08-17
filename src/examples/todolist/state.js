// @ts-check

import { ToDoList } from './model.js'

export class ToDoListState {
  /** @type {ToDoList} */
  model
  constructor(/** @type {ToDoList} */ list) {
    this.model = list
  }
  newInput = ''
  createFromInput() {
    const trimmed = this.newInput.trim()
    if (trimmed === '') return
    this.newInput = ''
    return this.model.create(trimmed)
  }
  filter = 'all'
  getFilteredReversedList() {
    return this.filter === 'active'
      ? this.model.list.filter((x) => !x.done).reverse()
      : this.filter === 'completed'
      ? this.model.list.filter((x) => x.done).reverse()
      : [...this.model.list].reverse()
  }
  /** @type {number|null} */
  editingId = null
  isEditing(/** @type {number} */ id) {
    return this.editingId === id
  }
  editInput = ''
  update(/** @type {number} */ id, /** @type {string} */ text) {
    this.model.update(id, text)
    this.editingId = null
  }
}
