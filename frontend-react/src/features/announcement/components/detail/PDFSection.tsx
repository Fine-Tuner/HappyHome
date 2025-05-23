import { useRef, useState } from "react";
import { ActiveTabType, ACTIVE_TAB } from "../../types/activeTab";
import ResizeHandle from "./ResizeHandle";

interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export default function PDFSection({ iframeRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState(0);

  return (
    <div className="h-screen relative w-full" ref={containerRef}>
      <div style={{ width: `${pdfWidth}px`, height: "100%" }}>
        <iframe
          ref={iframeRef}
          src="/zotero_build/web/reader.html"
          title="PDF Viewer"
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
      <ResizeHandle
        containerRef={containerRef}
        pdfWidth={pdfWidth}
        setPdfWidth={setPdfWidth}
      />
    </div>
  );
}
