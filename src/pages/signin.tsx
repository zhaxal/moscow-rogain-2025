import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { authClient } from "@/lib/auth-client";

interface SignUpForm {
  fullName: string;
  phone: string;
  code: string;
}

function SignInPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignUpForm>();
  const router = useRouter();

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const phoneValue = watch("phone");

  const sendCode = async () => {
    if (!phoneValue) return;
    try {
      // TODO: replace with real API call
      authClient.phoneNumber.sendOtp(
        { phoneNumber: phoneValue },

        {
          onRequest: () => {
            setIsSendingCode(true);
          },
          onSuccess: () => {
            alert("Код успешно отправлен");
            setCodeSent(true);
          },
        }
      );
    } catch (e) {
      alert("Не удалось отправить код");
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (data: SignUpForm) => {
    if (!codeSent) {
      alert("Сначала получите код");
      return;
    }
    try {
      setIsRegistering(true);
      // TODO: verify code + register (API call)
      authClient.phoneNumber.verify(
        {
          phoneNumber: data.phone,
          code: data.code,
        },
        {
          onSuccess: () => {
            authClient.updateUser({
              name: data.fullName,
            });
            alert("Регистрация успешна");
            router.push("/");
          },
        }
      );
    } catch (e) {
      alert("Ошибка регистрации");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <section className="bg-white p-4 sm:p-8 rounded shadow-md w-full max-w-[28rem]">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Регистрация</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              ФИО
            </label>
            <input
              {...register("fullName", { required: true, minLength: 5 })}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Иванов Иван Иванович"
            />
            {errors.fullName && (
              <span className="text-red-500 text-sm">
                Укажите полное ФИО (минимум 5 символов)
              </span>
            )}
          </div>

          <div className="mb-2">
            <p className="text-xs text-gray-600">
              Пожалуйста укажите номер телефона, который будет использоваться
              для участия в мероприятии
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Телефон
            </label>
            <input
              {...register("phone", {
                required: true,
                pattern: /^\+?\d{10,15}$/,
              })}
              type="tel"
              disabled={codeSent}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="+7XXXXXXXXXX"
            />
            {errors.phone && (
              <span className="text-red-500 text-sm">
                Укажите корректный номер (10–15 цифр)
              </span>
            )}
          </div>

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={sendCode}
              disabled={
                isSendingCode || !phoneValue || !!errors.phone || codeSent
              }
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 text-sm"
            >
              {isSendingCode
                ? "Отправка..."
                : codeSent
                ? "Отправлен"
                : "Получить код"}
            </button>
          </div>

          {codeSent && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Код подтверждения
              </label>
              <input
                {...register("code", {
                  required: true,
                  minLength: 4,
                  maxLength: 8,
                })}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Введите код"
              />
              {errors.code && (
                <span className="text-red-500 text-sm">
                  Укажите код (4–8 символов)
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isRegistering || !codeSent}
            className="mt-2 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-300 transition"
          >
            {isRegistering ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default SignInPage;
