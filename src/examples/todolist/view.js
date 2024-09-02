import { deps, h, tags } from '../../index.js'
import { ToDoListState } from './state.js'
import { test } from './test.js'

const { button, div, input, label, li, small, ul } = tags

export function view(/** @type {ToDoListState} */ s) {
  return h('div', { id: 'root' }, [
    div({ id: 'title-container' }, [
      label({ id: 'title', _for: 'input', innerText: 'To-Do-List' }),
      () => small([() => s.newInput || 'via hyper-arrow']),
      button({
        id: 'log',
        innerText: 'log deps',
        onclick() {
          console.log(deps)
        },
      }),
      button({
        id: 'test',
        innerText: 'auto test',
        disabled: () => !!s.editingId,
        onClick() {
          test(s)
        },
      }),
    ]),
    div({ id: 'input-container' }, [
      input({
        id: 'input',
        type: 'text',
        value: () => s.newInput,
        disabled: () => !!s.editingId,
        placeholder: 'input new to-do here...',
        $padding: '1px 3px',
        onInput(/**@type {any}*/ e) {
          s.newInput = e.target.value
        },
        onKeyDown(/**@type {any}*/ e) {
          if (e.code === 'Enter') s.createFromInput()
        },
      }),
      button({
        id: 'add',
        innerText: 'add',
        disabled: () => !s.newInput || !!s.editingId,
        onClick: s.createFromInput.bind(s),
      }),
      button({
        id: 'clear',
        innerText: 'clear',
        disabled: () => !s.newInput || !!s.editingId,
        onClick() {
          s.newInput = ''
        },
      }),
    ]),
    div({ id: 'filter-container' }, [
      button({
        id: 'all',
        innerText: 'all',
        disabled: () => s.filter === 'all' || !!s.editingId,
        onClick() {
          s.filter = 'all'
        },
      }),
      button({
        id: 'active',
        innerText: 'active',
        disabled: () => s.filter === 'active' || !!s.editingId,
        onClick() {
          s.filter = 'active'
        },
      }),
      button({
        id: 'completed',
        innerText: 'completed',
        disabled: () => s.filter === 'completed' || !!s.editingId,
        onClick() {
          s.filter = 'completed'
        },
      }),
    ]),
    button({
      id: 'delete-all-completed',
      innerText: 'delete all completed',
      disabled: () => !!s.editingId,
      onClick: s.model.deleteAllCompleted.bind(s.model),
    }),
    ul({ id: 'list', style: 'padding: 0' }, () =>
      s.getFilteredReversedList().map((item) =>
        li({ id: () => 'li-' + item.id, class: 'item-container', key: () => item.id }, [
          input({
            id: () => 'checkbox-' + item.id,
            class: 'checkbox',
            type: 'checkbox',
            checked: () => item.done,
            disabled: () => !!s.editingId,
            onInput() {
              s.model.toggle(item.id)
            },
          }),
          () =>
            s.isEditing(item.id)
              ? input({
                  id: () => 'edit-' + item.id,
                  class: 'item-input',
                  type: 'text',
                  value: () => s.editInput,
                  onInput(/**@type {any}*/ e) {
                    s.editInput = e.target.value
                  },
                  onKeyDown(/**@type {any}*/ e) {
                    if (e.keyCode === 13) s.update(item.id, s.editInput)
                  },
                })
              : label({
                  id: () => 'label-' + item.id,
                  class: () => 'item-label' + (item.done ? ' done' : ''),
                  for: () => 'checkbox-' + item.id,
                  innerText: () => item.text,
                  $minWidth: '150px',
                }),
          button({
            id: () => (s.isEditing(item.id) ? 'ok' : 'edit') + '-' + item.id,
            class: () => (s.isEditing(item.id) ? 'item-ok' : 'item-edit'),
            innerText: () => (s.isEditing(item.id) ? 'ok' : 'edit'),
            disabled: () => !!s.editingId && s.editingId !== item.id,
            onClick() {
              if (s.editingId === item.id) s.update(item.id, s.editInput)
              else {
                s.editingId = item.id
                s.editInput = item.text
                requestAnimationFrame(() => {
                  document.getElementById('edit-' + item.id)?.focus()
                  // @ts-ignore
                  document.getElementById('edit-' + item.id)?.select()
                })
              }
            },
          }),
          button({
            id: () => (s.isEditing(item.id) ? 'cancel' : 'delete') + '-' + item.id,
            class: () => (s.isEditing(item.id) ? 'item-cancel' : 'item-delete'),
            innerText: () => (s.isEditing(item.id) ? 'cancel' : 'delete'),
            disabled: () => !!s.editingId && s.editingId !== item.id,
            onClick() {
              if (s.editingId === item.id) s.editingId = null
              else s.model.delete(item.id)
            },
          }),
        ]),
      ),
    ),
  ])
}
