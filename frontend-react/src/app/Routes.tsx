import { Routes, Route, Navigate, useLoaderData } from "react-router-dom";
import { lazy, Suspense } from "react";
import Spinner from "../shared/components/Spinner";
import {
  fetchAnnouncementDetail,
  fetchAnnouncementsList,
} from "../api/announcementApi";
import { useQuery } from "@tanstack/react-query";

const AnnouncementsPage = lazy(() => import("../pages/AnnouncementsPage"));
const AnnouncementDetailPage = lazy(
  () => import("../pages/AnnouncementDetailPage"),
);

// 리스트 페이지 loader
export async function announcementsListLoader() {
  const data = await fetchAnnouncementsList();
  return { data };
}

// 상세 페이지 loader
export async function announcementDetailLoader({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const data = await fetchAnnouncementDetail(id);
  return { data };
}

// AnnouncementsPage를 TanStack Query와 연동하는 래퍼 컴포넌트
function AnnouncementsPageWithQuery() {
  const { data } = useLoaderData() as { data: any };
  const query = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncementsList,
    initialData: data,
  });
  return <AnnouncementsPage data={query.data} isLoading={query.isLoading} />;
}

// AnnouncementDetailPage를 TanStack Query와 연동하는 래퍼 컴포넌트
function AnnouncementDetailPageWithQuery() {
  const { data } = useLoaderData() as { data: any };
  const query = useQuery({
    queryKey: ["announcement", data.id],
    queryFn: () => fetchAnnouncementDetail(data.id),
    initialData: data,
  });
  return (
    <AnnouncementDetailPage data={query.data} isLoading={query.isLoading} />
  );
}

const routes = [
  {
    path: "/announcements",
    element: <AnnouncementsPageWithQuery />,
    loader: announcementsListLoader,
  },
  {
    path: "/announcements/:id",
    element: <AnnouncementDetailPageWithQuery />,
    loader: announcementDetailLoader,
  },
  {
    path: "*",
    element: <Navigate to="/announcements" />,
  },
];

function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {routes.map(({ path, element, loader }) => (
          <Route key={path} path={path} element={element} loader={loader} />
        ))}
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
