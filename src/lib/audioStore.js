// Audio blobs live in IndexedDB, not localStorage: recordings are megabytes,
// and localStorage is both size-capped and string-only. Only the small
// {blobId, name} pointer is kept in the main store, so exports stay light —
// which also means file-based audio does not travel in a JSON export
// (URL-based audio does).

const DB_NAME = 'smruti-gaan:audio'
const STORE = 'blobs'

function withStore(mode, fn) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(STORE, mode)
      const r = fn(tx.objectStore(STORE))
      tx.oncomplete = () => {
        db.close()
        resolve(r?.result)
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
    }
  })
}

export const saveAudio = (id, blob) => withStore('readwrite', (s) => s.put(blob, id))
export const getAudio = (id) => withStore('readonly', (s) => s.get(id))
export const deleteAudio = (id) => withStore('readwrite', (s) => s.delete(id))
