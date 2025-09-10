import { useState } from "react";
import Head from "next/head";

const QUESTION = {
  number: 1,
  text: "Какова столица России?",
  options: ["Москва", "Санкт‑Петербург", "Казань", "Новосибирск"],
};

function QuestionPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <Head>
        <title>{`Вопрос ${QUESTION.number}`}</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-start justify-center p-6">
        <div className="w-full max-w-xl bg-slate-800/70 backdrop-blur rounded-xl border border-slate-700 shadow-lg p-6">
          <header className="mb-5 flex items-center gap-3">
            <span className="px-3 py-1 rounded-md text-xs font-semibold tracking-wide bg-blue-600/20 text-blue-300 border border-blue-600/40">
              Вопрос {QUESTION.number}
            </span>
          </header>

          <h1 className="text-xl font-semibold leading-snug mb-6">
            {QUESTION.text}
          </h1>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {QUESTION.options.map((opt, idx) => {
              const id = `q${QUESTION.number}-opt${idx}`;
              const active = selected === idx;
              return (
                <label
                  key={id}
                  htmlFor={id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition
                    ${
                      active
                        ? "border-blue-500 bg-blue-600/20 ring-2 ring-blue-500/40"
                        : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/40"
                    }`}
                >
                  <input
                    id={id}
                    type="radio"
                    name="answer"
                    value={idx}
                    className="mt-1 h-4 w-4 cursor-pointer accent-blue-500"
                    checked={active}
                    onChange={() => setSelected(idx)}
                  />
                  <span className="text-sm leading-relaxed select-none">
                    <span className="font-semibold mr-1">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </span>
                </label>
              );
            })}
          </form>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {selected == null
                ? "Выберите ответ"
                : `Выбрано: ${String.fromCharCode(65 + selected)}`}
            </div>
            <button
              disabled={selected == null}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 transition"
              onClick={() => {
                alert(
                  `Вы выбрали: ${String.fromCharCode(65 + (selected ?? 0))}`
                );
              }}
            >
              Ответить
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default QuestionPage;
