import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Search, Clock, Trash2, Edit3, Users, GripVertical, X } from 'lucide-react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchBoardById } from '../store/slices/boardsSlice';
import { tasksService } from '../services/tasks.service';
import { listsService } from '../services/lists.service';
import { boardsService } from '../services/boards.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import socketService from '../services/socket';

export default function BoardPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentBoard, loading } = useSelector((state) => state.boards);
    const [lists, setLists] = useState([]);
    const [activeTask, setActiveTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [showActivity, setShowActivity] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [activities, setActivities] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    // Fetch board data and set up Socket.IO
    useEffect(() => {
        if (id) {
            dispatch(fetchBoardById(id));
            socketService.joinBoard(id);

            socketService.on('taskCreated', handleTaskCreated);
            socketService.on('taskUpdated', handleTaskUpdated);
            socketService.on('taskMoved', handleTaskMoved);
            socketService.on('taskDeleted', handleTaskDeleted);
            socketService.on('listCreated', handleListCreated);
            socketService.on('listDeleted', handleListDeleted);

            return () => {
                socketService.leaveBoard(id);
                socketService.off('taskCreated');
                socketService.off('taskUpdated');
                socketService.off('taskMoved');
                socketService.off('taskDeleted');
                socketService.off('listCreated');
                socketService.off('listDeleted');
            };
        }
    }, [id, dispatch]);

    // Sync lists with board data
    useEffect(() => {
        if (currentBoard) {
            // Fetch lists with their tasks
            fetchListsData();
        }
    }, [currentBoard]);

    const fetchListsData = async () => {
        try {
            const response = await listsService.getLists(id);
            const fetchedLists = response.data?.lists || response.data || [];
            // Fetch tasks for each list
            const listsWithTasks = await Promise.all(
                fetchedLists.map(async (list) => {
                    try {
                        const taskRes = await tasksService.getTasks(list._id);
                        return { ...list, tasks: taskRes.data?.tasks || taskRes.data || [] };
                    } catch {
                        return { ...list, tasks: [] };
                    }
                })
            );
            setLists(listsWithTasks);
        } catch {
            // If lists endpoint fails, try to use board's embedded lists
            if (currentBoard?.lists) {
                setLists(currentBoard.lists.map(l => ({ ...l, tasks: l.tasks || [] })));
            }
        }
    };

    // Real-time handlers
    const handleTaskCreated = (task) => {
        setLists(prev => prev.map(list =>
            list._id === task.list
                ? { ...list, tasks: [...(list.tasks || []), task] }
                : list
        ));
    };

    const handleTaskUpdated = (task) => {
        setLists(prev => prev.map(list => ({
            ...list,
            tasks: list.tasks?.map(t => t._id === task._id ? task : t) || []
        })));
        if (selectedTask?._id === task._id) setSelectedTask(task);
    };

    const handleTaskMoved = ({ task, oldListId, newListId }) => {
        setLists(prev => prev.map(list => {
            if (list._id === oldListId) {
                return { ...list, tasks: list.tasks.filter(t => t._id !== task._id) };
            }
            if (list._id === newListId) {
                const tasks = [...(list.tasks || []), task].sort((a, b) => a.position - b.position);
                return { ...list, tasks };
            }
            return list;
        }));
    };

    const handleTaskDeleted = ({ taskId, listId }) => {
        setLists(prev => prev.map(list =>
            list._id === listId
                ? { ...list, tasks: list.tasks.filter(t => t._id !== taskId) }
                : list
        ));
    };

    const handleListCreated = (newList) => {
        setLists(prev => [...prev, { ...newList, tasks: [] }]);
    };

    const handleListDeleted = ({ listId }) => {
        setLists(prev => prev.filter(l => l._id !== listId));
    };

    // Task CRUD
    const handleCreateTask = async (listId, title) => {
        try {
            await tasksService.createTask(listId, { title });
            fetchListsData();
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            const response = await tasksService.updateTask(taskId, updates);
            const updatedTask = response.data?.task || response.data;
            setSelectedTask(updatedTask);
            fetchListsData();
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await tasksService.deleteTask(taskId);
            setSelectedTask(null);
            fetchListsData();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    // List CRUD
    const handleCreateList = async (title) => {
        try {
            await listsService.createList(id, { title });
            fetchListsData();
        } catch (error) {
            console.error('Failed to create list:', error);
        }
    };

    const handleDeleteList = async (listId) => {
        try {
            await listsService.deleteList(listId);
            fetchListsData();
        } catch (error) {
            console.error('Failed to delete list:', error);
        }
    };

    // Drag and drop
    const handleDragStart = (event) => {
        const { active } = event;
        // Find the task being dragged
        for (const list of lists) {
            const task = list.tasks?.find(t => t._id === active.id);
            if (task) {
                setActiveTask(task);
                break;
            }
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over || active.id === over.id) return;

        // Find source and destination
        let sourceListId, destListId, sourceTask;
        for (const list of lists) {
            const task = list.tasks?.find(t => t._id === active.id);
            if (task) {
                sourceListId = list._id;
                sourceTask = task;
                break;
            }
        }

        // Determine destination list
        destListId = over.data?.current?.listId || sourceListId;

        // Find position
        const destList = lists.find(l => l._id === destListId);
        const overTaskIndex = destList?.tasks?.findIndex(t => t._id === over.id);
        const newPosition = overTaskIndex >= 0 ? overTaskIndex : (destList?.tasks?.length || 0);

        if (sourceTask) {
            try {
                await tasksService.moveTask(active.id, destListId, newPosition);
                fetchListsData();
            } catch (error) {
                console.error('Failed to move task:', error);
            }
        }
    };

    // Search
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults(null);
            return;
        }
        try {
            const response = await boardsService.searchBoards
                ? await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/search?q=${encodeURIComponent(query)}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }).then(r => r.json())
                : null;
            setSearchResults(response?.data?.results || null);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    // Activities
    const fetchActivities = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/boards/${id}/activities`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            const data = await response.json();
            setActivities(data.data?.activities || []);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        }
    };

    useEffect(() => {
        if (showActivity && id) fetchActivities();
    }, [showActivity, id]);

    // User assignment
    const handleAssignUser = async (taskId, userId) => {
        try {
            await tasksService.assignUser(taskId, userId);
            fetchListsData();
        } catch (error) {
            console.error('Failed to assign user:', error);
        }
    };

    const handleUnassignUser = async (taskId, userId) => {
        try {
            await tasksService.unassignUser(taskId, userId);
            fetchListsData();
        } catch (error) {
            console.error('Failed to unassign user:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!currentBoard) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <p className="text-lg text-gray-600 mb-4">Board not found</p>
                    <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft size={18} />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{currentBoard.name}</h1>
                            <p className="text-xs text-gray-500">
                                {currentBoard.members?.length || 0} member{currentBoard.members?.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showSearch ? "default" : "ghost"}
                            size="sm"
                            onClick={() => { setShowSearch(!showSearch); setShowActivity(false); }}
                        >
                            <Search size={16} />
                        </Button>
                        <Button
                            variant={showActivity ? "default" : "ghost"}
                            size="sm"
                            onClick={() => { setShowActivity(!showActivity); setShowSearch(false); }}
                        >
                            <Clock size={16} />
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <AnimatePresence>
                    {showSearch && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t px-4 py-3 bg-gray-50 overflow-hidden"
                        >
                            <Input
                                placeholder="Search boards, lists, tasks..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoFocus
                            />
                            {searchResults && (
                                <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                                    {searchResults.boards?.map(b => (
                                        <div key={b._id} className="px-3 py-2 bg-white rounded border text-sm">
                                            <span className="text-xs font-medium text-blue-600 mr-2">Board</span>
                                            {b.name}
                                        </div>
                                    ))}
                                    {searchResults.lists?.map(l => (
                                        <div key={l._id} className="px-3 py-2 bg-white rounded border text-sm">
                                            <span className="text-xs font-medium text-green-600 mr-2">List</span>
                                            {l.title}
                                        </div>
                                    ))}
                                    {searchResults.tasks?.map(t => (
                                        <div key={t._id} className="px-3 py-2 bg-white rounded border text-sm cursor-pointer hover:bg-gray-50"
                                            onClick={() => { setSelectedTask(t); setShowSearch(false); }}
                                        >
                                            <span className="text-xs font-medium text-purple-600 mr-2">Task</span>
                                            {t.title}
                                        </div>
                                    ))}
                                    {searchResults.boards?.length === 0 && searchResults.lists?.length === 0 && searchResults.tasks?.length === 0 && (
                                        <p className="text-sm text-gray-500 py-2">No results found</p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <div className="flex">
                {/* Board Content */}
                <main className="flex-1 p-6 overflow-x-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                            {lists.map((list) => (
                                <ListContainer
                                    key={list._id}
                                    list={list}
                                    onCreateTask={handleCreateTask}
                                    onDeleteList={handleDeleteList}
                                    onTaskClick={setSelectedTask}
                                />
                            ))}
                            <AddListButton onCreateList={handleCreateList} />
                        </div>
                        <DragOverlay>
                            {activeTask && <TaskCardOverlay task={activeTask} />}
                        </DragOverlay>
                    </DndContext>
                </main>

                {/* Activity Sidebar */}
                <AnimatePresence>
                    {showActivity && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l bg-white shadow-lg overflow-hidden"
                        >
                            <div className="p-4 w-80">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900">Activity Log</h2>
                                    <Button variant="ghost" size="sm" onClick={() => setShowActivity(false)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                                <div className="space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto">
                                    {activities.length > 0 ? activities.map((activity) => (
                                        <div key={activity._id} className="flex gap-3 text-sm border-b pb-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                                                {activity.user?.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-gray-700">{activity.details}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(activity.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-500 text-center py-8">No activity yet</p>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Task Detail Modal */}
            <TaskDetailModal
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                onAssign={handleAssignUser}
                onUnassign={handleUnassignUser}
                boardMembers={currentBoard?.members || []}
            />
        </div>
    );
}

// ─── List Container ────────────────────────────────────────────────────────────
function ListContainer({ list, onCreateTask, onDeleteList, onTaskClick }) {
    const [showAddTask, setShowAddTask] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');

    const handleAddTask = (e) => {
        e.preventDefault();
        if (taskTitle.trim()) {
            onCreateTask(list._id, taskTitle);
            setTaskTitle('');
            setShowAddTask(false);
        }
    };

    const taskIds = list.tasks?.map(t => t._id) || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 w-72"
        >
            <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            {list.title}
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                {list.tasks?.length || 0}
                            </span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-destructive"
                            onClick={() => onDeleteList(list._id)}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                        <AnimatePresence>
                            {list.tasks?.map((task) => (
                                <SortableTaskCard
                                    key={task._id}
                                    task={task}
                                    listId={list._id}
                                    onClick={() => onTaskClick(task)}
                                />
                            ))}
                        </AnimatePresence>
                    </SortableContext>

                    {showAddTask ? (
                        <form onSubmit={handleAddTask} className="space-y-2">
                            <Input
                                placeholder="Enter task title..."
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                autoFocus
                                className="text-sm"
                            />
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" className="text-xs">Add</Button>
                                <Button
                                    type="button" size="sm" variant="ghost" className="text-xs"
                                    onClick={() => { setShowAddTask(false); setTaskTitle(''); }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-500 text-sm h-8"
                            onClick={() => setShowAddTask(true)}
                        >
                            <Plus size={14} className="mr-1" />
                            Add task
                        </Button>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─── Sortable Task Card ────────────────────────────────────────────────────────
function SortableTaskCard({ task, listId, onClick }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task._id,
        data: { listId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
        >
            <Card
                className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white group"
                onClick={onClick}
            >
                <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                        <div
                            className="mt-0.5 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing"
                            {...attributes}
                            {...listeners}
                        >
                            <GripVertical size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                            {task.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                            )}
                            {task.assignee && task.assignee.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                    {task.assignee.slice(0, 3).map((user) => (
                                        <div
                                            key={user._id || user}
                                            className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-medium"
                                            title={user.username || 'User'}
                                        >
                                            {user.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    ))}
                                    {task.assignee.length > 3 && (
                                        <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]">
                                            +{task.assignee.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─── Drag Overlay ──────────────────────────────────────────────────────────────
function TaskCardOverlay({ task }) {
    return (
        <Card className="shadow-xl rotate-2 w-72 bg-white border-primary">
            <CardContent className="p-3">
                <p className="text-sm font-medium text-gray-800">{task.title}</p>
            </CardContent>
        </Card>
    );
}

// ─── Task Detail Modal ─────────────────────────────────────────────────────────
function TaskDetailModal({ task, onClose, onUpdate, onDelete, onAssign, onUnassign, boardMembers }) {
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

    useEffect(() => {
        if (task) {
            setEditTitle(task.title || '');
            setEditDesc(task.description || '');
            setEditing(false);
        }
    }, [task]);

    const handleSave = () => {
        onUpdate(task._id, { title: editTitle, description: editDesc });
        setEditing(false);
    };

    if (!task) return null;

    return (
        <Dialog open={!!task} onOpenChange={() => onClose()}>
            <DialogContent onClose={onClose}>
                <DialogHeader>
                    {editing ? (
                        <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-lg font-semibold"
                            autoFocus
                        />
                    ) : (
                        <DialogTitle className="flex items-center gap-2">
                            {task.title}
                            <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600">
                                <Edit3 size={14} />
                            </button>
                        </DialogTitle>
                    )}
                </DialogHeader>

                <div className="space-y-4">
                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                        {editing ? (
                            <Textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Add a description..."
                                rows={3}
                            />
                        ) : (
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded min-h-[60px]">
                                {task.description || 'No description'}
                            </p>
                        )}
                    </div>

                    {/* Assigned Users */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Users size={14} /> Assigned Members
                        </label>
                        <div className="space-y-2">
                            {task.assignee?.map(user => (
                                <div key={user._id || user} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                                            {user.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-sm">{user.username || user.email || 'User'}</span>
                                    </div>
                                    <button
                                        onClick={() => onUnassign(task._id, user._id)}
                                        className="text-gray-400 hover:text-destructive"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {/* Unassigned board members */}
                            {boardMembers.filter(m => !task.assignee?.some(a => (a._id || a) === (m._id || m))).length > 0 && (
                                <div className="border-t pt-2 mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Add members:</p>
                                    {boardMembers
                                        .filter(m => !task.assignee?.some(a => (a._id || a) === (m._id || m)))
                                        .map(member => (
                                            <button
                                                key={member._id || member}
                                                onClick={() => onAssign(task._id, member._id || member)}
                                                className="flex items-center gap-2 w-full px-3 py-1.5 rounded hover:bg-gray-100 text-sm text-gray-600"
                                            >
                                                <Plus size={12} />
                                                {member.username || member.email || 'User'}
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-gray-400 border-t pt-3">
                        Created: {new Date(task.createdAt).toLocaleString()}
                    </div>
                </div>

                <DialogFooter>
                    {editing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleSave}>Save Changes</Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="destructive" size="sm"
                                onClick={() => { onDelete(task._id); onClose(); }}
                            >
                                <Trash2 size={14} className="mr-1" /> Delete
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Add List Button ───────────────────────────────────────────────────────────
function AddListButton({ onCreateList }) {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            onCreateList(title);
            setTitle('');
            setShowForm(false);
        }
    };

    if (showForm) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-shrink-0 w-72"
            >
                <Card className="bg-gray-50">
                    <CardContent className="p-4">
                        <form onSubmit={handleSubmit} className="space-y-2">
                            <Input
                                placeholder="Enter list title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button type="submit" size="sm">Add List</Button>
                                <Button
                                    type="button" size="sm" variant="ghost"
                                    onClick={() => { setShowForm(false); setTitle(''); }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div whileHover={{ scale: 1.02 }} className="flex-shrink-0 w-72">
            <Button
                variant="outline"
                className="w-full h-24 border-dashed border-2 text-gray-400 hover:text-gray-600 hover:border-gray-400 bg-white/50"
                onClick={() => setShowForm(true)}
            >
                <Plus size={18} className="mr-2" />
                Add List
            </Button>
        </motion.div>
    );
}
