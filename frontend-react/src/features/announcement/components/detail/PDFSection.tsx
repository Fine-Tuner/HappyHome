interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export default function PDFSection({ iframeRef }: Props) {
  return (
    <div className="h-screen relative w-full">
      <iframe
        ref={iframeRef}
        src="/zotero_build/web/reader.html"
        title="PDF Viewer"
        className="w-full h-full"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
