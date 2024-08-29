import { deps, h } from '../../index.js'
import { ToDoListState } from './state.js'
import { test } from './test.js'

export function render(/** @type {ToDoListState} */ s) {
  return h('div', { id: 'root' }, [
    h(
      'div#title-container',
      h('label#title', { for: 'input' }, 'To-Do-List'),
      () => h('small', () => s.newInput || 'via hyper-arrow'),
      h('button#log', {
        textContent: 'log deps',
        onclick() {
          console.log(deps)
        },
      }),
      h('button#test', {
        innerText: 'auto test',
        disabled: () => s.editingId,
        onClick() {
          test(s)
        },
      }),
    ),
    h('div#input-container', [
      h('input#input', {
        type: 'text',
        style: { padding: '1px 3px' },
        placeholder: 'input new to-do here...',
        value: () => s.newInput,
        disabled: () => s.editingId,
        onInput(e) {
          s.newInput = e.target.value
        },
        onKeyDown(e) {
          if (e.code === 'Enter') s.createFromInput()
        },
      }),
      h('button#add', {
        children: 'add',
        disabled: () => !s.newInput || s.editingId,
        onClick: s.createFromInput.bind(s),
      }),
      h('button#clear', {
        children: 'clear',
        disabled: () => !s.newInput || s.editingId,
        onClick() {
          s.newInput = ''
        },
      }),
    ]),
    h(
      'div',
      { id: 'filter-container' },
      h('button#all', {
        children: 'all',
        disabled: () => s.filter === 'all' || s.editingId,
        onClick() {
          s.filter = 'all'
        },
      }),
      h('button#active', {
        children: 'active',
        disabled: () => s.filter === 'active' || s.editingId,
        onClick() {
          s.filter = 'active'
        },
      }),
      h('button#completed', {
        children: 'completed',
        disabled: () => s.filter === 'completed' || s.editingId,
        onClick() {
          s.filter = 'completed'
        },
      }),
    ),
    h('button#delete-all-completed', {
      children: 'delete all completed',
      disabled: () => s.editingId,
      onClick: s.model.deleteAllCompleted.bind(s.model),
    }),
    h('ul#list', { style: 'padding: 0' }, () =>
      s.getFilteredReversedList().map((item) =>
        h('li.item-container', { id: () => 'li-' + item.id }, [
          h('input.checkbox', {
            type: 'checkbox',
            id: () => 'checkbox-' + item.id,
            checked: () => item.done,
            disabled: () => s.editingId,
            onInput() {
              s.model.toggle(item.id)
            },
          }),
          () =>
            s.isEditing(item.id)
              ? h('input.item-input', {
                  type: 'text',
                  id: () => 'edit-' + item.id,
                  value: () => s.editInput,
                  onInput(e) {
                    s.editInput = e.target.value
                  },
                  onKeyDown(e) {
                    if (e.keyCode === 13) s.update(item.id, s.editInput)
                  },
                })
              : h('label.item-label', {
                  children: item.text,
                  style: { minWidth: '150px' },
                  class: () => (item.done ? 'done' : ''),
                  id: () => 'label-' + item.id,
                  attributes: { for: () => 'checkbox-' + item.id },
                }),
          h('button', {
            children: () => (s.isEditing(item.id) ? 'ok' : 'edit'),
            id: () => (s.isEditing(item.id) ? 'ok' : 'edit') + '-' + item.id,
            class: () => (s.isEditing(item.id) ? 'item-ok' : 'item-edit'),
            disabled: () => s.editingId && s.editingId !== item.id,
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
          h('button.item-delete-cancel', {
            children: () => (s.isEditing(item.id) ? 'cancel' : 'delete'),
            id: () => (s.isEditing(item.id) ? 'cancel' : 'delete') + '-' + item.id,
            class: () => (s.isEditing(item.id) ? 'item-cancel' : 'item-delete'),
            disabled: () => s.editingId && s.editingId !== item.id,
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
