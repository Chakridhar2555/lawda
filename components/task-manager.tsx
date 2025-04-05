"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Plus, CheckCircle2, Circle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  date: string | Date
  description?: string
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
}

interface TaskManagerProps {
  tasks: Task[]
  onAddTask: (task: Task) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
}

export function TaskManager({ tasks, onAddTask, onUpdateTask }: TaskManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    status: 'pending',
    priority: 'medium'
  })
  const { toast } = useToast()

  const handleAddTask = () => {
    if (!newTask.title || !newTask.date) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title!,
      date: typeof newTask.date === 'string' ? newTask.date : newTask.date!.toISOString(),
      description: newTask.description,
      status: 'pending',
      priority: newTask.priority || 'medium'
    }

    onAddTask(task)
    setIsDialogOpen(false)
    setNewTask({ status: 'pending', priority: 'medium' })
    
    toast({
      title: "Success",
      description: "Task added successfully",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString()
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newTask.title || ''}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Calendar
                  mode="single"
                  selected={newTask.date as Date | undefined}
                  onSelect={(date) => setNewTask({ ...newTask, date })}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add task description"
                />
              </div>
              <div>
                <Label>Priority</Label>
                <select
                  className="w-full rounded-md border p-2"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <Button onClick={handleAddTask}>Add Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "border rounded-lg p-4 space-y-2",
              task.status === 'completed' && "bg-green-50",
              task.status === 'cancelled' && "bg-gray-50"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateTask(task.id, {
                    status: task.status === 'completed' ? 'pending' : 'completed'
                  })}
                  className="hover:opacity-70"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                <div>
                  <h4 className={cn(
                    "font-medium",
                    task.status === 'completed' && "line-through text-gray-500"
                  )}>
                    {task.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Due: {formatDate(task.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                {task.status !== 'cancelled' && (
                  <button
                    onClick={() => onUpdateTask(task.id, { status: 'cancelled' })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mt-2">{task.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 