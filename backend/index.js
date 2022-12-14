const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./confiq/db");
const colors = require("colors");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config();
const app = express();
connectDB();

app.use(express.json()); // to accept json data2

app.use(cors());

// app.get("/", (req, res) => {
//   res.send("API is Runing Successfully");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ----------------------Deployment-----------------------------------

const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is Running Successfully");
  });
}

// ----------------------Deployment-----------------------------------

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 6868;

const server = app.listen(
  PORT,
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

  Socket.on("typing", (room) => Socket.in(room).emit("typing"));
  Socket.on("stop typing", (room) => Socket.in(room).emit("stop typing"));

  Socket.on("new message", (newMessageRecived) => {
    var chat = newMessageRecived.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecived.sender._id) return;

      Socket.in(user._id).emit("message recieved", newMessageRecived);
    });
  });

  Socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    Socket.leave(userData._id);
  });
});
