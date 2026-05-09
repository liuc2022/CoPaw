import { Layout, Space, Select, Switch } from "antd";
// ==================== 语言/主题切换暂时隐藏 (Kun He) ====================
// import LanguageSwitcher from "../components/LanguageSwitcher/index";
// import ThemeToggleButton from "../components/ThemeToggleButton";
// ==================== 语言/主题切换暂时隐藏结束 ====================
import styles from "./index.module.less";
import { useTheme } from "../contexts/ThemeContext";
// ==================== 品牌主题 (Kun He) ====================
import { useBrandTheme } from "../contexts/BrandThemeContext";
// ==================== 品牌主题结束 ====================
import { useState, useEffect } from "react";
import { useIframeStore } from "../stores/iframeStore";
import { instanceApi } from "../api/modules/instance";
import { DEFAULT_USER_ID } from "../constants/identity";

const { Header: AntHeader } = Layout;

const OPS_MODE_KEY = "swe-ops-mode";
const REAL_USER_ID_KEY = "swe-real-user-id";

export default function Header() {
  const { isDark } = useTheme();
  // ==================== 品牌主题 (Kun He) ====================
  // 获取动态品牌配置，用于显示正确的 logo
  const { theme: brandTheme } = useBrandTheme();
  // ==================== 品牌主题结束 ====================

  const isSuperManager = useIframeStore((state) => state.isSuperManager);
  const manager = useIframeStore((state) => state.manager);
  const userId = useIframeStore((state) => state.userId);
  const source = useIframeStore((state) => state.source);
  const setContext = useIframeStore((state) => state.setContext);
  const sourceForSwitch = source;
  const canUseOpsMode = manager || isSuperManager;

  const [opsMode, setOpsMode] = useState(
    () => sessionStorage.getItem(OPS_MODE_KEY) === "true",
  );
  const [realUserId, setRealUserId] = useState<string | null>(
    () => sessionStorage.getItem(REAL_USER_ID_KEY),
  );
  const [userList, setUserList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canUseOpsMode || !opsMode) {
      setUserList([]);
      return;
    }

    setLoading(true);
    instanceApi
      .getUsersBySource()
      .then((users) => {
        const userIds = users.map((user) => user.userId);
        if (userId && !userIds.includes(userId)) {
          setUserList([userId, ...userIds]);
          return;
        }
        setUserList(userIds);
      })
      .catch((err) => {
        console.error("[Header] Failed to fetch source users:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [canUseOpsMode, opsMode, sourceForSwitch, userId]);

  const handleOpsModeChange = (checked: boolean) => {
    if (checked) {
      const currentRealUserId = userId || DEFAULT_USER_ID;
      sessionStorage.setItem(REAL_USER_ID_KEY, currentRealUserId);
      sessionStorage.setItem(OPS_MODE_KEY, "true");
      setRealUserId(currentRealUserId);
      setOpsMode(true);
      return;
    }

    const nextUserId = realUserId || sessionStorage.getItem(REAL_USER_ID_KEY) || DEFAULT_USER_ID;
    setOpsMode(false);
    setRealUserId(null);
    sessionStorage.removeItem(OPS_MODE_KEY);
    sessionStorage.removeItem(REAL_USER_ID_KEY);
    if (userId !== nextUserId) {
      setContext({
        userId: nextUserId,
      });
      window.location.reload();
    }
  };

  const handleUserChange = (newUserId: string | undefined) => {
    const nextUserId = newUserId || realUserId || sessionStorage.getItem(REAL_USER_ID_KEY) || DEFAULT_USER_ID;
    if (newUserId && !userList.includes(newUserId)) return;

    setContext({
      userId: nextUserId,
    });

    window.location.reload();
  };

  return (
    <>
      <AntHeader className={styles.header}>
        <div className={styles.logoWrapper}>
          {/* ==================== 品牌主题 (Kun He) ==================== */}
          {/* 使用动态品牌 logo，根据 source 和明暗主题切换 */}
          <img
            src={
              isDark
                ? `${import.meta.env.BASE_URL}${brandTheme.darkLogo.replace(
                    /^\//,
                    "",
                  )}`
                : `${import.meta.env.BASE_URL}${brandTheme.logo.replace(
                    /^\//,
                    "",
                  )}`
            }
            alt={brandTheme.brandName}
            className={styles.logoImg}
          />
          {/* ==================== 品牌主题结束 ==================== */}
        </div>
        <Space size="middle">
          {/* ==================== 语言/主题切换暂时隐藏 (Kun He) ==================== */}
          {/* <LanguageSwitcher /> */}
          {/* <ThemeToggleButton /> */}
          {/* ==================== 语言/主题切换暂时隐藏结束 ==================== */}
          {canUseOpsMode && (
            <Switch
              checked={opsMode}
              checkedChildren="运维模式"
              unCheckedChildren="运维模式"
              onChange={handleOpsModeChange}
            />
          )}
          {canUseOpsMode && opsMode && (
            <Select
              allowClear
              value={userId ?? undefined}
              onChange={handleUserChange}
              loading={loading}
              showSearch
              optionFilterProp="label"
              style={{ minWidth: 180 }}
              placeholder="切换用户"
              options={userList.map((userId) => ({
                label: userId,
                value: userId,
              }))}
            />
          )}
        </Space>
      </AntHeader>
    </>
  );
}

