export class ToDoItem {
  constructor(id, text, done) {
    /** @type {number} */
    this.id = id
    /** @type {string} */
    this.text = text
    /** @type {boolean} */
    this.done = done
  }
}

export class ToDoList {
  /** @type {ToDoItem[]} */
  list = []
  _currentId = 0
  getItemById(/** @type {number} */ id) {
    return this.list.find((x) => x.id === id)
  }
  getIndexById(/** @type {number} */ id) {
    return this.list.findIndex((x) => x.id === id)
  }
  create(/** @type {string} */ text) {
    const item = new ToDoItem(++this._currentId, text, false)
    this.list.push(item)
    return this._currentId
  }
  toggle(/** @type {number} */ id) {
    const item = this.getItemById(id)
    if (item) item.done = !item.done
  }
  update(/** @type {number} */ id, /** @type {string} */ text) {
    const item = this.getItemById(id)
    if (item) item.text = text
  }
  delete(/** @type {number} */ id) {
    const index = this.getIndexById(id)
    if (index !== -1) this.list.splice(index, 1)
  }
  deleteAllCompleted() {
    this.list = this.list.filter((x) => !x.done)
  }
}
