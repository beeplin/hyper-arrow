// @ts-check
import { reactive } from '../../index.js'
import { ToDoList } from './model.js'
import { ToDoListState } from './state.js'
import { render } from './view.js'

const s = reactive(new ToDoListState(new ToDoList()))
document.querySelector('#app')?.append(render(s))

s.model.create('aaa')
s.model.create('bbb')
s.model.create('ccc')
