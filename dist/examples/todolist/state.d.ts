export class ToDoListState {
    constructor(list: ToDoList);
    /** @type {ToDoList} */
    model: ToDoList;
    newInput: string;
    createFromInput(): number;
    filter: string;
    getFilteredReversedList(): import("./model.js").ToDoItem[];
    /** @type {number|null} */
    editingId: number | null;
    isEditing(id: number): boolean;
    editInput: string;
    update(id: number, text: string): void;
}
import { ToDoList } from './model.js';
//# sourceMappingURL=state.d.ts.map