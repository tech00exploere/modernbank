"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export default function SupportPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [talkSupported, setTalkSupported] = useState(false);
  const [talkEnabled, setTalkEnabled] = useState(false);
  const [talkStatus, setTalkStatus] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [voiceReady, setVoiceReady] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const talkEnabledRef = useRef(false);
  const speakingRef = useRef(false);
  const manualStopRef = useRef(false);
  const recognitionRunningRef = useRef(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello, I am your AI support assistant. Ask about account status, transfers, loans, or transactions.",
    },
  ]);

  const history = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages]
  );

  const speakReply = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return Promise.resolve();
    }

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((voice) => voice.lang.startsWith("en") && /female|samantha|zira|aria/i.test(voice.name)) ||
      voices.find((voice) => voice.lang.startsWith("en")) ||
      null;

    if (recognitionRef.current && recognitionRunningRef.current) {
      recognitionRef.current.stop();
      recognitionRunningRef.current = false;
    }

    speakingRef.current = true;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    return new Promise<void>((resolve) => {
      utterance.onend = () => {
        speakingRef.current = false;
        if (talkEnabledRef.current && recognitionRef.current && !manualStopRef.current) {
          try {
            recognitionRef.current.start();
            recognitionRunningRef.current = true;
          } catch {
            setTalkStatus("AI Talk paused. Tap Start again.");
            setTalkEnabled(false);
            talkEnabledRef.current = false;
          }
        }
        resolve();
      };
      utterance.onerror = () => {
        speakingRef.current = false;
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  };

  const isNetworkFailure = (value: unknown) => {
    const message = value instanceof Error ? value.message : String(value || "");
    return /failed to fetch|networkerror|network request failed/i.test(message);
  };

  const ensureSupportOnline = async () => {
    const response = await fetch(`${apiUrl}/support/health`, {
      method: "GET",
      credentials: "include",
    });
    return response.ok;
  };

  const askSupport = async (message: string) => {
    const cleanMessage = message.trim();
    if (!cleanMessage || loading) {
      return;
    }

    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: cleanMessage }]);

    try {
      const request = () =>
        fetch(`${apiUrl}/support/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: cleanMessage, history }),
        });

      let response = await request();
      if (!response.ok && response.status >= 500) {
        response = await request();
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Support request failed");
      }

      const payload = await response.json();
      const reply =
        payload?.reply || "I could not generate a response right now.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      if (talkEnabledRef.current) {
        await speakReply(reply);
      }
    } catch (err) {
      const messageText = isNetworkFailure(err)
        ? "Network error: unable to reach support server. Verify backend is running on http://localhost:4000."
        : err instanceof Error
          ? err.message
          : "Support request failed";
      setError(messageText);
      const fallback =
        "I could not process this request right now. Please try again in a few moments.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallback,
        },
      ]);
      if (talkEnabledRef.current) {
        await speakReply(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) {
      return;
    }
    setInput("");
    await askSupport(message);
  };

  const stopTalkMode = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    recognitionRunningRef.current = false;
    recognitionRef.current = null;
    setTalkEnabled(false);
    talkEnabledRef.current = false;
    setLiveTranscript("");
    setTalkStatus("AI Talk stopped.");
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const startTalkMode = () => {
    if (typeof window === "undefined") {
      return;
    }

    const RecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setTalkStatus("Speech recognition is not supported in this browser.");
      setTalkSupported(false);
      return;
    }

    const recognition: SpeechRecognitionLike = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = async (event: any) => {
      if (speakingRef.current) {
        return;
      }

      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcriptChunk = String(event.results[i][0]?.transcript || "").trim();
        if (!transcriptChunk) {
          continue;
        }

        if (event.results[i].isFinal) {
          finalText += `${transcriptChunk} `;
        } else {
          interim += `${transcriptChunk} `;
        }
      }

      setLiveTranscript(interim.trim());

      const cleanFinal = finalText.trim();
      if (cleanFinal) {
        setLiveTranscript("");
        await askSupport(cleanFinal);
      }
    };

    recognition.onerror = (event: any) => {
      setTalkStatus(`AI Talk error: ${event?.error || "unknown"}`);
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      if (talkEnabledRef.current && !speakingRef.current && !manualStopRef.current) {
        try {
          recognition.start();
          recognitionRunningRef.current = true;
        } catch {
          setTalkStatus("AI Talk paused. Tap Start again.");
          setTalkEnabled(false);
          talkEnabledRef.current = false;
        }
      }
    };

    recognitionRef.current = recognition;

    const start = async () => {
      try {
        const online = await ensureSupportOnline();
        if (!online) {
          setTalkStatus("Support server is unavailable right now.");
          return;
        }

        recognition.start();
        manualStopRef.current = false;
        recognitionRunningRef.current = true;
        setTalkEnabled(true);
        talkEnabledRef.current = true;
        setTalkStatus("AI Talk active. Speak your question.");
        await speakReply(
          "AI Talk started. I am listening. Ask me about account status, transfers, loans, or transactions."
        );
      } catch {
        setTalkStatus("Unable to start AI Talk. Check microphone permission and backend connectivity.");
        setTalkEnabled(false);
        talkEnabledRef.current = false;
      }
    };

    start();
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const RecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setTalkSupported(Boolean(RecognitionCtor));
    setVoiceReady("speechSynthesis" in window);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoiceReady(window.speechSynthesis.getVoices().length > 0);
      };
      setVoiceReady(window.speechSynthesis.getVoices().length > 0);
    }

    return () => {
      recognitionRef.current?.stop();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <ProtectedRoute
      title="Support center"
      description="Chat with AI support or use AI Talk mode for voice conversations."
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">AI Chat</p>
          <div className="mt-4 h-80 space-y-3 overflow-y-auto rounded-xl bg-sand/50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-auto w-fit max-w-[85%] rounded-xl bg-ink px-3 py-2 text-sm text-sand"
                    : "w-fit max-w-[85%] rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
                }
              >
                {message.content}
              </div>
            ))}
          </div>
          <form className="mt-4 flex gap-3" onSubmit={handleAsk}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your query"
              className="w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-ink px-4 py-3 text-sm text-sand"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 text-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate">AI Talk</p>
            <p className="mt-3 text-slate">
              Speak directly with the AI assistant. Your voice is converted to text,
              answered by support AI, and read back aloud.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={startTalkMode}
                disabled={!talkSupported || talkEnabled}
                className="rounded-full bg-ink px-4 py-2 text-sand disabled:opacity-60"
              >
                Start AI Talk
              </button>
              <button
                type="button"
                onClick={stopTalkMode}
                disabled={!talkEnabled}
                className="rounded-full border border-ink/20 bg-white px-4 py-2 text-ink disabled:opacity-60"
              >
                Stop
              </button>
              <button
                type="button"
                onClick={() =>
                  speakReply(
                    "Hello, I am your AI support assistant. Ask your banking question."
                  )
                }
                disabled={!voiceReady}
                className="rounded-full border border-ink/20 bg-white px-4 py-2 text-ink disabled:opacity-60"
              >
                Test voice
              </button>
            </div>
            {!talkSupported ? (
              <p className="mt-3 text-slate">
                Voice recognition is not available in this browser. Use AI Chat instead.
              </p>
            ) : null}
            {liveTranscript ? (
              <p className="mt-3 rounded-xl bg-sand/60 px-3 py-2 text-slate">
                Listening: {liveTranscript}
              </p>
            ) : null}
            {talkStatus ? <p className="mt-3 text-slate">{talkStatus}</p> : null}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-sand/60 p-5 text-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate">Quick help topics</p>
            <ul className="mt-3 space-y-2 text-slate">
              <li>Account verification status</li>
              <li>Transfer failed or pending</li>
              <li>Transaction dispute support</li>
              <li>Loan approval updates</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
