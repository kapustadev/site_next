'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createTask, updateTaskColumn } from '@/actions'
import { createKanbanColumn, updateKanbanColumn, deleteKanbanColumn, sendProjectStatusMessage } from '@/actions/kanban'
import { addComment, deleteComment } from '@/actions/communications'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import styles from '../projects.module.css'

interface Comment {
  id: string
  content: string
  createdAt: Date
  authorId: string
  author: { id: string; name: string; role: string }
}

interface Task {
  id: string
  title: string
  description: string | null
  columnId: string | null
  dueDate: Date | null
  assignee: { id: string; name: string } | null
  comments: Comment[]
}

interface KanbanColumn {
  id: string
  name: string
  color: string
  order: number
  notifyClient: boolean
}

interface Project {
  id: string
  name: string
  description: string | null
  tasks: Task[]
  columns: KanbanColumn[]
}

interface User {
  id: string
  name: string
  role: string
}

export default function KanbanBoard({
  project,
  locale,
  users,
  canEdit,
  isReadOnly,
  currentUserId,
  role,
}: {
  project: Project
  locale: string
  users: User[]
  canEdit: boolean
  isReadOnly: boolean
  currentUserId: string
  role: string
}) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks)
  const [columns, setColumns] = useState<KanbanColumn[]>(project.columns)
  
  const [addingCol, setAddingCol] = useState<string | null>(null) // task to column
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddModal, setShowAddModal] = useState<string | null>(null) // task add modal
  const [modalForm, setModalForm] = useState({ title: '', description: '', assigneeId: '', dueDate: '' })
  
  // Column Management
  const [showColModal, setShowColModal] = useState<KanbanColumn | 'new' | null>(null)
  const [colForm, setColForm] = useState({ name: '', color: '#3b82f6', notifyClient: false })

  // Notification Popup
  const [showNotifyModal, setShowNotifyModal] = useState<{ taskId: string, destColId: string } | null>(null)
  const [notifyMsg, setNotifyMsg] = useState('')

  const [isPending, startTransition] = useTransition()
  
  // Task Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [commentText, setCommentText] = useState('')

  function getColumnTasks(colId: string) {
    return tasks.filter(t => t.columnId === colId)
  }

  function formatDue(d: Date | null) {
    if (!d) return null
    const date = new Date(d)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return { text: `${Math.abs(days)}д просрочено`, urgent: true }
    if (days === 0) return { text: 'Сегодня', urgent: true }
    if (days === 1) return { text: 'Завтра', urgent: false }
    return { text: `${days}д`, urgent: false }
  }

  function getInitials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination || isReadOnly) return
    const { draggableId, destination, source } = result
    
    const newStatusId = destination.droppableId
    const oldStatusId = source.droppableId

    if (newStatusId === oldStatusId) return

    const destCol = columns.find(c => c.id === newStatusId)
    
    if (destCol?.notifyClient) {
      // Show notification modal
      const taskTitle = tasks.find(t => t.id === draggableId)?.title || 'задачу'
      let msg = ''
      if (destCol.name === 'В работе') {
        msg = `Добрый день! Мы взяли задачу «${taskTitle}» в работу.`
      } else if (destCol.name === 'Тестирование') {
        msg = `Добрый день! Мы выполнили правку по задаче «${taskTitle}», она готова, мы её тестируем.`
      } else if (destCol.name === 'Ревью') {
        msg = `Добрый день! Теперь ваша очередь проверить задачу «${taskTitle}».`
      } else if (destCol.name === 'Готово') {
        msg = `Задача «${taskTitle}» была проверена, утверждена и закончена.`
      } else {
        msg = `Задача «${taskTitle}» перенесена в статус «${destCol.name}».`
      }
      setNotifyMsg(msg)
      setShowNotifyModal({ taskId: draggableId, destColId: newStatusId })
    } else {
      // Just move without notification
      setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, columnId: newStatusId } : t))
      startTransition(async () => {
        await updateTaskColumn(draggableId, newStatusId)
      })
    }
  }

  async function handleNotifyConfirm() {
    if (!showNotifyModal) return
    const { taskId, destColId } = showNotifyModal

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, columnId: destColId } : t))
    setShowNotifyModal(null)

    startTransition(async () => {
      await updateTaskColumn(taskId, destColId)
      if (notifyMsg.trim()) {
        await sendProjectStatusMessage(project.id, notifyMsg.trim())
      }
      setNotifyMsg('')
    })
  }

  function handleNotifySkip() {
    if (!showNotifyModal) return
    const { taskId, destColId } = showNotifyModal
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, columnId: destColId } : t))
    setShowNotifyModal(null)
    startTransition(async () => {
      await updateTaskColumn(taskId, destColId)
    })
  }

  async function handleModalAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!modalForm.title.trim()) return
    const firstCol = columns[0]?.id
    startTransition(async () => {
      const task = await createTask({
        title: modalForm.title,
        description: modalForm.description || undefined,
        projectId: project.id,
        columnId: showAddModal ?? firstCol,
        assigneeId: modalForm.assigneeId || undefined,
        dueDate: modalForm.dueDate || undefined,
      })
      const assignee = users.find(u => u.id === modalForm.assigneeId) ?? null
      setTasks(prev => [...prev, { ...task, assignee, comments: [] } as any])
      setModalForm({ title: '', description: '', assigneeId: '', dueDate: '' })
      setShowAddModal(null)
    })
  }

  // Column management
  async function handleSaveColumn(e: React.FormEvent) {
    e.preventDefault()
    if (!colForm.name.trim()) return

    startTransition(async () => {
      if (showColModal === 'new') {
        const newCol = await createKanbanColumn(project.id, {
          name: colForm.name,
          color: colForm.color,
          notifyClient: colForm.notifyClient
        })
        setColumns(prev => [...prev, newCol as any])
      } else if (typeof showColModal === 'object' && showColModal !== null) {
        const updated = await updateKanbanColumn(showColModal.id, project.id, {
          name: colForm.name,
          color: colForm.color,
          notifyClient: colForm.notifyClient
        })
        setColumns(prev => prev.map(c => c.id === showColModal.id ? updated as any : c))
      }
      setShowColModal(null)
      setColForm({ name: '', color: '#3b82f6', notifyClient: false })
    })
  }

  async function handleDeleteColumn(colId: string) {
    if (!confirm('Вы уверены? Задачи из этой колонки останутся без статуса.')) return
    startTransition(async () => {
      await deleteKanbanColumn(colId, project.id)
      setColumns(prev => prev.filter(c => c.id !== colId))
      setTasks(prev => prev.map(t => t.columnId === colId ? { ...t, columnId: null } : t))
    })
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || !selectedTask) return
    startTransition(async () => {
      const comment = await addComment(selectedTask.id, commentText)
      const updatedTasks = tasks.map(t => {
        if (t.id === selectedTask.id) {
          const updatedTask = { ...t, comments: [...t.comments, comment as any] }
          setSelectedTask(updatedTask)
          return updatedTask
        }
        return t
      })
      setTasks(updatedTasks)
      setCommentText('')
    })
  }

  async function handleDelComment(commentId: string) {
    if (!confirm('Удалить комментарий?')) return
    startTransition(async () => {
      await deleteComment(commentId)
      const updatedTasks = tasks.map(t => {
        if (t.id === selectedTask?.id) {
          const updatedTask = { ...t, comments: t.comments.filter(c => c.id !== commentId) }
          setSelectedTask(updatedTask)
          return updatedTask
        }
        return t
      })
      setTasks(updatedTasks)
    })
  }

  return (
    <div className={styles.boardPage}>
      <div className={styles.boardHeader}>
        <Link href={`/${locale}/projects`} className={styles.backBtn}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Проекты
        </Link>
        <div className={styles.boardTitle}>{project.name}</div>
        <div className={styles.boardActions}>
          {role === 'OWNER' && (
            <button
              className={styles.addBtn}
              onClick={() => { setColForm({ name: '', color: '#3b82f6', notifyClient: false }); setShowColModal('new') }}
              style={{ fontSize: '12px', height: '34px', padding: '0 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              + Колонка
            </button>
          )}
          {canEdit && (
            <button
              className={styles.addBtn}
              onClick={() => setShowAddModal(columns[0]?.id)}
              style={{ fontSize: '12px', height: '34px', padding: '0 14px' }}
            >
              Добавить задачу
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className={styles.board}>
          {columns.map(col => {
            const colTasks = getColumnTasks(col.id)
            return (
              <div key={col.id} className={styles.column}>
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitleWrap}>
                    <div className={styles.columnDot} style={{ background: col.color }} />
                    <span className={styles.columnTitle}>{col.name}</span>
                    <span className={styles.columnCount}>{colTasks.length}</span>
                  </div>
                  {role === 'OWNER' && (
                    <button
                      onClick={() => { setColForm({ name: col.name, color: col.color, notifyClient: col.notifyClient }); setShowColModal(col) }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px' }}
                      title="Редактировать колонку"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2a1 1 0 100-2 1 1 0 000 2zm0 6a1 1 0 100-2 1 1 0 000 2zm0 6a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/></svg>
                    </button>
                  )}
                </div>

                <Droppable droppableId={col.id} isDropDisabled={isReadOnly}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={styles.columnBody}
                      style={{
                        background: snapshot.isDraggingOver ? `${col.color}10` : undefined,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {colTasks.map((task, index) => {
                        const due = formatDue(task.dueDate)
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={isReadOnly || !canEdit}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                                className={`${styles.taskCard} ${snapshot.isDragging ? styles.taskCardDragging : ''}`}
                                onClick={() => setSelectedTask(task)}
                              >
                                <div className={styles.taskCardTitle}>{task.title}</div>
                                <div className={styles.taskCardFooter}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {task.assignee && (
                                      <div className={styles.taskAssignee} title={task.assignee.name}>
                                        {getInitials(task.assignee.name)}
                                      </div>
                                    )}
                                    {task.comments?.length > 0 && (
                                      <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>💬 {task.comments.length}</div>
                                    )}
                                  </div>
                                  {due && (
                                    <div className={`${styles.taskDue} ${due.urgent ? styles.taskDueUrgent : ''}`}>
                                      {due.text}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Task Create Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Новая задача</span>
              <button className={styles.modalClose} onClick={() => setShowAddModal(null)}>✕</button>
            </div>
            <form onSubmit={handleModalAdd}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Название *</label>
                  <input autoFocus className={styles.formInput} value={modalForm.title} onChange={e => setModalForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Описание</label>
                  <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={modalForm.description} onChange={e => setModalForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Исполнитель</label>
                    <select className={styles.formInput} value={modalForm.assigneeId} onChange={e => setModalForm(f => ({ ...f, assigneeId: e.target.value }))}>
                      <option value="">— Не назначен —</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Дедлайн</label>
                    <CustomDatePicker className={styles.formInput} value={modalForm.dueDate} onChange={val => setModalForm(f => ({ ...f, dueDate: val }))} />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Колонка</label>
                  <select className={styles.formInput} value={showAddModal} onChange={e => setShowAddModal(e.target.value)}>
                    {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowAddModal(null)}>Отмена</button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !modalForm.title.trim()}>Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Column Manage Modal */}
      {showColModal && (
        <div className={styles.modalOverlay} onClick={() => setShowColModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>{showColModal === 'new' ? 'Новая колонка' : 'Редактирование колонки'}</span>
              <button className={styles.modalClose} onClick={() => setShowColModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveColumn}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Название *</label>
                  <input autoFocus className={styles.formInput} value={colForm.name} onChange={e => setColForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Цвет (HEX)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={colForm.color} onChange={e => setColForm(f => ({ ...f, color: e.target.value }))} style={{ width: '40px', height: '40px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }} />
                    <input className={styles.formInput} value={colForm.color} onChange={e => setColForm(f => ({ ...f, color: e.target.value }))} style={{ flex: 1 }} />
                  </div>
                </div>
                <div className={styles.formField} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input type="checkbox" id="notifyClient" checked={colForm.notifyClient} onChange={e => setColForm(f => ({ ...f, notifyClient: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                  <label htmlFor="notifyClient" style={{ fontSize: '14px', color: 'var(--text)', cursor: 'pointer' }}>Уведомлять клиента в чат при переносе сюда</label>
                </div>
              </div>
              <div className={styles.modalFooter} style={{ justifyContent: 'space-between' }}>
                {showColModal !== 'new' ? (
                  <button type="button" className={styles.btnCancel} style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => handleDeleteColumn((showColModal as KanbanColumn).id)}>Удалить</button>
                ) : <div/>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className={styles.btnCancel} onClick={() => setShowColModal(null)}>Отмена</button>
                  <button type="submit" className={styles.btnSave} disabled={isPending || !colForm.name.trim()}>Сохранить</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notify Popup Modal */}
      {showNotifyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Уведомление клиенту</span>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Вы переместили задачу в колонку, для которой включены уведомления. Отправить сообщение в проектный чат?</p>
              <textarea
                className={`${styles.formInput} ${styles.formTextarea}`}
                value={notifyMsg}
                onChange={e => setNotifyMsg(e.target.value)}
                placeholder="Сообщение..."
              />
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={handleNotifySkip}>Пропустить</button>
              <button type="button" className={styles.btnSave} onClick={handleNotifyConfirm} disabled={isPending || !notifyMsg.trim()}>
                {isPending ? 'Отправка...' : 'Отправить в чат'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal (Comments) */}
      {selectedTask && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={styles.modalTitle}>{selectedTask.title}</span>
                {selectedTask.columnId && (
                  <span className={styles.columnCount} style={{ background: columns.find(c => c.id === selectedTask.columnId)?.color + '20', color: columns.find(c => c.id === selectedTask.columnId)?.color }}>
                    {columns.find(c => c.id === selectedTask.columnId)?.name}
                  </span>
                )}
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedTask(null)}>✕</button>
            </div>
            
            <div className={styles.modalBody} style={{ gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedTask.description && (
                  <div>
                    <div className={styles.formLabel} style={{ marginBottom: '6px' }}>Описание</div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedTask.description}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '24px' }}>
                  {selectedTask.assignee && (
                    <div>
                      <div className={styles.formLabel} style={{ marginBottom: '6px' }}>Исполнитель</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                        <div className={styles.taskAssignee}>{getInitials(selectedTask.assignee.name)}</div>
                        {selectedTask.assignee.name}
                      </div>
                    </div>
                  )}
                  {selectedTask.dueDate && (
                    <div>
                      <div className={styles.formLabel} style={{ marginBottom: '6px' }}>Дедлайн</div>
                      <div style={{ fontSize: '13px', color: 'var(--text)' }}>{new Date(selectedTask.dueDate).toLocaleDateString('ru-RU')}</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <div className={styles.formLabel} style={{ marginBottom: '16px' }}>Комментарии</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedTask.comments.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Нет комментариев</div>
                  ) : (
                    selectedTask.comments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: '12px' }}>
                        <div className={styles.taskAssignee}>{getInitials(c.author.name)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{c.author.name}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{new Date(c.createdAt).toLocaleString('ru-RU')}</span>
                            {(c.authorId === currentUserId || users.some(u => u.id === currentUserId && ['OWNER', 'PM'].includes(u.role))) && (
                              <button onClick={() => handleDelComment(c.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '10px', cursor: 'pointer', padding: 0 }}>удалить</button>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <textarea className={styles.formInput} placeholder="Написать комментарий..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ minHeight: '40px', resize: 'vertical' }} />
                  <button type="submit" className={styles.btnSave} disabled={isPending || !commentText.trim()} style={{ height: 'auto', padding: '10px 16px' }}>Отправить</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
