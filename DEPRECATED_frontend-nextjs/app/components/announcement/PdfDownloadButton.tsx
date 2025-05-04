export default function PdfDownloadButton({ pdfUrl }: { pdfUrl: string }) {
  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full inline-flex items-center justify-center px-2.5 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm group/pdf cursor-pointer hover:cursor-pointer active:cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
      </svg>
      자세히보기
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-0.5 transition-transform duration-150 group-hover/pdf:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </a>
  );
} 