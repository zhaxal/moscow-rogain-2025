import Head from "next/head";
import { gothampro, mossport } from "@/utils/fonts";
import Button from "@/components/Button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/router";

export default function Home() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Рогейн Москва 2025</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        className={`min-h-screen flex items-center justify-center p-3 sm:p-6 ${gothampro.className}`}
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

          {!session && (
            <Button onClick={() => router.push("/signin")} className="w-full">
              ВОЙТИ В СИСТЕМУ
            </Button>
          )}

          {session?.user.role === "admin" && (
            <Button onClick={() => router.push("/org")} className="w-full">
              ПАНЕЛЬ ОРГАНИЗАТОРА
            </Button>
          )}
        </div>
      </main>
    </>
  );
}
