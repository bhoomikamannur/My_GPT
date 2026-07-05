import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import { apiFetch } from "./api.js";
import { useAuth } from "./AuthContext.jsx";
import { useTheme } from "./ThemeContext.jsx";
import { useNavigate } from "react-router-dom";

function ChatWindow() {
    const { prompt, setPrompt, reply, setReply, currThreadId, prevChats, setPrevChats, setNewChat } = useContext(MyContext);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // "settings" | "upgrade" | null
    const [chatError, setChatError] = useState("");

    // voice recording state
    const [isRecording, setIsRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const getReply = async () => {
        if (!prompt.trim()) return;

        setChatError("");
        setLoading(true);
        setNewChat(false);

        const options = {
            method: "POST",
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
            })
        };

        try {
            const response = await apiFetch("/chat", options);
            const res = await response.json();

            if (!response.ok) {
                // Backend failed (e.g. bad OpenAI key) - show it, keep the prompt so
                // the person doesn't lose what they typed, and restore the empty state
                // if this thread still has no messages in it.
                setChatError(res.error || "Something went wrong. Please try again.");
                if (!prevChats.length) setNewChat(true);
                setLoading(false);
                return;
            }

            setReply(res.reply);
        } catch (err) {
            console.log(err);
            setChatError("Could not reach the server. Is the backend running?");
        }
        setLoading(false);
    }

    //Append new chat to prevChats
    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "user",
                    content: prompt
                }, {
                    role: "assistant",
                    content: reply
                }]
            ));
        }

        setPrompt("");
    }, [reply]);

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    const openModal = (modal) => {
        setActiveModal(modal);
        setIsOpen(false);
    }

    const handleLogout = () => {
        setIsOpen(false);
        logout();
        navigate("/login");
    }

    // ---- Voice input (speech-to-text via OpenAI Whisper) ----
    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

                setTranscribing(true);
                try {
                    const formData = new FormData();
                    formData.append("audio", audioBlob, "speech.webm");

                    const response = await apiFetch("/voice/transcribe", {
                        method: "POST",
                        body: formData
                    });
                    const data = await response.json();

                    if (response.ok && data.text) {
                        setPrompt(prev => (prev ? `${prev} ${data.text}` : data.text));
                    }
                } catch (err) {
                    console.log(err);
                }
                setTranscribing(false);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.log("Microphone access denied or unavailable", err);
        }
    }

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>MyGPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="navActions">
                    <button className="themeToggle" onClick={toggleTheme} title="Toggle theme">
                        <i className={theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
                    </button>
                    <div className="userIconDiv" onClick={handleProfileClick}>
                        <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                    </div>
                </div>
            </div>
            {
                isOpen &&
                <div className="dropDown">
                    <div className="dropDownItem" onClick={() => openModal("settings")}>
                        <i className="fa-solid fa-gear"></i> Settings
                    </div>
                    <div className="dropDownItem" onClick={() => openModal("upgrade")}>
                        <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan
                    </div>
                    <div className="dropDownItem" onClick={handleLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                    </div>
                </div>
            }

            {
                activeModal === "settings" &&
                <div className="modalOverlay" onClick={() => setActiveModal(null)}>
                    <div className="modalBox" onClick={(e) => e.stopPropagation()}>
                        <h2>Settings</h2>
                        <p><strong>Name:</strong> {user?.name}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Theme:</strong> {theme === "dark" ? "Dark" : "Light"}</p>
                        <button className="closeBtn" onClick={() => setActiveModal(null)}>Close</button>
                    </div>
                </div>
            }

            {
                activeModal === "upgrade" &&
                <div className="modalOverlay" onClick={() => setActiveModal(null)}>
                    <div className="modalBox" onClick={(e) => e.stopPropagation()}>
                        <h2>Upgrade plan</h2>
                        <p>Plans and billing aren't set up yet — this is a placeholder for a future pricing page.</p>
                        <button className="closeBtn" onClick={() => setActiveModal(null)}>Close</button>
                    </div>
                </div>
            }

            <Chat></Chat>

            <ScaleLoader color="var(--accent)" loading={loading}>
            </ScaleLoader>

            {chatError && <p className="chatError">{chatError}</p>}

            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder={transcribing ? "Transcribing..." : "Ask anything"}
                        value={prompt}
                        disabled={transcribing}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' ? getReply() : ''}
                    >
                    </input>
                    <div id="mic" className={isRecording ? "recording" : ""} onClick={toggleRecording} title={isRecording ? "Stop recording" : "Record voice message"}>
                        <i className={isRecording ? "fa-solid fa-stop" : "fa-solid fa-microphone"}></i>
                    </div>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    MyGPT can make mistakes. Check important info.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;