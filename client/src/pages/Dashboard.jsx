import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, LogOut, Trash2 } from 'lucide-react';
import { fetchBoards, createBoard, deleteBoard } from '../store/slices/boardsSlice';
import { logout } from '../store/slices/authSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import socketService from '../services/socket';

export default function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { boards, loading } = useSelector((state) => state.boards);
    const { user } = useSelector((state) => state.auth);
    const [showCreate, setShowCreate] = useState(false);
    const [boardName, setBoardName] = useState('');

    useEffect(() => {
        dispatch(fetchBoards());

        // Listen for real-time board updates
        socketService.on('boardCreated', () => dispatch(fetchBoards()));
        socketService.on('boardDeleted', () => dispatch(fetchBoards()));

        return () => {
            socketService.off('boardCreated');
            socketService.off('boardDeleted');
        };
    }, [dispatch]);

    const handleCreate = (e) => {
        e.preventDefault();
        if (boardName.trim()) {
            dispatch(createBoard({ name: boardName }));
            setBoardName('');
            setShowCreate(false);
        }
    };

    const handleDelete = (e, boardId) => {
        e.stopPropagation();
        if (window.confirm('Delete this board? All lists and tasks will be removed.')) {
            dispatch(deleteBoard(boardId));
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const colors = [
        'from-blue-500 to-blue-600',
        'from-purple-500 to-purple-600',
        'from-emerald-500 to-emerald-600',
        'from-orange-500 to-orange-600',
        'from-pink-500 to-pink-600',
        'from-teal-500 to-teal-600',
        'from-indigo-500 to-indigo-600',
        'from-rose-500 to-rose-600',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LayoutGrid size={22} className="text-primary" />
                        <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                                {user?.username}
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut size={16} />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Your Boards</h2>
                        <p className="text-gray-500 text-sm mt-1">{boards?.length || 0} boards</p>
                    </div>
                    <Button onClick={() => setShowCreate(true)} className="gap-2">
                        <Plus size={16} />
                        New Board
                    </Button>
                </div>

                {/* Create Board Form */}
                <AnimatePresence>
                    {showCreate && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="p-4">
                                    <form onSubmit={handleCreate} className="flex gap-3">
                                        <Input
                                            placeholder="Board name..."
                                            value={boardName}
                                            onChange={(e) => setBoardName(e.target.value)}
                                            autoFocus
                                            className="flex-1"
                                        />
                                        <Button type="submit" disabled={loading}>Create</Button>
                                        <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setBoardName(''); }}>
                                            Cancel
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Boards Grid */}
                {loading && boards?.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
                        />
                    </div>
                ) : boards?.length === 0 ? (
                    <div className="text-center py-20">
                        <LayoutGrid size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">No boards yet. Create your first board!</p>
                        <Button onClick={() => setShowCreate(true)}>Create Board</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <AnimatePresence>
                            {boards?.map((board, index) => (
                                <motion.div
                                    key={board._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -4 }}
                                    onClick={() => navigate(`/board/${board._id}`)}
                                    className="cursor-pointer"
                                >
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                                        <div className={`h-24 bg-gradient-to-r ${colors[index % colors.length]} relative`}>
                                            <button
                                                onClick={(e) => handleDelete(e, board._id)}
                                                className="absolute top-2 right-2 p-1.5 rounded-md bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold text-gray-900 truncate">{board.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {board.members?.length || 0} member{board.members?.length !== 1 ? 's' : ''}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
