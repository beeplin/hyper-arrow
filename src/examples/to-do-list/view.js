import {
  CACHE_REMOVED_CHILDREN,
  fawc2ropas,
  ON_CREATE,
  ropa2fawcs,
  tags,
} from '../../hyper-arrow.js'
import { ToDoListState } from './state.js'
import { test } from './test.js'

const { button, div, input, label, li, small, ul } = tags.html

export function view(/** @type {ToDoListState} */ s) {
  return div({ id: 'root' }, [
    div({ id: 'title-container' }, [
      label({ id: 'title', _for: 'input', innerText: 'To-Do-List' }),
      () => small({ id: 'small' }, () => s.newInput || 'via hyper-arrow'),
      button({
        id: 'log',
        type: 'button',
        innerText: 'log deps',
        onclick() {
          console.log(fawc2ropas)
          console.log(ropa2fawcs)
        },
      }),
      button({
        id: 'test',
        type: 'button',
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
        onInput(/** @type {any} */ e) {
          s.newInput = e.target.value
        },
        onKeyDown(/** @type {any} */ e) {
          if (e.code === 'Enter') s.createFromInput()
        },
      }),
      button({
        id: 'add',
        type: 'button',
        innerText: '✓',
        disabled: () => !s.newInput || !!s.editingId,
        onClick: s.createFromInput.bind(s),
      }),
      button({
        id: 'clear',
        type: 'button',
        innerText: '✗',
        disabled: () => !s.newInput || !!s.editingId,
        onClick() {
          s.newInput = ''
        },
      }),
    ]),
    div({ id: 'filter-container' }, [
      div({ class: 'filter' }, [
        input({
          id: 'all',
          type: 'radio',
          name: 'filter',
          value: 'all',
          checked: () => s.filter === 'all',
          disabled: () => !!s.editingId,
          onInput() {
            s.filter = 'all'
          },
        }),
        label({ id: 'label-all', for: 'all', innerText: 'all' }),
      ]),
      div({ class: 'filter' }, [
        input({
          id: 'active',
          type: 'radio',
          name: 'filter',
          value: 'active',
          checked: () => s.filter === 'active',
          disabled: () => !!s.editingId,
          onClick() {
            s.filter = 'active'
          },
        }),
        label({ id: 'label-active', for: 'active', innerText: 'active' }),
      ]),
      div({ class: 'filter' }, [
        input({
          id: 'completed',
          type: 'radio',
          name: 'filter',
          value: 'completed',
          checked: () => s.filter === 'completed',
          disabled: () => !!s.editingId,
          onClick() {
            s.filter = 'completed'
          },
        }),
        label({
          id: 'label-completed',
          for: 'completed',
          innerText: 'completed',
        }),
      ]),
      button({
        id: 'delete-all-completed',
        type: 'button',
        innerText: 'delete all completed',
        disabled: () => !!s.editingId,
        onClick: s.model.deleteAllCompleted.bind(s.model),
      }),
    ]),
    ul({ id: 'ul', style: 'padding: 0', [CACHE_REMOVED_CHILDREN]: 10 }, () =>
      s.getShownList().map((item, i) =>
        li({ id: () => 'li-' + item.id, class: 'item-container' }, [
          button({
            id: () => 'up-' + item.id,
            class: 'item-up',
            type: 'button',
            innerHTML: '⇧',
            disabled: () => !!s.editingId || i === 0,
            onClick() {
              s.swap(i - 1, i)
            },
          }),
          button({
            id: () => 'down-' + item.id,
            class: 'item-down',
            type: 'button',
            innerHTML: '⇩',
            disabled: () => !!s.editingId || i === s.getShownList().length - 1,
            onClick() {
              s.swap(i, i + 1)
            },
          }),
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
                  onInput(/** @type {any} */ e) {
                    s.editInput = e.target.value
                  },
                  onKeyDown(/** @type {any} */ e) {
                    if (e.keyCode === 13) s.updateItemText(item.id, s.editInput)
                  },
                  [ON_CREATE](/** @type {any} */ el) {
                    requestAnimationFrame(() => el.select())
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
            type: 'button',
            innerText: () => (s.isEditing(item.id) ? '✓' : '🖉'),
            disabled: () => !!s.editingId && s.editingId !== item.id,
            onClick() {
              if (s.editingId === item.id)
                s.updateItemText(item.id, s.editInput)
              else {
                s.editingId = item.id
                s.editInput = item.text
              }
            },
          }),
          button({
            id: () =>
              (s.isEditing(item.id) ? 'cancel' : 'delete') + '-' + item.id,
            class: () => (s.isEditing(item.id) ? 'item-cancel' : 'item-delete'),
            type: 'button',
            innerText: () => (s.isEditing(item.id) ? '✗' : '🗑'),
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
