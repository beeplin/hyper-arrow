import { mount, reactive } from '../../hyper-arrow.js'
import { ToDoList } from './model.js'
import { ToDoListState } from './state.js'
import { view } from './view.js'

const s = reactive(new ToDoListState(new ToDoList()))
mount('#app', view(s))

s.model.create('aaa')
s.model.create('bbb')
s.model.create('ccc')
