var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { watch } from '../../hyper-arrow.js';
import { ToDoListState } from './state.js';
const pause = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const raf = () => new Promise((r) => requestAnimationFrame(r));
export function test(/** @type {ToDoListState}  */ s) {
    return __awaiter(this, void 0, void 0, function* () {
        const count = 10;
        const stopWatch = watch(() => {
            console.log(s.newInput, s.filter, s.model._currentId);
        });
        watch(() => s.newInput, (x) => console.log('aaa', x, s.filter));
        for (let i = 0; i < count; i++) {
            yield raf();
            const id = s.model.create(String(i));
            const item = s.model.getItemById(id);
            yield raf();
            if (!item)
                return;
            if (i % 2)
                s.model.toggle(item.id);
            yield raf();
            if (i % 3) {
                s.editingId = item.id;
                yield raf();
                s.update(item.id, item.text + ' edited!');
            }
        }
        yield pause();
        s.filter = 'active';
        yield pause();
        s.filter = 'completed';
        yield pause();
        s.filter = 'all';
        yield pause();
        s.model.deleteAllCompleted();
        yield pause();
        for (let i = 0; i < count; i++) {
            yield raf();
            const id = s.model.create(String(i));
            const item = s.model.getItemById(id);
            if (!item)
                return;
            if (i % 2)
                s.model.toggle(item.id);
        }
        yield pause();
        s.filter = 'active';
        yield pause();
        s.filter = 'completed';
        yield pause();
        s.filter = 'all';
        yield pause();
        const length = s.model.list.length;
        for (let i = 0; i < length; i++) {
            yield raf();
            s.model.list.pop();
        }
        s.model.create('aaa');
        s.model.create('bbb');
        s.model.create('ccc');
        stopWatch();
    });
}
