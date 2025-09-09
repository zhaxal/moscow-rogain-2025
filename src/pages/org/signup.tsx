import { SubmitHandler, useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useState } from "react";

interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function SignUpPage() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>();

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const onSubmit: SubmitHandler<SignUpForm> = (data) => {
    const { name, email, password } = data;

    authClient.signUp.email(
      {
        email,
        password,
        name,
      },
      {
        onRequest: (ctx) => {
          // Show loading
          setIsLoading(true);
        },
        onSuccess: (ctx) => {
          router.push("/org/signin");
        },
        onError: (ctx) => {
          setIsLoading(false);
          console.log(ctx.error);
          alert(ctx.error.message);
        },
      }
    );
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {isLoading ? (
        <div className="loader">Loading...</div>
      ) : (
        <section className="bg-white p-4 sm:p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Регистрация</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Имя пользователя
              </label>
              <input
                {...register("name", { required: true })}
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              />
              {errors.name && (
                <span className="text-red-500 text-sm">
                  Это поле обязательно для заполнения
                </span>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Электронная почта
              </label>
              <input
                {...register("email", {
                  required: true,
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Введите корректный адрес электронной почты",
                  },
                })}
                type="email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              />
              {errors.email && (
                <span className="text-red-500 text-sm">
                  {errors.email.message ||
                    "Это поле обязательно для заполнения"}
                </span>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Пароль
              </label>
              <input
                {...register("password", {
                  required: true,
                  minLength: {
                    value: 6,
                    message: "Пароль должен содержать минимум 6 символов",
                  },
                })}
                type="password"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              />
              {errors.password && (
                <span className="text-red-500 text-sm">
                  {errors.password.message ||
                    "Это поле обязательно для заполнения"}
                </span>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Подтверждение пароля
              </label>
              <input
                {...register("confirmPassword", {
                  required: true,
                  validate: (value) =>
                    value === watch("password") || "Пароли не совпадают",
                })}
                type="password"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              />
              {errors.confirmPassword && (
                <span className="text-red-500 text-sm">
                  {errors.confirmPassword.message ||
                    "Это поле обязательно для заполнения"}
                </span>
              )}
            </div>

            <div className="mb-4">
              <a
                className="text-blue-500 hover:underline cursor-pointer text-sm"
                onClick={() => router.push("/org/signin")}
              >
                Уже есть аккаунт?
              </a>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="mt-1 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition duration-200 text-sm sm:text-base"
            >
              Зарегистрироваться
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

export default SignUpPage;
