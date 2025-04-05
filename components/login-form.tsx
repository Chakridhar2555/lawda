"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { User, Lock } from "lucide-react"

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("Attempting login with:", formData.email) // Debug log

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include' // Important for cookies
      })

      const data = await res.json()
      console.log("Login response:", { status: res.status, data }) // Debug log

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid credentials")
      }

      // Store auth data
      localStorage.setItem("user", JSON.stringify(data.user))

      toast({
        title: "Success",
        description: "Login successful! Redirecting...",
      })

      // Add a small delay before redirect to show the success message
      setTimeout(() => {
        // Use the redirectPath from the server response
        router.push(data.redirectPath)
      }, 1000)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to login"
      setError(message)
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">{error}</div>}
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Email (admin@gmail.com)"
          required
          className="pl-10 bg-[#F3F0FF] border-none"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <Input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Password (admin123)"
          required
          className="pl-10 bg-[#F3F0FF] border-none"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-red-500 hover:bg-red-600 rounded-full py-6 text-lg font-semibold"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login Now"}
      </Button>
      <div className="text-sm text-center text-gray-500">
        Use these credentials for testing:
        <br />
        Email: admin@gmail.com
        <br />
        Password: admin123
      </div>
    </form>
  )
}

