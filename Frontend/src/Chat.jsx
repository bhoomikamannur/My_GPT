import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { apiFetch } from "./api.js";

function Chat() {
    const { newChat, prevChats, reply } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const [speakingIdx, setSpeakingIdx] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (reply === null) {
            setLatestReply(null); //prevchat load
            return;
        }

        if (!prevChats?.length) return;

        const content = reply.split(" "); //individual words

        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx + 1).join(" "));

            idx++;
            if (idx >= content.length) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);

    }, [prevChats, reply])

    // ---- Voice output (text-to-speech via OpenAI TTS) ----
    const speak = async (text, idx) => {
        if (speakingIdx === idx) {
            audioRef.current?.pause();
            setSpeakingIdx(null);
            return;
        }

        try {
            const response = await apiFetch("/voice/speak", {
                method: "POST",
                body: JSON.stringify({ text })
            });

            if (!response.ok) return;

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            audioRef.current?.pause();
            const audio = new Audio(url);
            audioRef.current = audio;
            setSpeakingIdx(idx);

            audio.onended = () => setSpeakingIdx(null);
            audio.play();
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <div className="chatMain">
            {newChat && <h1 className="startChatHeading">Start a New Chat!</h1>}
            <div className="chats">
                {
                    prevChats?.slice(0, -1).map((chat, idx) =>
                        <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                            {
                                chat.role === "user" ?
                                    <p className="userMessage">{chat.content}</p> :
                                    <>
                                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{chat.content}</ReactMarkdown>
                                        <button className="speakBtn" onClick={() => speak(chat.content, idx)}>
                                            <i className={speakingIdx === idx ? "fa-solid fa-circle-stop" : "fa-solid fa-volume-high"}></i> {speakingIdx === idx ? "Stop" : "Listen"}
                                        </button>
                                    </>
                            }
                        </div>
                    )
                }

                {
                    prevChats.length > 0 && (
                        <>
                            {
                                latestReply === null ? (
                                    <div className="gptDiv" key={"non-typing"} >
                                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{prevChats[prevChats.length - 1].content}</ReactMarkdown>
                                        <button className="speakBtn" onClick={() => speak(prevChats[prevChats.length - 1].content, "last")}>
                                            <i className={speakingIdx === "last" ? "fa-solid fa-circle-stop" : "fa-solid fa-volume-high"}></i> {speakingIdx === "last" ? "Stop" : "Listen"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="gptDiv" key={"typing"} >
                                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{latestReply}</ReactMarkdown>
                                    </div>
                                )

                            }
                        </>
                    )
                }

            </div>
        </div>
    )
}

export default Chat;