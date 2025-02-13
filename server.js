const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
// Peer

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.render("joincall");
});
app.get("/gmeet", (req, res) => {
  res.render("gmeet");
});
app.get("/screenshare", (req, res) => {
  res.render("screenshare");
});
app.get("/meetingjoin", (req, res) => {
  res.render("meetingjoin");
});

app.get("/", (req, rsp) => {
  rsp.redirect(`/${uuidv4()}`);
});

app.get("/room", (req, res) => {
  res.render("room", { roomId: req.query.room, username: req.query.username });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, username, userId) => {

    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", {userId, username});

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    socket.on("mute-status-changed", (muted, userId ) => {
      console.log(muted);
      io.to(roomId).emit("update-mute-status", { muted, userId });
    });
    

    socket.on("leavemeeting", (userId) => {
      io.to(roomId).emit("user-leaved-meeting",  userId);
    });
  });


});

server.listen(process.env.PORT || 3030);
