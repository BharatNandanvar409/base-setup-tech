import { Server } from "socket.io";
import http from 'http';

let io: Server | null = null;

export const initSocket = (httpServer: http.Server) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*"
        }
    })

    io.on("connection", (socket) => {
        console.log("socket connection sucksecfull", socket.id);
    })

    return io;
}

export const getIO = (): Server =>{
    if(!io){
        throw new Error("Socket.io not initialized");
    }
    return io;
}