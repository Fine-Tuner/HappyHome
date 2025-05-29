import { useRef, useState, useEffect } from "react";
import { useTheme } from "../../../theme/hooks/useTheme";
import { useParams } from "react-router-dom";
import { useCreateCondition } from "../../../condition/api/postCreate";
import { ZoteroAnnotation } from "../../../annotation/types/zoteroAnnotation";
import { ZoteroReader } from "../../types/announcementDetail";
import { Category } from "../../api/getAnnouncement";
// @ts-ignore
import korStrings from "./kor.strings";

// Window 인터페이스 확장
declare global {
  interface Window {
    createReader?: any;
    Zotero?: {
      createReader?: any;
    };
    ReaderObj?: {
      createReader?: any;
    };
    [key: string]: any;
  }
}

export const usePdfViewer = (categories: Category[], pdfBlob?: Blob) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readerRef = useRef<ZoteroReader | null>(null);

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const params = useParams();
  const { theme } = useTheme();

  const { mutate: createCondition } = useCreateCondition(params.id!);

  // 어노테이션 저장 콜백 구현 (임시)
  const handleSaveAnnotations = (annotations: ZoteroAnnotation[]) => {
    console.log("annotations!", annotations);
    const {
      contentId,
      position: { pageIndex, rects },
      text,
      color,
    } = annotations[0];

    createCondition({
      announcement_id: params.id!,
      category_id: contentId || "",
      content: text,
      comment: "",
      section: "",
      page: pageIndex,
      bbox: rects,
      color: color,
    });
  };

  // cmd+f 키보드 이벤트 처리 로직
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // cmd+f 또는 ctrl+f 감지
      if ((event.metaKey || event.ctrlKey) && event.key === "f") {
        // 입력 필드에서 작업 중인 경우는 제외
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        // PDF iframe이 로드되어 있는 경우 PDF 검색 트리거
        if (iframeRef.current && iframeLoaded) {
          event.preventDefault();

          // PDF 검색 기능 트리거 함수
          const tryTriggerSearch = () => {
            try {
              const iframeWindow = iframeRef.current?.contentWindow;
              if (iframeWindow && (iframeWindow as any)._reader) {
                // reader 객체의 toggleFindPopup 메서드 직접 호출
                (iframeWindow as any)._reader.toggleFindPopup({ open: true });
                return true;
              }
              return false;
            } catch (error) {
              console.log("PDF 검색 트리거 실패:", error);
              return false;
            }
          };

          // 즉시 시도해보고, 실패하면 잠시 후 재시도
          if (!tryTriggerSearch()) {
            // reader가 아직 로드되지 않은 경우 100ms 후 재시도
            setTimeout(() => {
              if (!tryTriggerSearch()) {
                console.log('PDF reader가 아직 로드되지 않았습니다.');
              }
            }, 100);
          }
        }
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener("keydown", handleKeyDown);

    // 컴포넌트 언마운트 시 정리
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [iframeLoaded, iframeRef]);

  // iframe 로드 이벤트 처리
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      console.log("Zotero iframe loaded");
      setIframeLoaded(true);
    };

    iframe.addEventListener("load", handleIframeLoad);
    return () => {
      iframe.removeEventListener("load", handleIframeLoad);
    };
  }, [iframeRef.current]);

  // iframe이 로드된 후 PDF 초기화 시도
  useEffect(() => {
    if (iframeLoaded) {
      initializePdfViewer();
    }
  }, [iframeLoaded, theme, pdfBlob]);

  const initializePdfViewer = async () => {
    if (!iframeRef.current || !iframeLoaded) {
      console.log("iframe 참조 또는 로드 상태 확인 필요");
      return;
    }

    try {
      console.log("PDF 뷰어 초기화 시작");
      let arrayBuffer: ArrayBuffer;
      if (pdfBlob) {
        arrayBuffer = await pdfBlob.arrayBuffer();
      } else {
        // fallback: 기존 하드코딩된 파일
        const response = await fetch("/공고문_17779_20250405_135700.pdf");
        arrayBuffer = await response.arrayBuffer();
      }

      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        const root = iframeDocument.querySelector(":root");
        if (root) {
          root.setAttribute("data-color-scheme", theme);
        }
      }

      // contentWindow 내에서 Zotero 객체를 찾는 다양한 방법 시도
      const contentWindow = iframeRef.current.contentWindow;
      let createReaderFunction = null;

      // 디버깅 정보 출력
      console.log("iframe contentWindow:", contentWindow);

      if (contentWindow) {
        // 방법 1: 직접 createReader 찾기
        if (typeof contentWindow.createReader === "function") {
          console.log("contentWindow.createReader 함수 발견");
          createReaderFunction = contentWindow.createReader;
        }
        // 방법 2: window.Zotero 객체 내에서 찾기
        else if (
          contentWindow.Zotero &&
          typeof contentWindow.Zotero.createReader === "function"
        ) {
          console.log("contentWindow.Zotero.createReader 함수 발견");
          createReaderFunction = contentWindow.Zotero.createReader;
        }
        // 방법 3: window.ReaderObj 등 다른 이름으로 노출된 API 찾기
        else if (
          contentWindow.ReaderObj &&
          typeof contentWindow.ReaderObj.createReader === "function"
        ) {
          console.log("contentWindow.ReaderObj.createReader 함수 발견");
          createReaderFunction = contentWindow.ReaderObj.createReader;
        }
        // 방법 4: window에 직접 노출된 다른 이름의 함수 찾기 (예: initReader)
        else {
          // window 객체의 모든 속성을 확인하여 가능한 함수 찾기
          console.log("사용 가능한 window 속성 확인:");
          Object.keys(contentWindow).forEach((key) => {
            console.log(`- ${key}: ${typeof contentWindow[key]}`);
          });

          // 이름은 다르지만 비슷한 기능을 하는 함수 찾기
          const possibleFunctions = [
            "initReader",
            "loadReader",
            "setupReader",
            "initPdfReader",
          ];
          for (const funcName of possibleFunctions) {
            if (typeof contentWindow[funcName] === "function") {
              console.log(`${funcName} 함수 발견, 시도합니다`);
              createReaderFunction = contentWindow[funcName];
              break;
            }
          }
        }
      }

      if (!createReaderFunction) {
        throw new Error(
          "createReader 함수를 찾을 수 없습니다. iframe 내용을 확인하세요.",
        );
      }

      const reader = createReaderFunction({
        type: "pdf",
        data: {
          buf: new Uint8Array(arrayBuffer),
          url: window.location.origin,
        },
        colorScheme: theme,
        readOnly: false,
        showAnnotations: true,
        platform: "web",
        localizedStrings: korStrings,
        annotations: [],
        categories,
        primaryViewState: {
          pageIndex: 0,
          scale: "page-width",
          scrollLeft: 0,
          scrollTop: 0,
        },
        sidebarWidth: 240,
        sidebarOpen: true,
        bottomPlaceholderHeight: null,
        toolbarPlaceholderWidth: 0,
        authorName: "User",
        onOpenContextMenu(params: any) {
          reader.openContextMenu(params);
        },
        onAddToNote() {
          alert("Add annotations to the current note");
        },
        async onSaveAnnotations(annotations: any) {
          console.log("Save annotations", annotations);
          handleSaveAnnotations(annotations);
        },
        onDeleteAnnotations(ids: any) {
          console.log("Delete annotations", JSON.stringify(ids));
        },
        onChangeViewState(state: any, primary: any) {
          console.log("Set state", state, primary);
        },
        onOpenTagsPopup(annotationID: any, left: any, top: any) {
          alert(
            `Opening Zotero tagbox popup for id: ${annotationID}, left: ${left}, top: ${top}`,
          );
        },
        onClosePopup(data: any) {
          console.log("onClosePopup", data);
        },
        onOpenLink(url: any) {
          alert("Navigating to an external link: " + url);
        },
        onToggleSidebar(open: any) {
          console.log("Sidebar toggled:", open);
        },
        onChangeSidebarWidth(width: any) {
          console.log("Sidebar width changed", width);
        },
        onSetDataTransferAnnotations(
          dataTransfer: any,
          annotations: any,
          fromText: any,
        ) {
          console.log(
            "Set formatted dataTransfer annotations",
            dataTransfer,
            annotations,
            fromText,
          );
        },
        onConfirm(title: any, text: any, confirmationButtonTitle: any) {
          return window.confirm(text);
        },
        onRotatePages(pageIndexes: any, degrees: any) {
          console.log("Rotating pages", pageIndexes, degrees);
        },
        onDeletePages(pageIndexes: any) {
          console.log("Deleting pages", pageIndexes);
        },
        onToggleContextPane() {
          console.log("Toggle context pane");
        },
        onTextSelectionAnnotationModeChange(mode: any) {
          console.log(`Change text selection annotation mode to '${mode}'`);
        },
        onSaveCustomThemes(customThemes: any) {
          console.log("Save custom themes", customThemes);
        },
      });

      console.log("Reader 객체 생성 성공:", reader);

      readerRef.current = reader;

      // reader 객체를 iframe의 contentWindow에 저장하여 다른 컴포넌트에서 접근할 수 있도록 함
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.reader = reader;
      }
    } catch (error) {
      console.error("Error loading PDF:", error);

      // 에러 타입 및 상세 정보 출력
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      // iframe 내용 디버깅
      try {
        if (iframeRef.current && iframeRef.current.contentDocument) {
          console.log(
            "iframe HTML:",
            iframeRef.current.contentDocument.documentElement.outerHTML,
          );
        }
      } catch (e) {
        console.error("iframe 내용 확인 중 오류:", e);
      }
    }
  };

  return {
    iframeRef,
    readerRef,
    initializePdfViewer,
    iframeLoaded,
  };
};
