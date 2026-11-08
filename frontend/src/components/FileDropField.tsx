import { useEffect, useState, type DragEvent, type ChangeEvent } from 'react'

type Props = {
  id: string
  label: string
  file?: File | null
  onFile?: (file: File | null) => void
  /** Multi: agrega archivos a la cola (no reemplaza). */
  multiple?: boolean
  onFiles?: (files: File[]) => void
  previewUrl?: string
  hint?: string
  compact?: boolean
}

function isAllowedImage(file: File) {
  if (!file.type || file.type === 'application/octet-stream') {
    return /\.(jpe?g|png|webp|gif)$/i.test(file.name)
  }
  return file.type.startsWith('image/')
}

export function FileDropField({
  id,
  label,
  file = null,
  onFile,
  multiple = false,
  onFiles,
  previewUrl,
  hint,
  compact = false,
}: Props) {
  const [over, setOver] = useState(false)
  const [preview, setPreview] = useState<string | undefined>(previewUrl)

  useEffect(() => {
    if (!file) {
      setPreview(previewUrl)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, previewUrl])

  function pick(list: FileList | null) {
    if (!list?.length) {
      if (!multiple) onFile?.(null)
      return
    }
    const allowed = [...list].filter(isAllowedImage)
    if (!allowed.length) return
    if (multiple) {
      onFiles?.(allowed)
      return
    }
    onFile?.(allowed[0])
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    pick(e.dataTransfer.files)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    setOver(true)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    pick(e.target.files)
    e.target.value = ''
  }

  const defaultHint = multiple
    ? 'Arrastrá o elegí varias imágenes'
    : 'Arrastrá o hacé clic'

  return (
    <div
      className={`bedelia__field file-drop-field${compact ? ' is-compact' : ''}`}
    >
      <label htmlFor={id}>{label}</label>
      <label
        htmlFor={id}
        className={`file-drop${over ? ' is-over' : ''}${file || previewUrl ? ' has-file' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setOver(false)}
      >
        {preview && !multiple ? (
          <img className="file-drop__preview" src={preview} alt="" />
        ) : (
          <span className="file-drop__icon" aria-hidden>
            ↑
          </span>
        )}
        <span className="file-drop__copy">
          <span className="file-drop__text">
            {multiple
              ? hint || defaultHint
              : file
                ? file.name
                : hint || defaultHint}
          </span>
          <span className="file-drop__sub">
            JPEG, PNG o WEBP{multiple ? ' · varias a la vez' : ''}
          </span>
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp"
        className="file-drop__input"
        multiple={multiple}
        onChange={onChange}
      />
      {!multiple && file && (
        <button
          type="button"
          className="btn btn--ghost btn--small file-drop__clear"
          onClick={() => onFile?.(null)}
        >
          Quitar
        </button>
      )}
    </div>
  )
}
