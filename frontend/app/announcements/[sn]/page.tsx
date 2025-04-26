'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Announcement, Block, Condition } from '../../types/announcement';
import InfoItem from '../../components/announcement/InfoItem';
import { useTheme } from '../../context/ThemeContext';

// 임시 데이터 - API 연동 후 삭제
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    announcement_id: 2024001,
    announcement_name: '2024년 서울시 행복주택 1차 모집공고',
    housing_name: '서울 행복주택',
    supply_institution_name: '서울특별시',
    full_address: '서울시 강남구 테헤란로 123',
    total_supply_count: 100,
    rent_guarantee: 10000000,
    monthly_rent: 500000,
    pdf_url: '/공고문_17779_20250405_135700.pdf',
    begin_date: '2024-04-15T00:00:00Z',
    end_date: '2024-04-30T23:59:59Z',
    file_path: '/uploads/2024/04/공고문_17779_20250405_135700.pdf',
    type: '청년',
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
    conditions: [
      {
        id: '1',
        announcement_id: '1',
        llm_output_id: '1',
        content: '무주택자',
        section: '신청자격',
        category: '기본자격',
        pages: [1],
        created_at: '2024-04-01T00:00:00Z'
      },
      {
        id: '2',
        announcement_id: '1',
        llm_output_id: '1',
        content: '소득기준 충족자',
        section: '신청자격',
        category: '소득기준',
        pages: [1],
        created_at: '2024-04-01T00:00:00Z'
      }
    ],
    blocks: [
      {
        id: '1',
        announcement_id: '1',
        page: 1,
        bbox: [59.488, 687.56, 497.947, 697.427],
        type: 'text',
        confidence: 0.95,
        model: 'layout'
      }
    ],
    reference_links: [
      {
        id: '1',
        announcement_id: '1',
        condition_id: '1',
        block_id: '1',
        created_at: '2024-04-01T00:00:00Z'
      }
    ]
  },
  {
    id: '2',
    announcement_id: 2024002,
    announcement_name: '2024년 경기도 행복주택 2차 모집공고',
    housing_name: '경기 행복주택',
    supply_institution_name: '경기도',
    full_address: '경기도 수원시 팔달구 인계로 123',
    total_supply_count: 150,
    rent_guarantee: 8000000,
    monthly_rent: 400000,
    pdf_url: '/공고문_17808_20250405_135646.pdf',
    begin_date: '2024-04-01T00:00:00Z',
    end_date: '2024-04-15T23:59:59Z',
    file_path: '/uploads/2024/04/공고문_17808_20250405_135646.pdf',
    type: '신혼부부',
    created_at: '2024-03-25T00:00:00Z',
    updated_at: '2024-03-25T00:00:00Z',
    conditions: [
      {
        id: '3',
        announcement_id: '2',
        llm_output_id: '2',
        content: '무주택자',
        section: '신청자격',
        category: '기본자격',
        pages: [1],
        created_at: '2024-03-25T00:00:00Z'
      },
      {
        id: '4',
        announcement_id: '2',
        llm_output_id: '2',
        content: '소득기준 충족자',
        section: '신청자격',
        category: '소득기준',
        pages: [1],
        created_at: '2024-03-25T00:00:00Z'
      }
    ],
    blocks: [
      {
        id: '2',
        announcement_id: '2',
        page: 1,
        bbox: [59.488, 687.56, 497.947, 697.427],
        type: 'text',
        confidence: 0.95,
        model: 'layout'
      }
    ],
    reference_links: [
      {
        id: '2',
        announcement_id: '2',
        condition_id: '3',
        block_id: '2',
        created_at: '2024-03-25T00:00:00Z'
      }
    ]
  },
  {
    id: '3',
    announcement_id: 2024003,
    announcement_name: '2024년 경기도 행복주택 3차 모집공고',
    housing_name: '경기 행복주택',
    supply_institution_name: '경기도',
    full_address: '경기도 성남시 분당구 판교로 123',
    total_supply_count: 200,
    rent_guarantee: 9000000,
    monthly_rent: 450000,
    pdf_url: '/공고문_17870_20250331_224621.pdf',
    begin_date: '2024-04-20T00:00:00Z',
    end_date: '2024-05-05T23:59:59Z',
    file_path: '/uploads/2024/04/공고문_17870_20250331_224621.pdf',
    type: '청년',
    created_at: '2024-04-05T00:00:00Z',
    updated_at: '2024-04-05T00:00:00Z',
    conditions: [
      {
        id: '5',
        announcement_id: '3',
        llm_output_id: '3',
        content: '무주택자',
        section: '신청자격',
        category: '기본자격',
        pages: [1],
        created_at: '2024-04-05T00:00:00Z'
      },
      {
        id: '6',
        announcement_id: '3',
        llm_output_id: '3',
        content: '소득기준 충족자',
        section: '신청자격',
        category: '소득기준',
        pages: [1],
        created_at: '2024-04-05T00:00:00Z'
      }
    ],
    blocks: [
      {
        id: '3',
        announcement_id: '3',
        page: 1,
        bbox: [59.488, 687.56, 497.947, 697.427],
        type: 'text',
        confidence: 0.95,
        model: 'layout'
      }
    ],
    reference_links: [
      {
        id: '3',
        announcement_id: '3',
        condition_id: '5',
        block_id: '3',
        created_at: '2024-04-05T00:00:00Z'
      }
    ]
  },
  {
    id: '4',
    announcement_id: 2024004,
    announcement_name: '2024년 경기도 행복주택 4차 모집공고',
    housing_name: '경기 행복주택',
    supply_institution_name: '경기도',
    full_address: '경기도 안양시 동안구 평촌대로 123',
    total_supply_count: 180,
    rent_guarantee: 8500000,
    monthly_rent: 425000,
    pdf_url: '/{공고문(PDF)}_(최종)대전광역시시유성구10년임대 분납임대주택예비입주자모집.pdf',
    begin_date: '2024-04-25T00:00:00Z',
    end_date: '2024-05-10T23:59:59Z',
    file_path: '/uploads/2024/04/{공고문(PDF)}_(최종)대전광역시시유성구10년임대 분납임대주택예비입주자모집.pdf',
    type: '다자녀가구',
    created_at: '2024-04-10T00:00:00Z',
    updated_at: '2024-04-10T00:00:00Z',
    conditions: [
      {
        id: '7',
        announcement_id: '4',
        llm_output_id: '4',
        content: '무주택자',
        section: '신청자격',
        category: '기본자격',
        pages: [1],
        created_at: '2024-04-10T00:00:00Z'
      },
      {
        id: '8',
        announcement_id: '4',
        llm_output_id: '4',
        content: '소득기준 충족자',
        section: '신청자격',
        category: '소득기준',
        pages: [1],
        created_at: '2024-04-10T00:00:00Z'
      }
    ],
    blocks: [
      {
        id: '4',
        announcement_id: '4',
        page: 1,
        bbox: [59.488, 687.56, 497.947, 697.427],
        type: 'text',
        confidence: 0.95,
        model: 'layout'
      }
    ],
    reference_links: [
      {
        id: '4',
        announcement_id: '4',
        condition_id: '7',
        block_id: '4',
        created_at: '2024-04-10T00:00:00Z'
      }
    ]
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
  sortIndex: number;
}

