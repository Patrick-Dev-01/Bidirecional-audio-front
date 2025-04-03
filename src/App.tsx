import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

export default function AudioChat() {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [remoteId, setRemoteId] = useState<string>("");
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const peerRef = useRef<Peer | null>(null);
    const callRef = useRef<any>(null);

    useEffect(() => {
        const peer = new Peer(); // Cria uma conexão Peer.js
        peerRef.current = peer;

        peer.on("open", (id) => {
            console.log("🆔 Meu Peer ID:", id);
            setPeerId(id);
        });

        peer.on("call", (call) => {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                call.answer(stream);
                call.on("stream", (remoteStream) => {
                    if (audioRef.current) {
                        audioRef.current.srcObject = remoteStream;
                        audioRef.current.play();
                    }
                });
            });
        });

        return () => peer.disconnect();
    }, []);

    const startCall = () => {
        if (!remoteId || !peerRef.current) return;
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const call = peerRef.current!.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                if (audioRef.current) {
                    audioRef.current.srcObject = remoteStream;
                    audioRef.current.play();
                }
            });
            callRef.current = call;
        });
    };

    return (
        <div>
            <h1>🔊 Audio Chat com Peer.js</h1>
            <p>Seu Peer ID: {peerId}</p>
            <input
                type="text"
                placeholder="ID do parceiro"
                value={remoteId}
                onChange={(e) => setRemoteId(e.target.value)}
            />
            <button onClick={startCall}>📞 Chamar</button>
            <audio ref={audioRef} controls autoPlay />
        </div>
    );
}