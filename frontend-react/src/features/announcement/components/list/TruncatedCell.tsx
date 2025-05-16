import { Tooltip } from "react-tooltip";

export default function TruncatedCell({
  content,
  maxLength = 20,
}: {
  content: string | string[] | number;
  maxLength?: number;
}) {
  const displayContent = Array.isArray(content)
    ? content.join(", ")
    : typeof content === "number"
      ? content.toString()
      : content;

  const isTruncated = displayContent.length > maxLength;
  const truncatedContent = isTruncated
    ? `${displayContent.slice(0, maxLength)}...`
    : displayContent;

  return (
    <div className="overflow-hidden">
      <span
        data-tooltip-id={isTruncated ? `tooltip-${displayContent}` : undefined}
        className="truncate block"
      >
        {truncatedContent}
      </span>
      {isTruncated && (
        <Tooltip
          id={`tooltip-${displayContent}`}
          place="top"
          content={displayContent}
          className="z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            maxWidth: "300px",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        />
      )}
    </div>
  );
}
