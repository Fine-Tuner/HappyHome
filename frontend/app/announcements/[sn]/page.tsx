'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Announcement } from '../../types/announcement';
import StatusBadge from '../../components/announcement/StatusBadge';
import InfoItem from '../../components/announcement/InfoItem';

// 임시 데이터 - API 연동 후 삭제
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    sn: '2024-001',
    title: '2024년 서울시 행복주택 1차 모집공고',
    institution: '서울특별시',
    announcementDate: '2024-04-01',
    applicationStartDate: '2024-04-15',
    applicationEndDate: '2024-04-30',
    status: '모집예정',
    location: '서울시 강남구',
    totalHouseholds: 100,
    pdfUrl: '/공고문_17779_20250405_135700.pdf',
    targetGroup: '청년, 신혼부부',
    eligibility: '무주택자, 소득기준 충족자',
    schedule: '2024-04-15 ~ 2024-04-30',
    floorArea: '전용 59㎡',
    leasePeriod: '2년',
    buildingType: '아파트'
  },
  {
    id: '2',
    sn: '2024-002',
    title: '2024년 경기도 행복주택 2차 모집공고',
    institution: '경기도',
    announcementDate: '2024-03-25',
    applicationStartDate: '2024-04-01',
    applicationEndDate: '2024-04-15',
    status: '모집중',
    location: '경기도 수원시',
    totalHouseholds: 150,
    pdfUrl: '/공고문_17808_20250405_135646.pdf',
    targetGroup: '청년, 신혼부부, 다자녀가구',
    eligibility: '무주택자, 소득기준 충족자',
    schedule: '2024-04-01 ~ 2024-04-15',
    floorArea: '전용 84㎡',
    leasePeriod: '2년',
    buildingType: '오피스텔'
  },
  {
    id: '3',
    sn: '2024-003',
    title: '2024년 경기도 행복주택 3차 모집공고',
    institution: '경기도',
    announcementDate: '2024-04-05',
    applicationStartDate: '2024-04-20',
    applicationEndDate: '2024-05-05',
    status: '모집예정',
    location: '경기도 성남시',
    totalHouseholds: 200,
    pdfUrl: '/공고문_17870_20250331_224621.pdf',
    targetGroup: '청년, 신혼부부',
    eligibility: '무주택자, 소득기준 충족자',
    schedule: '2024-04-20 ~ 2024-05-05',
    floorArea: '전용 74㎡',
    leasePeriod: '2년',
    buildingType: '아파트'
  },
  {
    id: '4',
    sn: '2024-004',
    title: '2024년 경기도 행복주택 4차 모집공고',
    institution: '경기도',
    announcementDate: '2024-04-10',
    applicationStartDate: '2024-04-25',
    applicationEndDate: '2024-05-10',
    status: '모집예정',
    location: '경기도 안양시',
    totalHouseholds: 180,
    pdfUrl: '/{공고문(PDF)}_(최종)대전광역시시유성구10년임대 분납임대주택예비입주자모집.pdf',
    targetGroup: '청년, 신혼부부, 다자녀가구',
    eligibility: '무주택자, 소득기준 충족자',
    schedule: '2024-04-25 ~ 2024-05-10',
    floorArea: '전용 69㎡',
    leasePeriod: '2년',
    buildingType: '그 외'
  }
];

interface ContextMenuParams {
  x: number;
  y: number;
  items: Array<{
    id: string;
    label: string;
    enabled: boolean;
  }>;
}

interface Annotation {
  id: string;
  type: string;
  page: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: string;
}

interface ViewState {
  pageIndex: number;
  scale: number;
  scrollLeft: number;
  scrollTop: number;
}

interface CustomTheme {
  id: string;
  name: string;
  styles: Record<string, string>;
}

interface ZoteroReader {
  openContextMenu: (params: ContextMenuParams) => void;
}

interface ZoteroWindow extends Window {
  createReader: (config: {
    type: string;
    data: {
      buf: Uint8Array;
      url: string;
    };
    readOnly: boolean;
    showAnnotations: boolean;
    platform: string;
    localizedStrings: Record<string, string>;
    annotations: Annotation[];
    primaryViewState: ViewState;
    sidebarWidth: number;
    bottomPlaceholderHeight: number | null;
    toolbarPlaceholderWidth: number;
    authorName: string;
    onOpenContextMenu: (params: ContextMenuParams) => void;
    onAddToNote: () => void;
    onSaveAnnotations: (annotations: Annotation[]) => Promise<void>;
    onDeleteAnnotations: (ids: string[]) => void;
    onChangeViewState: (state: ViewState, primary: boolean) => void;
    onOpenTagsPopup: (annotationID: string, left: number, top: number) => void;
    onClosePopup: (data: unknown) => void;
    onOpenLink: (url: string) => void;
    onToggleSidebar: (open: boolean) => void;
    onChangeSidebarWidth: (width: number) => void;
    onSetDataTransferAnnotations: (
      dataTransfer: DataTransfer,
      annotations: Annotation[],
      fromText: boolean
    ) => void;
    onConfirm: (
      title: string,
      text: string,
      confirmationButtonTitle: string
    ) => boolean;
    onRotatePages: (pageIndexes: number[], degrees: number) => void;
    onDeletePages: (pageIndexes: number[]) => void;
    onToggleContextPane: () => void;
    onTextSelectionAnnotationModeChange: (mode: string) => void;
    onSaveCustomThemes: (customThemes: CustomTheme[]) => void;
  }) => ZoteroReader;
}

