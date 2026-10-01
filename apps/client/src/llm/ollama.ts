export type OllamaToolCall = {
    function: {
        name: string;
        arguments: Record<string, unknown> | string;
    };
};

export type OllamaMessage = {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_calls?: OllamaToolCall[];
    tool_name?: string;
};

export type OllamaTool = {
    type: "function";
    function: {
        name: string;
        description?: string;
        parameters: Record<string, unknown>;
    };
};

type OllamaChatResponse = {
    message: OllamaMessage;
};

type ChatOptions = {
    messages: OllamaMessage[];
    tools: OllamaTool[];
};

const baseUrl =
    process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

const model = process.env.OLLAMA_MODEL;

export async function chatWithOllama({
    messages,
    tools,
}: ChatOptions): Promise<OllamaMessage> {
    if (!model) {
        throw new Error("OLLAMA_MODEL is not set in the root .env file");
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages,
            tools,
            stream: false,
            think: false,
            keep_alive: "30m",
        }),
    });

    if (!response.ok) {
        const responseBody = await response.text();

        throw new Error(
            `Ollama returned ${response.status}: ${responseBody}`,
        );
    }

    const data = (await response.json()) as OllamaChatResponse;

    return data.message;
}