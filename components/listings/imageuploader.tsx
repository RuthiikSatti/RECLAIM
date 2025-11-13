'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client' // your browser supabase factory

const supabase = createClient()

const MAX_IMAGES = 10

export default function ImageUploader({
  inputName = 'imageUrls',
  existingImages = []
}: {
  inputName?: string
  existingImages?: string[]
}) {
  const [urls, setUrls] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the limit
    const totalImages = urls.length + files.length
    if (totalImages > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You currently have ${urls.length} image(s). You can only add ${MAX_IMAGES - urls.length} more.`)
      return
    }

    setUploading(true)
    setError(null)

    const uploadedUrls: string[] = []

    // get current user id from session (needed for pathing)
    const sessionRes = await supabase.auth.getSession()
    const userId = sessionRes?.data?.session?.user?.id
    if (!userId) {
      setError('Not authenticated (upload requires sign-in).')
      setUploading(false)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 12)}.${ext}`
      const path = `${userId}/${fileName}`

      // upload
      const { data: up, error: upErr } = await supabase.storage
        .from('listings')
        .upload(path, file)

      if (upErr) {
        console.error('upload error', upErr)
        setError(upErr.message)
        continue
      }

      // get public url
      const { data: publicData } = supabase.storage
        .from('listings')
        .getPublicUrl(path)

      if (publicData?.publicUrl) {
        uploadedUrls.push(publicData.publicUrl)
      }
    }

    // append to existing list
    setUrls((s) => [...s, ...uploadedUrls])
    setUploading(false)
  }

  function removeUrl(index: number) {
    setUrls((s) => s.filter((_, i) => i !== index))
  }

  const remainingSlots = MAX_IMAGES - urls.length
  const isAtLimit = urls.length >= MAX_IMAGES

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          disabled={isAtLimit}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-gray-600">
          {urls.length} / {MAX_IMAGES} images
        </span>
      </div>

      {isAtLimit && (
        <p className="text-sm text-orange-600">
          You've reached the maximum of {MAX_IMAGES} images. Remove some to add new ones.
        </p>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2 mt-2 flex-wrap">
        {urls.map((u, i) => (
          <div key={u} className="relative">
            <img src={u} alt={`preview-${i}`} className="w-24 h-24 object-cover rounded" />
            <button
              type="button"
              onClick={() => removeUrl(i)}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow hover:bg-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Hidden input so server action receives imageUrls JSON */}
      <input type="hidden" name={inputName} value={JSON.stringify(urls)} />

      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
    </div>
  )
}
