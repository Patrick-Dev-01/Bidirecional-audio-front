import { useState } from 'react'
import './App.css'
import { useEffect, useRef } from "react";

const App = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [sala, setSala] = useState<string | null>(null);

    useEffect(() => {
        if (!sala) return;

        // Se a sala não mudou, não recria a conexão
        if (wsRef.current && wsRef.current.url.includes(sala)) {
            console.log("Já conectado à sala, sem necessidade de reconectar.");
            return;
        }

        // Fecha a conexão WebSocket anterior antes de criar uma nova
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        // Criar nova conexão WebSocket
        const ws = new WebSocket(`ws://localhost:8080?sala=${sala}`);
        wsRef.current = ws;

        ws.onopen = () => console.log(`✅ Conectado à sala: ${sala}`);
        ws.onclose = () => console.log(`❌ Desconectado da sala: ${sala}`);

        // Criar um novo MediaSource quando a aba abrir
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        mediaSource.addEventListener("sourceopen", () => {
            const sourceBuffer = mediaSource.addSourceBuffer("audio/webm; codecs=opus");
            sourceBufferRef.current = sourceBuffer;
            setIsReady(true);
        });

        // Associar o MediaSource ao <audio>
        if (audioRef.current) {
            audioRef.current.src = URL.createObjectURL(mediaSource);
        }

        // Captura de áudio e envio via WebSocket
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm; codecs=opus" });
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
            console.log("Limpando a conexão ao sair da sala.");
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [isReady, sala]);

    return (
        <div>
            <h1>🔊 Audio Chat</h1>
            <p>Sala atual: {sala || "Nenhuma"}</p>

            <div>
                <button onClick={() => setSala("sala1")}>Entrar na Sala 1</button>
                <button onClick={() => setSala("sala2")}>Entrar na Sala 2</button>
                <button onClick={() => setSala("sala3")}>Entrar na Sala 3</button>
            </div>

            <audio ref={audioRef} controls autoPlay />
        </div>
    );
};

export default App
