import { lazy, Suspense } from "react";
import Spinner from "../shared/components/Spinner";
import {
  getAnnouncements,
  useGetAnnouncements,
} from "../features/announcement/api/get/announcements";
import { createBrowserRouter, useLoaderData } from "react-router-dom";

const AnnouncementsPage = lazy(
  () => import("../features/announcement/AnnouncementsPage"),
);
// const AnnouncementDetailPage = lazy(
//   () => import("../pages/AnnouncementDetailPage"),
// );

// 상세 페이지 loader
// export async function announcementDetailLoader({
//   params,
// }: {
//   params: { id: string };
// }) {
//   const { id } = params;
//   const data = await fetchAnnouncementDetail(id);
//   return { data };
// }

// AnnouncementsPage를 TanStack Query와 연동하는 래퍼 컴포넌트
// function AnnouncementsPageWithQuery() {
//   const { data } = useLoaderData();
//   // const query = useQuery({
//   //   queryKey: ["announcements"],
//   //   queryFn: fetchAnnouncementsList,
//   //   initialData: data,
//   // });
//   useGetAnnouncements({
//     options: {
//       initialData: data,
//     },
//   });
//   return <AnnouncementsPage />;
// }

// AnnouncementDetailPage를 TanStack Query와 연동하는 래퍼 컴포넌트
// function AnnouncementDetailPageWithQuery() {
//   const { data } = useLoaderData() as { data: any };
//   const query = useQuery({
//     queryKey: ["announcement", data.id],
//     queryFn: () => fetchAnnouncementDetail(data.id),
//     initialData: data,
//   });
//   return (
//     <AnnouncementDetailPage data={query.data} isLoading={query.isLoading} />
//   );
// }

export const router = createBrowserRouter([
  {
    path: "/announcements",
    element: (
      <Suspense fallback={<Spinner />}>
        <AnnouncementsPage />
      </Suspense>
    ),
    // loader: ({ request }) => {
    //   const url = new URL(request.url);
    //   const params = Object.fromEntries(url.searchParams);
    //   return getAnnouncements({
    //     page: 1,
    //     limit: 12,
    //     sortType: "latest",
    //   });
    // },
  },
  // {
  //   path: "/announcements/:id",
  //   element: <AnnouncementDetailPageWithQuery />,
  //   loader: announcementDetailLoader,
  // },
  {
    path: "*",
    element: <Spinner />,
    // 또는 <Navigate to="/announcements" />를 Suspense로 감싸서 사용 가능
  },
]);
