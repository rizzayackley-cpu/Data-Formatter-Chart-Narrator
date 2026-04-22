import React from "react";
import { createBrowserRouter, isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Layout } from "./components/Layout";
import { Workbench } from "./pages/Workbench";
import { Button } from "./components/ui/button";
import { useLanguage } from "./context/LanguageContext";

function ErrorPage() {
  const error = useRouteError();
  const { t } = useLanguage();

  const message = (() => {
    if (isRouteErrorResponse(error)) {
      return `${error.status} ${error.statusText}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return t('error.unknown');
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-xl font-semibold text-gray-900">{t('error.title')}</h1>
        <p className="text-sm text-gray-600 mt-2 break-words">{message}</p>
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" onClick={() => window.location.reload()}>
            {t('error.refresh')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/">{t('error.backHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: Workbench },
      { path: "data-comparison", Component: Workbench },
      { path: "insight-summary", Component: Workbench },
    ],
  },
]);
