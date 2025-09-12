import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { gothampro, mossport } from "@/utils/fonts";
import Button from "@/components/Button";

import { useSnackbar } from "notistack";
import Footer from "@/components/Footer";
import { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";

export const getServerSideProps = (async (context) => {
  try {
    const { req, query } = context;
    const redirect = query.redirect as string;

    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (session?.user.name !== "no_number") {
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

interface RegisterForm {
  startNumber: number;
}

interface RegisterPageProps {
  redirect?: string | null;
}

function RegisterPage({ redirect }: RegisterPageProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [isRegistering, setIsRegistering] = useState(false);

  const onSubmit = async (data: RegisterForm) => {
    setIsRegistering(true);
    try {
      await authClient.updateUser({ name: String(data.startNumber) });

      enqueueSnackbar("Регистрация успешна!", { variant: "success" });
      const destination = redirect && redirect.startsWith("/") ? redirect : "/";
      router.push(destination);
    } catch (error) {
      console.error("Registration error:", error);
      enqueueSnackbar("Ошибка регистрации", { variant: "error" });
    } finally {
      setIsRegistering(false);
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
                Пожалуйста укажите ваш стартовый номер для участия в мероприятии
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label
                className={`block text-sm font-semibold ${gothampro.className}`}
                style={{ color: "#6DAD3A" }}
              >
                Стартовый номер
              </label>
              <div className="flex-1 relative">
                <input
                  {...register("startNumber", {
                    required: "Стартовый номер обязателен",
                    min: { value: 1, message: "Номер должен быть больше 0" },
                    max: {
                      value: 9999,
                      message: "Номер не может быть больше 9999",
                    },
                    valueAsNumber: true,
                  })}
                  type="number"
                  className={`w-full px-3 sm:px-4 py-3 text-sm sm:text-base rounded-lg border-2 transition focus:outline-none ${
                    gothampro.className
                  } ${
                    errors.startNumber
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-orange-500 bg-white"
                  }`}
                  style={{ color: "#2D2D2D" }}
                  placeholder="Введите стартовый номер"
                />
              </div>
              {errors.startNumber && (
                <span className="text-red-500 text-xs sm:text-sm font-medium">
                  {errors.startNumber.message}
                </span>
              )}
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div
                className={`text-xs sm:text-sm text-center sm:text-left ${gothampro.className}`}
                style={{ color: "#6DAD3A" }}
              >
                {isRegistering
                  ? "Выполняется регистрация..."
                  : "Готов к регистрации"}
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={isSubmitting || isRegistering}
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

export default RegisterPage;
