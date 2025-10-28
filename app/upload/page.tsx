'use client'

import { useState, useRef } from 'react'

interface UploadResponse {
  success: boolean
  message: string
  data?: {
    title: string
    filePath: string
    commitHash: string
    transcriptLength: number
    previewContent: string
    image: {
      url: string
      alt: string
      credit: string
    } | null
  }
  error?: string
  details?: string
}

export default function AudioUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [password, setPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = ['mp3', 'wav', 'webm', 'ogg', 'flac', 'm4a', 'mp4']
  const maxFileSizeMB = 25

  const handleFileChange = (selectedFile: File) => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!extension || !supportedFormats.includes(extension)) {
      setError(`Unsupported file format. Please upload one of: ${supportedFormats.join(', ')}`)
      return
    }

    const sizeMB = selectedFile.size / (1024 * 1024)
    if (sizeMB > maxFileSizeMB) {
      setError(
        `File too large. Maximum size is ${maxFileSizeMB}MB. Your file is ${sizeMB.toFixed(2)}MB`
      )
      return
    }

    setFile(selectedFile)
    setError('')
    setResult(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileChange(droppedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select an audio file')
      return
    }

    if (!password) {
      setError('Please enter the API password')
      return
    }

    setUploading(true)
    setError('')
    setProgress('Uploading audio file...')

    try {
      const formData = new FormData()
      formData.append('audio', file)
      if (title) {
        formData.append('title', title)
      }

      const response = await fetch('/api/process-audio', {
        method: 'POST',
        headers: {
          'x-api-password': password,
        },
        body: formData,
      })

      const data: UploadResponse = await response.json()

      if (response.ok && data.success) {
        setResult(data)
        setProgress('')
        setFile(null)
        setTitle('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(data.error || data.details || 'Upload failed')
        setProgress('')
      }
    } catch (err) {
      setError('An error occurred while uploading. Please try again.')
      setProgress('')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Upload Audio Recording
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Upload an audio file to automatically transcribe, generate an article, and publish to
            the site
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Audio File
            </label>
            <div
              className={`mt-2 flex justify-center rounded-lg border-2 border-dashed px-6 py-10 ${
                isDragging
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-700'
              } ${file ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {file ? (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                      >
                        <span>Upload a file</span>
                        <input
                          ref={fileInputRef}
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".mp3,.wav,.webm,.ogg,.flac,.m4a,.mp4,audio/*"
                          className="sr-only"
                          onChange={(e) => {
                            const selectedFile = e.target.files?.[0]
                            if (selectedFile) {
                              handleFileChange(selectedFile)
                            }
                          }}
                          disabled={uploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {supportedFormats.map((f) => f.toUpperCase()).join(', ')} up to{' '}
                      {maxFileSizeMB}MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Title (optional)
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 sm:text-sm"
              placeholder="Leave blank to auto-generate from content"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              API Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 sm:text-sm"
              placeholder="Enter API password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Progress Message */}
          {progress && (
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 animate-spin text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">{progress}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {result && result.success && result.data && (
            <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Article published successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p className="font-medium">{result.data.title}</p>
                    <p className="mt-1 text-xs">
                      Transcript length: {result.data.transcriptLength} characters
                    </p>
                    <p className="mt-1 text-xs">File: {result.data.filePath}</p>
                    <p className="mt-1 text-xs">Commit: {result.data.commitHash.substring(0, 8)}</p>
                  </div>
                  <div className="mt-4">
                    <a
                      href="/"
                      className="text-sm font-medium text-green-800 hover:text-green-700 dark:text-green-200 dark:hover:text-green-300"
                    >
                      View published articles →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={uploading || !file || !password}
              className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? 'Processing...' : 'Upload and Publish'}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-8 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            What happens next?
          </h3>
          <ol className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Audio is transcribed using OpenAI Whisper</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>AI generates a title, article, and summary from the transcript</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>A relevant image is fetched from stock photo services</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Article is committed and pushed to GitHub</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">5.</span>
              <span>Site is automatically rebuilt and published</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
