<template>
  <main class="oauth-home">
    <div class="oauth-home__mesh" aria-hidden="true" />

    <header class="oauth-home__header">
      <div class="brand">
        <span class="brand__mark">
          <img :src="logo" alt="" />
        </span>
        <span class="brand__name">{{ appConfig.title }}</span>
      </div>

      <div class="oauth-home__toolbar">
        <el-tooltip :content="t('login.themeToggle')" placement="bottom">
          <button class="icon-button" type="button" aria-label="切换主题">
            <ThemeSwitch />
          </button>
        </el-tooltip>
        <el-tooltip :content="t('login.languageToggle')" placement="bottom">
          <button class="icon-button" type="button" aria-label="切换语言">
            <LangSelect size="text-20px" />
          </button>
        </el-tooltip>
      </div>
    </header>

    <section class="oauth-home__content">
      <div class="hero">
        <h1>OpenSabre 管理平台</h1>
        <p class="hero__lead">统一身份认证 · 权限治理 · 组织协同</p>
        <p class="hero__copy">
          通过 OAuth2 安全认证进入系统，集中管理用户、角色、菜单权限与组织资源。
        </p>

        <div class="hero__actions">
          <el-button
            class="oauth-button"
            type="primary"
            size="large"
            :loading="checkingSession"
            @click="handleOAuthLogin"
          >
            <el-icon><Key /></el-icon>
            使用统一身份登录
          </el-button>
          <span class="hero__hint">
            <el-icon><Lock /></el-icon>
            通过 OAuth2 安全认证进入系统
          </span>
        </div>

        <div class="trust-strip" aria-label="平台能力">
          <div v-for="item in capabilityItems" :key="item.label" class="trust-strip__item">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>

      <aside class="console-preview" aria-label="管理台预览">
        <div class="console-preview__topbar">
          <span />
          <span />
          <span />
          <strong>Console</strong>
        </div>

        <div class="console-preview__body">
          <div class="console-preview__summary">
            <div>
              <span class="summary-label">今日认证</span>
              <strong>1,284</strong>
            </div>
            <div class="summary-chart" aria-hidden="true">
              <span style="height: 36%" />
              <span style="height: 58%" />
              <span style="height: 44%" />
              <span style="height: 72%" />
              <span style="height: 63%" />
            </div>
          </div>

          <div class="module-list">
            <div v-for="module in modules" :key="module.title" class="module-row">
              <span class="module-row__icon">
                <el-icon><component :is="module.icon" /></el-icon>
              </span>
              <span class="module-row__content">
                <strong>{{ module.title }}</strong>
                <small>{{ module.description }}</small>
              </span>
              <span class="module-row__status">{{ module.status }}</span>
            </div>
          </div>

          <div class="audit-panel">
            <div class="audit-panel__header">
              <strong>审计追踪</strong>
              <span>实时</span>
            </div>
            <div class="audit-line">
              <span />
              <em />
            </div>
            <div class="audit-line audit-line--short">
              <span />
              <em />
            </div>
          </div>
        </div>
      </aside>
    </section>

    <footer class="oauth-home__footer">
      <span>OpenSabre · Enterprise Administration</span>
      <span v-if="appConfig.version">v{{ appConfig.version }}</span>
    </footer>
  </main>
</template>

<script setup lang="ts">
import logo from "@/assets/images/logo.png";
import { appConfig } from "@/settings";
import ThemeSwitch from "@/components/ThemeSwitch/index.vue";
import { useUserStore } from "@/store";
import { AuthStorage } from "@/utils/auth";
import { OAuth2_CONFIG } from "@/api/auth";
import {
  Key,
  Lock,
  User,
  Menu,
  Connection,
  Operation,
  SetUp,
  Tickets,
} from "@element-plus/icons-vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const checkingSession = ref(true);

const capabilityItems = [
  { label: "统一认证", icon: Lock },
  { label: "角色权限", icon: Operation },
  { label: "组织协同", icon: Connection },
];

