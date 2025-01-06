"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import socket from "./utils/socket";
import "./styles.css";

const Home = () => {
  const [slide, setSlide] = useState("create"); // Toggle between 'create' and 'join'
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  // Clear socket listeners to prevent duplicates
  useEffect(() => {
    return () => {
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("roomFull");
    };
  }, []);

  // Handle room creation
  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    socket.emit("createRoom", { username });
    socket.on("roomCreated", ({ roomId }) => {
      console.log("Room created with ID:", roomId);
      router.push(`/game/${roomId}`);
    });
  };

  // Handle joining a room
  const handleJoinRoom = () => {
    if (!username.trim() || !roomId.trim()) {
      alert("Please enter both a username and a room ID");
      return;
    }

    socket.emit("joinRoom", { roomId, username });

    socket.on("roomJoined", () => {
      console.log(`Joined room: ${roomId}`);
      router.push(`/game/${roomId}`);
    });

    socket.on("roomFull", () => {
      alert("The room is full. Please try another room.");
    });
  };

  // Common input handler
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  return (
    <div className="home-container">
      <h1 className="title">Multiplayer Tic-Tac-Toe Game</h1>

      {/* Slider for toggling between 'Create' and 'Join' */}
      <div className="slider-container">
        <div className="slider">
          <button
            className={`slide-btn ${slide === "create" ? "active" : ""}`}
            onClick={() => setSlide("create")}
            suppressHydrationWarning={true}
          >
            Create Room
          </button>
          <button
            className={`slide-btn ${slide === "join" ? "active" : ""}`}
            onClick={() => setSlide("join")}
            suppressHydrationWarning={true}
          >
            Join Room
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="form-container">
        {/* Username Input */}
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={handleInputChange(setUsername)}
          className="input-field"
          suppressHydrationWarning={true}
        />

        {/* Room ID Input (only visible in 'Join' mode) */}
        {slide === "join" && (
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={handleInputChange(setRoomId)}
            className="input-field"
            suppressHydrationWarning={true}
          />
        )}

        {/* Action Button */}
        <button
          className="action-btn"
          onClick={slide === "create" ? handleCreateRoom : handleJoinRoom}
          suppressHydrationWarning={true}
        >
          {slide === "create" ? "Create Room" : "Join Room"}
        </button>
      </div>
    </div>
  );
};

export default Home;
