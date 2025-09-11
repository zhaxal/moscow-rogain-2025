import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { gothampro, mossport } from "@/utils/fonts";
import Button from "@/components/Button";
import { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";
import { useSnackbar } from "notistack";
import Footer from "@/components/Footer";

export const getServerSideProps = (async (context) => {
  try {
    const { req, query } = context;
    const redirect = query.redirect as string;

    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (session) {
      // If user is already authenticated, redirect to the intended page or home
      return {
        redirect: {
          destination: redirect && redirect.startsWith("/") ? redirect : "/",
          permanent: false,
        },
      };
    }

    return {
      props: {
        redirect: redirect || null,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      notFound: true,
    };
  }
}) satisfies GetServerSideProps;

interface SignUpForm {
  phone: string;
  code: string;
}

interface SignInPageProps {
  redirect?: string | null;
}

function SignInPage({ redirect }: SignInPageProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignUpForm>();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const phoneValue = watch("phone");

  const sendCode = async () => {
    if (!phoneValue) return;
    try {
      authClient.phoneNumber.sendOtp(
        { phoneNumber: phoneValue },
        {
          onRequest: () => {
            setIsSendingCode(true);
          },
          onSuccess: () => {
            enqueueSnackbar("Код успешно отправлен", { variant: "success" });
            setCodeSent(true);
          },
          onResponse: () => {
            setIsSendingCode(false);
          },
        }
      );
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Не удалось отправить код", { variant: "error" });
    }
  };

  const onSubmit = async (data: SignUpForm) => {
    if (!codeSent) {
      enqueueSnackbar("Сначала получите код", { variant: "warning" });
      return;
    }
    try {
      authClient.phoneNumber.verify(
        {
          phoneNumber: data.phone,
          code: data.code,
        },
        {
          onRequest: () => {
            setIsRegistering(true);
          },
          onSuccess: () => {
            enqueueSnackbar("Регистрация успешна", { variant: "success" });
            // Redirect to the intended page or home
            const destination =
              redirect && redirect.startsWith("/") ? redirect : "/";
            router.push(destination);
          },
          onResponse: () => {
            setIsRegistering(false);
          },
        }
      );
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Ошибка регистрации", { variant: "error" });
    }
  };

  return (
    <>
      <Head>
        <title>Регистрация</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        className={`min-h-screen flex flex-col items-start justify-center p-3 sm:p-6 ${gothampro.className}`}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="w-full max-w-xl rounded-xl p-4 sm:p-8 border-2 shadow-lg mt-4 sm:mt-0 mx-auto"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#6DAD3A",
          }}
        >
          <header className="mb-6 sm:mb-8 text-center">
            {/* Main Logo */}
            <div className="mb-6">
              <Image
                src="/logos/rogaine_logo.svg"
                alt="Rogaine Logo"
                width={200}
                height={100}
                className="mx-auto"
                priority
              />
            </div>

            <h1
              className={`text-2xl sm:text-4xl font-bold tracking-wide mb-4 ${mossport.className}`}
              style={{ color: "#6DAD3A" }}
            >
              РЕГИСТРАЦИЯ
            </h1>
            <div
              className="w-full h-px"
              style={{ backgroundColor: "#6DAD3A" }}
            ></div>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            <div className="space-y-2">
              <p
                className={`text-xs leading-relaxed ${gothampro.className}`}
                style={{ color: "#6DAD3A" }}
              >
                Пожалуйста укажите номер телефона, который будет использоваться
                для участия в мероприятии
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label
                className={`block text-sm font-semibold ${gothampro.className}`}
                style={{ color: "#6DAD3A" }}
              >
                Телефон
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  {...register("phone", {
                    required: true,
                    pattern: /^\+?\d{10,15}$/,
                  })}
                  type="tel"
                  disabled={codeSent}
                  className={`flex-1 px-3 sm:px-4 py-3 text-sm sm:text-base rounded-lg border-2 transition focus:outline-none ${
                    gothampro.className
                  } ${
                    errors.phone
                      ? "border-red-500 bg-red-50"
                      : codeSent
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 focus:border-orange-500 bg-white"
                  } disabled:opacity-60`}
                  style={{ color: "#2D2D2D" }}
                  placeholder="+7XXXXXXXXXX"
                />
                <Button
                  type="button"
                  onClick={sendCode}
                  variant="orange"
                  disabled={
                    isSendingCode || !phoneValue || !!errors.phone || codeSent
                  }
                >
                  {isSendingCode
                    ? "Отправка..."
                    : codeSent
                    ? "Отправлен"
                    : "Получить код"}
                </Button>
              </div>
              {errors.phone && (
                <span className="text-red-500 text-xs sm:text-sm font-medium">
                  Укажите корректный номер (10–15 цифр)
                </span>
              )}
            </div>

            {codeSent && (
              <div className="space-y-2 sm:space-y-3">
                <label
                  className={`block text-sm font-semibold ${gothampro.className}`}
                  style={{ color: "#6DAD3A" }}
                >
                  Код подтверждения
                </label>
                <input
                  {...register("code", {
                    required: true,
                    minLength: 4,
                    maxLength: 8,
                  })}
                  type="text"
                  className={`w-full px-3 sm:px-4 py-3 text-sm sm:text-base rounded-lg border-2 transition focus:outline-none ${
                    gothampro.className
                  } ${
                    errors.code
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-orange-500 bg-white"
                  }`}
                  style={{ color: "#2D2D2D" }}
                  placeholder="Введите код"
                />
                {errors.code && (
                  <span className="text-red-500 text-xs sm:text-sm font-medium">
                    Укажите код (4–8 символов)
                  </span>
                )}
              </div>
            )}

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div
                className={`text-xs sm:text-sm text-center sm:text-left ${gothampro.className}`}
                style={{ color: "#6DAD3A" }}
              >
                {!codeSent
                  ? "Получите код для продолжения"
                  : isRegistering
                  ? "Выполняется регистрация..."
                  : "Готов к регистрации"}
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={isSubmitting || isRegistering || !codeSent}
                  className="w-full sm:w-auto"
                >
                  {isRegistering ? "РЕГИСТРАЦИЯ..." : "ЗАРЕГИСТРИРОВАТЬСЯ"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <Footer />
      </main>
    </>
  );
}

export default SignInPage;
