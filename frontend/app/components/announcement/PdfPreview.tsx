import { Document, Page } from 'react-pdf';

interface PdfPreviewProps {
  pdfUrl: string;
  currentPage: number;
  numPages: number;
  onLoadSuccess: (numPages: number) => void;
  onPageChange: (direction: 'prev' | 'next') => void;
  onClick: () => void;
}

export default function PdfPreview({
  pdfUrl,
  currentPage,
  numPages,
  onLoadSuccess,
  onPageChange,
  onClick,
}: PdfPreviewProps) {
  return (
    <div
      className="h-64 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 relative group/pdf shadow-md cursor-pointer"
      onClick={onClick}
    >
      <Document
        file={pdfUrl}
        loading={<div className="w-full h-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">로딩중...</div>}
        error={<div className="w-full h-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">PDF를 불러올 수 없습니다</div>}
        onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
      >
        <Page
          pageNumber={currentPage}
          width={192}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
      <PdfNavigationButtons
        currentPage={currentPage}
        numPages={numPages}
        onPageChange={onPageChange}
      />
      <PdfPageIndicator
        currentPage={currentPage}
        numPages={numPages}
      />
    </div>
  );
}

interface PdfNavigationButtonsProps {
  currentPage: number;
  numPages: number;
  onPageChange: (direction: 'prev' | 'next') => void;
}

function PdfNavigationButtons({ currentPage, numPages, onPageChange }: PdfNavigationButtonsProps) {
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover/pdf:opacity-100 transition-all duration-300">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onPageChange('prev');
        }}
        disabled={currentPage === 1}
        className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onPageChange('next');
        }}
        disabled={currentPage === numPages}
        className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

interface PdfPageIndicatorProps {
  currentPage: number;
  numPages: number;
}

function PdfPageIndicator({ currentPage, numPages }: PdfPageIndicatorProps) {
  return (
    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
      {currentPage} / {numPages}
    </div>
  );
} 