import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Image, message, Tooltip, Spin, Tabs, Segmented, Tag } from "antd";
import {
  FullscreenOutlined,
  LinkOutlined,
  EyeOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import {
  SparkFalseLine,
  SparkDownloadLine,
  SparkCopyLine,
  SparkTrueLine,
} from "@agentscope-ai/icons";
import { IconButton } from "@agentscope-ai/design";
import { Markdown } from "@/components/agentscope-chat";
import {
  getCapabilityLabel,
  getFileExtension,
  getFileIcon,
  getFileType,
  getFileTypeLabel,
  getOfficePreviewUrl,
} from "./fileUtils";

export interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const textPreviewStyle: React.CSSProperties = {
  width: "100%",
  maxHeight: "400px",
  overflow: "auto",
  backgroundColor: "#f5f5f5",
  borderRadius: "8px",
  padding: "12px",
  fontFamily: "monospace",
  fontSize: "12px",
  lineHeight: "1.5",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const previewContainerStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fallbackWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  textAlign: "center",
  gap: "12px",
};

type ViewMode = "preview" | "source";
type DeviceMode = "desktop" | "tablet" | "mobile";

function escapeHtmlAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function ensureViewportMeta(html: string): string {
  if (/<meta\s+name=["']viewport["']/i.test(html)) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(
      /<head([^>]*)>/i,
      `<head$1><meta name="viewport" content="width=device-width, initial-scale=1" />`,
    );
  }

  return `<head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>${html}`;
}

function injectBaseTag(html: string, fileUrl: string): string {
  const baseHref = new URL(".", fileUrl).href;
  const baseTag = `<base href="${escapeHtmlAttr(baseHref)}" />`;

  if (/<base\s/i.test(html)) return html;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }

  return `<head>${baseTag}</head>${html}`;
}

