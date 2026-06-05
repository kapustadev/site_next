'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { sendMessage, getMessages, createChatGroup } from '@/actions/communications'
import styles from './chat.module.css'

export default function ChatClient({
  groups: initialGroups,
  currentUserId,
  allUsers,
  role
}: {
  groups: any[]
  currentUserId: string
  allUsers: any[]
  role: string
}) {
  const [groups, setGroups] = useState(initialGroups)
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id || null)
  const [messages, setMessages] = useState<any[]>([])
  
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [showModal, setShowModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const canCreateGroups = role === 'OWNER' || role === 'PM'

  useEffect(() => {
    if (!activeGroupId) return
    startTransition(async () => {
      const msgs = await getMessages(activeGroupId)
      setMessages(msgs)
      scrollToBottom()
    })
  }, [activeGroupId])

  function scrollToBottom() {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  function getInitials(name: string) {
    return name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?'
  }

  function formatTime(d: Date) {
    return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!activeGroupId) return
    if (!text.trim() && !file) return

    const formData = new FormData()
    formData.append('groupId', activeGroupId)
    if (text.trim()) formData.append('content', text)
    if (file) formData.append('file', file)

    const optContent = text
    setText('')
    setFile(null)

    // Optimistic
    const optId = Math.random().toString()
    setMessages(prev => [...prev, {
      id: optId,
      content: optContent,
      fileUrl: file ? URL.createObjectURL(file) : null,
      fileType: file?.type.startsWith('image/') ? 'image' : file?.type.startsWith('video/') ? 'video' : file ? 'file' : null,
      createdAt: new Date(),
      author: { id: currentUserId, name: 'Вы', role: '...' }
    }])
    scrollToBottom()

    startTransition(async () => {
      try {
        const msg = await sendMessage(formData)
        setMessages(prev => prev.map(m => m.id === optId ? msg as any : m))
      } catch(err) {
        alert('Ошибка отправки сообщения')
      }
    })
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroupName) return
    
    startTransition(async () => {
      try {
        const group = await createChatGroup(newGroupName, selectedUsers)
        setGroups(prev => [...prev, group])
        setShowModal(false)
        setNewGroupName('')
        setSelectedUsers([])
        setActiveGroupId(group.id)
      } catch(err) {
        alert('Ошибка создания')
      }
    })
  }

  const activeGroup = groups.find(g => g.id === activeGroupId)

  return (
    <div className={styles.chatLayout}>
      
      {/* ── Left Sidebar ── */}
      <div className={styles.chatSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>Каналы</div>
          {canCreateGroups && (
            <button className={styles.addBtn} onClick={() => setShowModal(true)} title="Создать группу">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>
        <div className={styles.channelList}>
          {groups.map(g => (
            <div 
              key={g.id} 
              className={`${styles.channelItem} ${g.id === activeGroupId ? styles.channelItemActive : ''}`}
              onClick={() => setActiveGroupId(g.id)}
            >
              <div className={styles.channelName}># {g.name || 'Личные сообщения'}</div>
              <div className={styles.channelPreview}>
                {g.messages?.[0] ? `${g.messages[0].content?.slice(0, 20)}...` : 'Нет сообщений'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Content ── */}
      <div className={styles.chatMain}>
        {activeGroup ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatTitle}>
                <div className={styles.onlineDot} />
                {activeGroup.name || 'Личные сообщения'}
              </div>
            </div>

            <div className={styles.chatBody} ref={scrollRef}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', margin: 'auto' }}>
                  Сообщений пока нет. Напишите первым!
                </div>
              )}
              {messages.map(m => {
                const isOwn = m.author.id === currentUserId
                return (
                  <div key={m.id} className={`${styles.messageRow} ${isOwn ? styles.messageRowOwn : ''}`}>
                    {!isOwn && (
                      <div className={styles.avatar} title={m.author.name}>
                        {getInitials(m.author.name)}
                      </div>
                    )}
                    <div className={styles.messageContent}>
                      {!isOwn && (
                        <div className={styles.authorName}>
                          {m.author.name} <span className={styles.roleBadge}>{m.author.role}</span>
                        </div>
                      )}
                      <div className={styles.bubble}>
                        {m.fileUrl && (
                          <div className={styles.fileAttachment}>
                            {m.fileType === 'image' && <img src={m.fileUrl} alt="Вложение" />}
                            {m.fileType === 'video' && <video src={m.fileUrl} controls />}
                            {m.fileType === 'file' && (
                              <a href={m.fileUrl} target="_blank" className={styles.docLink}>
                                📄 Скачать файл
                              </a>
                            )}
                          </div>
                        )}
                        {m.content}
                        <div className={styles.time}>{formatTime(m.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={styles.chatInputWrap}>
              {file && (
                <div className={styles.filePreview}>
                  📎 {file.name}
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>✕</button>
                </div>
              )}
              <form className={styles.chatForm} onSubmit={handleSend}>
                <label className={styles.attachBtn} title="Прикрепить файл">
                  <input 
                    type="file" 
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </label>
                <textarea
                  className={styles.chatInput}
                  placeholder="Сообщение..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <button type="submit" className={styles.sendBtn} disabled={isPending || (!text.trim() && !file)}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M16.5 1.5l-15 7 5 2M16.5 1.5l-6 15-2-5M16.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ margin: 'auto', color: 'var(--text-3)' }}>Выберите чат слева</div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Создать группу</div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Название чата</label>
                  <input 
                    className={styles.formInput} 
                    value={newGroupName} 
                    onChange={e => setNewGroupName(e.target.value)}
                    required 
                    placeholder="Например: Проект Alpha"
                  />
                </div>
                
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Кого пригласить?</label>
                  <div className={styles.usersList}>
                    {allUsers.filter(u => u.id !== currentUserId).map(u => (
                      <label key={u.id} className={styles.userLabel}>
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.includes(u.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedUsers([...selectedUsers, u.id])
                            else setSelectedUsers(selectedUsers.filter(id => id !== u.id))
                          }}
                        />
                        {u.name} ({u.email}) — <strong style={{color: 'var(--blue)'}}>{u.role}</strong>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !newGroupName}>Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
