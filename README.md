# Real-Time Task Collaboration Platform

A modern, full-stack Trello/Notion-inspired task management application with real-time collaboration features.

![Tech Stack](https://img.shields.io/badge/MERN-Stack-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-blue)
![Redux](https://img.shields.io/badge/Redux-State-purple)

##  Features

- ** Authentication**: Secure JWT-based signup/login
- ** Boards**: Create and manage multiple task boards
- ** Lists & Tasks**: Organize tasks in customizable lists
- ** Drag & Drop**: Move tasks across lists with @dnd-kit
- ** Collaboration**: Assign members to tasks, real-time updates
- ** Search**: Global search across boards, lists, and tasks
- ** Activity Log**: Track all board activities in a sidebar panel
- ** Modern UI**: Clean light-mode design with Shadcn-UI components
- ** Animations**: Smooth Framer Motion transitions

## Demo Credentials

After starting the application, create an account with:
```
Email:    demo@taskflow.com
Password: demo1234
```
Or sign up with any credentials. Open two browser tabs to test real-time collaboration.

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Real_Time_Task_Collaboration_Platform
```

2. **Backend Setup**
```bash
cd server
npm install
```

Create `.env` file in `server/`:
```env
MONGO_URI=mongodb://localhost:27017/task_collaboration
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

> **Note**: For MongoDB Atlas, replace `MONGO_URI` with your connection string.

3. **Frontend Setup**
```bash
cd ../client
npm install
```

Create `.env` file in `client/`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. **Run the Application**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

5. **Run Tests**
```bash
cd server
npm test
```

6. **Access the App**: Open `http://localhost:5173`

## Project Structure

```
Real_Time_Task_Collaboration_Platform/
├── server/                 # Backend (Express 5 + MongoDB)
│   ├── controllers/       # Route handlers (auth, boards, lists, tasks, search, activities)
│   ├── middleware/        # Auth (JWT) & validation (Joi) middleware
│   ├── models/           # Mongoose schemas (User, Board, List, Task, Activity)
│   ├── routes/           # RESTful API route definitions
│   ├── tests/            # API test suite (Jest + Supertest)
│   ├── validation/       # Joi validation schemas
│   ├── utils/            # Global error handler
│   ├── src/app.js        # Express app config
│   └── index.js          # Server entry + Socket.IO setup
│
└── client/                # Frontend (React 19 + Vite)
    └── src/
        ├── components/   # UI components (Button, Card, Dialog, Input, Textarea)
        ├── pages/        # Login, Signup, Dashboard, BoardPage
        ├── services/     # API services (auth, boards, lists, tasks, socket)
        ├── store/        # Redux Toolkit (auth, boards slices)
        └── lib/          # Utility functions
```

## Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │    Board     │     │    List      │     │    Task      │
├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤
│ _id          │◄────│ owner (ref)  │     │ _id          │     │ _id          │
│ username *   │     │ _id          │◄────│ board (ref)  │     │ title *      │
│ email *      │     │ name *       │     │ title *      │◄────│ list (ref)   │
│ password *   │◄──┐ │ members[]   ─┼──►  │ tasks[] ─────┼──►  │ description  │
│ createdAt    │   │ │ lists[]  ────┼──►  │ position *   │     │ assignee[] ──┼──► User
│ timestamps   │   │ │ createdAt    │     │ timestamps   │     │ position *   │
└──────────────┘   │ │ timestamps   │     └──────────────┘     │ timestamps   │
                   │ └──────────────┘                          └──────────────┘
                   │
                   │ ┌──────────────┐
                   │ │  Activity    │
                   │ ├──────────────┤
                   └─│ user (ref)   │
                     │ board (ref) ─┼──► Board
                     │ task (ref)  ─┼──► Task
                     │ type *       │
                     │ details      │
                     │ timestamps   │
                     └──────────────┘

* = required field
```

## API Contract

### Authentication
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/signup` | `{ username, email, password }` | `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user, token }` |
| GET | `/api/auth/me` | — | `{ user }` |

### Boards
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/boards` | — | `{ boards[] }` |
| POST | `/api/boards` | `{ name }` | `{ board }` |
| GET | `/api/boards/:id` | — | `{ board }` (populated) |
| PUT | `/api/boards/:id` | `{ name?, members? }` | `{ board }` |
| DELETE | `/api/boards/:id` | — | Success |
| POST | `/api/boards/:id/members` | `{ userId }` | `{ board }` |
| DELETE | `/api/boards/:id/members/:memberId` | — | `{ board }` |
| GET | `/api/boards/:id/activities` | — | `{ activities[] }` |

### Lists
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/boards/:boardId/lists` | — | `{ lists[] }` |
| POST | `/api/boards/:boardId/lists` | `{ title }` | `{ list }` |
| PUT | `/api/boards/list/:id` | `{ title?, position? }` | `{ list }` |
| DELETE | `/api/boards/list/:id` | — | Success |

### Tasks
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/lists/:listId/tasks` | — | `{ tasks[] }` |
| POST | `/api/lists/:listId/tasks` | `{ title, description? }` | `{ task }` |
| GET | `/api/lists/task/:id` | — | `{ task }` |
| PUT | `/api/lists/task/:id` | `{ title?, description? }` | `{ task }` |
| PATCH | `/api/lists/task/:id/move` | `{ listId, position }` | `{ task }` |
| DELETE | `/api/lists/task/:id` | — | Success |
| POST | `/api/lists/task/:id/assign` | `{ userId }` | `{ task }` |
| DELETE | `/api/lists/task/:id/assign/:userId` | — | `{ task }` |

### Search
| Method | Endpoint | Query | Response |
|--------|----------|-------|----------|
| GET | `/api/search` | `?q=keyword` | `{ results }` |

## Real-Time Sync Strategy

Socket.IO is used for bi-directional real-time communication:

1. **Room-based**: Each board is a Socket.IO room (`board:<id>`)
2. **Join/Leave**: Users join a board room when viewing it, leave when navigating away
3. **Broadcast**: Server emits events to the room after every CRUD operation
4. **Events**: `taskCreated`, `taskUpdated`, `taskMoved`, `taskDeleted`, `listCreated`, `listDeleted`, `boardCreated`, `boardUpdated`, `boardDeleted`, `taskAssigned`, `taskUnassigned`
5. **Client handling**: React components listen for events and update local state immediately

## Architecture

### Frontend
- **State Management**: Redux Toolkit with `createAsyncThunk` for API calls
- **Authentication**: JWT stored in `localStorage`, Axios interceptors for auto-attach and 401 redirect
- **Routing**: React Router v6 with `<ProtectedRoute>` wrapper
- **Real-time**: Socket.IO client service with event listener pattern
- **Drag & Drop**: @dnd-kit with sortable contexts per list
- **Styling**: Tailwind CSS v4 (light mode only) with custom theme tokens

### Backend
- **Express 5**: Latest version with async error handling
- **Middleware chain**: CORS → JSON parsing → Route-level auth → Joi validation → Controller
- **Database**: MongoDB with Mongoose ODM; referenced relationships (Board → Lists → Tasks)
- **Socket.IO**: Integrated with HTTP server, room-based broadcasting
- **Error handling**: Global error middleware with consistent `{ success, message }` response format

## Scalability Considerations

| Concern | Current Approach | Scaling Strategy |
|---------|-----------------|------------------|
| **Database** | Single MongoDB instance | MongoDB Atlas cluster with read replicas, sharding by `boardId` |
| **Real-time** | Single Socket.IO server | Redis adapter (`@socket.io/redis-adapter`) for multi-server |
| **API** | Single Express server | Horizontal scaling with load balancer (PM2 cluster / K8s) |
| **Auth** | JWT in localStorage | Redis session store or short-lived JWTs with refresh tokens |
| **Search** | MongoDB text search | Elasticsearch/Meilisearch for full-text search at scale |
| **Files** | Not implemented | S3/Cloudinary for file uploads with CDN |
| **Caching** | None | Redis caching for board/list reads, cache invalidation on writes |

### Assumptions & Trade-offs
- **JWT in localStorage**: Simple but vulnerable to XSS. For production, use httpOnly cookies.
- **Embedded list/task references**: Faster reads but limits individual document size. Could use virtual populate for very large boards.
- **No rate limiting**: Should add `express-rate-limit` for production.
- **No pagination on board page**: Tasks load all at once. For large boards, implement cursor-based pagination.
- **Light mode only**: Simplified UI design decision for this assignment.

## Testing

```bash
cd server
npm test
```

Tests cover:
- Health check endpoint
- Auth API validation and authentication rejection
- Board/Task API auth middleware
- Search API auth middleware
- 404 route handling

## License

This project is open source and available under the MIT License.

## Author

**Rachit Borkar**

---

**Built with using the MERN stack**
