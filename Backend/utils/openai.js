import "dotenv/config";

const getOpenAIAPIResponse = async (message) => {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: message
            }]
        })
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", options);
    const data = await response.json();

    if (!response.ok) {
        // Surface the real reason (bad/missing API key, rate limit, etc.) instead of
        // silently returning undefined and letting the caller crash on save.
        const reason = data?.error?.message || `OpenAI request failed with status ${response.status}`;
        throw new Error(reason);
    }

    return data.choices[0].message.content; //reply
}

export default getOpenAIAPIResponse;