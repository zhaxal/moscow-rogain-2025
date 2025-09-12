import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { auth } from "@/lib/auth";
import { useRouter } from "next/router";

import { gothampro, mossport } from "@/utils/fonts";

import Button from "@/components/Button";
import { useSnackbar } from "notistack";
import { db } from "@/database";
import Footer from "@/components/Footer";

type QuestionPageProps = {
  user: {
    name: string;
    role: string;
  };
  question: {
    id: number;
    number: number;
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

    if (session?.user.name === "no_number") {
      return {
        redirect: {
          destination:
            "/register?redirect=" + encodeURIComponent(req.url || ""),
          permanent: false,
        },
      };
    }

    if (!session) {
      return {
        redirect: {
          destination: "/signin?redirect=" + encodeURIComponent(req.url || ""),
          permanent: false,
        },
      };
    }

    const record = await db
      .selectFrom("question")
      .selectAll()
      .where("org_id", "=", id)
      .executeTakeFirst();

    if (!record) {
      return {
        notFound: true,
      };
    }

    const attempt = await db
      .selectFrom("quiz_attempt")
      .selectAll()
      .where("question_id", "=", record.id)
      .where("user_id", "=", session.user.id)
      .executeTakeFirst();

    if (attempt) {
      return {
        redirect: {
          destination: `/?snackbar=answered`,
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: {
          name: session.user.name || "Игрок",
          role: session.user.role || "user",
        },
        question: {
          id: record.id,
          number: record.number,
          question: record.question_text,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const handleSubmit = async () => {
    if (selected === null || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: question.id.toString(),
          answer: question.options[selected],
        }),
      });

      if (response.ok) {
        enqueueSnackbar("Ответ отправлен", { variant: "success" });
        // Optional: redirect to next question or results page
        router.push("/");
      } else {
        const error = await response.json();
        enqueueSnackbar(error.error || "Ошибка при отправке ответа", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      enqueueSnackbar("Ошибка при отправке ответа", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`Вопрос ${question.number}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        className={`min-h-screen flex flex-col items-start justify-center p-3 sm:p-6 ${gothampro.className}`}
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
            <div className="flex justify-center mb-4">
              <Image
                src="/logos/rogaine_logo.svg"
                alt="Rogaine Logo"
                width={200}
                height={133}
                className="h-24 sm:h-32 w-auto"
                priority
              />
            </div>
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
              handleSubmit();
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
                    disabled={isSubmitting}
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
              disabled={selected == null || isSubmitting}
              onClick={handleSubmit}
              className="order-1 sm:order-2 w-full sm:w-auto"
            >
              {isSubmitting ? "ОТПРАВКА..." : "ОТВЕТИТЬ"}
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}

export default QuestionPage;
