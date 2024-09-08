import { mount, reactive, UID_ATTR_NAME } from '../../hyper-arrow.js'
import { ToDoList } from './model.js'
import { ToDoListState } from './state.js'
import { view } from './view.js'

const s = reactive(new ToDoListState(new ToDoList()))
mount('#app', view(s), { [UID_ATTR_NAME]: 'uid' })

s.model.create('aaa')
s.model.create('bbb')
s.model.create('ccc')
