import { deps, reverseDeps, tags } from '../../hyper-arrow.js'
import { ToDoItem } from './model.js'
import { ToDoListState } from './state.js'
import { test } from './test.js'

const { button, div, input, label, li, small, ul } = tags.html
const { svg, circle } = tags.svg
const { math, semantics, mfrac, mi, mn } = tags.mathml

export function view(/**@type {ToDoListState}*/ s) {
  function item(/**@type {number}*/ i) {
    return s.getFilteredReversedList()[i]
  }
  return div({ id: 'root' }, [
    div(
      {
        $height: '100px',
        $display: 'flex',
        $flexDirection: 'row',
        $alignItems: 'baseline',
      },
      [
        svg({ xmlns: 'http://www.w3.org/2000/svg', stroke: 'red', fill: 'grey' }, [
          circle({ cx: '50', cy: '50', r: () => (s.newInput.length + 10).toString() }),
        ]),
        math({ display: 'block' }, [
          semantics(
            mfrac(
              mi('x'),
              mn(() => s.newInput.length.toString()),
            ),
          ),
        ]),
      ],
    ),
    div({ id: 'title-container' }, [
      label({ id: 'title', _for: 'input', innerText: 'To-Do-List' }),
      () => small(() => s.newInput || 'via hyper-arrow'),
      button({
        id: 'log',
        innerText: 'log deps',
        onclick() {
          console.log(deps)
          console.log(reverseDeps)
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
    ul({ id: 'list', style: 'padding: 0', cacheRemovedChildren: true }, () =>
      s.getFilteredReversedList().map((item, i) =>
        li({ id: () => 'li-' + item.id, class: 'item-container' }, [
          button({
            id: () => 'up-' + item.id,
            class: 'item-up',
            innerHTML: '⇧',
            disabled: () => !!s.editingId,
            onClick() {
              const j = s.getFilteredReversedList().findIndex((j) => j.id === item.id)
              if (j === 0) return
              const prevItem = s.getFilteredReversedList()[j - 1]
              swap(s.model.list, item, prevItem)
            },
          }),
          button({
            id: () => 'down-' + item.id,
            class: 'item-down',
            innerHTML: '⇩',
            disabled: () => !!s.editingId,
            onClick() {
              const j = s.getFilteredReversedList().findIndex((j) => j.id === item.id)
              if (j === s.getFilteredReversedList().length - 1) return
              const nextItem = s.getFilteredReversedList()[j + 1]
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
                  onCreate(/**@type {any}*/ el) {
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
            innerText: () => (s.isEditing(item.id) ? '✓' : '🖉'),
            disabled: () => !!s.editingId && s.editingId !== item.id,
            onClick() {
              if (s.editingId === item.id) s.update(item.id, s.editInput)
              else {
                s.editingId = item.id
                s.editInput = item.text
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

function swap(
  /**@type {ToDoItem[]}*/ list,
  /**@type {ToDoItem}*/ a,
  /**@type {ToDoItem}*/ b,
) {
  const ia = list.findIndex((i) => i.id === a.id)
  const ib = list.findIndex((i) => i.id === b.id)

  // let x = new ToDoItem(-1, '', false)
  // let y = a
  // list[ia] = x
  // x = b
  // list[ib] = a
  // list[ia] = b

  let x = a
  list[ia] = b
  list[ib] = x

  // if (ib < ia) {
  //   list.splice(ia, 1)
  //   list.splice(ib, 1, a)
  //   list.splice(ia, 0, b)
  // } else {
  //   list.splice(ib, 1)
  //   list.splice(ia, 1, b)
  //   list.splice(ib, 0, a)
  // }
}
