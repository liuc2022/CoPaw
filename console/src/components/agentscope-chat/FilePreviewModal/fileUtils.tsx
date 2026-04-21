import React from "react";
import {
  xlsxIcon,
  imgIcon,
  mdIcon,
  pdfIcon,
  pptIcon,
  docIcon,
  zipIcon,
  videoIcon,
  audioIcon,
} from "@/assets/icons";

export const IMG_EXTS = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];
export const VIDEO_EXTS = ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"];
export const AUDIO_EXTS = ["mp3", "wav", "flac", "ape", "aac", "ogg", "m4a"];
export const OFFICE_EXTS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
export const PDF_EXTS = ["pdf"];
export const MD_EXTS = ["md", "mdx"];
export const TEXT_EXTS = [
  "txt",
  "json",
  "xml",
  "csv",
  "log",
  "yaml",
  "yml",
  "toml",
  "ini",
  "conf",
  "config",
  "env",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "bat",
  "cmd",
];
export const HTML_EXTS = ["html", "htm", "xhtml"];
export const ARCHIVE_EXTS = ["zip", "rar", "7z", "tar", "gz"];

const DEFAULT_ICON_COLOR = "#8c8c8c";

const IconImage = ({ url, size = 24 }: { url: string; size?: number }) => (
  <img
    src={url}
    width={size}
    height={size}
    alt="file icon"
    style={{ objectFit: "contain" }}
  />
);

const PRESET_FILE_ICONS: {
  ext: string[];
  color: string;
  icon: React.ReactElement;
}[] = [
  { icon: <IconImage url={xlsxIcon} />, color: "#22b35e", ext: ["xlsx", "xls"] },
  { icon: <IconImage url={imgIcon} />, color: DEFAULT_ICON_COLOR, ext: IMG_EXTS },
  { icon: <IconImage url={mdIcon} />, color: "#52c41a", ext: [...MD_EXTS, ...TEXT_EXTS, ...HTML_EXTS] },
  { icon: <IconImage url={pdfIcon} />, color: "#ff4d4f", ext: PDF_EXTS },
  { icon: <IconImage url={pptIcon} />, color: "#ff6e31", ext: ["ppt", "pptx"] },
  { icon: <IconImage url={docIcon} />, color: "#1677ff", ext: ["doc", "docx"] },
  { icon: <IconImage url={zipIcon} />, color: "#fab714", ext: ARCHIVE_EXTS },
  { icon: <IconImage url={videoIcon} />, color: "#ff4d4f", ext: VIDEO_EXTS },
  { icon: <IconImage url={audioIcon} />, color: "#8c8c8c", ext: AUDIO_EXTS },
];

export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function matchExt(suffix: string, ext: string[]): boolean {
  const lowerSuffix = `.${suffix}`;
  return ext.some((e) => lowerSuffix.toLowerCase() === `.${e}`);
}

export type FileType =
  | "image"
  | "video"
  | "audio"
  | "office"
  | "pdf"
  | "markdown"
  | "text"
  | "html"
  | "archive"
  | "other";

export function getFileType(fileName: string): FileType {
  const ext = getFileExtension(fileName);
  if (matchExt(ext, IMG_EXTS)) return "image";
  if (matchExt(ext, VIDEO_EXTS)) return "video";
  if (matchExt(ext, AUDIO_EXTS)) return "audio";
  if (matchExt(ext, OFFICE_EXTS)) return "office";
  if (matchExt(ext, PDF_EXTS)) return "pdf";
  if (matchExt(ext, MD_EXTS)) return "markdown";
  if (matchExt(ext, HTML_EXTS)) return "html";
  if (matchExt(ext, TEXT_EXTS)) return "text";
  if (matchExt(ext, ARCHIVE_EXTS)) return "archive";
  return "other";
}

export function isOfficeFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return matchExt(ext, OFFICE_EXTS);
}

export function getOfficePreviewUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

export function getFileTypeLabel(fileType: FileType): string {
  switch (fileType) {
    case "image":
      return "图片";
    case "video":
      return "视频";
    case "audio":
      return "音频";
    case "office":
      return "Office";
    case "pdf":
      return "PDF";
    case "markdown":
      return "Markdown";
    case "text":
      return "文本";
    case "html":
      return "HTML";
    case "archive":
      return "压缩包";
    default:
      return "文件";
  }
}

export function getPreviewCapability(fileType: FileType): "full" | "partial" | "download" {
  switch (fileType) {
    case "image":
    case "video":
    case "audio":
    case "pdf":
    case "markdown":
    case "text":
    case "html":
      return "full";
    case "office":
      return "partial";
    default:
      return "download";
  }
}

export function getCapabilityLabel(fileType: FileType): string {
  const capability = getPreviewCapability(fileType);
  if (capability === "full") return "可预览";
  if (capability === "partial") return "尝试预览";
  return "仅下载";
}

export function getCapabilityColor(fileType: FileType): string {
  const capability = getPreviewCapability(fileType);
  if (capability === "full") return "#52c41a";
  if (capability === "partial") return "#faad14";
  return "#8c8c8c";
}

export function getFileIcon(fileName: string, size = 24): {
  icon: React.ReactElement;
  color: string;
} {
  const ext = getFileExtension(fileName);

  for (const { ext: extensions, color } of PRESET_FILE_ICONS) {
    if (matchExt(ext, extensions)) {
      const iconUrl = getIconUrlByExt(extensions[0]);
      return { icon: <IconImage url={iconUrl} size={size} />, color };
    }
  }

  return {
    icon: <IconImage url={zipIcon} size={size} />,
    color: DEFAULT_ICON_COLOR,
  };
}

function getIconUrlByExt(ext: string): string {
  const extToIcon: Record<string, string> = {
    xlsx: xlsxIcon,
    xls: xlsxIcon,
    png: imgIcon,
    jpg: imgIcon,
    jpeg: imgIcon,
    gif: imgIcon,
    bmp: imgIcon,
    webp: imgIcon,
    svg: imgIcon,
    md: mdIcon,
    mdx: mdIcon,
    pdf: pdfIcon,
    ppt: pptIcon,
    pptx: pptIcon,
    doc: docIcon,
    docx: docIcon,
    zip: zipIcon,
    rar: zipIcon,
    "7z": zipIcon,
    tar: zipIcon,
    gz: zipIcon,
    mp4: videoIcon,
    avi: videoIcon,
    mov: videoIcon,
    wmv: videoIcon,
    flv: videoIcon,
    mkv: videoIcon,
    webm: videoIcon,
    mp3: audioIcon,
    wav: audioIcon,
    flac: audioIcon,
    ape: audioIcon,
    aac: audioIcon,
    ogg: audioIcon,
    m4a: audioIcon,
    txt: mdIcon,
    json: mdIcon,
    xml: mdIcon,
    csv: mdIcon,
    log: mdIcon,
    yaml: mdIcon,
    yml: mdIcon,
    toml: mdIcon,
    ini: mdIcon,
    conf: mdIcon,
    config: mdIcon,
    env: mdIcon,
    sh: mdIcon,
    bash: mdIcon,
    zsh: mdIcon,
    ps1: mdIcon,
    bat: mdIcon,
    cmd: mdIcon,
    html: mdIcon,
    htm: mdIcon,
    xhtml: mdIcon,
  };
  return extToIcon[ext] || zipIcon;
}
