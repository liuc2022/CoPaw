import React, { useMemo, useState } from "react";
import { SparkCopyLine, SparkDownloadLine, SparkLinkLine } from "@agentscope-ai/icons";
import { message, Tooltip, Tag } from "antd";
import FilePreviewModal from "../FilePreviewModal";
import {
  getCapabilityColor,
  getCapabilityLabel,
  getFileIcon,
  getFileType,
  getFileTypeLabel,
} from "../FilePreviewModal/fileUtils";

export interface DownloadFileCardProps {
  url: string;
  fileName?: string;
  className?: string;
  style?: React.CSSProperties;
}

const EMPTY = "\u00A0";

const cardStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px",
  background: "#fff",
  border: "1px solid #d9d9d9",
  borderRadius: 12,
  cursor: "pointer",
  transition: "all 0.2s ease",
  maxWidth: 360,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const iconStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  flexShrink: 0,
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const nameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "#262626",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
  flexWrap: "wrap",
};

const actionBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
};

const actionButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  background: "#f5f5f5",
  borderRadius: 6,
  color: "#595959",
  cursor: "pointer",
  border: "1px solid #f0f0f0",
};

function extractFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/");
    return parts[parts.length - 1] || "未知文件";
  } catch {
    return "未知文件";
  }
}

function DownloadFileCard(props: DownloadFileCardProps) {
  const { url, fileName: propFileName, className, style } = props;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const fileName = useMemo(
    () => propFileName || extractFileName(url),
    [url, propFileName],
  );

  const { icon } = useMemo(() => getFileIcon(fileName, 28), [fileName]);
  const fileType = useMemo(() => getFileType(fileName), [fileName]);
  const fileTypeLabel = useMemo(() => getFileTypeLabel(fileType), [fileType]);
  const capabilityLabel = useMemo(() => getCapabilityLabel(fileType), [fileType]);
  const capabilityColor = useMemo(() => getCapabilityColor(fileType), [fileType]);

  const [namePrefix, nameSuffix] = useMemo(() => {
    const match = fileName.match(/^(.*)\.[^.]+$/);
    return match ? [match[1], fileName.slice(match[1].length)] : [fileName, ""];
  }, [fileName]);

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      message.success("链接已复制");
    } catch {
      message.error("复制失败");
    }
  };

  const handleOpenNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const mergedCardStyle = {
    ...cardStyle,
    borderColor: hovered ? "#91caff" : "#d9d9d9",
    boxShadow: hovered ? "0 4px 12px rgba(22,119,255,0.12)" : cardStyle.boxShadow,
    ...style,
  };

  return (
    <>
      <div
        className={className}
        style={mergedCardStyle}
        onClick={handlePreview}
        role="button"
        tabIndex={0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handlePreview();
          }
        }}
      >
        <div style={iconStyle}>{icon}</div>
        <div style={contentStyle}>
          <Tooltip title={fileName}>
            <div style={nameStyle}>
              {namePrefix || EMPTY}
              {nameSuffix}
            </div>
          </Tooltip>
          <div style={metaRowStyle}>
            <Tag bordered={false} color="default" style={{ marginInlineEnd: 0 }}>
              {fileTypeLabel}
            </Tag>
            <Tag
              bordered={false}
              color={capabilityColor === "#52c41a" ? "success" : capabilityColor === "#faad14" ? "warning" : "default"}
              style={{ marginInlineEnd: 0 }}
            >
              {capabilityLabel}
            </Tag>
          </div>
        </div>
        <div style={actionBarStyle} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="复制链接">
            <div style={actionButtonStyle} onClick={handleCopy}>
              <SparkCopyLine style={{ fontSize: 14 }} />
            </div>
          </Tooltip>
          <Tooltip title="新窗口打开">
            <div style={actionButtonStyle} onClick={handleOpenNewTab}>
              <SparkLinkLine style={{ fontSize: 14 }} />
            </div>
          </Tooltip>
          <Tooltip title="下载文件">
            <div style={actionButtonStyle} onClick={handleDownload}>
              <SparkDownloadLine style={{ fontSize: 14, color: "#1677ff" }} />
            </div>
          </Tooltip>
        </div>
      </div>
      <FilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fileUrl={url}
        fileName={fileName}
      />
    </>
  );
}

export default DownloadFileCard;
