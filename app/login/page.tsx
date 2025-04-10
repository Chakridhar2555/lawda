"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import "./styles.css"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      localStorage.setItem("user", JSON.stringify(data.user))

      toast({
        title: "Success",
        description: "Login successful",
      })

      setTimeout(() => {
        router.push(data.redirectPath)
      }, 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to login"
      setError(message)
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Image
              src="/placeholder-logo.png"
              alt="Get Home Realty"
              width={256}
              height={100}
              priority
            />
          </div>
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">How to get started with Get Home Realty?</p>
        </div>

        <div className="welcome-image-container">
          <Image
            src="/welcome-banner.jpg"
            alt="Welcome"
            fill
            className="welcome-image"
            priority
          />
          <div className="welcome-text">
            Very good works are waiting for you!
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <Label htmlFor="email" className="form-label">Email</Label>
            <Input
              id="email"
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <Label htmlFor="password" className="form-label">Password</Label>
            <Input
              id="password"
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login Now"}
          </Button>

          <div className="test-credentials">
            <h3 className="test-credentials-title">Use these credentials for testing:</h3>
            <p className="test-credentials-text">Email: admin@gmail.com</p>
            <p className="test-credentials-text">Password: admin123</p>
          </div>
        </form>
      </div>
    </div>
  )
} 