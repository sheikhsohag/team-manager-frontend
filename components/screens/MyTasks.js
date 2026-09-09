'use client';

import TasksBoard from '@/components/TasksBoard';

export default function MyTasksScreen() {
  return (
    <div>
      <div className="mb">
        <h2>My Tasks</h2>
        <p className="muted small">Your own tasks plus anything shared with you. Filter by status, person, or date; click a task to open it.</p>
      </div>
      <TasksBoard scope="mine" />
    </div>
  );
}
