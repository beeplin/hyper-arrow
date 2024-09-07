export class ToDoListState {
    constructor(list: ToDoList);
    newInput: string;
    filter: string;
    /**@type {number?}*/ editingId: number | null;
    editInput: string;
    /**@type {ToDoList}*/ model: ToDoList;
    createFromInput(): number | undefined;
    getShownList(): ToDoItem[];
    isEditing(id: number): boolean;
    updateItemText(id: number, text: string): void;
    swap(i: number, j: number): void;
}
import { ToDoList } from './model.js';
import { ToDoItem } from './model.js';
//# sourceMappingURL=state.d.ts.map