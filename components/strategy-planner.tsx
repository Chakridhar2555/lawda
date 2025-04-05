import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Task {
  id: string
  date: Date
  task: string
}

interface StrategyPlannerProps {
  leadId: string
  onClose: () => void
  onStrategyUpdate: (updatedStrategy: { tasks: Task[]; notes: string; lastUpdated: string }) => void
  initialTasks?: Task[]
  initialNotes?: string
}

export function StrategyPlanner({
  leadId,
  onClose,
  onStrategyUpdate,
  initialTasks = [],
  initialNotes = "",
}: StrategyPlannerProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTask, setNewTask] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [notes, setNotes] = useState(initialNotes)
  const { toast } = useToast()

  useEffect(() => {
    setTasks(initialTasks)
    setNotes(initialNotes)
  }, [initialTasks, initialNotes])

  const addTask = () => {
    if (newTask && selectedDate) {
      const task: Task = {
        id: Date.now().toString(),
        date: selectedDate,
        task: newTask,
      }
      setTasks([...tasks, task])
      setNewTask("")
    }
  }

  const saveStrategy = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, notes }),
      })
      if (!response.ok) throw new Error("Failed to save strategy")

      const updatedStrategy = {
        tasks,
        notes,
        lastUpdated: new Date().toISOString(),
      }

      toast({
        title: "Success",
        description: "Strategy saved successfully",
      })
      onStrategyUpdate(updatedStrategy)
      onClose()
    } catch (error) {
      console.error("Error saving strategy:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save strategy. Please try again.",
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Strategy Planner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Input
              placeholder="Enter task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={addTask}>Add Task</Button>
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <span>
                  {format(new Date(task.date), "MMM d")}: {task.task}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Textarea
            placeholder="Additional notes or strategy details..."
            className="mt-4"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveStrategy}>Save Strategy</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

