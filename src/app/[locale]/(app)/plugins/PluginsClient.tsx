'use client'

import { useState, useTransition, useRef } from 'react'
import styles from './plugins.module.css'
import { uploadPlugin, deletePlugin } from '@/actions/plugins'

type PluginItem = {
  id: string
  name: string
  version: string
  description: string | null
  fileUrl: string
  createdAt: Date
  uploader: { name: string } | null
}

export default function PluginsClient({
  plugins: initialPlugins,
  role,
}: {
  plugins: PluginItem[]
  role: string
}) {
  const [plugins, setPlugins] = useState<PluginItem[]>(initialPlugins as any)
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const canUpload = role === 'OWNER' || role === 'PM'

  const [form, setForm] = useState({ name: '', version: '', description: '' })
  const [file, setFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setErrorMsg('Выберите файл')
    if (!form.name || !form.version) return setErrorMsg('Заполните обязательные поля')

    setErrorMsg('')
    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('version', form.version)
    formData.append('description', form.description)
    formData.append('file', file)

    startTransition(async () => {
      try {
        const p = await uploadPlugin(formData)
        setPlugins(prev => [{ ...p, uploader: { name: 'Вы' } } as any, ...prev])
        setShowModal(false)
        setForm({ name: '', version: '', description: '' })
        setFile(null)
      } catch (err: any) {
        setErrorMsg(err.message || 'Ошибка загрузки')
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить плагин навсегда?')) return
    startTransition(async () => {
      try {
        await deletePlugin(id)
        setPlugins(prev => prev.filter(p => p.id !== id))
      } catch (err: any) {
        alert(err.message || 'Ошибка удаления')
      }
    })
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Репозиторий Плагинов</div>
          <div className={styles.subtitle}>
            Внутренняя база PRO плагинов для разработчиков
          </div>
        </div>
        {canUpload && (
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Загрузить плагин
          </button>
        )}
      </div>

      <div className={styles.pluginsGrid}>
        {plugins.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyText}>Репозиторий пуст</div>
            <div className={styles.emptyHint}>
              {canUpload ? 'Загрузите первый плагин в базу' : 'Плагины появятся здесь позже'}
            </div>
          </div>
        ) : plugins.map(p => (
          <div key={p.id} className={styles.pluginCard}>
            <div className={styles.pluginTop}>
              <div className={styles.pluginIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M3.27 6.96L12 12l8.73-5.04M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.pluginActions}>
                {canUpload && (
                  <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(p.id)} title="Удалить">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5.5 3.5V2h3v1.5M6 6v4M8 6v4M3 3.5l.5 7.5h7l.5-7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className={styles.pluginName}>{p.name}</div>
            <div>
              <span className={styles.pluginVersion}>v{p.version}</span>
            </div>
            
            <div className={styles.pluginDesc}>
              {p.description || 'Нет описания'}
            </div>

            <div className={styles.pluginFooter}>
              <span>Загрузил: {p.uploader?.name || 'Система'}</span>
              <a href={p.fileUrl} download className={styles.downloadBtn}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Скачать
              </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Загрузка плагина</span>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className={styles.modalBody}>
                {errorMsg && <div style={{ color: 'var(--red)', fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px' }}>{errorMsg}</div>}
                
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Название плагина *</label>
                  <input
                    className={styles.formInput}
                    placeholder="Например: ACF Pro"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Версия *</label>
                  <input
                    className={styles.formInput}
                    placeholder="Например: 6.2.5"
                    value={form.version}
                    onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Архив (.zip) *</label>
                  <div className={styles.fileInputWrap}>
                    <input
                      type="file"
                      accept=".zip"
                      className={styles.fileInput}
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <div className={styles.fileInputText}>
                      {file ? (
                        <span style={{ color: 'var(--text)' }}>Выбран: <strong>{file.name}</strong></span>
                      ) : (
                        <span>Нажмите или перетащите <strong>.zip</strong> архив сюда</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Описание</label>
                  <textarea
                    className={`${styles.formInput} ${styles.formTextarea}`}
                    placeholder="Пару слов о плагине..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !form.name || !form.version || !file}>
                  {isPending ? 'Загрузка...' : 'Загрузить в базу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
