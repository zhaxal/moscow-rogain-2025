import { useState } from "react";
import Head from "next/head";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { auth } from "@/lib/auth";

import PocketBase from "pocketbase";
import { Question } from "@/types/question";

import { gothampro, mossport } from "@/utils/fonts";

import Button from "@/components/Button";
import { useSnackbar } from "notistack";

type QuestionPageProps = {
  user: {
    name: string;
    role: string;
  };
  question: {
    number: string;
    question: string;
    options: string[];
  };
};

export const getServerSideProps = (async (context) => {
  try {
    const { req, params } = context;
    const { id } = params as { id: string };

    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (!session) {
      return {
        redirect: {
          destination: "/signin",
          permanent: false,
        },
      };
    }

    const pb = new PocketBase("https://pb.rogain.moscow");
    const login = process.env.PB_LOGIN;
    const password = process.env.PB_PASSWORD;

    if (!login || !password) {
      throw new Error("App credentials are not set");
    }

    await pb.collection("_superusers").authWithPassword(login, password);

    const record = await pb.collection<Question>("questions").getOne(id);

    if (!record) {
      return {
        notFound: true,
      };
    }

    pb.authStore.clear();

    return {
      props: {
        user: {
          name: session.user.name || "Игрок",
          role: session.user.role || "user",
        },
        question: {
          number: record.number,
          question: record.question,
          options: [
            record.correct_answer,
            record.incorrect_answer_1,
            record.incorrect_answer_2,
            record.incorrect_answer_3,
          ]
            .filter(Boolean)
            .sort(() => Math.random() - 0.5),
        },
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      notFound: true,
    };
  }
}) satisfies GetServerSideProps<QuestionPageProps>;

function QuestionPage({
  question,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [selected, setSelected] = useState<number | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  return (
    <>
      <Head>
        <title>{`Вопрос ${question.number}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        className={`min-h-screen flex items-start justify-center p-3 sm:p-6 ${gothampro.className}`}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="w-full max-w-xl rounded-xl p-4 sm:p-8 border-2 shadow-lg"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#6DAD3A",
          }}
        >
          <header className="mb-6 sm:mb-8 text-center">
            <h1
              className={`text-2xl sm:text-4xl font-bold tracking-wide mb-3 sm:mb-4 ${mossport.className}`}
              style={{ color: "#6DAD3A" }}
            >
              ВОПРОС {question.number}
            </h1>
            <div
              className="w-full h-px"
              style={{ backgroundColor: "#6DAD3A" }}
            ></div>
          </header>

          <div
            className={`text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 ${gothampro.className}`}
            style={{ color: "#2D2D2D" }}
          >
            {question.question}
          </div>

          <form
            className="space-y-2 sm:space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {question.options.map((opt, idx) => {
              const id = `q${question.number}-opt${idx}`;
              const active = selected === idx;
              return (
                <label
                  key={id}
                  htmlFor={id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 sm:p-4 transition border-2 ${
                    active ? "bg-orange-50" : "bg-gray-50 hover:bg-green-50"
                  }`}
                  style={{
                    borderColor: active ? "#f97316" : "#E5E7EB",
                  }}
                >
                  <input
                    id={id}
                    type="radio"
                    name="answer"
                    value={idx}
                    className="mt-1 h-4 w-4 cursor-pointer accent-orange-500 flex-shrink-0"
                    checked={active}
                    onChange={() => setSelected(idx)}
                  />
                  <span
                    className={`text-sm sm:text-base leading-relaxed select-none ${gothampro.className}`}
                    style={{ color: "#2D2D2D" }}
                  >
                    <span
                      className="font-semibold mr-2"
                      style={{ color: "#6DAD3A" }}
                    >
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </span>
                </label>
              );
            })}
          </form>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div
              className={`text-sm ${gothampro.className} order-2 sm:order-1`}
              style={{ color: "#6DAD3A" }}
            >
              {selected == null
                ? "Выберите ответ"
                : `Выбрано: ${String.fromCharCode(65 + selected)}`}
            </div>
            <Button
              disabled={selected == null}
              onClick={() => {
                enqueueSnackbar("Ответ отправлен", { variant: "success" });
              }}
              className="order-1 sm:order-2 w-full sm:w-auto"
            >
              ОТВЕТИТЬ
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

export default QuestionPage;
