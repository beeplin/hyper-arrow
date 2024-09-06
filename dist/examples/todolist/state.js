import { ToDoList } from './model.js';
export class ToDoListState {
    constructor(/**@type {ToDoList}*/ list) {
        this.newInput = '';
        this.filter = 'all';
        /**@type {number|null}*/
        this.editingId = null;
        this.editInput = '';
        this.model = list;
    }
    createFromInput() {
        const trimmed = this.newInput.trim();
        if (trimmed === '')
            return;
        this.newInput = '';
        return this.model.create(trimmed);
    }
    getFilteredReversedList() {
        return this.filter === 'active'
            ? this.model.list.filter((x) => !x.done).reverse()
            : this.filter === 'completed'
                ? this.model.list.filter((x) => x.done).reverse()
                : [...this.model.list].reverse();
    }
    isEditing(/**@type {number}*/ id) {
        return this.editingId === id;
    }
    update(/**@type {number}*/ id, /**@type {string}*/ text) {
        this.model.update(id, text);
        this.editingId = null;
    }
}
