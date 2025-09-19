import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";

interface TelemetryResponse {
  message: string;
  resultsCreated: number;
}

interface TelemetryError {
  error: string;
}

interface Result {
  user_id: string;
  start_number: string;
  phone_number: string;
  total_questions: number;
  quiz_points: number;
  telemetry_points: number;
  total_points: number;
  group_name: string;
}

interface ResultsResponse {
  results: Result[];
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

function TelemetryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<Result[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [numberFilter, setNumberFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const router = useRouter();

  const fetchResults = async (startNumber?: string, group?: string) => {
    setIsLoadingResults(true);
    try {
      const params = new URLSearchParams();
      if (startNumber?.trim()) {
        params.append("start_number", startNumber.trim());
      }
      if (group?.trim()) {
        params.append("group", group.trim());
      }

      const url = `/api/org/results${
        params.toString() ? "?" + params.toString() : ""
      }`;
      const response = await fetch(url);

      if (response.ok) {
        const data: ResultsResponse = await response.json();
        const sortedResults = data.results.sort(
          (a, b) => Number(b.total_points) - Number(a.total_points)
        );
        setResults(sortedResults);
      } else {
        setError("Не удалось загрузить результаты");
      }
    } catch (err) {
      setError("Ошибка при загрузке результатов");
      console.error("Results fetch error:", err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Debounced fetch function
  const debouncedFetchResults = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (startNumber?: string, group?: string, immediate = false) => {
        clearTimeout(timeoutId);
        if (immediate) {
          fetchResults(startNumber, group);
        } else {
          timeoutId = setTimeout(() => {
            fetchResults(startNumber, group);
          }, 500); // 500ms delay
        }
      };
    })(),
    []
  );

  const handleNumberFilterChange = (value: string) => {
    setNumberFilter(value);
    debouncedFetchResults(value, groupFilter);
  };

  const handleGroupFilterChange = (value: string) => {
    setGroupFilter(value);
    debouncedFetchResults(numberFilter, value);
  };

  const handleRefreshResults = () => {
    debouncedFetchResults(numberFilter, groupFilter, true);
  };

  const clearFilters = () => {
    setNumberFilter("");
    setGroupFilter("");
    debouncedFetchResults("", "", true);
  };

  const exportToCSV = () => {
    if (results.length === 0) {
      setError("Нет данных для экспорта");
      return;
    }

    // Create CSV header
    const headers = [
      "Номер участника",
      "Телефон",
      "Группа",
      "Викторина",
      "Телеметрия",
      "Общий балл",
    ];

    // Sort results by total points (descending)
    const sortedResults = [...results].sort(
      (a, b) => Number(b.total_points) - Number(a.total_points)
    );

    // Create CSV rows
    const csvRows = [
      headers.join(","),
      ...sortedResults.map((result) =>
        [
          result.start_number || "N/A",
          result.phone_number || "N/A",
          result.group_name || "N/A",
          result.quiz_points || 0,
          result.telemetry_points || 0,
          result.total_points || 0,
        ].join(",")
      ),
    ];

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD format
      const filterSuffix = numberFilter || groupFilter ? "_filtered" : "";
      link.setAttribute("download", `results_${dateStr}${filterSuffix}.csv`);

      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage("CSV файл успешно экспортирован");
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

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

      const response = await fetch("/api/org/telemetry", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const successData = data as TelemetryResponse;
        setMessage(
          `${successData.message}. Загружено ${successData.resultsCreated} результатов.`
        );
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "csv-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        // Refresh results after successful upload
        debouncedFetchResults(numberFilter, groupFilter, true);
      } else {
        const errorData = data as TelemetryError;
        setError(errorData.error || "Не удалось загрузить результаты");
      }
    } catch (err) {
      setError("Произошла ошибка сети при загрузке результатов");
      console.error("Telemetry upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
            Загрузка результатов телеметрии
          </h1>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label
                htmlFor="csv-file"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Выберите CSV файл с результатами
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 
                  file:mr-2 sm:file:mr-4 
                  file:py-2 file:px-3 sm:file:px-4 
                  file:rounded-md file:border-0 
                  file:text-xs sm:file:text-sm file:font-semibold 
                  file:bg-blue-50 file:text-blue-700 
                  hover:file:bg-blue-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUploading}
              />
            </div>

            {file && (
              <div className="text-xs sm:text-sm text-gray-600 p-2 bg-blue-50 rounded-md">
                <div className="font-medium truncate">Выбран: {file.name}</div>
                <div className="text-gray-500">
                  Размер: {Math.round(file.size / 1024)} КБ
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md 
                hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed 
                font-medium text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                touch-manipulation"
            >
              {isUploading ? "Загрузка..." : "Загрузить результаты"}
            </button>
          </form>

          {message && (
            <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm break-words">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm break-words">{error}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                touch-manipulation block"
            >
              ← Назад к панели управления
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-xl font-bold text-gray-800">
              Общие результаты
            </h2>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Поиск по номеру участника..."
                  value={numberFilter}
                  onChange={(e) => handleNumberFilterChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 
                    focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Поиск по группе..."
                  value={groupFilter}
                  onChange={(e) => handleGroupFilterChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 
                    focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={exportToCSV}
                disabled={results.length === 0}
                className="bg-green-600 text-white py-2 px-4 rounded-md 
                  hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                  font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Экспорт CSV
              </button>
              <button
                onClick={handleRefreshResults}
                disabled={isLoadingResults}
                className="bg-blue-600 text-white py-2 px-4 rounded-md 
                  hover:bg-blue-700 disabled:bg-gray-400 
                  font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isLoadingResults ? "Обновление..." : "Обновить"}
              </button>
              {(numberFilter || groupFilter) && (
                <button
                  onClick={clearFilters}
                  disabled={isLoadingResults}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md 
                    hover:bg-gray-300 disabled:bg-gray-100 
                    font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Очистить фильтры
                </button>
              )}
            </div>

            {(numberFilter || groupFilter) && (
              <div className="text-sm text-blue-600">
                Найдено результатов: {results.length}
                {numberFilter && ` • Номер: "${numberFilter}"`}
                {groupFilter && ` • Группа: "${groupFilter}"`}
              </div>
            )}
          </div>

          {isLoadingResults ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Загрузка результатов...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {numberFilter || groupFilter
                  ? "Результаты не найдены"
                  : "Результаты не найдены"}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер участника
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Телефон
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Группа
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Викторина
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Телеметрия
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Общий балл
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr
                      key={result.user_id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.start_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.phone_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.group_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.quiz_points || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.telemetry_points || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {result.total_points || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TelemetryPage;
