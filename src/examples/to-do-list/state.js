import { ToDoList } from './model.js'

export class ToDoListState {
  newInput = ''
  filter = 'all'
  /**@type {number?}*/ editingId = null
  editInput = ''

  constructor(/**@type {ToDoList}*/ list) {
    /**@type {ToDoList}*/ this.model = list
  }

  createFromInput() {
    const trimmed = this.newInput.trim()
    if (trimmed === '') return
    this.newInput = ''
    return this.model.create(trimmed)
  }

  getShownList() {
    return this.filter === 'active'
      ? this.model.list.filter((x) => !x.done).reverse()
      : this.filter === 'completed'
      ? this.model.list.filter((x) => x.done).reverse()
      : [...this.model.list].reverse()
  }

  isEditing(/**@type {number}*/ id) {
    return this.editingId === id
  }

  updateItemText(/**@type {number}*/ id, /**@type {string}*/ text) {
    this.model.update(id, text)
    this.editingId = null
  }

  swap(/**@type {number}*/ i, /**@type {number}*/ j) {
    i = this.model.list.findIndex(
      (item, index) => item.id === this.getShownList()[i].id,
    )
    j = this.model.list.findIndex(
      (item, index) => item.id === this.getShownList()[j].id,
    )

    // // simple swap. will have duplicate ids and cannot smart update DOM
    // const x = this.model.list[i]
    // this.model.list[i] = this.model.list[j]
    // this.model.list[j] = x

    // // avoid duplicate ids and can smart update DOM
    // let x = new ToDoItem(-1, '', false)
    // let y = this.model.list[i]
    // this.model.list[i] = x
    // x = this.model.list[j]
    // this.model.list[j] = y
    // this.model.list[i] = x

    // best solution
    this.model.list = this.model.list.map(
      (_, index) => this.model.list[index === i ? j : index === j ? i : index],
    )
  }
}
