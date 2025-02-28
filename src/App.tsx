import React, { useState, DragEvent, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Task {
  id: string;
  content: string;
}

interface DragData {
  id: string;
  sourceList: keyof Tasks;
  index?: number;
}

interface Tasks {
  taskBank: Task[];
  urgentImportant: Task[];
  importantNotUrgent: Task[];
  urgentNotImportant: Task[];
  notUrgentNotImportant: Task[];
}

interface QuadrantInfo {
  title: string;
  subtitle: string;
}

const initialTasks: Tasks = {
  taskBank: [],
  urgentImportant: [],
  importantNotUrgent: [],
  urgentNotImportant: [],
  notUrgentNotImportant: []
};

const quadrantInfo: Record<keyof Omit<Tasks, 'taskBank'>, QuadrantInfo> = {
  urgentImportant: { title: 'Do First', subtitle: 'Urgent & Important' },
  importantNotUrgent: { title: 'Schedule', subtitle: 'Important, Not Urgent' },
  urgentNotImportant: { title: 'Delegate', subtitle: 'Urgent, Not Important' },
  notUrgentNotImportant: { title: 'Eliminate', subtitle: 'Not Urgent, Not Important' }
};

const STORAGE_KEY = 'eisenhower-tasks';

const App = () => {
  const [tasks, setTasks] = useState<Tasks>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : initialTasks;
  });
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim() !== '') {
      setTasks(prev => ({
        ...prev,
        taskBank: [...prev.taskBank, { id: Date.now().toString(), content: newTask }]
      }));
      setNewTask('');
    }
  };

  const removeTask = (id: string, list: keyof Tasks) => {
    setTasks(prev => ({
      ...prev,
      [list]: prev[list].filter(task => task.id !== id)
    }));
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string, sourceList: keyof Tasks) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, sourceList }));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, targetList: keyof Tasks) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { id: string; sourceList: keyof Tasks };
      const { id, sourceList } = data;

      if (sourceList === targetList) return;

      setTasks(prev => {
        const task = prev[sourceList].find(t => t.id === id);
        if (!task) return prev;

        return {
          ...prev,
          [sourceList]: prev[sourceList].filter(t => t.id !== id),
          [targetList]: [...prev[targetList], task]
        };
      });
    } catch (error) {
      console.error('Error during drop:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const TaskItem = ({ task, listKey }: { task: Task; listKey: keyof Tasks }) => (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, task.id, listKey)}
      className="p-3 border rounded-lg cursor-move hover:bg-accent transition-colors flex items-center gap-3"
    >
      <Checkbox 
        onCheckedChange={() => removeTask(task.id, listKey)}
        className="data-[state=checked]:bg-primary"
      />
      {task.content}
    </div>
  );

  return (
    <div className="container mx-auto py-10">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8 text-center">
        Eisenhower To-Do
      </h1>
      
      <div className="flex gap-4 mb-8">
        <Input 
          type="text" 
          value={newTask} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTask(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="Add a task..." 
          className="flex-grow"
        />
        <Button onClick={addTask}>Add to Inbox</Button>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Task Inbox</h2>
          </CardHeader>
          <CardContent>
            <div 
              className="space-y-2 min-h-[100px] p-4 rounded-lg border-2 border-dashed overflow-y-auto max-h-60"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, 'taskBank')}
            >
              {tasks.taskBank.map((task, index) => (
                <TaskItem key={task.id} task={task} listKey="taskBank" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(quadrantInfo).map(([key, { title, subtitle }]) => {
            const quadrantKey = key as keyof Omit<Tasks, 'taskBank'>;
            return (
              <Card 
                key={key}
                className="h-full transition-colors"
              >
                <CardHeader>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </CardHeader>
                <CardContent>
                  <div 
                    className="space-y-2 min-h-[100px] p-4 rounded-lg border-2 border-dashed transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-primary', 'bg-accent/50');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-primary', 'bg-accent/50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary', 'bg-accent/50');
                      onDrop(e, quadrantKey);
                    }}
                  >
                    {tasks[quadrantKey].map((task, index) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        listKey={quadrantKey}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
