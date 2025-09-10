import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface SignInForm {
  email: string;
  password: string;
}

export const getServerSideProps = (async (context) => {
  try {
    const { req } = context;

    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (session) {
      return {
        redirect: {
          destination: "/org",
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

function SignInPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>();
  const { enqueueSnackbar } = useSnackbar();

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const onSubmit = (data: SignInForm) => {
    const { email, password } = data;

    authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onRequest: (ctx) => {
          setIsLoading(true);
        },
        onSuccess: (ctx) => {
          router.push("/org");
        },
        onError: (ctx) => {
          setIsLoading(false);

          enqueueSnackbar(ctx.error.message, { variant: "error" });
        },
      }
    );
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {isLoading ? (
        <div className="loader">Loading...</div>
      ) : (
        <section className="bg-white p-4 sm:p-8 rounded shadow-md w-full max-w-[24rem]">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Вход</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Электронная почта
              </label>
              <input
                {...register("email", { required: true })}
                type="email"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && (
                <span className="text-red-500 text-sm">Email is required</span>
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
                {...register("password", { required: true })}
                type="password"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.password && (
                <span className="text-red-500 text-sm">Пароль обязателен</span>
              )}
            </div>

            <div className="mb-4">
              <a
                className="text-blue-500 hover:underline text-sm"
                onClick={() => router.push("/org/signup")}
              >
                Нету аккаунта?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 transition duration-200"
            >
              Войти
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

export default SignInPage;
