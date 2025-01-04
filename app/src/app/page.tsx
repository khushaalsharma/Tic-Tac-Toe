"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import socket from "./utils/socket";
import "./styles.css";

const Home = () => {
  const [slide, setSlide] = useState("create"); // toggle between 'create' and 'join'
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleCreateRoom = () => {
    if (!username) return alert("Enter a username");
    socket.emit("createRoom", { username });
    socket.on("roomCreated", ({ roomId }) => {
      router.push(`/game/${roomId}`);
    });
  };

  const handleJoinRoom = () => {
    if (!username || !roomId) return alert("Enter both username and room ID");
    socket.emit("joinRoom", { roomId, username });
    socket.on("roomJoined", () => {
      router.push(`/game/${roomId}`);
    });
    socket.on("roomFull", () => {
      alert("Room is full");
    });
  };

   return (
    <div className="home-container">
      <h1 className="title">Multiplayer Tic-Tac-Toe</h1>
      <div className="slider-container">
        <div className="slider">
          <button
            className={`slide-btn ${slide === "create" ? "active" : ""}`}
            onClick={() => setSlide("create")}
          >
            Create Room
          </button>
          <button
            className={`slide-btn ${slide === "join" ? "active" : ""}`}
            onClick={() => setSlide("join")}
          >
            Join Room
          </button>
        </div>
      </div>
      <div className="form-container">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
        />
        {slide === "join" && (
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="input-field"
          />
        )}
        <button
          className="action-btn"
          onClick={slide === "create" ? handleCreateRoom : handleJoinRoom}
        >
          {slide === "create" ? "Create Room" : "Join Room"}
        </button>
      </div>
    </div>
  );
};

export default Home;
