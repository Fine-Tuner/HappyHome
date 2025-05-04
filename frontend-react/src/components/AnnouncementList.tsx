import { useState } from 'react';
import { Announcement } from '../types/announcement';
import PdfModal from './PdfModal';
import AnnouncementCard from './announcement/AnnouncementCard';
import { pdfjs } from 'react-pdf';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface AnnouncementListProps {
  announcements: Announcement[];
}

interface PdfState {
  [key: string]: {
    currentPage: number;
    numPages: number;
  };
}

export default function AnnouncementList({ announcements }: AnnouncementListProps) {
  const [pdfStates, setPdfStates] = useState<PdfState>({});
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  const handlePageChange = (announcementId: string, direction: 'prev' | 'next') => {
    setPdfStates(prev => {
      const currentState = prev[announcementId];
      if (!currentState) return prev;

      const newPage = direction === 'prev' 
        ? Math.max(1, currentState.currentPage - 1)
        : Math.min(currentState.numPages, currentState.currentPage + 1);

      return {
        ...prev,
        [announcementId]: {
          ...currentState,
          currentPage: newPage
        }
      };
    });
  };

  const handlePdfLoadSuccess = (announcementId: string, numPages: number) => {
    setPdfStates(prev => ({
      ...prev,
      [announcementId]: {
        currentPage: 1,
        numPages
      }
    }));
  };

  return (
    <div className="space-y-6">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          currentPage={pdfStates[announcement.id]?.currentPage || 1}
          numPages={pdfStates[announcement.id]?.numPages || 0}
          onLoadSuccess={handlePdfLoadSuccess}
          onPageChange={handlePageChange}
          onPdfClick={setSelectedPdf}
        />
      ))}
      {selectedPdf && (
        <PdfModal
          pdfUrl={selectedPdf}
          isOpen={!!selectedPdf}
          onClose={() => setSelectedPdf(null)}
        />
      )}
    </div>
  );
} 