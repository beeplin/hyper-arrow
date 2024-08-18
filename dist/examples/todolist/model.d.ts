export class ToDoItem {
    constructor(id: any, text: any, done: any);
    /** @type {number} */
    id: number;
    /** @type {string} */
    text: string;
    /** @type {boolean} */
    done: boolean;
}
export class ToDoList {
    /** @type {ToDoItem[]} */
    list: ToDoItem[];
    _currentId: number;
    getItemById(id: number): ToDoItem;
    getIndexById(id: number): number;
    create(text: string): number;
    toggle(id: number): void;
    update(id: number, text: string): void;
    delete(id: number): void;
    deleteAllCompleted(): void;
}
//# sourceMappingURL=model.d.ts.map