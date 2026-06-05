'use client'

import { useState, useTransition } from 'react'
import { createWikiArticle, deleteWikiArticle } from '@/actions/wiki'
import styles from './wiki.module.css'

export default function WikiClient({ articles, role }: { articles: any[], role: string }) {
  const [showModal, setShowModal] = useState(false)
  const [activeArticle, setActiveArticle] = useState<any | null>(null)
  const [isPending, startTransition] = useTransition()
  
  const canCreate = role === 'OWNER' || role === 'PM'

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createWikiArticle(formData)
        setShowModal(false)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить статью?')) return
    startTransition(async () => {
      await deleteWikiArticle(id)
      setActiveArticle(null)
    })
  }

  return (
    <div className={styles.wikiLayout}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.title}>Все статьи</div>
          {canCreate && (
            <button className={styles.addBtn} onClick={() => { setShowModal(true); setActiveArticle(null) }}>
              +
            </button>
          )}
        </div>
        <div className={styles.articleList}>
          {articles.length === 0 && <div className={styles.emptyText}>Нет статей</div>}
          {articles.map(article => (
            <div 
              key={article.id} 
              className={`${styles.articleItem} ${activeArticle?.id === article.id ? styles.active : ''}`}
              onClick={() => setActiveArticle(article)}
            >
              <div className={styles.articleTitle}>{article.title}</div>
              <div className={styles.articleDate}>{new Date(article.createdAt).toLocaleDateString('ru')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {activeArticle ? (
          <div className={styles.articleView}>
            <div className={styles.articleHeader}>
              <h1 className={styles.h1}>{activeArticle.title}</h1>
              <div className={styles.articleMeta}>
                Автор: {activeArticle.author.name} • {new Date(activeArticle.createdAt).toLocaleDateString('ru')}
                {canCreate && (
                  <button onClick={() => handleDelete(activeArticle.id)} className={styles.deleteBtn}>
                    Удалить
                  </button>
                )}
              </div>
            </div>
            <div className={styles.articleBody}>
              {/* Простой рендер текста. В будущем можно добавить Markdown */}
              {activeArticle.content.split('\n').map((line: string, i: number) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>📚</div>
            Выберите статью для чтения
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Новая статья</h2>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleCreate} className={styles.modalForm}>
              <input name="title" placeholder="Заголовок статьи" required className={styles.input} />
              <textarea name="content" placeholder="Содержимое..." required className={styles.textarea} rows={10} />
              <div className={styles.modalFooter}>
                <button type="submit" disabled={isPending} className={styles.submitBtn}>
                  {isPending ? 'Сохранение...' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
