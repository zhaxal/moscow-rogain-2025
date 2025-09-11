/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";

interface Question {
  answer: string;
  correct: number;
}

interface User {
  row_number: number;
  full_name: string;
  phone_number: string;
  correct_count: number;
  questions: Question[];
}

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filters {
  search: string;
  minCorrect: string;
  maxCorrect: string;
  sortBy: string;
  sortOrder: string;
}

interface UsersResponse {
  users: User[];
  pagination: Pagination;
  filters: Filters;
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

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [minCorrect, setMinCorrect] = useState("");
  const [maxCorrect, setMaxCorrect] = useState("");
  const [sortBy, setSortBy] = useState("full_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, minCorrect, maxCorrect, sortBy, sortOrder]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(minCorrect && { minCorrect }),
        ...(maxCorrect && { maxCorrect }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/org/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        const usersData = data as UsersResponse;
        setUsers(usersData.users);
        setPagination(usersData.pagination);
      } else {
        setError(data.error || "Не удалось загрузить данные пользователей");
      }
    } catch (err) {
      setError("Произошла ошибка сети при загрузке данных");
      console.error("Users fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Fetch all users for CSV export
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Large number to get all users
        ...(search && { search }),
        ...(minCorrect && { minCorrect }),
        ...(maxCorrect && { maxCorrect }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/org/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAllUsers(data.users);
        return data.users;
      }
      return [];
    } catch (err) {
      console.error("Error fetching all users:", err);
      return [];
    }
  };

  const exportToCSV = async () => {
    const usersToExport = await fetchAllUsers();
    if (usersToExport.length === 0) return;

    // Create CSV headers
    const headers = [
      "№",
      "ФИО",
      "Телефон",
      "Правильных ответов",
      ...Array.from({ length: 50 }, (_, i) => `Вопрос ${i + 1}`),
      ...Array.from({ length: 50 }, (_, i) => `Ответ ${i + 1}`),
    ];

    // Create CSV rows
    const csvRows = [
      headers.join(","),
      ...usersToExport.map(
        (user: {
          row_number: any;
          full_name: any;
          phone_number: any;
          correct_count: any;
          questions: any[];
        }) =>
          [
            user.row_number,
            `"${user.full_name}"`,
            `"${user.phone_number}"`,
            user.correct_count,
            ...user.questions.map((q: { correct: any }) => q.correct),
            ...user.questions.map((q: { answer: any }) => `"${q.answer}"`),
          ].join(",")
      ),
    ];

    // Create and download file
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_results_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSort = (column: string) => {
    const newSortOrder =
      sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newSortOrder);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
              Результаты участников
            </h1>
            <button
              onClick={exportToCSV}
              disabled={pagination.totalItems === 0 || isLoading}
              className="bg-green-600 text-white py-2 px-4 rounded-md 
                hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed 
                font-medium text-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                touch-manipulation"
            >
              Экспорт в CSV
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Поиск по имени или телефону
                  </label>
                  <input
                    id="search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите имя или телефон..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="minCorrect"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Минимум правильных
                  </label>
                  <input
                    id="minCorrect"
                    type="number"
                    min="0"
                    max="50"
                    value={minCorrect}
                    onChange={(e) => setMinCorrect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    htmlFor="maxCorrect"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Максимум правильных
                  </label>
                  <input
                    id="maxCorrect"
                    type="number"
                    min="0"
                    max="50"
                    value={maxCorrect}
                    onChange={(e) => setMaxCorrect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium text-sm"
                  >
                    Применить фильтры
                  </button>
                </div>
              </div>
            </form>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Загрузка данных...</div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm break-words">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-2 text-red-600 hover:text-red-800 font-medium text-sm underline"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {!isLoading && !error && users.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              Участники не найдены
            </div>
          )}

          {!isLoading && !error && users.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="sticky left-0 z-20 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            №
                          </th>
                          <th
                            className="sticky left-12 z-20 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 min-w-[200px] cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("full_name")}
                          >
                            ФИО{" "}
                            {sortBy === "full_name" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                          <th className="sticky left-64 z-20 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 min-w-[150px]">
                            Телефон
                          </th>
                          <th
                            className="sticky left-96 z-20 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("correct_count")}
                          >
                            Правильных{" "}
                            {sortBy === "correct_count" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </th>
                          {Array.from({ length: 50 }, (_, i) => (
                            <th
                              key={i}
                              className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 min-w-[60px]"
                            >
                              {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr
                            key={user.row_number}
                            className="hover:bg-gray-50"
                          >
                            <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                              {user.row_number}
                            </td>
                            <td className="sticky left-12 z-10 bg-white px-6 py-4 text-sm text-gray-900 border-r border-gray-300">
                              <div
                                className="truncate max-w-[180px]"
                                title={user.full_name}
                              >
                                {user.full_name}
                              </div>
                            </td>
                            <td className="sticky left-64 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                              {user.phone_number}
                            </td>
                            <td className="sticky left-96 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.correct_count >= 40
                                    ? "bg-green-100 text-green-800"
                                    : user.correct_count >= 25
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.correct_count}/50
                              </span>
                            </td>
                            {user.questions.map((question, index) => (
                              <td
                                key={index}
                                className="px-3 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300"
                              >
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`inline-flex w-6 h-6 items-center justify-center text-xs font-semibold rounded-full ${
                                      question.correct
                                        ? "bg-green-100 text-green-800"
                                        : question.answer
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    {question.correct
                                      ? "✓"
                                      : question.answer
                                      ? "✗"
                                      : "—"}
                                  </span>
                                  {question.answer && (
                                    <span
                                      className="text-xs text-gray-500 truncate max-w-[50px] mt-1"
                                      title={question.answer}
                                    >
                                      {question.answer}
                                    </span>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Предыдущая
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Следующая
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Показано{" "}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{" "}
                        до{" "}
                        <span className="font-medium">
                          {Math.min(
                            pagination.page * pagination.limit,
                            pagination.totalItems
                          )}
                        </span>{" "}
                        из{" "}
                        <span className="font-medium">
                          {pagination.totalItems}
                        </span>{" "}
                        результатов
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={!pagination.hasPrev}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Предыдущая
                        </button>

                        {/* Page numbers */}
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            const pageNum =
                              Math.max(
                                1,
                                Math.min(
                                  pagination.totalPages - 4,
                                  pagination.page - 2
                                )
                              ) + i;

                            if (pageNum > pagination.totalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  pageNum === pagination.page
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}

                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={!pagination.hasNext}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Следующая
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                touch-manipulation"
            >
              ← Назад к панели управления
            </button>

            {!isLoading && !error && pagination.totalItems > 0 && (
              <div className="text-sm text-gray-600">
                Всего участников: {pagination.totalItems}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
