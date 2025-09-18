import React, { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { auth } from "@/lib/auth";
import { useRouter } from "next/router";

import { gothampro, mossport } from "@/utils/fonts";
import Button from "@/components/Button";
import Footer from "@/components/Footer";
import { useSnackbar } from "notistack";

interface Result {
  user_id: string;
  start_number: string;
  phone_number: string;
  group_name: string; // Добавляем поле группы
  total_questions: number;
  quiz_points: number;
  telemetry_points: number;
  total_points: number;
}

interface ResultsResponse {
  results: Result[];
}

type ResultsPageProps = {
  user: {
    name: string;
    role: string;
  };
};

export const getServerSideProps = (async (context) => {
  try {
    const { req } = context;

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

    return {
      props: {
        user: {
          name: session.user.name || "Игрок",
          role: session.user.role || "user",
        },
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      notFound: true,
    };
  }
}) satisfies GetServerSideProps<ResultsPageProps>;

function ResultsPage({
  user,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/org/results");
      if (response.ok) {
        const data: ResultsResponse = await response.json();
        const sortedResults = data.results.sort(
          (a, b) => Number(b.total_points) - Number(a.total_points)
        );
        setResults(sortedResults);
        setFilteredResults(sortedResults);
        enqueueSnackbar("Результаты обновлены", { variant: "success" });
      } else {
        enqueueSnackbar("Не удалось загрузить результаты", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Ошибка при загрузке результатов", { variant: "error" });
      console.error("Results fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setFilteredResults(results);
    } else {
      const filtered = results.filter((result) =>
        result.start_number?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <>
      <Head>
        <title>Результаты</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        className={`min-h-screen flex flex-col items-center justify-start p-3 sm:p-6 ${gothampro.className}`}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="w-full max-w-4xl rounded-xl p-4 sm:p-8 border-2 shadow-lg"
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
              РЕЗУЛЬТАТЫ
            </h1>
            <div
              className="w-full h-px"
              style={{ backgroundColor: "#6DAD3A" }}
            ></div>
          </header>

          {/* Search and Refresh Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Поиск по номеру участника..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${gothampro.className}`}
                  style={{
                    borderColor: "#E5E7EB",
                    color: "#2D2D2D",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6DAD3A";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                  }}
                />
              </div>
              <Button
                onClick={fetchResults}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "ОБНОВЛЕНИЕ..." : "ОБНОВИТЬ"}
              </Button>
            </div>

            {searchTerm && (
              <div
                className={`text-sm ${gothampro.className}`}
                style={{ color: "#6DAD3A" }}
              >
                Найдено результатов: {filteredResults.length}
              </div>
            )}
          </div>

          {/* Results Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div
                className={`text-lg ${gothampro.className}`}
                style={{ color: "#6DAD3A" }}
              >
                Загрузка результатов...
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <div
                className={`text-lg ${gothampro.className}`}
                style={{ color: "#2D2D2D" }}
              >
                {searchTerm ? "Результаты не найдены" : "Результаты пока не доступны"}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div
                  className="grid grid-cols-5 gap-2 sm:gap-4 p-3 sm:p-4 rounded-t-lg border-b-2"
                  style={{ backgroundColor: "#6DAD3A", borderColor: "#6DAD3A" }}
                >
                  <div
                    className={`text-xs sm:text-sm font-bold text-white ${gothampro.className}`}
                  >
                    НОМЕР
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-bold text-white ${gothampro.className}`}
                  >
                    ГРУППА
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-bold text-white ${gothampro.className}`}
                  >
                    ВИКТОРИНА
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-bold text-white ${gothampro.className}`}
                  >
                    ТЕЛЕМЕТРИЯ
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-bold text-white ${gothampro.className}`}
                  >
                    ОБЩИЙ БАЛЛ
                  </div>
                </div>

                {/* Table Body */}
                <div className="rounded-b-lg border-2 border-t-0" style={{ borderColor: "#6DAD3A" }}>
                  {filteredResults.map((result, index) => (
                    <div
                      key={result.user_id}
                      className={`grid grid-cols-5 gap-2 sm:gap-4 p-3 sm:p-4 border-b ${
                        index === filteredResults.length - 1 ? "border-b-0" : ""
                      }`}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9F9F9",
                        borderColor: "#E5E7EB",
                      }}
                    >
                      <div
                        className={`text-sm sm:text-base font-semibold ${gothampro.className}`}
                        style={{ color: "#6DAD3A" }}
                      >
                        {result.start_number || "—"}
                      </div>
                      <div
                        className={`text-sm sm:text-base ${gothampro.className}`}
                        style={{ color: "#2D2D2D" }}
                      >
                        {result.group_name || "—"}
                      </div>
                      <div
                        className={`text-sm sm:text-base ${gothampro.className}`}
                        style={{ color: "#2D2D2D" }}
                      >
                        {result.quiz_points || 0}
                      </div>
                      <div
                        className={`text-sm sm:text-base ${gothampro.className}`}
                        style={{ color: "#2D2D2D" }}
                      >
                        {result.telemetry_points || 0}
                      </div>
                      <div
                        className={`text-sm sm:text-base font-bold ${gothampro.className}`}
                        style={{ color: "#6DAD3A" }}
                      >
                        {result.total_points || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-6 sm:mt-8 text-center">
            <Button
              onClick={() => router.push("/")}
              className="w-full sm:w-auto"
            >
              НА ГЛАВНУЮ
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}

export default ResultsPage;