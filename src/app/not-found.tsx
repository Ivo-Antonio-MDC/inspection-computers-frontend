import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center dark:bg-gray-900">
      <p className="text-title-lg font-bold text-brand-500">404</p>
      <h1 className="mt-2 text-xl font-semibold text-gray-800 dark:text-white">Página não encontrada</h1>
      <p className="mt-1 text-sm text-gray-500">O endereço que procura não existe ou foi removido.</p>
      <Link href="/" className="mt-6 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600">
        Voltar ao painel
      </Link>
    </div>
  );
}
