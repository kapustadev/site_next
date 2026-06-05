'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { sendMessage } from '@/actions/communications'
import styles from './chat.module.css'

interface Message {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string
    role: string
  }
}

export default function ChatClient({
  messages: initialMessages,
  currentUserId
}: {
  messages: Message[]
  currentUserId: string
}) {
  // Sort messages: oldest first for display
  const [messages, setMessages] = useState([...initialMessages].reverse())
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function getInitials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  function formatTime(d: Date) {
    return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!text.trim()) return
    const content = text
    setText('')
    
    // Optimistic update
    const optId = Math.random().toString()
    setMessages(prev => [...prev, {
      id: optId,
      content,
      createdAt: new Date(),
      author: { id: currentUserId, name: 'Вы', role: '...' }
    }])

    startTransition(async () => {
      const msg = await sendMessage(content)
      setMessages(prev => prev.map(m => m.id === optId ? msg as any : m))
    })
  }

  return (
    <div className={styles.chatWrap}>
      <div className={styles.chatHeader}>
        <div className={styles.chatTitle}>
          <div className={styles.onlineDot} />
          Общий чат команды
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
                  {m.content}
                  <div className={styles.time}>{formatTime(m.createdAt)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.chatInputWrap}>
        <form className={styles.chatForm} onSubmit={handleSend}>
          <textarea
            className={styles.chatInput}
            placeholder="Введите сообщение... (Enter для отправки)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button type="submit" className={styles.sendBtn} disabled={isPending || !text.trim()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M16.5 1.5l-15 7 5 2M16.5 1.5l-6 15-2-5M16.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
