import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Announcement } from '../types/announcement';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { usePdfViewer } from '../hooks/usePdfViewer';
import { useComments } from '../hooks/useComments';
import { useContent } from '../hooks/useContent';
import { AnalysisResult, BBox, ContentItem } from '../types/announcementDetail';
import TopicSection from '../components/announcement/TopicSection';
import TabSection from '../components/announcement/TabSection';

// Mock 데이터
const mockAnalysisResults: AnalysisResult[] = [
  {
    id: '1',
    topic: '신청자격',
    contents: [
      {
        content: '무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자',
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

export default function AnnouncementDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Topic 관리를 위한 상태
  const [topics, setTopics] = useState<AnalysisResult[]>(mockAnalysisResults);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const {
    iframeRef,
    readerRef,
    pdfWidth,
    isDragging,
    containerRef,
    handleMouseDown,
    iframeLoaded
  } = usePdfViewer(theme);

  const {
    comments,
    newComment,
    setNewComment,
    handleAddComment,
    handleDeleteComment
  } = useComments(params.sn!);

  const {
    expandedTopics,
    expandedContents,
    editedContents,
    contentAnnotations,
    toggleTopic,
    toggleContent,
    handleContentEdit,
    handleResetContent,
    onSaveAnnotations
  } = useContent();

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Topic 추가 함수
  const handleAddTopic = () => {
    if (newTopicTitle.trim() === '') return;
    
    const newTopic: AnalysisResult = {
      id: `topic-${Date.now()}`,
      topic: newTopicTitle.trim(),
      contents: [{
        content: '내용을 입력하세요',
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        comments: []
      }]
    };
    
    setTopics(prev => [...prev, newTopic]);
    setNewTopicTitle('');
    setIsAddingTopic(false);
    
    // 새로 추가된 토픽 자동 펼치기
    toggleTopic(newTopic.id);
  };
  
  // Topic 삭제 함수
  const handleDeleteTopic = (topicId: string) => {
    setTopics(prev => prev.filter(topic => topic.id !== topicId));
  };
  
  // Content 추가 함수
  const handleAddContent = (topicId: string) => {
    const newContent: ContentItem = {
      content: '새 내용을 입력하세요',
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      comments: []
    };
    
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          contents: [...topic.contents, newContent]
        };
      }
      return topic;
    }));
  };
  
  // Topic 제목 수정 함수
  const handleEditTopicTitle = (topicId: string, newTitle: string) => {
    if (newTitle.trim() === '') return;
    
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          topic: newTitle.trim()
        };
      }
      return topic;
    }));
  };
  
  // Content 삭제 함수
  const handleDeleteContent = (topicId: string, contentIndex: number) => {
    // contentIndex가 -1이면 새 컨텐츠를 추가
    if (contentIndex === -1) {
      handleAddContent(topicId);
      return;
    }
    
    // 기존 삭제 로직
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        const newContents = [...topic.contents];
        newContents.splice(contentIndex, 1);
        
        // 최소 1개의 content는 유지
        if (newContents.length === 0) {
          newContents.push({
            content: '내용을 입력하세요',
            bbox: { x: 0, y: 0, width: 0, height: 0 },
            comments: []
          });
        }
        
        return {
          ...topic,
          contents: newContents
        };
      }
      return topic;
    }));
  };

  const handleHighlightClick = (bbox: BBox, pageNumber: number) => {
    const innerFrame = iframeRef.current?.contentWindow?.document?.querySelector('iframe');
    if (!innerFrame) return;
    
    const innerFrameWindow = innerFrame.contentWindow;

    const pageWidth = 595;
    const pageHeight = 840;

    const {x, y, width, height} = bbox;
    
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="space-y-4">
            {/* 토픽 목록 */}
            {topics.map((topic) => (
              <div key={topic.id} className="relative">
                <TopicSection
                  topic={topic}
                  expandedTopics={expandedTopics}
                  expandedContents={expandedContents}
                  editedContents={editedContents}
                  contentAnnotations={contentAnnotations}
                  comments={comments}
                  newComment={newComment}
                  onToggleTopic={toggleTopic}
                  onToggleContent={toggleContent}
                  onContentEdit={handleContentEdit}
                  onResetContent={handleResetContent}
                  onHighlightClick={handleHighlightClick}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onNewCommentChange={(topicId, content, value) => 
                    setNewComment(prev => ({
                      ...prev,
                      [`${topicId}-${content}`]: value
                    }))
                  }
                  onAnnotationClick={(annotationId) => {
                    readerRef.current?.setSelectedAnnotations([annotationId]);
                  }}
                  onDeleteContent={handleDeleteContent}
                  onDeleteTopic={handleDeleteTopic}
                  onEditTopicTitle={handleEditTopicTitle}
                />
              </div>
            ))}
            
            {/* 새 주제 추가하기 버튼 - 목록 아래에 배치 */}
            <div className="mt-4">
              {isAddingTopic ? (
                <div className="flex gap-2 items-center bg-gray-800/60 p-2 rounded-lg">
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="주제 제목을 입력하세요"
                    className="flex-1 px-2 py-1 text-sm rounded bg-gray-700 border border-gray-600 text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTopic();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddTopic}
                    className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingTopic(false);
                      setNewTopicTitle('');
                    }}
                    className="px-3 py-1 text-xs font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingTopic(true)}
                  className="flex items-center justify-center gap-1 py-2 px-3 text-sm font-medium text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-600/30 border border-blue-200 dark:border-blue-500/30 rounded-md hover:bg-blue-200 dark:hover:bg-blue-600/40 transition-colors w-full"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  새 주제 추가하기
                </button>
              )}
            </div>
          </div>
        );
      case 'qa':
        return (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            질문과 답변 기능은 준비 중입니다.
          </div>
        );
      case 'memo':
        return (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            메모 기능은 준비 중입니다.
          </div>
        );
      default:
        return null;
    }
  };

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      <div ref={containerRef}>

{/* Content Section */}
<div className="w-1/2 h-screen overflow-y-auto" style={{ width: `${pdfWidth}px`}}>
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

            <TabSection activeTab={activeTab} onTabChange={setActiveTab}>
              {renderTabContent()}
            </TabSection>
          </div>
</div>
        
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

      
      {/* PDF Viewer Section */}
        <div className="h-screen relative w-full">
          <iframe
            ref={iframeRef}
            src="/zotero_build/web/reader.html"
            title="PDF Viewer"
            className="w-full h-full"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
    </div>
  );
} 