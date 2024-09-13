export class ToDoItem {
    constructor(
    /** @type {number} */ id, 
    /** @type {string} */ text, 
    /** @type {boolean} */ done) {
        /** @type {number} */ this.id = id;
        /** @type {string} */ this.text = text;
        /** @type {boolean} */ this.done = done;
    }
}
export class ToDoList {
    constructor() {
        /** @type {ToDoItem[]} */ this.list = [];
        this._currentId = 0;
    }
    getItemById(/** @type {number} */ id) {
        return this.list.find((x) => x.id === id);
    }
    getIndexById(/** @type {number} */ id) {
        return this.list.findIndex((x) => x.id === id);
    }
    create(/** @type {string} */ text) {
        const item = new ToDoItem(++this._currentId, text, false);
        this.list.push(item);
        return this._currentId;
    }
    toggle(/** @type {number} */ id) {
        const item = this.getItemById(id);
        if (item)
            item.done = !item.done;
    }
    update(/** @type {number} */ id, /** @type {string} */ text) {
        const item = this.getItemById(id);
        if (item)
            item.text = text;
    }
    delete(/** @type {number} */ id) {
        const index = this.getIndexById(id);
        // splice 会导致许多无效列表更新
        // if (index !== -1) this.list.splice(index, 1)
        this.list = this.list.filter((item) => item.id !== id);
    }
    deleteAllCompleted() {
        this.list = this.list.filter((x) => !x.done);
    }
}
