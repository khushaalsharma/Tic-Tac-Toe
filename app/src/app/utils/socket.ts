import { io, Socket } from "socket.io-client";

console.log("Server URL:",process.env.NEXT_PUBLIC_SERVER_URL);
const socket: Socket = io(process.env.NEXT_PUBLIC_SERVER_URL);

socket.on("connect", () => {
    console.log("Connected to server");
});

socket.on("connect_error", (error) => {
    console.log("Error in connecting: ", error);
})

export default socket;
