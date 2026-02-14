import app from "./src/app.js";
import { Socket } from "socket.io";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = new Socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

