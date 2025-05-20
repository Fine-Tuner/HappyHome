import { lazy, Suspense } from "react";
import Spinner from "../shared/components/Spinner";
import { createBrowserRouter, useLoaderData } from "react-router-dom";
import AnnouncementDetailPage from "../pages/AnnouncementDetailPage";

const AnnouncementsPage = lazy(() => import("../pages/AnnouncementsPage"));

export const router = createBrowserRouter([
  {
    path: "/announcements",
    element: (
      <Suspense fallback={<Spinner />}>
        <AnnouncementsPage />
      </Suspense>
    ),
  },
  {
    path: "/announcements/:id",
    element: <AnnouncementDetailPage />,
  },
]);
