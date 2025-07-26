import { lazy, Suspense } from "react";
import Spinner from "../shared/components/Spinner";
import { createBrowserRouter } from "react-router-dom";
import AnnouncementDetailPage from "../pages/AnnouncementDetailPage";

const AnnouncementsPage = lazy(() => import("../pages/AnnouncementsPage"));
const MyPage = lazy(() => import("../pages/MyPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<Spinner />}>
        <AnnouncementsPage />
      </Suspense>
    ),
  },
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
  {
    path: "/mypage",
    element: (
      <Suspense fallback={<Spinner />}>
        <MyPage />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<Spinner />}>
        <LoginPage />
      </Suspense>
    ),
  },
]);
