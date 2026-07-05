import express from "express";
import multer from "multer";
import OpenAI from "openai";
import { Readable } from "stream";
import requireAuth from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.use(requireAuth);

// Speech-to-text: browser records audio -> sent here -> Whisper transcribes it -> text returned
router.post("/transcribe", upload.single("audio"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No audio file received" });
    }

    try {
        // The OpenAI SDK needs a File-like object; wrap the uploaded buffer
        const file = await OpenAI.toFile(req.file.buffer, "speech.webm", { type: req.file.mimetype });

        const transcription = await openai.audio.transcriptions.create({
            file,
            model: "whisper-1"
        });

        res.json({ text: transcription.text });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to transcribe audio" });
    }
});

// Text-to-speech: takes assistant reply text -> returns spoken audio (mp3 stream)
router.post("/speak", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    try {
        const speech = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text.slice(0, 4000) // guard against extremely long replies
        });

        const buffer = Buffer.from(await speech.arrayBuffer());
        res.set({
            "Content-Type": "audio/mpeg",
            "Content-Length": buffer.length
        });
        Readable.from(buffer).pipe(res);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to generate speech" });
    }
});

export default router;
