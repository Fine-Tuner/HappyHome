import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Announcement } from '../types/announcement';
import InfoItem from '../components/announcement/InfoItem';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

// 임시 데이터 - API 연동 후 삭제
interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: string;
}

interface ContentItem {
  content: string;
  bbox: BBox;
  comments: Comment[];
}

interface AnalysisResult {
  id: string;
  topic: string;
  contents: ContentItem[];
}

// Mock 데이터
const mockAnalysisResults: AnalysisResult[] = [
  {
    id: '1',
    topic: '신청자격',
    contents: [
      {
        content: '무주택자로서 소득기준을 충족하는 자',
        bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
        comments: [
          {
            id: 'c1',
            content: '소득기준이 어떻게 되나요?',
            createdAt: '2024-04-15T10:00:00Z',
            author: '홍길동'
          },
          {
            id: 'c2',
            content: '소득기준은 4인 가구 기준 5,000만원 이하입니다.',
            createdAt: '2024-04-15T11:00:00Z',
            author: '관리자'
          }
        ]
      },
      {
        content: '신청일 현재 무주택자로서 주택을 소유하지 않은 자',
        bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
        comments: []
      }
    ]
  },
  {
    id: '2',
    topic: '임대기간',
    contents: [
      {
        content: '최초 2년, 연장 가능 (최대 4년)',
        bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
        comments: [
          {
            id: 'c3',
            content: '연장 신청은 언제 해야 하나요?',
            createdAt: '2024-04-16T09:00:00Z',
            author: '김철수'
          }
        ]
      },
      {
        content: '연장 시 최대 2회까지 가능하며, 1회당 1년씩 연장',
        bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
        comments: []
      }
    ]
  },
  {
    id: '3',
    topic: '입주자 선정방법',
    contents: [
      {
        content: '추첨을 통한 선정 (다자녀 가구 우선)',
        bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
        comments: []
      },
      {
        content: '다자녀 가구는 3자녀 이상 가구를 말하며, 우선 선정',
        bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
        comments: []
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
  _tools: any;
  _primaryView: any;
  openContextMenu: (params: ContextMenuParams) => void;
  setSelectedAnnotations: (ids: string[]) => void;
}

interface ZoteroWindow extends Window {
  createReader: (options: any) => ZoteroReader;
}

declare global {
  interface Window {
    createReader: (options: any) => ZoteroReader;
  }
}

interface SelectedContent {
  id: string;
  title: string;
  content: string;
}

export default function AnnouncementDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  const [isClient, setIsClient] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [expandedContents, setExpandedContents] = useState<Record<string, boolean>>({});
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentAnnotations, setContentAnnotations] = useState<{ [key: string]: any[] }>({});
  const [editedContents, setEditedContents] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  const [pdfWidth, setPdfWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    if(!containerRef.current) return;

    const savedWidth = localStorage.getItem('pdfWidth');
    const initialWidth = savedWidth ? Number(savedWidth) : 2400;
    setPdfWidth(initialWidth);
  }, [containerRef.current]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = pdfWidth;
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if(!isDragging) return;
      const deltaX = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;

      const containerWidth = window.innerWidth;
      const minWidth = containerWidth * 0.3;
      const maxWidth = containerWidth * 0.85;

      if(newWidth < minWidth || newWidth > maxWidth) return;
      setPdfWidth(newWidth);
      localStorage.setItem('pdfWidth', newWidth.toString());
    }

    const handleMouseUp = () => {
      setIsDragging(false);
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
      document.body.style.userSelect = '';
    }
  }, [isDragging])

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const containerWidth = window.innerWidth;
      const minWidth = containerWidth * 0.5;
      const maxWidth = containerWidth * 0.85;
      
      if (pdfWidth < minWidth) {
        setPdfWidth(minWidth);
        localStorage.setItem('pdfWidth', minWidth.toString());
      } else if (pdfWidth > maxWidth) {
        setPdfWidth(maxWidth);
        localStorage.setItem('pdfWidth', maxWidth.toString());
      }
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const overlay = isDragging ? document.createElement('div') : null;
    if (overlay) {
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.zIndex = '50';
      containerRef.current?.appendChild(overlay);
    }
  
    return () => {
      overlay?.remove();
    };
  }, [isDragging]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const savedContents = localStorage.getItem('editedContents');
      if (savedContents) {
        setEditedContents(JSON.parse(savedContents));
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      const savedComments = localStorage.getItem('comments');
      if (savedComments) {
        setComments(JSON.parse(savedComments));
      }
    }
  }, [isClient]);

  const handleContentSelect = (contentId: string) => {
    console.log('Selected content ID:', contentId);
  };

  useEffect(() => {
    const fetchAnnouncementData = async () => {
      try {
        const [announcementData, analysisData] = await Promise.all([
          api.getAnnouncement(params.sn!),
          api.getAnalysisResults(params.sn!)
        ]);
        
        setAnnouncement(announcementData);
        setAnalysisResults(analysisData);
      } catch (err) {
        setError('공고 정보를 불러오는데 실패했습니다.');
        console.error('Error fetching announcement data:', err);
      }
    };

    if (params.sn) {
      fetchAnnouncementData();
    }
  }, [params.sn]);

  useEffect(() => {
    if (!isClient || !iframeRef.current) return;

    const iframe = iframeRef.current;
    iframe.onload = async () => {
      try {
        const response = await fetch('/공고문_17779_20250405_135700.pdf');
        const arrayBuffer = await response.arrayBuffer();

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
          contents: mockAnalysisResults.map(topic => ({
            id: topic.id,
            title: topic.topic,
            contents: topic.contents.map(content => ({
              id: `${topic.id}-${content.content}`,
              content: content.content
            }))
          })),
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
            onSaveAnnotations(annotations);
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
          },
          onContentSelect: handleContentSelect,
          onSelectAnnotations(ids: string[]) {
            console.log('onSelectAnnotations called with ids:', ids);
            if (ids.length === 1) {
              console.log('Attempting to scroll to annotation:', ids[0]);
              scrollToAnnotation(ids[0]);
            }
          },
          onClickContent: (contentId: string) => {
            console.log('Content clicked:', contentId);
            const [topicId, ...contentParts] = contentId.split('-');
            const content = contentParts.join('-');
            
            setExpandedTopics(prev => ({
              ...prev,
              [topicId]: true
            }));
            
            const topic = mockAnalysisResults.find(t => t.id === topicId);
            if (topic) {
              const contentIndex = topic.contents.findIndex(c => c.content === content);
              if (contentIndex !== -1) {
                setExpandedContents(prev => ({
                  ...prev,
                  [`${topicId}-${contentIndex}`]: true
                }));
                
                setTimeout(() => {
                  const contentElement = document.querySelector(`[data-content-id="${contentId}"]`);
                  if (contentElement) {
                    contentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    contentElement.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20');
                    setTimeout(() => {
                      contentElement.classList.remove('bg-yellow-50', 'dark:bg-yellow-900/20');
                    }, 2000);
                  }
                }, 100);
              }
            }
          }
        });

        readerRef.current = reader;
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };
  }, [announcement, theme, isClient, contentAnnotations]);

  const handleHighlightClick = (bbox: BBox, pageNumber: number) => {
    const innerFrame = iframeRef.current?.contentWindow?.document?.querySelector('iframe');
    if (!innerFrame) return;
    
    const innerFrameWindow = innerFrame.contentWindow;

    const pageWidth = 595;
    const pageHeight = 840;

    const {x, y, width, height} = bbox;
    console.log(x, y, width, height)
    
    const top = ((pageHeight - height) / pageHeight) * 100;
    const left = (x / pageWidth) * 100;
    const widthPercent = ((width - x) / pageWidth) * 100;
    const heightPercent = ((height - y) / pageHeight) * 100;

    const pageElement = innerFrameWindow?.document?.querySelector(`.page[data-page-number="${pageNumber}"]`);
    if (!pageElement) return;

    const existingHighlights = pageElement.querySelectorAll('.highlight-overlay');
    existingHighlights.forEach((el: Element) => el.remove());

    const highlightLayer = document.createElement('div');
    highlightLayer.style.position = 'absolute';
    highlightLayer.style.left = `${left}%`;
    highlightLayer.style.top = `${top}%`;
    highlightLayer.style.width = `${widthPercent}%`;
    highlightLayer.style.height = `${heightPercent}%`;
    highlightLayer.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
    highlightLayer.classList.add('highlight-overlay');
    pageElement.appendChild(highlightLayer);

    setTimeout(() => {
      highlightLayer.remove();
    }, 3000);

    pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const toggleContent = (topicId: string, contentIndex: number) => {
    const key = `${topicId}-${contentIndex}`;
    setExpandedContents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const onSaveAnnotations = async (annotations: any[]) => {
    console.log('Saving annotations:', annotations);
    
    setContentAnnotations(prevAnnotations => {
      const updatedAnnotations = { ...prevAnnotations };
      
      annotations.forEach(annotation => {
        if (annotation.contentId) {
          const contentKey = annotation.contentId;
          
          if (!updatedAnnotations[contentKey]) {
            updatedAnnotations[contentKey] = [];
          }
          
          const existingIndex = updatedAnnotations[contentKey]
            .findIndex(a => a.id === annotation.id);
          
          if (existingIndex !== -1) {
            updatedAnnotations[contentKey][existingIndex] = annotation;
          } else {
            updatedAnnotations[contentKey] = [...updatedAnnotations[contentKey], annotation];
          }
        }
      });

      return updatedAnnotations;
    });
  };

  const scrollToAnnotation = (annotationId: string) => {
    console.log('scrollToAnnotation called for:', annotationId);
    
    for (const topic of mockAnalysisResults) {
      for (const content of topic.contents) {
        const contentKey = `${topic.id}-${content.content}`;
        const annotations = contentAnnotations[contentKey] || [];
        
        console.log('Checking content:', contentKey, 'annotations:', annotations);
        
        const foundAnnotation = annotations.find(ann => ann.id === annotationId);
        if (foundAnnotation) {
          console.log('Found annotation in content:', contentKey);
          
          setExpandedTopics(prev => ({
            ...prev,
            [topic.id]: true
          }));
          
          const contentIndex = topic.contents.indexOf(content);
          const contentExpandKey = `${topic.id}-${contentIndex}`;
          console.log('Expanding content with key:', contentExpandKey);
          
          setExpandedContents(prev => ({
            ...prev,
            [contentExpandKey]: true
          }));

          setTimeout(() => {
            const annotationElement = document.querySelector(`[data-annotation-id="${annotationId}"]`);
            console.log('Found element:', annotationElement);
            
            if (annotationElement) {
              annotationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              annotationElement.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20');
              setTimeout(() => {
                annotationElement.classList.remove('bg-yellow-50', 'dark:bg-yellow-900/20');
              }, 2000);
            } else {
              console.log('Could not find element with data-annotation-id:', annotationId);
            }
          }, 300);
          
          return;
        }
      }
    }
    console.log('Annotation not found in any content:', annotationId);
  };

  const handleContentEdit = (topicId: string, content: ContentItem, newContent: string) => {
    const contentId = `${topicId}-${content.content}`;
    const updatedContents = {
      ...editedContents,
      [contentId]: newContent
    };
    setEditedContents(updatedContents);
    localStorage.setItem('editedContents', JSON.stringify(updatedContents));
  };

  const handleResetContent = (topicId: string, content: ContentItem) => {
    const contentId = `${topicId}-${content.content}`;
    const updatedContents = { ...editedContents };
    delete updatedContents[contentId];
    setEditedContents(updatedContents);
    localStorage.setItem('editedContents', JSON.stringify(updatedContents));
  };

  const handleAddComment = async (topicId: string, content: ContentItem) => {
    const contentId = `${topicId}-${content.content}`;
    if (!newComment[contentId]?.trim()) return;

    try {
      const response = await api.addComment(params.sn!, {
        contentId,
        content: newComment[contentId],
        author: '사용자'
      });

      const updatedComments = {
        ...comments,
        [contentId]: [...(comments[contentId] || []), response]
      };

      setComments(updatedComments);
      localStorage.setItem('comments', JSON.stringify(updatedComments));
      
      setNewComment(prev => ({
        ...prev,
        [contentId]: ''
      }));
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('댓글 추가에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (topicId: string, content: ContentItem, commentId: string) => {
    const contentId = `${topicId}-${content.content}`;
    
    try {
      await api.deleteComment(params.sn!, commentId);
      
      const updatedComments = {
        ...comments,
        [contentId]: (comments[contentId] || []).filter(c => c.id !== commentId)
      };

      setComments(updatedComments);
      localStorage.setItem('comments', JSON.stringify(updatedComments));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* PDF Viewer Section */}
      <div ref={containerRef}>
        <div className="h-screen relative" style={{ width: `${pdfWidth}px`}}>
          <iframe
            ref={iframeRef}
            src="/zotero_build/web/reader.html"
            title="PDF Viewer"
            className="w-full h-full"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
          {/* 리사이즈 핸들 */}
          <div
            className={`absolute right-0 top-0 h-full w-2 cursor-col-resize transition-colors duration-150 z-10 ${
              isDragging 
                ? 'bg-blue-500 dark:bg-blue-600' 
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600'
            }`}
            style={{ left: `${pdfWidth}px` }}
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="w-1/2 h-screen overflow-y-auto">
        <div className="p-8">
          <button
            onClick={() => navigate('/announcements')}
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

          <div className="space-y-4">
            {mockAnalysisResults.map((topic) => (
              <div key={topic.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleTopic(topic.id)}
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {topic.topic}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ${
                      expandedTopics[topic.id] ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                
                {expandedTopics[topic.id] && (
                  <div className="mt-4 space-y-3">
                    {topic.contents.map((content, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-md p-3"
                        data-content-id={`${topic.id}-${content.content}`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 flex items-center justify-between cursor-pointer"
                            onClick={() => toggleContent(topic.id, index)}
                          >
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              내용 {index + 1}
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ${
                                expandedContents[`${topic.id}-${index}`] ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHighlightClick(content.bbox, 1);
                            }}
                            className="ml-2 px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full hover:bg-yellow-200 transition-colors duration-200"
                          >
                            위치 보기
                          </button>
                        </div>
                        
                        {expandedContents[`${topic.id}-${index}`] && (
                          <div className="mt-2">
                            <div className="relative">
                              <textarea
                                className="w-full p-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                value={editedContents[`${topic.id}-${content.content}`] ?? content.content}
                                onChange={(e) => handleContentEdit(topic.id, content, e.target.value)}
                              />
                              {editedContents[`${topic.id}-${content.content}`] && (
                                <button
                                  onClick={() => handleResetContent(topic.id, content)}
                                  className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors duration-200"
                                  title="원래 내용으로 되돌리기"
                                >
                                  초기화
                                </button>
                              )}
                            </div>
                            
                            {contentAnnotations[`${topic.id}-${content.content}`]?.length > 0 && (
                              <div className="mt-2 space-y-2">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  연결된 하이라이트
                                </div>
                                {contentAnnotations[`${topic.id}-${content.content}`].map((annotation, idx) => (
                                  <div
                                    key={annotation.id}
                                    data-annotation-id={annotation.id}
                                    className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors relative"
                                    onClick={() => {
                                      console.log('Clicking annotation:', annotation.id);
                                      readerRef.current?.setSelectedAnnotations([annotation.id]);
                                    }}
                                  >
                                    <div
                                      className="w-3 h-3 rounded flex-shrink-0"
                                      style={{ backgroundColor: annotation.color }}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                                      {annotation.text
                                        ? `"${annotation.text.substring(0, 50)}${annotation.text.length > 50 ? '...' : ''}"`
                                        : `하이라이트 ${idx + 1}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                  댓글 {(comments[`${topic.id}-${content.content}`] || []).length + (content.comments || []).length}개
                                </h4>
                              </div>

                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={newComment[`${topic.id}-${content.content}`] || ''}
                                  onChange={(e) => setNewComment(prev => ({
                                    ...prev,
                                    [`${topic.id}-${content.content}`]: e.target.value
                                  }))}
                                  placeholder="댓글을 입력하세요"
                                  className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddComment(topic.id, content);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleAddComment(topic.id, content)}
                                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  등록
                                </button>
                              </div>

                              <div className="space-y-2">
                                {content.comments.map((comment) => (
                                  <div key={comment.id} className="bg-white dark:bg-gray-600 p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {comment.author}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                      {comment.content}
                                    </p>
                                  </div>
                                ))}

                                {(comments[`${topic.id}-${content.content}`] || []).map((comment) => (
                                  <div key={comment.id} className="bg-white dark:bg-gray-600 p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {comment.author}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                          })}
                                        </span>
                                        <button
                                          onClick={() => handleDeleteComment(topic.id, content, comment.id)}
                                          className="text-xs text-red-500 hover:text-red-600"
                                          title="댓글 삭제"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                      {comment.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 