interface ViewState {
  pageIndex: number;
  scale: number | string;
  scrollLeft: number;
  scrollTop: number;
}

interface CustomTheme {
  id: string;
  name: string;
  styles: Record<string, string>;
}

interface PdfView {
  _tool: any;
  _pdfPages: Record<number, any>;
  _onAddAnnotation: (annotation: any) => void;
}

interface ZoteroReader {
  _tools: {
    highlight: {
      type: 'highlight';
      color: string;
    };
    pointer: {
      type: 'pointer';
    };
  };
  _primaryView: PdfView;
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
  const { theme } = useTheme();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [highlights, setHighlights] = useState<Array<{
    id: string;
    page: number;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readerRef = useRef<ZoteroReader | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!announcement || !iframeRef.current) return;

    const iframe = iframeRef.current;
    iframe.onload = async () => {
      try {
        const response = await fetch(announcement.pdf_url);
        const arrayBuffer = await response.arrayBuffer();

        // iframe이 로드된 후 초기 테마 설정
        const iframeDocument = iframe.contentDocument;
        if (iframeDocument) {
          const root = iframeDocument.querySelector(':root');
          if (root) {
            root.setAttribute('data-color-scheme', theme);
          }
        }

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
            scale: 'page-width',
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

        if (iframe.contentWindow) {
          const pdfViewer = iframe.contentWindow.document.querySelector('.pdf-viewer');
          if (pdfViewer) {
            // Handle different layout modes
            let spreadMode = pdfViewer.spreadMode; // 0: No Spread, 1: Odd Spreads, 2: Even Spreads
            console.log(`Current spread mode: ${spreadMode}`);
            
            // Set initial scale to fit page width
            pdfViewer.currentScaleValue = 'page-width';
            
            // Log success message
            console.log(`Zoom set successfully for spread mode: ${spreadMode}`);
          }
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };
  }, [announcement, theme]);

  useEffect(() => {
    // API 연동 후 실제 데이터로 교체
    const foundAnnouncement = mockAnnouncements.find(a => a.announcement_id === Number(params.sn));
    setAnnouncement(foundAnnouncement || null);
  }, [params.sn]);

