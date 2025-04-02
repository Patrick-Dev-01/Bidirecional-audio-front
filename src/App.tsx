import { useState } from 'react'
import './App.css'
import { useEffect, useRef } from "react";

const App = () => {
  const ws = useRef(null);
    const peerConnection = useRef(null);
    const localAudio = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket("ws://localhost:3000");
        ws.current.onopen = () => console.log("WebSocket conectado!");
        ws.current.onerror = (err) => console.error("Erro WebSocket:", err);

        peerConnection.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                console.log("Microfone capturado:", stream);
                stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

                if (localAudio.current) {
                    localAudio.current.srcObject = stream;
                }
            })
            .catch(err => console.error("Erro ao acessar microfone:", err));

        return () => {
            // ws.current.close();
            // peerConnection.current.close();
        };
    }, []);

    return (
        <div>
            <h2>🎤 Teste WebRTC + WebSocket</h2>
            <audio ref={localAudio} autoPlay controls />
        </div>
    );
};


export default App
