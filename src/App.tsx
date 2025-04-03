import { useState } from 'react'
import './App.css'
import { useEffect, useRef } from "react";

const App = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const [isReady, setIsReady] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Conectar ao WebSocket
        const ws = new WebSocket("ws://localhost:8080");
        wsRef.current = ws;

        ws.onopen = () => console.log("Conectado ao WebSocket");
        ws.onclose = () => console.log("Desconectado");

        // Criar um MediaSource para o áudio
        mediaSourceRef.current = new MediaSource();
        mediaSourceRef.current.addEventListener("sourceopen", () => {
            const mediaSource = mediaSourceRef.current!;
            const sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs=opus');
            sourceBufferRef.current = sourceBuffer;
            setIsReady(true);
        });

        // Configurar o áudio
        if (audioRef.current) {
            audioRef.current.src = URL.createObjectURL(mediaSourceRef.current);
        }

        // Captura de áudio e envio via WebSocket
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
            mediaRecorder.start(500);

            mediaRecorder.ondataavailable = (event) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(event.data);
                }
            };
        });

        // Receber áudio via WebSocket
        ws.onmessage = async (event) => {
            if (isReady && sourceBufferRef.current && !sourceBufferRef.current.updating) {
                const arrayBuffer = await event.data.arrayBuffer();
                sourceBufferRef.current.appendBuffer(arrayBuffer);
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [isReady]);

    return (
        <div>
            <h1>Audio Chat</h1>
            <audio ref={audioRef} controls autoPlay />
        </div>
    );
};

export default App
