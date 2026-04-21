import React from "react";
import { useProviderContext } from "@/components/agentscope-chat";
import DownloadFileCard from "@/components/agentscope-chat/DownloadFileCard";
import { getFileType } from "@/components/agentscope-chat/FilePreviewModal/fileUtils";

function getPlainText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    return children.map((child) => getPlainText(child)).join("");
  }
  if (React.isValidElement(children)) {
    return getPlainText(children.props.children);
  }
  return "";
}

function resolveLinkHref(href?: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, window.location.href).href;
  } catch {
    return null;
  }
}

function shouldRenderFileCard(href?: string, text?: string): boolean {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  const resolvedHref = resolveLinkHref(href);
  if (!resolvedHref) return false;

  let pathname = "";
  try {
    pathname = new URL(resolvedHref).pathname;
  } catch {
    return false;
  }

  if (getFileType(pathname) !== "other") {
    return true;
  }

  if (/\/(static|files\/preview)\//.test(pathname)) {
    return true;
  }

  const normalizedText = (text || "").trim().toLowerCase();
  return ["download", "附件", "下载", "预览附件", "查看附件"].includes(normalizedText);
}

export default function Link(props) {
  if (props["data-footnote-ref"] === "") return <Sup {...props} />;
  if (props.children === "↩" && props["data-footnote-backref"] === "") {
    return null;
  }

  const href = typeof props.href === "string" ? props.href : undefined;
  const resolvedHref = resolveLinkHref(href);
  const linkText = getPlainText(props.children).trim();

  if (resolvedHref && shouldRenderFileCard(href, linkText)) {
    return (
      <div style={{ display: "block", width: "100%", margin: "12px 0" }}>
        <DownloadFileCard
          url={resolvedHref}
          fileName={linkText && linkText !== href ? linkText : undefined}
        />
      </div>
    );
  }

  if (resolvedHref && resolvedHref !== href) {
    return <a {...props} href={resolvedHref} />;
  }

  return <a {...props} />;
}

function Sup(props) {
  const { getPrefixCls } = useProviderContext();
  const prefixCls = getPrefixCls("markdown-footnote");
  const { href, ...rest } = props;

  return (
    <a
      {...rest}
      className={prefixCls}
      onClick={() => {
        try {
          const [x, y, id] = props.id.split("-");
          const url = document
            .querySelector(`#footnote-${id}`)
            .querySelector("a")
            .getAttribute("href");
          window.open(url, "_blank");
        } catch (error) {}
      }}
    />
  );
}
