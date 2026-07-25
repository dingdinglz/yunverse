"use client";

import { useState } from "react";

import Button from "@/components/Button";
import { apiPost } from "@/lib/apiClient";

interface DebugResult {
  matched: boolean;
  text: string;
  instrument?: string;
  reason?: string;
}

export default function RingVoiceDebugPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    { text: string; result: DebugResult; at: string }[]
  >([]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    try {
      const result = await apiPost<DebugResult>("/voice/debug", { text });
      setHistory((prev) => [
        { text, result, at: new Date().toLocaleTimeString() },
        ...prev,
      ].slice(0, 20));
      setInput("");
    } catch (err) {
      setHistory((prev) => [
        {
          text,
          result: { matched: false, text, reason: String(err) },
          at: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 20));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground">语音调试</h2>
        <p className="mt-1 text-sm text-muted">
          输入文本模拟语音指令，测试 LLM 意图识别与乐器切换
        </p>
      </header>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="例: 切换到琵琶 / 我想弹吉他 / 换唢呐"
          className="flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent"
          disabled={loading}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
        >
          {loading ? "识别中..." : "发送"}
        </Button>
      </div>

      {history.length > 0 && (
        <ul className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
          {history.map((item, i) => (
            <li key={i} className="flex items-start gap-3 px-3 py-2.5 text-sm">
              <span className="shrink-0 font-mono text-xs text-muted">
                {item.at}
              </span>
              <span className="flex-1">
                <span className="text-foreground">&ldquo;{item.text}&rdquo;</span>
                <span className="mx-2 text-muted">&rarr;</span>
                {item.result.matched ? (
                  <span className="font-medium text-ok">
                    {item.result.instrument}
                  </span>
                ) : (
                  <span className="text-warn">
                    {item.result.reason || "未匹配"}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
