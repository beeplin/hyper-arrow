import { deps, h, tags } from '../../hyper-arrow.js'
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
        innerText: '✓',
        disabled: () => !s.newInput || !!s.editingId,
        onClick: s.createFromInput.bind(s),
      }),
      button({
        id: 'clear',
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
        label({ id: 'label-completed', for: 'completed', innerText: 'completed' }),
      ]),
      button({
        id: 'delete-all-completed',
        innerText: 'delete all completed',
        disabled: () => !!s.editingId,
        onClick: s.model.deleteAllCompleted.bind(s.model),
      }),
    ]),
    ul({ id: 'list', style: 'padding: 0', cacheChildrenByKey: true }, () =>
      s.getFilteredReversedList().map((item) =>
        li({ id: () => 'li-' + item.id, class: 'item-container', key: () => item.id }, [
          button({
            id: () => 'up-' + item.id,
            class: 'item-up',
            innerHTML: '⇧',
            disabled: () => !!s.editingId,
            onClick() {
              const index = s
                .getFilteredReversedList()
                .findIndex((i) => i.id === item.id)
              if (index === 0) return
              const prevItem = s.getFilteredReversedList()[index - 1]
              swap(s.model.list, item, prevItem)
            },
          }),
          button({
            id: () => 'down-' + item.id,
            class: 'item-down',
            innerHTML: '⇩',
            disabled: () => !!s.editingId,
            onClick() {
              const index = s
                .getFilteredReversedList()
                .findIndex((i) => i.id === item.id)
              if (index === s.getFilteredReversedList().length - 1) return
              const nextItem = s.getFilteredReversedList()[index + 1]
              swap(s.model.list, item, nextItem)
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
            innerText: () => (s.isEditing(item.id) ? '✓' : '🖉'),
            disabled: () => !!s.editingId && s.editingId !== item.id,
            // FIXME: 切换 filter 到 completed 后 innerText 和 disable 失效
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

/** @type {<T extends {id: unknown}>(list: T[], a: T, b: T) => void} */
function swap(list, a, b) {
  const ia = list.findIndex((i) => i.id === a.id)
  const ib = list.findIndex((i) => i.id === b.id)
  if (ib < ia) {
    list.splice(ia, 1)
    list.splice(ib, 1, a)
    list.splice(ia, 0, b)
  } else {
    list.splice(ib, 1)
    list.splice(ia, 1, b)
    list.splice(ib, 0, a)
  }
}
