import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useState, useEffect } from 'react';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PdfModalProps {
  pdfUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfModal({ pdfUrl, isOpen, onClose }: PdfModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 flex items-center justify-center p-2">
        <div className="relative w-full max-w-7xl h-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-2xl transition-all">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 페이지 네비게이션 */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-full p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
              disabled={currentPage === numPages}
              className="rounded-full p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* PDF 뷰어 */}
          <div className="relative h-[calc(100%-4rem)] flex items-center justify-center">
            <Document
              file={pdfUrl}
              loading={<div className="flex h-full items-center justify-center">로딩중...</div>}
              error={<div className="flex h-full items-center justify-center">PDF를 불러올 수 없습니다</div>}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              <Page
                pageNumber={currentPage}
                height={window.innerHeight - 100}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="mx-auto"
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
} 