const modules = [
  { title: "用户管理", description: "账户、状态与组织归属", status: "Ready", icon: User },
  { title: "菜单权限", description: "动态路由与可见范围", status: "Synced", icon: Menu },
  { title: "组织角色", description: "角色授权与资源绑定", status: "Active", icon: SetUp },
  { title: "审计追踪", description: "登录记录与关键操作", status: "Live", icon: Tickets },
];

function handleOAuthLogin() {
  window.location.href = OAuth2_CONFIG.authorizeUrl;
}

onMounted(async () => {
  const hasToken = AuthStorage.getAccessToken();
  if (!hasToken) {
    checkingSession.value = false;
    return;
  }

  try {
    await userStore.getUserInfo();

    const redirectPath = (route.query.redirect as string) || "/";
    await router.push(decodeURIComponent(redirectPath));
  } catch {
    AuthStorage.clearAuth();
  } finally {
    checkingSession.value = false;
  }
});
</script>

<style lang="scss" scoped>
.oauth-home {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 28px clamp(22px, 4vw, 64px);
  overflow: hidden;
  color: #0f172a;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 250, 255, 0.92)),
    radial-gradient(circle at 88% 14%, rgba(34, 211, 238, 0.14), transparent 30%), #f8fbff;

  &::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: "";
    background-image:
      linear-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15, 23, 42, 0.045) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.75), transparent 72%);
  }
}

.oauth-home__mesh {
  position: absolute;
  inset: auto -12% -26% 36%;
  height: 54%;
  pointer-events: none;
  background:
    radial-gradient(circle at 32% 40%, rgba(14, 165, 233, 0.15), transparent 32%),
    radial-gradient(circle at 72% 48%, rgba(16, 185, 129, 0.16), transparent 28%);
  filter: blur(16px);
}

.oauth-home__header,
.oauth-home__content,
.oauth-home__footer {
  position: relative;
  z-index: 1;
}

.oauth-home__header {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);

  img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }
}

.brand__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.oauth-home__toolbar {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: #334155;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;

  &:hover {
    color: #0369a1;
    background: rgba(14, 165, 233, 0.1);
  }
}

.oauth-home__content {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 0.92fr) minmax(420px, 0.78fr);
  gap: clamp(36px, 6vw, 92px);
  align-items: center;
  width: min(1180px, 100%);
  padding: clamp(44px, 8vh, 92px) 0 36px;
  margin: 0 auto;
}

.hero {
  max-width: 620px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(42px, 5.8vw, 76px);
  font-weight: 800;
  line-height: 1.03;
  color: #07111f;
  letter-spacing: 0;
}

.hero__lead {
  margin: 22px 0 0;
  font-size: clamp(21px, 2.2vw, 30px);
  font-weight: 700;
  line-height: 1.35;
  color: #0f766e;
}

.hero__copy {
  max-width: 560px;
  margin: 18px 0 0;
  font-size: 16px;
  line-height: 1.9;
  color: #475569;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-top: 34px;
}

.oauth-button {
  height: 48px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #0284c7, #0f766e);
  border: 0;
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(14, 116, 144, 0.24);

  :deep(.el-icon) {
    margin-right: 8px;
    font-size: 18px;
  }
}

.hero__hint {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  line-height: 1.4;
  color: #64748b;
}

.trust-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 42px;
}

.trust-strip__item {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  height: 38px;
  padding: 0 13px;
  font-size: 13px;
  font-weight: 650;
  color: #334155;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;

  .el-icon {
    color: #0891b2;
  }
}

.console-preview {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  box-shadow:
    0 28px 80px rgba(15, 23, 42, 0.16),
    0 1px 0 rgba(255, 255, 255, 0.8) inset;
  backdrop-filter: blur(16px);
}

.console-preview__topbar {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 50px;
  padding: 0 18px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);

  span {
    width: 9px;
    height: 9px;
    background: #cbd5e1;
    border-radius: 50%;
  }

  strong {
    margin-left: 8px;
    font-size: 13px;
    color: #475569;
  }
}

