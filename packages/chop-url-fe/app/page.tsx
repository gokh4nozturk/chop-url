"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Link as LinkIcon, Check } from "lucide-react"

export default function Home() {
  const [url, setUrl] = useState("")
  const [shortenedUrl, setShortenedUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Reset copied state after 2 seconds
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Basic URL validation
      let urlToShorten = url.trim()
      if (!urlToShorten.startsWith('http://') && !urlToShorten.startsWith('https://')) {
        urlToShorten = 'https://' + urlToShorten
      }

      // Don't allow shortening our own URLs
      if (urlToShorten.includes('chop-url.vercel.app') || urlToShorten.includes('chop-url-backend.gokhaanozturk.workers.dev')) {
        throw new Error("Cannot shorten URLs from this domain")
      }

      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToShorten }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to shorten URL")
      }

      const data = await response.json()
      setShortenedUrl(data.shortUrl)
    } catch (error) {
      console.error("Error shortening URL:", error)
      setError(error instanceof Error ? error.message : "Failed to shorten URL. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortenedUrl)
      setCopied(true)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-zinc-900 to-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Chop URL</h1>
          <p className="text-zinc-400">Make your long URLs short and sweet</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                type="url"
                placeholder="Enter your long URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 pr-4 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 w-full min-w-[300px]"
                required
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              {isLoading ? "Chopping..." : "Chop!"}
            </Button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </form>

        {shortenedUrl && (
          <div className="mt-8 p-4 bg-zinc-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-green-400 truncate flex-1 mr-2">{shortenedUrl}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="hover:bg-zinc-700 transition-all duration-200"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-zinc-400" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
