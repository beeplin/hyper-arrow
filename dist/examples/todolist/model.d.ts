export class ToDoItem {
    constructor(id: number, text: string, done: boolean);
    /** @type {number} */ id: number;
    /** @type {string} */ text: string;
    /** @type {boolean} */ done: boolean;
}
export class ToDoList {
    /** @type {ToDoItem[]} */ list: ToDoItem[];
    _currentId: number;
    getItemById(id: number): ToDoItem | undefined;
    getIndexById(id: number): number;
    create(text: string): number;
    toggle(id: number): void;
    update(id: number, text: string): void;
    delete(id: number): void;
    deleteAllCompleted(): void;
}
//# sourceMappingURL=model.d.ts.map