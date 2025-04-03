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

        if (wsRef.current) {
            // wsRef.current.close();
            wsRef.current = null;
        }
    
        const ws = new WebSocket(`${import.meta.env.VITE_WS_LINK}` || `ws://localhost:8080?sala=${sala}`);
        wsRef.current = ws;
    
        ws.onopen = () => console.log(`✅ Conectado à sala: ${sala}`);
        ws.onclose = () => console.log(`❌ Desconectado da sala: ${sala}`);
    
        // 🚨 Apenas cria o MediaSource UMA VEZ
        if (!mediaSourceRef.current) {
            const mediaSource = new MediaSource();
            mediaSourceRef.current = mediaSource;
    
            mediaSource.addEventListener("sourceopen", () => {
                if (!sourceBufferRef.current) {
                    try {
                        sourceBufferRef.current = mediaSource.addSourceBuffer("audio/webm; codecs=opus");
                        setIsReady(true);
                    } catch (error) {
                        console.error("Erro ao criar SourceBuffer:", error);
                    }
                }
            });
    
            if (audioRef.current) {
                audioRef.current.src = URL.createObjectURL(mediaSource);
            }
        }
    
        ws.onmessage = async (event) => {
            if (!isReady || !sourceBufferRef.current || !mediaSourceRef.current) return;
    
            // 🚨 Garante que o MediaSource está aberto
            if (mediaSourceRef.current.readyState !== "open") {
                console.warn("MediaSource ainda não está aberto! Esperando...");
                return;
            }

            if (isReady && sourceBufferRef.current && !sourceBufferRef.current.updating) {
                const arrayBuffer = await event.data.arrayBuffer();
                sourceBufferRef.current.appendBuffer(arrayBuffer);
            }
    
            const arrayBuffer = await event.data.arrayBuffer();
    
            if (!sourceBufferRef.current.updating) {
                try {
                    sourceBufferRef.current.appendBuffer(arrayBuffer);
                } catch (error) {
                    console.error("Erro ao adicionar buffer:", error);
                }
            } else {
                sourceBufferRef.current.addEventListener(
                    "updateend",
                    () => {
                        if (!sourceBufferRef.current?.updating) {
                            sourceBufferRef.current.appendBuffer(arrayBuffer);
                        }
                    },
                    { once: true }
                );
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
            <h1>🔊 Audio Chat Bidirecional</h1>
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
