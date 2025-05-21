import { useParams } from "react-router-dom";
import { useDeleteCondition } from "../api/delete";
import ConfirmAlert from "../../../shared/components/Confirm/ConfirmAlert";
import { useConfirm } from "../../../shared/components/Confirm/useConfirm";
import { Condition } from "../../announcement/api/getAnnouncement";

interface Props {
  condition: Condition;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export default function ConditionOptions({ condition, iframeRef }: Props) {
  const params = useParams();
  const { mutate: deleteCondition } = useDeleteCondition(params.id!);
  const { openConfirmAlert, alertState, closeConfirmAlert, handleConfirm } =
    useConfirm();

  const handleDeleteCondition = (conditionId: string) => {
    openConfirmAlert(
      "정말 이 항목을 삭제하시겠습니까?",
      () => {
        deleteCondition(conditionId);
      },
      "삭제",
    );
  };

  const handleHighlightClick = (
    bbox: { x: number; y: number; width: number; height: number },
    pageNumber: number,
  ) => {
    const innerFrame =
      iframeRef?.current?.contentWindow?.document?.querySelector("iframe");
    if (!innerFrame) return;
    const innerFrameWindow = innerFrame.contentWindow;

    const pageWidth = 595;
    const pageHeight = 840;

    const { x, y, width, height } = bbox;
    // 좌측 하단 기준의 좌표를 좌측 상단 기준으로 변환
    const top = ((pageHeight - height) / pageHeight) * 100;
    const left = (x / pageWidth) * 100;
    const widthPercent = ((width - x) / pageWidth) * 100;
    const heightPercent = ((height - y) / pageHeight) * 100;

    const pageElement = innerFrameWindow?.document?.querySelector(
      `.page[data-page-number="${pageNumber}"]`,
    );
    if (!pageElement) return;

    // 기존 하이라이트 제거
    const existingHighlights =
      pageElement.querySelectorAll(".highlight-overlay");
    existingHighlights.forEach((el) => el.remove());

    // 새로운 하이라이트 추가
    const highlightLayer = document.createElement("div");
    highlightLayer.id = "highlight-layer";
    highlightLayer.style.position = "absolute";
    highlightLayer.style.left = `${left}%`;
    highlightLayer.style.top = `${top}%`;
    highlightLayer.style.width = `${widthPercent}%`;
    highlightLayer.style.height = `${heightPercent}%`;
    highlightLayer.style.backgroundColor = "rgba(255, 255, 0, 0.3)";
    highlightLayer.classList.add("highlight-overlay");
    pageElement.appendChild(highlightLayer);

    // 3초 후 하이라이트 제거
    setTimeout(() => {
      highlightLayer.remove();
    }, 3000);

    // 해당 페이지로 스크롤
    pageElement.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <div
        className="flex items-center self-start gap-1"
        style={{ minHeight: "32px" }}
      >
        {/* PDF 위치 찾기 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleHighlightClick(condition.bbox, condition.page);
          }}
          // className={
          //   (conditionHovered[index]
          //     ? "opacity-100 pointer-events-auto"
          //     : "opacity-0 pointer-events-none") +
          //   " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-blue-200 bg-blue-500/20 rounded-md hover:bg-blue-500/30"
          // }
          title="PDF에서 해당 내용의 위치 찾기"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="10"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* 메모 보기/수정 */}
        {/* <button
        onClick={(e) => {
          e.stopPropagation();
          if (openConditionMemo !== conditionKey) {
            setOpenConditionMemo(conditionKey);
          } else {
            setOpenConditionMemo(null);
          }
        }}
        className={
          (conditionHovered[index]
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none") +
          " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-green-200 bg-green-500/20 rounded-md hover:bg-green-500/30"
        }
        title="컨디션에 메모 추가/수정하기"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button> */}
        {/* 컨디션 삭제 버튼 */}
        <button
          onClick={() => handleDeleteCondition(condition.id)}
          // className={
          //   (conditionHovered[index]
          //     ? "opacity-100 pointer-events-auto"
          //     : "opacity-0 pointer-events-none") +
          //   " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-red-200 bg-red-500/20 rounded-md hover:bg-red-500/30"
          // }
          title="이 컨디션 항목 삭제하기"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11V17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11V17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 7H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 7L9 3H15L17 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* 커스텀 알럿 컴포넌트 */}
      </div>
      <ConfirmAlert
        isOpen={alertState.isOpen}
        message={alertState.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirmAlert}
        buttonLabel={alertState.buttonLabel || "삭제"}
      />
    </>
  );
}