  const handleConditionClick = (condition: Condition) => {
    if (!readerRef.current || !announcement) return;

    // 해당 조건과 연결된 블록 찾기
    const relatedBlocks = announcement.reference_links
      ?.filter(link => link.condition_id === condition.id)
      .map(link => announcement.blocks?.find(block => block.id === link.block_id))
      .filter((block): block is Block => block !== undefined);

    if (!relatedBlocks?.length) return;

    // 정확한 위치 계산
    console.log(relatedBlocks)
    

    
  };

  const handleInfoClick = (label: string, value: string) => {
    if (!readerRef.current || !announcement) return;

    // 해당 정보와 관련된 블록 찾기
    const relatedBlocks = announcement.reference_links
      ?.map(link => announcement.blocks?.find(block => block.id === link.block_id))
      .filter((block): block is Block => block !== undefined);

    if (!relatedBlocks?.length) return;

    const innerFrame = iframeRef.current?.contentWindow?.document?.querySelector('iframe');
    if (!innerFrame) return;
    
    const innerFrameWindow = innerFrame.contentWindow;
    const innerFrameDocument = innerFrameWindow?.document;
    const page = innerFrameDocument?.querySelector('.page[data-page-number="1"]');
    
    if (page) {
      // 페이지 크기 가져오기
      const pageRect = page.getBoundingClientRect();
      const pageWidth = pageRect.width;
      const pageHeight = pageRect.height;
      
      console.log('Page dimensions:', {
        width: pageWidth,
        height: pageHeight
      });

      // 하이라이트 위치 계산
      const newHighlights = relatedBlocks.map(block => {
        const [x, y, width, height] = block.bbox;
        
        // bbox 좌표를 퍼센트로 변환
        const left = (x / pageWidth) * 100;
        const top = (y / pageHeight) * 100;
        const widthPercent = ((width - x) / pageWidth) * 100;
        const heightPercent = ((height - y) / pageHeight) * 100;

        return {
          id: block.id,
          page: block.page,
          position: {
            x: left,
            y: top,
            width: widthPercent,
            height: heightPercent
          }
        };
      });

      setHighlights(newHighlights);
    }
  };

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
      <div className="w-1/2 h-screen relative">
        <iframe
          ref={iframeRef}
          src="/zotero_build/web/reader.html"
          title="PDF Viewer"
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
        {/* 하이라이트 오버레이 */}
        <div
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none"
        >
          {highlights.map(highlight => (
            <div
              key={highlight.id}
              className="absolute bg-yellow-400 bg-opacity-30"
              style={{
                left: `${highlight.position.x}%`,
                top: `${highlight.position.y}%`,
                width: `${highlight.position.width}%`,
                height: `${highlight.position.height}%`,
              }}
            />
          ))}
        </div>
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
                  {announcement.announcement_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {announcement.supply_institution_name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  기본 정보
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors duration-200"
                    onClick={() => handleInfoClick('공고번호', announcement.announcement_id.toString())}
                  >
                    <InfoItem label="공고번호" value={announcement.announcement_id.toString()} />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors duration-200"
                    onClick={() => handleInfoClick('주택명', announcement.housing_name)}
                  >
                    <InfoItem label="주택명" value={announcement.housing_name} />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors duration-200"
                    onClick={() => handleInfoClick('주소', announcement.full_address)}
                  >
                    <InfoItem label="주소" value={announcement.full_address} />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors duration-200"
                    onClick={() => handleInfoClick('모집 세대수', `${announcement.total_supply_count}세대`)}
                  >
                    <InfoItem label="모집 세대수" value={`${announcement.total_supply_count}세대`} />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors duration-200"
                    onClick={() => handleInfoClick('임대보증금', `${announcement.rent_guarantee.toLocaleString()}원`)}
                  >
                    <InfoItem label="임대보증금" value={`${announcement.rent_guarantee.toLocaleString()}원`} />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors duration-200"
                    onClick={() => handleInfoClick('월임대료', `${announcement.monthly_rent.toLocaleString()}원`)}
                  >
                    <InfoItem label="월임대료" value={`${announcement.monthly_rent.toLocaleString()}원`} />
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors duration-200"
                    onClick={() => handleInfoClick('신청기간', `${announcement.begin_date?.split('T')[0]} ~ ${announcement.end_date?.split('T')[0]}`)}
                  >
                    <InfoItem label="신청기간" value={`${announcement.begin_date?.split('T')[0]} ~ ${announcement.end_date?.split('T')[0]}`} />
                  </div>
                </div>
              </div>

              {announcement.conditions && (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    신청 조건
                  </h2>
                  <div className="space-y-4">
                    {announcement.conditions.map(condition => (
                      <div
                        key={condition.id}
                        className="p-3 bg-gray-50 dark:bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors duration-200"
                        onClick={() => handleConditionClick(condition)}
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {condition.section} - {condition.category}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300 mt-1">
                          {condition.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 