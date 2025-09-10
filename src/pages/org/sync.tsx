import React, { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";

interface SyncResponse {
  message: string;
  questionsCreated: number;
}

interface SyncError {
  error: string;
}

export const getServerSideProps = (async (context) => {
  try {
    const { req } = context;

    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (!session) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    if (session.user.role !== "admin") {
      return {
        redirect: {
          destination: "/org/signin",
          permanent: false,
        },
      };
    }

    return {
      props: {},
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      notFound: true,
    };
  }
}) satisfies GetServerSideProps;

function SyncPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.name.endsWith(".csv")
      ) {
        setError("Пожалуйста, выберите CSV файл");
        return;
      }
      setFile(selectedFile);
      setError("");
      setMessage("");
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError("Пожалуйста, выберите CSV файл");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("csv", file);

      const response = await fetch("/api/org/sync", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const successData = data as SyncResponse;
        setMessage(
          `${successData.message}. Создано ${successData.questionsCreated} вопросов.`
        );
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "csv-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const errorData = data as SyncError;
        setError(errorData.error || "Не удалось синхронизировать данные");
      }
    } catch (err) {
      setError("Произошла ошибка сети при синхронизации данных");
      console.error("Sync error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Синхронизация вопросов игры
        </h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Требования к формату CSV
          </h2>
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600">
            <p className="mb-2">
              Ваш CSV файл должен содержать следующие колонки:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>№ Вопроса</strong> - Номер вопроса
              </li>
              <li>
                <strong>Вопрос</strong> - Текст вопроса
              </li>
              <li>
                <strong>Верный ответ</strong> - Правильный ответ
              </li>
              <li>
                <strong>Неверный ответ</strong> - Неправильный ответ 1
              </li>
              <li>
                <strong>Неверный ответ.1</strong> - Неправильный ответ 2
              </li>
              <li>
                <strong>Неверный ответ.2</strong> - Неправильный ответ 3
              </li>
            </ul>
            <p className="mt-3 text-red-600 font-medium">
              ⚠️ Внимание: Это заменит все существующие вопросы в базе данных.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label
              htmlFor="csv-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Выберите CSV файл
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isUploading}
            />
          </div>

          {file && (
            <div className="text-sm text-gray-600">
              Выбранный файл: <span className="font-medium">{file.name}</span> (
              {Math.round(file.size / 1024)} КБ)
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isUploading
              ? "Синхронизация..."
              : "Загрузить и синхронизировать вопросы"}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад к панели управления
          </button>
        </div>
      </div>
    </div>
  );
}

export default SyncPage;
