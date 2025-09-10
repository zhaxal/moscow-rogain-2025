import {
  IDetectedBarcode,
  Scanner,
  useDevices,
} from "@yudiel/react-qr-scanner";
import Button from "@/components/Button";
import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";
import { gothampro, mossport } from "@/utils/fonts";

function QrPage() {
  const device = useDevices();
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0 && scanning) {
      const data = detectedCodes[0].rawValue;
      setScanning(false);

      try {
        // Check if the scanned data is a valid URL
        const url = new URL(data);

        // Open the URL in a new tab/window
        window.location.href = url.href;

        // Or navigate within the app
        // router.push(url.href);

        // console.log("Opened URL:", url.href);
      } catch (err) {
        setError("Недействительная ссылка в QR-коде");
        console.error("Invalid URL in QR code:", data);

        // Re-enable scanning after error
        setTimeout(() => {
          setScanning(true);
          setError(null);
        }, 3000);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Сканирование QR-кода</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        className={`min-h-screen flex items-start justify-center p-3 sm:p-6 ${gothampro.className}`}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div
          className="w-full max-w-xl rounded-xl p-4 sm:p-8 border-2 shadow-lg"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#6DAD3A",
          }}
        >
          <header className="mb-6 sm:mb-8 text-center">
            <h1
              className={`text-2xl sm:text-4xl font-bold tracking-wide mb-3 sm:mb-4 ${mossport.className}`}
              style={{ color: "#6DAD3A" }}
            >
              СКАНИРОВАНИЕ QR-КОДА
            </h1>
            <div
              className="w-full h-px"
              style={{ backgroundColor: "#6DAD3A" }}
            ></div>
          </header>

          {/* QR Scanner Content */}
          {device.length > 0 ? (
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              <p
                className={`text-sm sm:text-base leading-relaxed text-center ${gothampro.className}`}
                style={{ color: "#2D2D2D" }}
              >
                Наведите камеру на QR-код для автоматического сканирования
              </p>

              {error && (
                <div
                  className="w-full p-3 sm:p-4 rounded-lg border-2 text-center"
                  style={{
                    backgroundColor: "#FEF2F2",
                    borderColor: "#F87171",
                    color: "#DC2626",
                  }}
                >
                  <p className={`text-sm sm:text-base ${gothampro.className}`}>
                    {error}
                  </p>
                </div>
              )}

              {scanning && !error && (
                <div className="w-full max-w-sm mx-auto">
                  <div
                    className="rounded-lg overflow-hidden border-2 aspect-square"
                    style={{ borderColor: "#6DAD3A" }}
                  >
                    <Scanner
                      sound={false}
                      onScan={handleScan}
                      constraints={{
                        facingMode: "environment",
                        aspectRatio: 1,
                      }}
                      styles={{
                        container: {
                          width: "100%",
                          height: "100%",
                        },
                        video: {
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        },
                      }}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs sm:text-sm ${gothampro.className}`}
                      style={{ color: "#6DAD3A" }}
                    >
                      Сканирование активно...
                    </span>
                  </div>
                </div>
              )}

              {!scanning && !error && (
                <div
                  className="w-full p-4 rounded-lg border-2 text-center"
                  style={{
                    backgroundColor: "#F0FDF4",
                    borderColor: "#22C55E",
                    color: "#16A34A",
                  }}
                >
                  <p
                    className={`text-sm sm:text-base font-medium ${gothampro.className}`}
                  >
                    ✓ QR-код успешно отсканирован!
                  </p>
                  <p
                    className={`text-xs sm:text-sm mt-1 ${gothampro.className}`}
                  >
                    Открываем ссылку...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-full p-4 rounded-lg border-2 text-center"
              style={{
                backgroundColor: "#FEF2F2",
                borderColor: "#F87171",
                color: "#DC2626",
              }}
            >
              <p className={`text-sm sm:text-base ${gothampro.className}`}>
                Нет доступных камер. Пожалуйста, разрешите доступ к камере в
                настройках браузера.
              </p>
            </div>
          )}

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div
              className={`text-sm ${gothampro.className} order-2 sm:order-1`}
              style={{ color: "#6DAD3A" }}
            >
              {scanning && !error
                ? "Готов к сканированию"
                : error
                ? "Ошибка сканирования"
                : "Сканирование завершено"}
            </div>
            <Button
              onClick={() => router.back()}
              className="order-1 sm:order-2 w-full sm:w-auto"
            >
              НАЗАД
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

export default QrPage;
