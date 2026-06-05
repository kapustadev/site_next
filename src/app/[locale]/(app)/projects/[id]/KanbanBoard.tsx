'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createTask, updateTaskStatus, deleteTask } from '@/actions'
import { addComment, deleteComment } from '@/actions/communications'
import styles from '../projects.module.css'

const COLUMNS = [
  { id: 'BACKLOG',     label: 'Backlog',      color: '#64748b' },
  { id: 'TODO',        label: 'To Do',        color: '#3b82f6' },
  { id: 'IN_PROGRESS', label: 'В работе',     color: '#f59e0b' },
  { id: 'REVIEW',      label: 'Ревью',        color: '#8b5cf6' },
  { id: 'TESTING',     label: 'Тестирование', color: '#06b6d4' },
  { id: 'DONE',        label: 'Готово',       color: '#22c55e' },
]

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
  status: string
  dueDate: Date | null
  assignee: { id: string; name: string } | null
  comments: Comment[]
}

interface Project {
  id: string
  name: string
  description: string | null
  tasks: Task[]
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
}: {
  project: Project
  locale: string
  users: User[]
  canEdit: boolean
  isReadOnly: boolean
  currentUserId: string
}) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks)
  const [addingCol, setAddingCol] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddModal, setShowAddModal] = useState<string | null>(null)
  const [modalForm, setModalForm] = useState({ title: '', description: '', assigneeId: '', dueDate: '' })
  const [isPending, startTransition] = useTransition()
  
  // Task Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [commentText, setCommentText] = useState('')

  function getColumnTasks(colId: string) {
    return tasks.filter(t => t.status === colId)
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
    const { draggableId, destination } = result
    const newStatus = destination.droppableId

    setTasks(prev =>
      prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t)
    )

    startTransition(async () => {
      await updateTaskStatus(draggableId, newStatus)
    })
  }

  async function handleQuickAdd(colId: string) {
    if (!newTaskTitle.trim()) { setAddingCol(null); return }
    startTransition(async () => {
      const task = await createTask({ title: newTaskTitle, projectId: project.id, status: colId })
      setTasks(prev => [...prev, { ...task, assignee: null, comments: [] } as any])
      setNewTaskTitle('')
      setAddingCol(null)
    })
  }

  async function handleModalAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!modalForm.title.trim()) return
    startTransition(async () => {
      const task = await createTask({
        title: modalForm.title,
        description: modalForm.description || undefined,
        projectId: project.id,
        status: showAddModal ?? 'TODO',
        assigneeId: modalForm.assigneeId || undefined,
        dueDate: modalForm.dueDate || undefined,
      })
      const assignee = users.find(u => u.id === modalForm.assigneeId) ?? null
      setTasks(prev => [...prev, { ...task, assignee, comments: [] } as any])
      setModalForm({ title: '', description: '', assigneeId: '', dueDate: '' })
      setShowAddModal(null)
    })
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Удалить задачу?')) return
    startTransition(async () => {
      await deleteTask(taskId, project.id)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      if (selectedTask?.id === taskId) setSelectedTask(null)
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
      {/* Header */}
      <div className={styles.boardHeader}>
        <Link href={`/${locale}/projects`} className={styles.backBtn}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Проекты
        </Link>
        <div className={styles.boardTitle}>{project.name}</div>
        {canEdit && (
          <div className={styles.boardActions}>
            <button
              className={styles.addBtn}
              onClick={() => setShowAddModal('TODO')}
              style={{ fontSize: '12px', height: '34px', padding: '0 14px' }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Добавить задачу
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={styles.board}>
          {COLUMNS.map(col => {
            const colTasks = getColumnTasks(col.id)
            return (
              <div key={col.id} className={styles.column}>
                {/* Column Header */}
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitleWrap}>
                    <div className={styles.columnDot} style={{ background: col.color }} />
                    <span className={styles.columnTitle}>{col.label}</span>
                    <span className={styles.columnCount}>{colTasks.length}</span>
                  </div>
                  {canEdit && (
                    <button
                      className={styles.columnAddBtn}
                      onClick={() => { setAddingCol(col.id); setNewTaskTitle('') }}
                      title="Добавить задачу"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Droppable Column */}
                <Droppable droppableId={col.id} isDropDisabled={isReadOnly}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={styles.columnBody}
                      style={{
                        background: snapshot.isDraggingOver
                          ? `${col.color}10`
                          : undefined,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {colTasks.map((task, index) => {
                        const due = formatDue(task.dueDate)
                        return (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                            isDragDisabled={isReadOnly || !canEdit}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${styles.taskCard} ${snapshot.isDragging ? styles.taskCardDragging : ''}`}
                                onClick={() => setSelectedTask(task)}
                              >
                                <div className={styles.taskCardTitle}>{task.title}</div>
                                <div className={styles.taskCardFooter}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {task.assignee && (
                                      <div
                                        className={styles.taskAssignee}
                                        title={task.assignee.name}
                                      >
                                        {getInitials(task.assignee.name)}
                                      </div>
                                    )}
                                    {task.comments?.length > 0 && (
                                      <div style={{ fontSize: '10px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        💬 {task.comments.length}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {due && (
                                      <div className={`${styles.taskDue} ${due.urgent ? styles.taskDueUrgent : ''}`}>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1"/>
                                          <path d="M5 3v2.5L6.5 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                        </svg>
                                        {due.text}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}

                      {/* Quick add form */}
                      {addingCol === col.id && canEdit && (
                        <div className={styles.addTaskForm}>
                          <textarea
                            autoFocus
                            className={styles.addTaskInput}
                            placeholder="Название задачи..."
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickAdd(col.id) }
                              if (e.key === 'Escape') setAddingCol(null)
                            }}
                          />
                          <div className={styles.addTaskActions}>
                            <button className={styles.addTaskSave} onClick={() => handleQuickAdd(col.id)} disabled={isPending}>
                              {isPending ? '...' : 'Добавить'}
                            </button>
                            <button className={styles.addTaskCancel} onClick={() => setAddingCol(null)}>✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Full Task Create Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Новая задача</span>
              <button className={styles.modalClose} onClick={() => setShowAddModal(null)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleModalAdd}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Название *</label>
                  <input
                    autoFocus
                    className={styles.formInput}
                    placeholder="Что нужно сделать?"
                    value={modalForm.title}
                    onChange={e => setModalForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Описание</label>
                  <textarea
                    className={`${styles.formInput} ${styles.formTextarea}`}
                    placeholder="Детали задачи..."
                    value={modalForm.description}
                    onChange={e => setModalForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  {users.length > 0 && (
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Исполнитель</label>
                      <select
                        className={styles.formInput}
                        value={modalForm.assigneeId}
                        onChange={e => setModalForm(f => ({ ...f, assigneeId: e.target.value }))}
                        style={{ appearance: 'auto' }}
                      >
                        <option value="">— Не назначен —</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Дедлайн</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={modalForm.dueDate}
                      onChange={e => setModalForm(f => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Колонка</label>
                  <select
                    className={styles.formInput}
                    value={showAddModal}
                    onChange={e => setShowAddModal(e.target.value)}
                    style={{ appearance: 'auto' }}
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowAddModal(null)}>
                  Отмена
                </button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !modalForm.title.trim()}>
                  {isPending ? 'Создаю...' : 'Создать задачу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal (with Comments) */}
      {selectedTask && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={styles.modalTitle}>{selectedTask.title}</span>
                <span className={styles.columnCount} style={{ background: COLUMNS.find(c => c.id === selectedTask.status)?.color + '20', color: COLUMNS.find(c => c.id === selectedTask.status)?.color }}>
                  {COLUMNS.find(c => c.id === selectedTask.status)?.label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {canEdit && (
                  <button className={styles.modalClose} onClick={() => handleDeleteTask(selectedTask.id)} title="Удалить задачу" style={{ color: 'var(--red)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M4 3V2h6v1M3 3l.5 8.5h7L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
                <button className={styles.modalClose} onClick={() => setSelectedTask(null)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className={styles.modalBody} style={{ gap: '24px' }}>
              {/* Info Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedTask.description && (
                  <div>
                    <div className={styles.formLabel} style={{ marginBottom: '6px' }}>Описание</div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {selectedTask.description}
                    </div>
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
                      <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                        {new Date(selectedTask.dueDate).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
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
                          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                            {c.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <textarea
                    className={styles.formInput}
                    placeholder="Написать комментарий..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    style={{ minHeight: '40px', resize: 'vertical' }}
                  />
                  <button type="submit" className={styles.btnSave} disabled={isPending || !commentText.trim()} style={{ height: 'auto', padding: '10px 16px' }}>
                    {isPending ? '...' : 'Отправить'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
