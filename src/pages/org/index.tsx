import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

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
      props: {
        user: {
          name: session.user.name || "Организатор",
          email: session.user.email || "<ваш_email@example.com>",
          role: session.user.role || "user",
        },
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      notFound: true,
    };
  }
}) satisfies GetServerSideProps;

interface AdminPanelProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

function OrgPage({ user }: AdminPanelProps) {
  const router = useRouter();

  const menuItems = [
    {
      title: "Синхронизация вопросов",
      description: "Загрузить вопросы игры из CSV файла",
      icon: "🔄",
      href: "/org/sync",
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },

    {
      title: "Список участников",
      description: "Просмотреть и управлять участниками игры",
      icon: "👥",
      href: "/org/users",
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      title: "Результаты игры",
      description: "Просмотреть результаты и статистику игроков",
      icon: "📊",
      href: "/org/telemetry",
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },

    // {
    //   title: "Экспорт данных",
    //   description: "Скачать результаты в различных форматах",
    //   icon: "📥",
    //   href: "/org/export",
    //   color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    // },
  ];

  const stats = [
    {
      label: "Зарегистрированных команд",
      value: "24",
      change: "+3 за сегодня",
    },
    { label: "Загруженных вопросов", value: "156", change: "Обновлено вчера" },
    { label: "Активных игроков", value: "72", change: "+12 за неделю" },
    { label: "Завершенных игр", value: "8", change: "+2 за месяц" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Панель управления - Московский Рогейн 2025
              </h1>
              <p className="text-gray-600 mt-1">
                Добро пожаловать, {user.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={async () => {
                  await authClient.signOut();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium text-sm"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                {stat.label}
              </h3>
              <p className="text-3xl font-bold text-gray-800 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-green-600">{stat.change}</p>
            </div>
          ))}
        </div> */}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Управление системой
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(item.href)}
                className={`p-6 rounded-lg border-2 transition-colors duration-200 text-left ${item.color}`}
              >
                <div className="flex items-start space-x-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2025 Московский Рогейн. Панель управления организатора.</p>
        </footer>
      </div>
    </div>
  );
}

export default OrgPage;
