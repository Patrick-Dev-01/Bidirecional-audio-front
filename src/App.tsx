import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { io, Socket } from "socket.io-client";

export default function AudioChat() {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [sala, setSala] = useState<string>("");
    const audioRefs = useRef(new Map()); // Armazena referências dos áudios
    const peersRef = useRef(new Map()); // Armazena conexões Peer
    const socket = useRef(io("http://localhost:9096"));
    const peer = useRef(new Peer());

    useEffect(() => {
        peer.current.on("open", (id) => {
            console.log("🆔 Meu Peer ID:", id);
            setPeerId(id);
        });

        peer.current.on("call", (call) => {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                call.answer(stream);
                call.on("stream", (remoteStream) => {
                    if (!audioRefs.current.has(call.peer)) {
                        adicionarAudio(call.peer, remoteStream);
                    }
                });
            });
        });

        socket.current.on("usuarios_na_sala", (usuarios) => {
            console.log("👥 Outros usuários na sala:", usuarios);
            usuarios.forEach(chamarPeer);
        });

        socket.current.on("novo_usuario", (novoPeerId) => {
            console.log("👤 Novo usuário entrou:", novoPeerId);
            chamarPeer(novoPeerId);
        });

        return () => {
            socket.current.disconnect();
            peer.current.disconnect();
        };
    }, []);

    const entrarNaSala = () => {
        if (!sala) return;
        socket.current.emit("entrar_sala", sala, peerId);
    };

    const chamarPeer = (id: string) => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const call = peer.current.call(id, stream);
            call.on("stream", (remoteStream) => {
                if (!audioRefs.current.has(id)) {
                    adicionarAudio(id, remoteStream);
                }
            });
            peersRef.current.set(id, call);
        });
    };

    const adicionarAudio = (id: string, stream: MediaStream) => {
        const audio = document.createElement("audio");
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.controls = true;
        document.body.appendChild(audio);
        audioRefs.current.set(id, audio);
    };

    return (
        <div>
            <h1>🔊 Audio Chat Multijogador</h1>
            <input
                type="text"
                placeholder="Nome da Sala"
                value={sala}
                onChange={(e) => setSala(e.target.value)}
            />
            <button onClick={entrarNaSala}>Entrar na Sala</button>
        </div>
    );
}