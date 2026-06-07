'use client'

import { useState, useTransition } from 'react'
import styles from './plugins.module.css'
import { uploadPlugin, uploadPluginVersion, deletePlugin, createPluginCategory, deletePluginCategory } from '@/actions/plugins'

type PluginVersion = {
  id: string
  version: string
  fileUrl: string
  createdAt: Date
  uploader: { name: string } | null
}

type PluginItem = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  category?: { name: string } | null
  versions: PluginVersion[]
}

type CategoryItem = {
  id: string
  name: string
}

export default function PluginsClient({
  plugins: initialPlugins,
  categories: initialCategories,
  role,
}: {
  plugins: PluginItem[]
  categories: CategoryItem[]
  role: string
}) {
  const [plugins, setPlugins] = useState<PluginItem[]>(initialPlugins as any)
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories)
  
  // Modals
  const [showModal, setShowModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState<string | null>(null) // pluginId
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null) // To show versions
  
  // Filtering
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  
  const canUpload = role === 'OWNER' || role === 'PM'

  const [form, setForm] = useState({ name: '', version: '', description: '', categoryId: '' })
  const [versionForm, setVersionForm] = useState({ version: '' })
  const [file, setFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showNewCatInput, setShowNewCatInput] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const filteredPlugins = plugins.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategoryId ? (categories.find(c => c.name === p.category?.name)?.id === selectedCategoryId) : true
    return matchesSearch && matchesCat
  })

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setErrorMsg('Выберите файл')
    if (!form.name || !form.version) return setErrorMsg('Заполните обязательные поля')

    setErrorMsg('')
    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('version', form.version)
    formData.append('description', form.description)
    if (form.categoryId) formData.append('categoryId', form.categoryId)
    formData.append('file', file)

    startTransition(async () => {
      try {
        const result = await uploadPlugin(formData)
        if (result && 'error' in result) {
          setErrorMsg(result.error as string)
          return
        }
        
        const p = result as any
        setPlugins(prev => [p, ...prev])
        setShowModal(false)
        setForm({ name: '', version: '', description: '', categoryId: '' })
        setFile(null)
      } catch (err: any) {
        setErrorMsg(err.message || 'Ошибка загрузки')
      }
    })
  }

  async function handleUploadVersion(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setErrorMsg('Выберите файл')
    if (!versionForm.version) return setErrorMsg('Заполните версию')

    setErrorMsg('')
    const formData = new FormData()
    formData.append('pluginId', showVersionModal!)
    formData.append('version', versionForm.version)
    formData.append('file', file)

    startTransition(async () => {
      try {
        const result = await uploadPluginVersion(formData)
        if (result && 'error' in result) {
          setErrorMsg(result.error as string)
          return
        }
        
        const newVersion = result as any
        setPlugins(prev => prev.map(p => {
          if (p.id === showVersionModal) {
            return { ...p, versions: [newVersion, ...p.versions] }
          }
          return p
        }))
        setShowVersionModal(null)
        setVersionForm({ version: '' })
        setFile(null)
      } catch (err: any) {
        setErrorMsg(err.message || 'Ошибка загрузки')
      }
    })
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    startTransition(async () => {
      const result = await createPluginCategory(newCatName)
      if (result && 'error' in result) {
        setErrorMsg(result.error as string)
        return
      }
      setCategories(prev => [...prev, result as any].sort((a,b) => a.name.localeCompare(b.name)))
      setForm(f => ({ ...f, categoryId: result.id }))
      setShowNewCatInput(false)
      setNewCatName('')
      setErrorMsg('')
    })
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`Удалить категорию "${name}"? Плагины не удалятся, но потеряют категорию.`)) return
    startTransition(async () => {
      await deletePluginCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      if (form.categoryId === id) setForm(f => ({ ...f, categoryId: '' }))
      if (selectedCategoryId === id) setSelectedCategoryId(null)
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить плагин и все его версии навсегда?')) return
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
          <div className={styles.subtitle}>Внутренняя база PRO плагинов для разработчиков</div>
        </div>
        {canUpload && (
          <button className={styles.addBtn} onClick={() => { setErrorMsg(''); setFile(null); setShowModal(true) }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Загрузить новый плагин
          </button>
        )}
      </div>

      <div className={styles.layout}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.searchBar}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Поиск плагинов..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.pluginsGrid}>
            {filteredPlugins.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <div className={styles.emptyText}>Ничего не найдено</div>
                <div className={styles.emptyHint}>Попробуйте изменить параметры поиска</div>
              </div>
            ) : filteredPlugins.map(p => {
              const currentVersion = p.versions[0]
              
              return (
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
                        <>
                          <button className={styles.actionBtnIcon} onClick={() => { setErrorMsg(''); setFile(null); setShowVersionModal(p.id) }} title="Загрузить новую версию">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M7 10V2M3 5l4-4 4 4M2 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button className={`${styles.actionBtnIcon} ${styles.actionBtnDanger}`} onClick={() => handleDelete(p.id)} title="Удалить">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 3.5h10M5.5 3.5V2h3v1.5M6 6v4M8 6v4M3 3.5l.5 7.5h7l.5-7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.pluginNameWrap}>
                    <span className={styles.pluginName}>{p.name}</span>
                    {p.category && (
                      <span className={styles.catBadge}>{p.category.name}</span>
                    )}
                  </div>
                  
                  {currentVersion ? (
                    <div>
                      <span className={styles.pluginVersion}>Текущая: v{currentVersion.version}</span>
                    </div>
                  ) : (
                    <div className={styles.pluginVersion} style={{ color: 'var(--red)' }}>Нет версий</div>
                  )}
                  
                  <div className={styles.pluginDesc}>
                    {p.description || 'Нет описания'}
                  </div>

                  <div className={styles.pluginFooter}>
                    <span>Загрузил: {currentVersion?.uploader?.name || 'Система'}</span>
                    {currentVersion && (
                      <a href={currentVersion.fileUrl} download className={styles.downloadBtn}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Скачать
                      </a>
                    )}
                  </div>

                  {/* Versions Toggle */}
                  {p.versions.length > 1 && (
                    <div className={styles.versionsSection}>
                      <button 
                        className={styles.versionsToggle}
                        onClick={() => setExpandedPlugin(expandedPlugin === p.id ? null : p.id)}
                      >
                        {expandedPlugin === p.id ? 'Скрыть историю версий' : `История версий (${p.versions.length - 1})`}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: expandedPlugin === p.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
                          <path d="M2 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      
                      {expandedPlugin === p.id && (
                        <div className={styles.versionsList}>
                          {p.versions.slice(1).map(v => (
                            <div key={v.id} className={styles.versionItem}>
                              <div>
                                <div className={styles.versionName}>v{v.version}</div>
                                <div className={styles.versionMeta}>{new Date(v.createdAt).toLocaleDateString()} • {v.uploader?.name}</div>
                              </div>
                              <a href={v.fileUrl} download className={styles.versionDownload}>
                                Скачать
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarTitle}>Категории</div>
            <div className={styles.categoryList}>
              <button 
                className={`${styles.catFilterItem} ${selectedCategoryId === null ? styles.catFilterActive : ''}`}
                onClick={() => setSelectedCategoryId(null)}
              >
                Все категории
              </button>
              {categories.map(c => (
                <button 
                  key={c.id} 
                  className={`${styles.catFilterItem} ${selectedCategoryId === c.id ? styles.catFilterActive : ''}`}
                  onClick={() => setSelectedCategoryId(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {canUpload && (
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>Управление категориями</div>
              <div className={styles.catManageList}>
                {categories.map(c => (
                  <div key={c.id} className={styles.catManageItem}>
                    <span>{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c.id, c.name)} title="Удалить">✕</button>
                  </div>
                ))}
                {!showNewCatInput ? (
                  <button className={styles.catManageAddBtn} onClick={() => setShowNewCatInput(true)}>
                    + Добавить категорию
                  </button>
                ) : (
                  <div className={styles.catManageForm}>
                    <input
                      autoFocus
                      placeholder="Название..."
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <button onClick={handleCreateCategory} disabled={!newCatName.trim() || isPending} className={styles.btnSave} style={{ flex: 1, padding: '4px' }}>Ок</button>
                      <button onClick={() => setShowNewCatInput(false)} className={styles.btnCancel} style={{ flex: 1, padding: '4px' }}>Отмена</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Plugin Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Новый плагин</span>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className={styles.modalBody}>
                {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
                
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
                  <label className={styles.formLabel}>Начальная версия *</label>
                  <input
                    className={styles.formInput}
                    placeholder="Например: 1.0.0"
                    value={form.version}
                    onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Архив (.zip) *</label>
                  <div className={styles.fileInputWrap}>
                    <input type="file" accept=".zip" className={styles.fileInput} onChange={e => setFile(e.target.files?.[0] || null)} />
                    <div className={styles.fileInputText}>
                      {file ? <span>Выбран: <strong>{file.name}</strong></span> : <span>Нажмите или перетащите <strong>.zip</strong> архив сюда</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Категория</label>
                  <select
                    className={styles.formInput}
                   
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  >
                    <option value="">Без категории</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !form.name || !form.version || !file}>
                  {isPending ? 'Загрузка...' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload New Version Modal */}
      {showVersionModal && (
        <div className={styles.modalOverlay} onClick={() => setShowVersionModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Обновить плагин</span>
              <button className={styles.modalClose} onClick={() => setShowVersionModal(null)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleUploadVersion}>
              <div className={styles.modalBody}>
                {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
                
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Новая версия *</label>
                  <input
                    className={styles.formInput}
                    placeholder="Например: 1.0.1"
                    value={versionForm.version}
                    onChange={e => setVersionForm(f => ({ ...f, version: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Новый архив (.zip) *</label>
                  <div className={styles.fileInputWrap}>
                    <input type="file" accept=".zip" className={styles.fileInput} onChange={e => setFile(e.target.files?.[0] || null)} />
                    <div className={styles.fileInputText}>
                      {file ? <span>Выбран: <strong>{file.name}</strong></span> : <span>Нажмите или перетащите <strong>.zip</strong> архив сюда</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowVersionModal(null)}>Отмена</button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !versionForm.version || !file}>
                  {isPending ? 'Загрузка...' : 'Обновить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
