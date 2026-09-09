'use client';

import TasksBoard from '@/components/TasksBoard';

export default function AllTasksScreen() {
  return (
    <div>
      <div className="mb">
        <h2>All Tasks</h2>
        <p className="muted small">Every task across the company. Filter by member, status, or date range. Click a task to open its detail, subtasks, comments and files.</p>
      </div>
      <TasksBoard scope="all" />
    </div>
  );
}
