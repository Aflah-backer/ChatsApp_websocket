const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./confiq/db");
const colors = require("colors");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { Socket } = require("socket.io");

dotenv.config();
const app = express();
connectDB();

app.use(express.json()); // to accept json data2

app.use(cors());
app.get("/", (req, res) => {
  res.send("API is runing");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 6868;

const server = app.listen(
  6868,
  console.log(`server started on ${PORT}`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 6000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (Socket) => {
  console.log("connected to socket.io");

  Socket.on("setup", (userData) => {
    Socket.join(userData._id);
    Socket.emit("connected");
  });

  Socket.on("join chat", (room) => {
    Socket.join(room);
    console.log("User Joined Room: " + room);
  });
});
