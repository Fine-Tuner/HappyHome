import { useRef, useState, useEffect } from "react";
import { useTheme } from "../../../theme/hooks/useTheme";
import { useParams } from "react-router-dom";
import { useCreateCondition } from "../../../condition/api/postCreate";
import { useUpdateCondition } from "../../../condition/api/putUpdate";
import { useGetAnnouncement } from "../../api/getAnnouncement";
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
  const { mutate: updateCondition } = useUpdateCondition(params.id!);

  // announcement 데이터 가져오기
  const { data: announcementData } = useGetAnnouncement({
    params: { announcementId: params.id! },
  });

  // annotation과 condition 매핑을 위한 함수
  const findConditionByPosition = (annotation: any, conditions: any[]) => {
    const { position: { pageIndex, rects }, color } = annotation;

    // 같은 페이지, 비슷한 위치, 같은 색상의 condition 찾기
    return conditions.find(condition => {
      if (!condition.position || !condition.position.rects) return false;

      const conditionPage = condition.position.pageIndex;
      const conditionRects = condition.position.rects;
      const conditionColor = condition.color;

      // 페이지가 다르면 매핑 안됨
      if (conditionPage !== pageIndex) return false;

      // 색상이 다르면 매핑 안됨
      if (conditionColor !== color) return false;

      // rect 위치가 비슷한지 확인 (오차범위 5px)
      const TOLERANCE = 5;
      if (rects.length > 0 && conditionRects.length > 0) {
        const [ax1, ay1, ax2, ay2] = rects[0];
        const [cx1, cy1, cx2, cy2] = conditionRects[0];

        return Math.abs(ax1 - cx1) < TOLERANCE &&
               Math.abs(ay1 - cy1) < TOLERANCE &&
               Math.abs(ax2 - cx2) < TOLERANCE &&
               Math.abs(ay2 - cy2) < TOLERANCE;
      }

      return false;
    });
  };

  // 어노테이션 저장 콜백 구현 (임시)
  const handleSaveAnnotations = async (annotations: ZoteroAnnotation[]) => {
    console.log("📝 Saving annotations:", annotations);

    if (!annotations || annotations.length === 0) {
      console.log("⚠️ No annotations to save");
      return;
    }

    // 각 annotation을 순차적으로 처리
    for (const [index, annotation] of annotations.entries()) {
      console.log(`📋 Processing annotation ${index + 1}:`, annotation);

      const {
        id,
        contentId,
        categoryId,
        categoryName,
        position: { pageIndex, rects },
        text,
        color,
        extractedText,
        type
      } = annotation;

      // 추출된 텍스트 우선, 없으면 기본 텍스트 사용
      const finalContent = extractedText && extractedText.trim()
        ? extractedText.trim()
        : text || '';

      if (!finalContent) {
        console.log(`⚠️ No content found for annotation ${index + 1}, skipping`);
        continue;
      }

      const conditionData = {
        announcement_id: params.id!,
        category_id: categoryId || contentId || '',
        content: finalContent,
        comment: '',
        section: categoryName || '',
        page: pageIndex + 1, // PDF에서는 0-based이므로 1을 더함
        bbox: rects,
        color: color,
      };

      console.log(`✅ Creating condition for annotation ${index + 1}:`, conditionData);

      try {
        // Promise 기반으로 API 호출하여 결과 확인
        const result = await new Promise((resolve, reject) => {
          createCondition(conditionData, {
            onSuccess: (data) => {
              console.log(`✅ Condition created successfully for annotation ${index + 1}:`, data);

              // Reader의 annotation에 conditionId 저장
              if (iframeRef.current?.contentWindow?.reader) {
                const reader = iframeRef.current.contentWindow.reader;
                if (reader.updateAnnotation) {
                  reader.updateAnnotation({
                    ...annotation,
                    conditionId: data.id
                  });
                }
              }

              resolve(data);
            },
            onError: (error) => {
              console.error(`❌ Failed to create condition for annotation ${index + 1}:`, error);
              reject(error);
            }
          });
        });

        console.log(`🎉 Annotation ${index + 1} processed successfully`);
      } catch (error) {
        console.error(`💥 Error processing annotation ${index + 1}:`, error);
      }
    }

    console.log("🏁 All annotations processed");
  };

  // Comment annotation 업데이트 처리
  const handleCommentUpdate = async (annotation: any) => {
    console.log("🔄 Handling comment update:", annotation);

    try {
      // announcement 데이터에서 conditions 가져오기
      let existingCondition = null;

      if (announcementData?.conditions) {
        existingCondition = findConditionByPosition(annotation, announcementData.conditions);
        console.log("🔍 Found existing condition for comment update:", existingCondition);
      }

      if (!existingCondition) {
        console.error("❌ No condition found for this annotation, cannot update comment");
        return;
      }

      try {
        const updateData = {
          id: existingCondition.id,
          comment: annotation.comment || '',
          is_deleted: false,
        };

        const result = await new Promise((resolve, reject) => {
          updateCondition(updateData, {
            onSuccess: (data) => {
              console.log(`✅ Comment updated successfully:`, data);
              resolve(data);
            },
            onError: (error) => {
              console.error(`❌ Failed to update comment:`, error);
              reject(error);
            }
          });
        });

        console.log(`🎉 Comment update completed successfully`);
      } catch (error) {
        console.error(`💥 Error updating comment:`, error);
      }

    } catch (error) {
      console.error("💥 Error in handleCommentUpdate:", error);
    }
  };

  // Category annotation 업데이트 처리
  const handleCategoryUpdate = async (annotation: any) => {
    console.log("🔄 Handling category update:", annotation);

    try {
      // announcement 데이터에서 conditions 가져오기
      let existingCondition = null;

      if (announcementData?.conditions) {
        existingCondition = findConditionByPosition(annotation, announcementData.conditions);
        console.log("🔍 Found existing condition for category update:", existingCondition);
      }

      if (!existingCondition) {
        console.error("❌ No condition found for this annotation, cannot update category");
        return;
      }

      try {
        const updateData = {
          id: existingCondition.id,
          category_id: annotation.categoryId || '',
          is_deleted: false,
        };

        const result = await new Promise((resolve, reject) => {
          updateCondition(updateData, {
            onSuccess: (data) => {
              console.log(`✅ Category updated successfully:`, data);
              resolve(data);
            },
            onError: (error) => {
              console.error(`❌ Failed to update category:`, error);
              reject(error);
            }
          });
        });

        console.log(`🎉 Category update completed successfully`);
      } catch (error) {
        console.error(`💥 Error updating category:`, error);
      }

    } catch (error) {
      console.error("💥 Error in handleCategoryUpdate:", error);
    }
  };

  // BBox annotation 업데이트 처리
  const handleBBoxUpdate = async (annotation: any) => {
    console.log("🔄 Handling BBox update:", annotation);

    try {
      // announcement 데이터에서 conditions 가져오기
      let existingCondition = null;

      if (announcementData?.conditions) {
        existingCondition = findConditionByPosition(annotation, announcementData.conditions);
        console.log("🔍 Found existing condition:", existingCondition);
      }

      // iframe에서 텍스트 추출 함수 호출
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || !(iframeWindow as any)._reader) {
        console.error("❌ Reader not available for text extraction");
        return;
      }

      // Reader에서 텍스트 추출
      const reader = (iframeWindow as any)._reader;
      let extractedText = '';

      // 텍스트 추출 로직 (Reader의 _extractTextFromBBoxAnnotation과 유사)
      try {
        if (reader._extractTextFromBBoxAnnotation) {
          reader._extractTextFromBBoxAnnotation(annotation);
          extractedText = reader._lastExtractedText || '';
        }
      } catch (error) {
        console.error("❌ Error extracting text:", error);
      }

      // Confirm 창 표시
      const shouldUpdateContent = extractedText.trim()
        ? window.confirm(
            `BBox 영역이 수정되었습니다.\n\n추출된 텍스트: "${extractedText.trim()}"\n\n기존 내용을 새로 추출된 텍스트로 덮어쓰시겠습니까?\n\n확인: 내용 덮어쓰기\n취소: 영역만 수정`
          )
        : false;

      console.log(`🤔 User choice: ${shouldUpdateContent ? 'Update content' : 'Keep existing content'}`);

      // annotation에 사용자 선택 정보와 conditionId 추가
      const updatedAnnotation = {
        ...annotation,
        extractedText: extractedText.trim(),
        shouldUpdateContent,
        conditionId: existingCondition?.id || annotation.conditionId
      };

      if (!updatedAnnotation.conditionId) {
        console.error("❌ No condition found for this annotation, cannot update");
        return;
      }

      // 업데이트 실행
      await handleUpdateAnnotations([updatedAnnotation]);

    } catch (error) {
      console.error("💥 Error in handleBBoxUpdate:", error);
    }
  };

  // BBox annotation 업데이트 콜백 구현
  const handleUpdateAnnotations = async (annotations: ZoteroAnnotation[]) => {
    console.log("🔄 Updating annotations:", annotations);

    if (!annotations || annotations.length === 0) {
      console.log("⚠️ No annotations to update");
      return;
    }

    for (const [index, annotation] of annotations.entries()) {
      console.log(`🔄 Processing update for annotation ${index + 1}:`, annotation);

      const {
        id,
        conditionId,
        position: { pageIndex, rects },
        extractedText,
        shouldUpdateContent = false
      } = annotation;

      if (!conditionId) {
        console.error(`❌ No conditionId found for annotation ${index + 1}, skipping update`);
        continue;
      }

      try {
        const updateData: any = {
          id: conditionId, // condition ID 사용
          bbox: rects,
          is_deleted: false,
        };

        // 콘텐츠 업데이트가 선택된 경우에만 content 필드 추가
        if (shouldUpdateContent && extractedText) {
          updateData.content = extractedText.trim();
          console.log(`📝 Updating content to: "${updateData.content}"`);
        } else {
          console.log(`📐 Updating only bbox, keeping existing content`);
        }

        const result = await new Promise((resolve, reject) => {
          updateCondition(updateData, {
            onSuccess: (data) => {
              console.log(`✅ Condition updated successfully for annotation ${index + 1}:`, data);
              resolve(data);
            },
            onError: (error) => {
              console.error(`❌ Failed to update condition for annotation ${index + 1}:`, error);
              reject(error);
            }
          });
        });

        console.log(`🎉 Annotation ${index + 1} updated successfully`);
      } catch (error) {
        console.error(`💥 Error updating annotation ${index + 1}:`, error);
      }
    }

    console.log("🏁 All annotation updates processed");
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
        async onUpdateAnnotations(annotations: any) {
          console.log("Update annotations", annotations);

          // Comment 업데이트 감지
          const commentUpdates = annotations.filter((ann: any) =>
            ann.comment !== undefined
          );

          // Category 업데이트 감지
          const categoryUpdates = annotations.filter((ann: any) =>
            ann.categoryId !== undefined
          );

          // BBox annotation 업데이트 감지
          const bboxUpdates = annotations.filter((ann: any) =>
            ann.type === 'image' && ann.position && ann.position.rects
          );

          if (commentUpdates.length > 0) {
            // Comment 업데이트 처리
            for (const annotation of commentUpdates) {
              await handleCommentUpdate(annotation);
            }
          }

          if (categoryUpdates.length > 0) {
            // Category 업데이트 처리
            for (const annotation of categoryUpdates) {
              await handleCategoryUpdate(annotation);
            }
          }

          if (bboxUpdates.length > 0) {
            // BBox 업데이트에 대해 confirm 창 표시 및 텍스트 추출
            for (const annotation of bboxUpdates) {
              await handleBBoxUpdate(annotation);
            }
          } else if (commentUpdates.length === 0 && categoryUpdates.length === 0) {
            // 일반 annotation 업데이트 (BBox, comment, category가 아닌 경우)
            handleUpdateAnnotations(annotations);
          }
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
