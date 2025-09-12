import Head from "next/head";
import Image from "next/image";
import { gothampro, mossport } from "@/utils/fonts";
import Button from "@/components/Button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/router";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useSnackbar } from "notistack";
import { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";

interface HomeProps {
  snackbar?: string | null;
}

export const getServerSideProps = (async (context) => {
  const { req, query } = context;
  const snackbar = query.snackbar as string | undefined;

  const session = await auth.api.getSession({
    headers: req.headers as unknown as Headers,
  });

  if (session?.user.name === "no_number") {
    return {
      redirect: {
        destination: "/register",
        permanent: false,
      },
    };
  }

  return {
    props: {
      snackbar: snackbar || null,
    },
  };
}) satisfies GetServerSideProps<HomeProps>;

export default function Home({ snackbar }: HomeProps) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (snackbar === "answered") {
      enqueueSnackbar("Вы уже ответили на этот вопрос.", {
        variant: "info",
      });
    }
  }, [snackbar, enqueueSnackbar]);

  return (
    <>
      <Head>
        <title>Рогейн Москва 2025</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        className={`min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 ${gothampro.className}`}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="w-full max-w-md rounded-xl p-6 sm:p-8 border-2 shadow-lg text-center"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#6DAD3A",
          }}
        >
          <header className="mb-6 sm:mb-8">
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
              className={`text-3xl sm:text-4xl font-bold tracking-wide mb-4 ${mossport.className}`}
              style={{ color: "#6DAD3A" }}
            >
              РОГЕЙН МОСКВА 2025
            </h1>
            <div
              className="w-full h-px mb-4"
              style={{ backgroundColor: "#6DAD3A" }}
            ></div>
          </header>

          <div
            className={`text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 ${gothampro.className}`}
            style={{ color: "#2D2D2D" }}
          >
            Добро пожаловать на мероприятие!
          </div>

          {!isPending && !session && (
            <Button onClick={() => router.push("/signin")} className="w-full">
              ВОЙТИ В СИСТЕМУ
            </Button>
          )}

          {session && session.user.role === "admin" && (
            <Button onClick={() => router.push("/org")} className="w-full">
              ПАНЕЛЬ ОРГАНИЗАТОРА
            </Button>
          )}

          {session && session.user.role === "user" && (
            <Button onClick={() => router.push("/qr")} className="w-full">
              СКАНИРОВАТЬ QR-КОД
            </Button>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
}