.console-preview__body {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.console-preview__summary,
.audit-panel {
  padding: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
}

.console-preview__summary {
  display: flex;
  gap: 18px;
  align-items: end;
  justify-content: space-between;

  strong {
    display: block;
    margin-top: 8px;
    font-size: 34px;
    line-height: 1;
    color: #0f172a;
  }
}

.summary-label {
  font-size: 13px;
  font-weight: 650;
  color: #64748b;
}

.summary-chart {
  display: flex;
  gap: 7px;
  align-items: end;
  width: 128px;
  height: 68px;

  span {
    flex: 1;
    background: linear-gradient(180deg, #22d3ee, #0f766e);
    border-radius: 6px 6px 2px 2px;
  }
}

.module-list {
  display: grid;
  gap: 10px;
}

.module-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 8px;
}

.module-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #0369a1;
  background: #e0f2fe;
  border-radius: 8px;
}

.module-row__content {
  display: grid;
  gap: 4px;
  min-width: 0;

  strong {
    font-size: 14px;
    color: #0f172a;
  }

  small {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: #64748b;
    white-space: nowrap;
  }
}

.module-row__status {
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #047857;
  background: #d1fae5;
  border-radius: 6px;
}

.audit-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  strong {
    font-size: 14px;
    color: #0f172a;
  }

  span {
    font-size: 12px;
    color: #0891b2;
  }
}

.audit-line {
  display: grid;
  grid-template-columns: 9px 1fr;
  gap: 10px;
  align-items: center;
  margin-top: 10px;

  span {
    width: 9px;
    height: 9px;
    background: #10b981;
    border-radius: 50%;
  }

  em {
    height: 8px;
    background: linear-gradient(90deg, #cbd5e1, rgba(203, 213, 225, 0));
    border-radius: 999px;
  }
}

.audit-line--short em {
  width: 72%;
}

.oauth-home__footer {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding-top: 18px;
  font-size: 12px;
  color: #64748b;
}

:global(.dark) .oauth-home {
  color: #e5edf8;
  background:
    linear-gradient(180deg, rgba(5, 13, 24, 0.94), rgba(10, 20, 36, 0.96)),
    radial-gradient(circle at 84% 14%, rgba(34, 211, 238, 0.16), transparent 30%), #07111f;

  &::before {
    background-image:
      linear-gradient(rgba(226, 232, 240, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(226, 232, 240, 0.06) 1px, transparent 1px);
  }
}

:global(.dark) {
  .brand__mark,
  .oauth-home__toolbar,
  .console-preview,
  .console-preview__summary,
  .audit-panel {
    background: rgba(15, 23, 42, 0.82);
    border-color: rgba(148, 163, 184, 0.18);
  }

  .brand__name,
  .hero h1,
  .console-preview__summary strong,
  .module-row__content strong,
  .audit-panel__header strong {
    color: #f8fafc;
  }

  .hero__copy,
  .hero__hint,
  .oauth-home__footer,
  .module-row__content small,
  .summary-label {
    color: #94a3b8;
  }

  .console-preview__topbar,
  .module-row {
    background: rgba(15, 23, 42, 0.72);
    border-color: rgba(148, 163, 184, 0.14);
  }

  .trust-strip__item {
    color: #cbd5e1;
    background: rgba(15, 23, 42, 0.72);
    border-color: rgba(148, 163, 184, 0.16);
  }
}

@media (max-width: 980px) {
  .oauth-home {
    min-height: auto;
    overflow-y: auto;
  }

  .oauth-home__content {
    grid-template-columns: 1fr;
    gap: 34px;
    padding-top: 48px;
  }

  .hero {
    max-width: none;
  }

  .console-preview {
    max-width: 620px;
  }
}

@media (max-width: 640px) {
  .oauth-home {
    padding: 18px;
  }

  .brand__name {
    max-width: 180px;
  }

  .oauth-home__content {
    padding-top: 42px;
  }

  .hero h1 {
    font-size: 42px;
  }

  .hero__actions,
  .oauth-button {
    width: 100%;
  }

  .hero__hint {
    width: 100%;
  }

  .console-preview__summary,
  .module-row {
    grid-template-columns: 1fr;
  }

  .console-preview__summary {
    align-items: stretch;
  }

  .summary-chart {
    width: 100%;
  }

  .module-row__status {
    width: fit-content;
  }

  .oauth-home__footer {
    flex-direction: column;
  }
}
</style>