function injectPreviewStyle(html: string): string {
  const styleTag = `
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }
  body {
    box-sizing: border-box;
  }
  img, video, iframe, canvas, svg {
    max-width: 100%;
  }
  table {
    border-collapse: collapse;
    max-width: 100%;
  }
</style>`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${styleTag}`);
  }

  return `<head>${styleTag}</head>${html}`;
}

function buildPreviewHtml(html: string, fileUrl: string): string {
  let next = html;

  if (!/<html[\s>]/i.test(next)) {
    next = `<!doctype html><html><body>${next}</body></html>`;
  }

  next = ensureViewportMeta(next);
  next = injectBaseTag(next, fileUrl);
  next = injectPreviewStyle(next);

  return next;
}

function formatStructuredText(text: string, fileName: string): string {
  const ext = getFileExtension(fileName);
  if (ext === "json") {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }
  return text;
}

function getDeviceWidth(deviceMode: DeviceMode): string {
  switch (deviceMode) {
    case "tablet":
      return "768px";
    case "mobile":
      return "390px";
    default:
      return "100%";
  }
}

function FilePreviewModal(props: FilePreviewModalProps) {
  const { open, onClose, fileUrl, fileName } = props;
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [htmlError, setHtmlError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");

  const fileType = useMemo(() => getFileType(fileName), [fileName]);
  const fileTypeLabel = useMemo(() => getFileTypeLabel(fileType), [fileType]);
  const capabilityLabel = useMemo(() => getCapabilityLabel(fileType), [fileType]);
  const { icon, color } = useMemo(() => getFileIcon(fileName, 48), [fileName]);

  useEffect(() => {
    if (!open || !(fileType === "text" || fileType === "markdown") || !fileUrl) {
      setTextContent(null);
      setTextError(null);
      setTextLoading(false);
      return;
    }

    let cancelled = false;

    setTextLoading(true);
    setTextError(null);
    setTextContent(null);

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error("加载失败");
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const maxLength = 50000;
        const formatted = formatStructuredText(text, fileName);
        setTextContent(
          formatted.length > maxLength
            ? `${formatted.slice(0, maxLength)}\n\n... (内容过长，已截断)`
            : formatted,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setTextError("文件暂时无法预览");
      })
      .finally(() => {
        if (!cancelled) setTextLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, fileType, fileUrl, fileName]);

  useEffect(() => {
    if (!open || fileType !== "html" || !fileUrl) {
      setHtmlContent(null);
      setHtmlError(null);
      setHtmlLoading(false);
      setViewMode("preview");
      setDeviceMode("desktop");
      return;
    }

    let cancelled = false;

    setHtmlLoading(true);
    setHtmlError(null);
    setHtmlContent(null);
    setViewMode("preview");
    setDeviceMode("desktop");

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error("加载失败");
        return res.text();
      })
      .then((html) => {
        if (cancelled) return;
        const maxLength = 200000;
        setHtmlContent(
          html.length > maxLength
            ? `${html.slice(0, maxLength)}\n<!-- 内容过长，已截断 -->`
            : html,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setHtmlError("HTML 文件暂时无法预览");
        setViewMode("source");
      })
      .finally(() => {
        if (!cancelled) setHtmlLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, fileType, fileUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fileUrl);
      message.success("链接已复制");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error("复制失败");
    }
  }, [fileUrl]);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, fileName]);

  const handleOpenNewTab = useCallback(() => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }, [fileUrl]);

  const handleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev);
  }, []);

  const previewHeight = fullscreen ? "85vh" : "500px";
  const htmlPreviewWidth = useMemo(() => getDeviceWidth(deviceMode), [deviceMode]);
  const htmlPreviewDoc = useMemo(
    () => (htmlContent ? buildPreviewHtml(htmlContent, fileUrl) : ""),
    [htmlContent, fileUrl],
  );

  const renderTextFallback = useCallback(
    (messageText: string) => (
      <div style={fallbackWrapStyle}>
        <div style={{ color: "#8c8c8c", fontSize: 14 }}>{messageText}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <IconButton icon={<SparkDownloadLine />} onClick={handleDownload}>
            下载文件
          </IconButton>
          <IconButton icon={<LinkOutlined />} onClick={handleOpenNewTab}>
            新窗口打开
          </IconButton>
        </div>
      </div>
    ),
    [handleDownload, handleOpenNewTab],
  );

  const renderSourceView = useCallback(
    (content: string) => (
      <div style={{ ...textPreviewStyle, maxHeight: previewHeight }}>
        <code>{content}</code>
      </div>
    ),
    [previewHeight],
  );

  const renderPreviewContent = useMemo(() => {
    if (fileType === "image") {
      return (
        <div style={previewContainerStyle}>
          <Image
            src={fileUrl}
            alt={fileName}
            style={{ maxWidth: "100%", maxHeight: previewHeight, objectFit: "contain" }}
          />
        </div>
      );
    }

    if (fileType === "video") {
      return (
        <div style={previewContainerStyle}>
          <video
            controls
            style={{ maxWidth: "100%", maxHeight: previewHeight, borderRadius: 8 }}
            src={fileUrl}
          >
            <source src={fileUrl} />
          </video>
        </div>
      );
    }

    if (fileType === "audio") {
      return (
        <div style={{ ...previewContainerStyle, padding: "20px 0" }}>
          <audio controls style={{ width: "100%" }} src={fileUrl}>
            <source src={fileUrl} />
          </audio>
        </div>
      );
    }

    if (fileType === "office") {
      const previewUrl = getOfficePreviewUrl(fileUrl);
      return (
        <div style={{ width: "100%", height: previewHeight }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <Tag color="warning" bordered={false}>
              在线预览依赖外部服务，失败时请下载查看
            </Tag>
          </div>
          <iframe
            src={previewUrl}
            style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }}
            title="Office Preview"
          />
        </div>
      );
    }

    if (fileType === "pdf") {
      return (
        <div style={{ width: "100%", height: previewHeight }}>
          <Tabs
            items={[
              {
                key: "preview",
                label: "预览",
                children: (
                  <iframe
                    src={fileUrl}
                    style={{ width: "100%", height: previewHeight, border: "none", borderRadius: 8 }}
                    title="PDF Preview"
                  />
                ),
              },
              {
                key: "actions",
                label: "操作",
                children: renderTextFallback("如果当前浏览器无法预览 PDF，可在新窗口打开或直接下载"),
              },
            ]}
          />
        </div>
      );
    }

    if (fileType === "html") {
      if (htmlLoading) {
        return <Spin tip="加载 HTML 中..." />;
      }

      if (htmlError) {
        return renderTextFallback(htmlError);
      }

      return (
        <Tabs
          activeKey={viewMode}
          onChange={(key) => setViewMode(key as ViewMode)}
          items={[
            {
              key: "preview",
              label: (
                <span>
                  <EyeOutlined /> 页面预览
                </span>
              ),
              children: (
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <Segmented<DeviceMode>
                      value={deviceMode}
                      onChange={(value) => setDeviceMode(value)}
                      options={[
                        { label: "桌面", value: "desktop" },
                        { label: "平板", value: "tablet" },
                        { label: "手机", value: "mobile" },
                      ]}
                    />
                  </div>
                  <div style={{ ...previewContainerStyle, height: previewHeight }}>
                    <div
                      style={{
                        width: htmlPreviewWidth,
                        height: "100%",
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        overflow: "hidden",
                        transition: "width 0.2s ease",
                        background: "#fff",
                      }}
                    >
                      <iframe
                        srcDoc={htmlPreviewDoc}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        title="HTML Preview"
                      />
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "source",
              label: (
                <span>
                  <CodeOutlined /> 源码
                </span>
              ),
              children: renderSourceView(htmlContent || ""),
            },
          ]}
        />
      );
    }

    if (fileType === "markdown") {
      if (textLoading) return <Spin tip="加载中..." />;
      if (textError) return renderTextFallback("Markdown 文件暂时无法预览，请尝试下载查看");
      if (!textContent) return null;

      return (
        <Tabs
          activeKey={viewMode}
          onChange={(key) => setViewMode(key as ViewMode)}
          items={[
            {
              key: "preview",
              label: "渲染预览",
              children: (
                <div style={{ width: "100%", maxHeight: previewHeight, overflow: "auto", padding: "12px" }}>
                  <Markdown content={textContent} allowHtml />
                </div>
              ),
            },
            {
              key: "source",
              label: "源码",
              children: renderSourceView(textContent),
            },
          ]}
        />
      );
    }

    if (fileType === "text") {
      if (textLoading) return <Spin tip="加载中..." />;
      if (textError) return renderTextFallback("文本文件暂时无法预览，请尝试下载查看");
      if (!textContent) return null;

      const ext = getFileExtension(fileName);
      const previewTabLabel = ext === "csv" ? "文本预览" : "内容预览";

      return (
        <Tabs
          activeKey={viewMode}
          onChange={(key) => setViewMode(key as ViewMode)}
          items={[
            {
              key: "preview",
              label: previewTabLabel,
              children:
                ext === "csv" ? (
                  <div style={{ maxHeight: previewHeight, overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
                      <tbody>
                        {textContent.split(/\r?\n/).filter(Boolean).slice(0, 50).map((line, index) => (
                          <tr key={`${line}-${index}`}>
                            {line.split(",").map((cell, cellIndex) => (
                              <td
                                key={`${cell}-${cellIndex}`}
                                style={{ border: "1px solid #f0f0f0", padding: "8px 10px", fontSize: 12 }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  renderSourceView(textContent)
                ),
            },
            {
              key: "source",
              label: "源码",
              children: renderSourceView(textContent),
            },
          ]}
        />
      );
    }

    if (fileType === "archive") {
      return renderTextFallback("压缩文件暂不支持在线预览，可直接下载后查看内容");
    }

    return (
      <div style={fallbackWrapStyle}>
        <div style={{ color, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontSize: 16, fontWeight: 500, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName}
        </div>
        <div style={{ fontSize: 12, color: "#8c8c8c" }}>
          文件类型: {fileName.split(".").pop()?.toUpperCase() || "未知"}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <IconButton icon={<SparkDownloadLine />} onClick={handleDownload}>
            下载文件
          </IconButton>
          <IconButton icon={<LinkOutlined />} onClick={handleOpenNewTab}>
            新窗口打开
          </IconButton>
        </div>
      </div>
    );
  }, [
    color,
    deviceMode,
    fileName,
    fileType,
    fileTypeLabel,
    fileUrl,
    handleDownload,
    handleOpenNewTab,
    htmlContent,
    htmlError,
    htmlLoading,
    htmlPreviewDoc,
    htmlPreviewWidth,
    icon,
    previewHeight,
    renderSourceView,
    renderTextFallback,
    textContent,
    textError,
    textLoading,
    viewMode,
  ]);

  const headerActions = useMemo(() => {
    const actions = [
      <Tooltip key="open" title="新窗口打开">
        <IconButton
          size="small"
          icon={<LinkOutlined />}
          onClick={handleOpenNewTab}
          bordered={false}
        />
      </Tooltip>,
      <Tooltip key="copy" title="复制链接">
        <IconButton
          size="small"
          icon={copied ? <SparkTrueLine style={{ color: "#52c41a" }} /> : <SparkCopyLine />}
          onClick={handleCopy}
          bordered={false}
        />
      </Tooltip>,
      <Tooltip key="download" title="下载文件">
        <IconButton
          size="small"
          icon={<SparkDownloadLine />}
          onClick={handleDownload}
          bordered={false}
        />
      </Tooltip>,
    ];

    const previewableTypes = ["image", "video", "audio", "office", "pdf", "markdown", "text", "html"];
    if (previewableTypes.includes(fileType)) {
      actions.unshift(
        <Tooltip key="fullscreen" title={fullscreen ? "退出全屏" : "全屏预览"}>
          <IconButton
            size="small"
            icon={<FullscreenOutlined />}
            onClick={handleFullscreen}
            bordered={false}
          />
        </Tooltip>,
      );
    }

    return actions;
  }, [fileType, handleCopy, handleDownload, handleFullscreen, handleOpenNewTab, copied, fullscreen]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={fullscreen ? "95vw" : 860}
      centered
      closeIcon={<IconButton size="small" icon={<SparkFalseLine />} bordered={false} />}
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                maxWidth: fullscreen ? "50vw" : "320px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fileName}
            </span>
            <Tag bordered={false} color="default" style={{ marginInlineEnd: 0 }}>
              {fileTypeLabel}
            </Tag>
            <Tag bordered={false} color="processing" style={{ marginInlineEnd: 0 }}>
              {capabilityLabel}
            </Tag>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 32 }}>
            {headerActions}
          </div>
        </div>
      }
      styles={{
        content: { padding: "16px 24px" },
        body: { padding: "16px 0" },
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: fullscreen ? "85vh" : "220px" }}>
        {renderPreviewContent}
      </div>
    </Modal>
  );
}

export default FilePreviewModal;