export default function AnnouncementDetail() {
  const params = useParams();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readerRef = useRef<ZoteroReader | null>(null);

  useEffect(() => {
    // API 연동 후 실제 데이터로 교체
    const foundAnnouncement = mockAnnouncements.find(a => a.sn === params.sn);
    setAnnouncement(foundAnnouncement || null);
  }, [params.sn]);

  useEffect(() => {
    if (!announcement || !iframeRef.current) return;

    const iframe = iframeRef.current;
    iframe.onload = async () => {
      try {
        const response = await fetch(announcement.pdfUrl);
        const arrayBuffer = await response.arrayBuffer();

        const reader = (iframe.contentWindow as unknown as ZoteroWindow).createReader({
          type: "pdf",
          data: {
            buf: new Uint8Array(arrayBuffer),
            url: window.location.origin,
          },
          readOnly: false,
          showAnnotations: true,
          platform: "web",
          localizedStrings: {},
          annotations: [],
          primaryViewState: {
            pageIndex: 0,
            scale: 1,
            scrollLeft: 0,
            scrollTop: 0
          },
          sidebarWidth: 240,
          bottomPlaceholderHeight: null,
          toolbarPlaceholderWidth: 0,
          authorName: "User",
          onOpenContextMenu(params: ContextMenuParams) {
            reader.openContextMenu(params);
          },
          onAddToNote() {
            alert('Add annotations to the current note');
          },
          async onSaveAnnotations(annotations: Annotation[]) {
            console.log('Save annotations', annotations);
          },
          onDeleteAnnotations(ids: string[]) {
            console.log('Delete annotations', JSON.stringify(ids));
          },
          onChangeViewState(state: ViewState, primary: boolean) {
            console.log('Set state', state, primary);
          },
          onOpenTagsPopup(annotationID: string, left: number, top: number) {
            alert(`Opening Zotero tagbox popup for id: ${annotationID}, left: ${left}, top: ${top}`);
          },
          onClosePopup(data: unknown) {
            console.log('onClosePopup', data);
          },
          onOpenLink(url: string) {
            alert('Navigating to an external link: ' + url);
          },
          onToggleSidebar(open: boolean) {
            console.log('Sidebar toggled', open);
          },
          onChangeSidebarWidth(width: number) {
            console.log('Sidebar width changed', width);
          },
          onSetDataTransferAnnotations(
            dataTransfer: DataTransfer,
            annotations: Annotation[],
            fromText: boolean
          ) {
            console.log('Set formatted dataTransfer annotations', dataTransfer, annotations, fromText);
          },
          onConfirm(
            title: string,
            text: string,
            confirmationButtonTitle: string
          ) {
            return window.confirm(text);
          },
          onRotatePages(pageIndexes: number[], degrees: number) {
            console.log('Rotating pages', pageIndexes, degrees);
          },
          onDeletePages(pageIndexes: number[]) {
            console.log('Deleting pages', pageIndexes);
          },
          onToggleContextPane() {
            console.log('Toggle context pane');
          },
          onTextSelectionAnnotationModeChange(mode: string) {
            console.log(`Change text selection annotation mode to '${mode}'`);
          },
          onSaveCustomThemes(customThemes: CustomTheme[]) {
            console.log('Save custom themes', customThemes);
          }
        });

        readerRef.current = reader;
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };
  }, [announcement]);

  if (!announcement) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600 dark:text-gray-300">
            공고문을 찾을 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* PDF Viewer Section */}
      <div className="w-1/2 h-screen">
        <iframe
          ref={iframeRef}
          src="/zotero_build/web/reader.html"
          title="PDF Viewer"
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>

      {/* Content Section */}
      <div className="w-1/2 h-screen overflow-y-auto">
        <div className="p-8">
          <button
            onClick={() => router.push('/announcements')}
            className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            목록으로 돌아가기
          </button>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {announcement.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {announcement.institution}
                </p>
              </div>
              <StatusBadge status={announcement.status} />
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  기본 정보
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="공고번호" value={announcement.sn} />
                  <InfoItem label="공고일" value={announcement.announcementDate} />
                  <InfoItem label="신청기간" value={announcement.schedule} />
                  <InfoItem label="모집위치" value={announcement.location} />
                  <InfoItem label="모집 세대수" value={`${announcement.totalHouseholds}세대`} />
                  <InfoItem label="전용면적" value={announcement.floorArea} />
                  <InfoItem label="임대기간" value={announcement.leasePeriod} />
                  <InfoItem label="건물종류" value={announcement.buildingType} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  대상 및 자격
                </h2>
                <div className="space-y-4">
                  <InfoItem label="공급대상" value={announcement.targetGroup} />
                  <InfoItem label="신청자격" value={announcement.eligibility} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 