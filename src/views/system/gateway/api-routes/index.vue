<template>
  <div class="app-container">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">API 资产与发布状态</span>
          <div class="flex items-center gap-2">
            <el-button type="success" :loading="syncing" @click="syncApis">同步 OpenAPI</el-button>
            <el-button
              type="warning"
              :loading="publishing"
              :disabled="pendingDraftCount === 0"
              @click="publishDrafts"
            >
              发布到网关
              <span v-if="pendingDraftCount">（{{ pendingDraftCount }}）</span>
            </el-button>
            <el-button type="primary" :loading="loading" @click="loadAll">刷新</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="API 资产" name="apis">
          <el-form :inline="true" class="mb-3">
            <el-form-item label="服务名">
              <el-select
                v-model="serviceId"
                clearable
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入服务名"
                class="w-64"
              >
                <el-option
                  v-for="service in services"
                  :key="service.name"
                  :label="service.name"
                  :value="service.name"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button :loading="loading" @click="handleApiSearch">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="loading" :data="apis" border row-key="id">
            <el-table-column prop="serviceId" label="服务名" min-width="160" />
            <el-table-column prop="httpMethod" label="方法" width="100" />
            <el-table-column prop="upstreamPath" label="接口路径" min-width="250" />
            <el-table-column prop="operationId" label="Operation ID" min-width="180" />
            <el-table-column prop="summary" label="说明" min-width="220" show-overflow-tooltip />
            <el-table-column label="发现状态" width="110">
              <template #default="{ row }">
                <DictTag
                  v-model="row.discoveryStatus"
                  code="gateway_api_discovery_status"
                  fallback="未知"
                />
              </template>
            </el-table-column>
            <el-table-column label="发布状态" width="130">
              <template #default="{ row }">
                <DictTag
                  v-if="publicationByApi.get(row.id)"
                  :model-value="publicationByApi.get(row.id)?.status"
                  code="gateway_publication_status"
                />
                <el-tag v-else type="info">未发布</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openPublicationDialog(row)">
                  {{ publicationByApi.get(row.id) ? "编辑发布" : "发布 API" }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="mt-4 flex justify-end">
            <el-pagination
              v-model:current-page="apiPagination.page"
              v-model:page-size="apiPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="apiPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleApiPageSizeChange"
              @current-change="loadApis"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="API 发布记录" name="publications">
          <el-table v-loading="loading" :data="publications" border row-key="id">
            <el-table-column label="API" min-width="220">
              <template #default="{ row }">
                <div class="font-medium">{{ row.apiSummary || row.operationId || row.apiId }}</div>
                <div class="text-xs text-gray-500">{{ row.serviceId || "未知服务" }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="httpMethod" label="方法" width="90" />
            <el-table-column prop="externalPath" label="对外路径" min-width="220" />
            <el-table-column prop="upstreamPath" label="内部路径" min-width="220" />
            <el-table-column label="访问控制" width="140">
              <template #default="{ row }">{{ authModeLabel(row.authMode) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <DictTag v-model="row.status" code="gateway_publication_status" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openPublicationDetail(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="应用级路由" name="application-routes">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm text-gray-500">
              原路由管理已合并到此处，统一按应用级路由草稿发布
            </span>
            <el-button type="success" icon="plus" @click="openApplicationRouteDialog()">
              新增应用路由
            </el-button>
          </div>
          <el-table v-loading="loading" :data="applicationRoutes" border row-key="id">
            <el-table-column prop="serviceId" label="服务名" min-width="160" />
            <el-table-column prop="routeName" label="路由名称" min-width="170" />
            <el-table-column prop="externalPath" label="外部路径" min-width="230" />
            <el-table-column prop="targetUri" label="目标 URI" min-width="230" />
            <el-table-column prop="httpMethod" label="方法" width="100" />
            <el-table-column label="风险等级" width="110">
              <template #default="{ row }">
                <DictTag v-model="row.riskLevel" code="gateway_risk_level" />
              </template>
            </el-table-column>
            <el-table-column label="来源" width="120">
              <template #default="{ row }">
                <el-tag :type="row.runtimeOnly ? 'warning' : 'success'">
                  {{ row.runtimeOnly ? "运行配置" : "控制面" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <DictTag v-model="row.status" code="gateway_publication_status" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="openApplicationRouteDetail(row)"
                >
                  详情
                </el-button>
                <el-button
                  link
                  type="warning"
                  size="small"
                  :disabled="row.runtimeOnly"
                  @click="openApplicationRouteDialog(row)"
                >
                  {{ row.runtimeOnly ? "只读" : "编辑" }}
                </el-button>
                <el-button
                  v-if="!row.runtimeOnly && row.status === 'DRAFT'"
                  link
                  type="success"
                  size="small"
                  @click="publishApplicationRoute(row)"
                >
                  发布
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="publicationDialog.visible"
      title="发布 API"
      width="1080px"
      top="4vh"
      class="api-publication-dialog"
    >
      <el-steps :active="publicationStep" finish-status="success" align-center class="mb-6">
        <el-step title="路由配置" />
        <el-step title="流量处理" />
        <el-step title="安全设置" />
        <el-step title="确认发布" />
      </el-steps>

      <el-form v-if="publicationStep === 0" label-width="120px">
        <el-alert
          title="API 信息已从 OpenAPI 自动带入，后端服务与内部路径不可修改。"
          type="info"
          :closable="false"
          class="mb-4"
        />
        <el-form-item label="API 名称">
          <el-input
            :model-value="
              publicationDialog.api?.summary || publicationDialog.api?.operationId || '未命名 API'
            "
            disabled
          />
        </el-form-item>
        <el-form-item label="后端服务">
          <el-input :model-value="publicationDialog.api?.serviceId" disabled />
        </el-form-item>
        <el-form-item label="内部接口">
          <el-input
            :model-value="`${publicationDialog.api?.httpMethod || ''} ${publicationDialog.api?.upstreamPath || ''}`"
            disabled
          />
        </el-form-item>
        <el-form-item label="对外路径" required>
          <el-input v-model="publicationForm.externalPath">
            <template #prepend>{{ publicationDialog.api?.httpMethod }}</template>
          </el-input>
        </el-form-item>
        <el-form-item label="路径处理">
          <el-radio-group v-model="pathMode">
            <el-radio-button value="SIMPLE">自动转换</el-radio-button>
            <el-radio-button value="ADVANCED">高级过滤器</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-alert
          v-if="pathMode === 'SIMPLE'"
          type="success"
          :closable="false"
          title="自动转换说明"
          :description="automaticPathDescription"
          class="mb-4 ml-[120px] w-[calc(100%-120px)]"
        />
        <el-alert
          v-else
          type="warning"
          :closable="false"
          title="高级模式由过滤器决定路径和报文处理，不再生成自动转换规则；两种模式互斥。"
          class="mb-4 ml-[120px] w-[calc(100%-120px)]"
        />
        <el-form-item v-if="pathMode === 'ADVANCED'" label="过滤器">
          <div class="w-full space-y-2">
            <div
              v-for="(item, index) in publicationFilters"
              :key="`api-filter-${index}`"
              class="flex gap-2"
            >
              <el-select v-model="item.name" class="w-48" placeholder="选择过滤器">
                <el-option
                  v-for="name in apiFilterOptions"
                  :key="name"
                  :label="name"
                  :value="name"
                />
              </el-select>
              <el-input
                v-model="item.argsText"
                placeholder="例如 parts=1 或 name=X-Source,value=gateway"
              />
              <el-button
                link
                type="danger"
                icon="delete"
                @click="publicationFilters.splice(index, 1)"
              />
            </div>
            <el-button
              link
              type="primary"
              icon="plus"
              @click="publicationFilters.push(emptyDefinition())"
            >
              添加过滤器
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div v-else-if="publicationStep === 1">
        <el-alert
          title="默认继承应用或全局配置；只有需要例外时才设置 API 覆盖。"
          type="info"
          :closable="false"
          class="mb-4"
        />
        <el-card v-for="item in policyItems" :key="item.type" shadow="never" class="mb-3">
          <div class="flex items-start justify-between gap-4">
            <div>
              <span class="font-medium">{{ item.label }}</span>
              <div class="mt-2 text-sm text-gray-600">
                继承后生效：{{ effectivePolicyText(item.type) }}
              </div>
            </div>
            <el-select v-model="policyForms[item.type].mode" class="w-36">
              <el-option label="继承默认" value="INHERIT" />
              <el-option label="API 覆盖" value="ENABLED" />
              <el-option label="API 禁用" value="DISABLED" />
            </el-select>
          </div>
          <div v-if="policyForms[item.type].mode === 'ENABLED'" class="policy-fields mt-4">
            <template v-if="item.type === 'RATE_LIMIT'">
              <div class="policy-field">
                <label>限流维度</label>
                <el-select v-model="policyForms.RATE_LIMIT.config.keyType">
                  <el-option label="按 IP" value="IP" />
                  <el-option label="按用户" value="USER" />
                  <el-option label="按客户端" value="OAUTH_CLIENT" />
                  <el-option label="按 API" value="API" />
                </el-select>
              </div>
              <div class="policy-field">
                <label>每秒令牌数</label>
                <el-input-number
                  v-model="policyForms.RATE_LIMIT.config.replenishRate"
                  :min="1"
                  controls-position="right"
                />
              </div>
              <div class="policy-field">
                <label>突发容量</label>
                <el-input-number
                  v-model="policyForms.RATE_LIMIT.config.burstCapacity"
                  :min="1"
                  controls-position="right"
                />
              </div>
              <div class="policy-field">
                <label>单次请求令牌</label>
                <el-input-number
                  v-model="policyForms.RATE_LIMIT.config.requestedTokens"
                  :min="1"
                  controls-position="right"
                />
              </div>
            </template>
            <template v-else-if="item.type === 'TIMEOUT'">
              <div class="policy-field">
                <label>连接超时（ms）</label>
                <el-input-number
                  v-model="policyForms.TIMEOUT.config.connectTimeoutMs"
                  :min="1"
                  controls-position="right"
                />
              </div>
              <div class="policy-field">
                <label>响应超时（ms）</label>
                <el-input-number
                  v-model="policyForms.TIMEOUT.config.responseTimeoutMs"
                  :min="1"
                  controls-position="right"
                />
              </div>
            </template>
            <template v-else>
              <div class="policy-field">
                <label>失败率阈值（%）</label>
                <el-input-number
                  v-model="policyForms.CIRCUIT_BREAKER.config.failureRateThreshold"
                  :min="1"
                  :max="100"
                  controls-position="right"
                />
              </div>
              <div class="policy-field">
                <label>慢调用率阈值（%）</label>
                <el-input-number
                  v-model="policyForms.CIRCUIT_BREAKER.config.slowCallRateThreshold"
                  :min="1"
                  :max="100"
                  controls-position="right"
                />
              </div>
              <div class="policy-field">
                <label>慢调用判定（ms）</label>
                <el-input-number
                  v-model="policyForms.CIRCUIT_BREAKER.config.slowCallDurationThresholdMs"
                  :min="1"
                  controls-position="right"
                />
              </div>
              <div class="policy-field">
                <label>最少调用数</label>
                <el-input-number
                  v-model="policyForms.CIRCUIT_BREAKER.config.minimumNumberOfCalls"
                  :min="1"
                  controls-position="right"
                />
              </div>
              <div class="policy-field">
                <label>熔断等待（ms）</label>
                <el-input-number
                  v-model="policyForms.CIRCUIT_BREAKER.config.waitDurationInOpenStateMs"
                  :min="1"
                  controls-position="right"
                />
              </div>
              <div class="policy-field">
                <label>降级地址（可选）</label>
                <el-input
                  v-model="policyForms.CIRCUIT_BREAKER.config.fallbackUri"
                  placeholder="如 forward:/fallback"
                />
              </div>
            </template>
          </div>
        </el-card>
      </div>

      <el-form v-else-if="publicationStep === 2" label-width="120px">
        <el-alert
          title="跨域由应用级或全局配置统一管理，本次 API 发布无需重复填写。"
          type="info"
          :closable="false"
          class="mb-4"
        />
        <el-form-item label="访问控制" required>
          <el-select
            v-model="publicationForm.authMode"
            class="w-full"
            @change="handleAuthModeChange"
          >
            <el-option label="登录后访问（推荐）" value="AUTHENTICATED" />
            <el-option label="公开访问" value="PUBLIC" />
            <el-option label="需要资源授权" value="RESOURCE_REQUIRED" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="publicationForm.authMode === 'RESOURCE_REQUIRED'"
          label="组织资源"
          required
        >
          <el-select v-model="publicationForm.resourceId" filterable clearable class="w-full">
            <el-option
              v-for="option in resourceOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <div v-else class="space-y-4">
        <el-alert
          title="请确认以下配置。保存后形成草稿，还需通过页面顶部“发布到网关”才会生效。"
          type="warning"
          :closable="false"
        />
        <el-card shadow="never">
          <template #header><span class="font-medium">路由配置</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="API 名称">
              {{
                publicationDialog.api?.summary || publicationDialog.api?.operationId || "未命名 API"
              }}
            </el-descriptions-item>
            <el-descriptions-item label="Operation ID">
              {{ publicationDialog.api?.operationId || "—" }}
            </el-descriptions-item>
            <el-descriptions-item label="对外请求">
              {{ publicationDialog.api?.httpMethod }} {{ publicationForm.externalPath }}
            </el-descriptions-item>
            <el-descriptions-item label="后端服务">
              {{ publicationDialog.api?.serviceId }}
            </el-descriptions-item>
            <el-descriptions-item label="内部转发">
              {{ publicationDialog.api?.httpMethod }} {{ publicationDialog.api?.upstreamPath }}
            </el-descriptions-item>
            <el-descriptions-item label="路径处理">
              {{ pathMode === "SIMPLE" ? "自动转换" : "高级过滤器" }}
            </el-descriptions-item>
          </el-descriptions>
          <el-table
            v-if="pathMode === 'ADVANCED'"
            :data="publicationFilters"
            border
            size="small"
            class="mt-3"
          >
            <el-table-column prop="name" label="过滤器" width="220" />
            <el-table-column prop="argsText" label="参数" />
          </el-table>
        </el-card>
        <el-card shadow="never">
          <template #header><span class="font-medium">流量处理</span></template>
          <el-descriptions :column="1" border>
            <el-descriptions-item v-for="item in policyItems" :key="item.type" :label="item.label">
              <el-tag :type="policyModeTagType(policyForms[item.type].mode)" class="mr-2">
                {{ policyModeText(policyForms[item.type].mode) }}
              </el-tag>
              {{ selectedPolicyText(item.type) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card shadow="never">
          <template #header><span class="font-medium">安全设置</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="访问控制">{{ authModeText }}</el-descriptions-item>
            <el-descriptions-item label="组织资源">{{ selectedResourceText }}</el-descriptions-item>
            <el-descriptions-item label="跨域策略">继承应用级或全局配置</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
      <template #footer>
        <el-button @click="publicationDialog.visible = false">取消</el-button>
        <el-button v-if="publicationStep > 0" @click="publicationStep--">上一步</el-button>
        <el-button v-if="publicationStep < 3" type="primary" @click="nextPublicationStep">
          下一步
        </el-button>
        <el-button v-else type="primary" :loading="saving" @click="savePublication">
          保存发布草稿
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="publicationDetailDialog.visible" title="API 发布详情" width="900px">
      <template v-if="publicationDetailDialog.data">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="API 名称">
            {{ publicationDetailDialog.data.apiSummary || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="Operation ID">
            {{ publicationDetailDialog.data.operationId || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="所属服务">
            {{ publicationDetailDialog.data.serviceId || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="API ID">
            {{ publicationDetailDialog.data.apiId }}
          </el-descriptions-item>
          <el-descriptions-item label="对外请求">
            {{ publicationDetailDialog.data.httpMethod }}
            {{ publicationDetailDialog.data.externalPath }}
          </el-descriptions-item>
          <el-descriptions-item label="内部转发">
            {{ publicationDetailDialog.data.httpMethod }}
            {{ publicationDetailDialog.data.upstreamPath || "使用 API 原始路径" }}
          </el-descriptions-item>
          <el-descriptions-item label="访问控制">
            {{ authModeLabel(publicationDetailDialog.data.authMode) }}
          </el-descriptions-item>
          <el-descriptions-item label="关联资源">
            {{ publicationDetailDialog.data.resourceId || "不需要" }}
          </el-descriptions-item>
          <el-descriptions-item label="发布状态">
            <DictTag
              v-model="publicationDetailDialog.data.status"
              code="gateway_publication_status"
            />
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <DictTag v-model="publicationDetailDialog.data.riskLevel" code="gateway_risk_level" />
          </el-descriptions-item>
          <el-descriptions-item label="已发布版本">
            {{ publicationDetailDialog.data.publishedVersion || "尚未发布" }}
          </el-descriptions-item>
          <el-descriptions-item label="配置版本">
            {{ publicationDetailDialog.data.lockVersion ?? 0 }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="mb-2 mt-4 font-medium">高级过滤器</div>
        <el-table
          v-if="publicationDetailDialog.data.filters?.length"
          :data="publicationDetailDialog.data.filters"
          border
          size="small"
        >
          <el-table-column prop="name" label="过滤器" width="220" />
          <el-table-column label="参数">
            <template #default="{ row }">{{ definitionText(row) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="未配置高级过滤器，使用自动路径转换" :image-size="60" />
      </template>
      <template #footer>
        <el-button type="primary" @click="publicationDetailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="applicationRouteDetailDialog.visible" title="应用级路由详情" width="900px">
      <template v-if="applicationRouteDetailDialog.data">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="路由名称">
            {{ applicationRouteDetailDialog.data.routeName }}
          </el-descriptions-item>
          <el-descriptions-item label="所属服务">
            {{ applicationRouteDetailDialog.data.serviceId }}
          </el-descriptions-item>
          <el-descriptions-item label="目标 URI">
            {{ applicationRouteDetailDialog.data.targetUri }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            {{ applicationRouteDetailDialog.data.routeOrder ?? 100 }}
          </el-descriptions-item>
          <el-descriptions-item label="外部路径">
            {{ applicationRouteDetailDialog.data.externalPath }}
          </el-descriptions-item>
          <el-descriptions-item label="请求方法">
            {{ applicationRouteDetailDialog.data.httpMethod || "全部方法" }}
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            {{ applicationRouteDetailDialog.data.runtimeOnly ? "网关运行配置（只读）" : "控制面" }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <DictTag
              v-model="applicationRouteDetailDialog.data.status"
              code="gateway_publication_status"
            />
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <DictTag
              v-model="applicationRouteDetailDialog.data.riskLevel"
              code="gateway_risk_level"
            />
          </el-descriptions-item>
          <el-descriptions-item label="发布版本">
            {{
              applicationRouteDetailDialog.data.publishedVersion ||
              (applicationRouteDetailDialog.data.runtimeOnly ? "当前运行版本" : "尚未发布")
            }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="mb-2 mt-4 font-medium">路由断言</div>
        <el-table :data="applicationRouteDetailDialog.data.predicates || []" border size="small">
          <el-table-column prop="name" label="断言" width="220" />
          <el-table-column label="参数">
            <template #default="{ row }">{{ definitionText(row) }}</template>
          </el-table-column>
        </el-table>
        <div class="mb-2 mt-4 font-medium">路由过滤器</div>
        <el-table
          v-if="applicationRouteDetailDialog.data.filters?.length"
          :data="applicationRouteDetailDialog.data.filters"
          border
          size="small"
        >
          <el-table-column prop="name" label="过滤器" width="220" />
          <el-table-column label="参数">
            <template #default="{ row }">{{ definitionText(row) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="未配置过滤器" :image-size="60" />
      </template>
      <template #footer>
        <el-button @click="applicationRouteDetailDialog.visible = false">关闭</el-button>
        <el-button
          v-if="applicationRouteDetailDialog.data && !applicationRouteDetailDialog.data.runtimeOnly"
          type="warning"
          @click="editApplicationRouteFromDetail"
        >
          编辑
        </el-button>
        <el-button
          v-if="
            applicationRouteDetailDialog.data &&
            !applicationRouteDetailDialog.data.runtimeOnly &&
            applicationRouteDetailDialog.data.status === 'DRAFT'
          "
          type="success"
          :loading="publishing"
          @click="publishApplicationRoute(applicationRouteDetailDialog.data)"
        >
          发布
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="applicationRouteDialog.visible"
      :title="applicationRouteDialog.editing ? '编辑应用级路由' : '新增应用级路由'"
      width="760px"
    >
      <el-form label-width="110px">
        <el-form-item label="服务名" required>
          <el-select
            v-model="applicationRouteForm.serviceId"
            filterable
            allow-create
            class="w-full"
          >
            <el-option
              v-for="service in services"
              :key="service.name"
              :label="service.name"
              :value="service.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="路由名称" required>
          <el-input v-model="applicationRouteForm.routeName" placeholder="例如 organization-api" />
        </el-form-item>
        <el-form-item label="目标 URI" required>
          <el-input
            v-model="applicationRouteForm.targetUri"
            placeholder="例如 lb://base-organization"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="applicationRouteForm.routeOrder" :min="-9999" :max="9999" />
        </el-form-item>
        <el-alert
          :closable="false"
          type="info"
          title="参数填写规则：Path 直接填 /api/**；其他断言和过滤器按 key=value,key2=value2 填写。"
          class="mb-4"
        />
        <el-form-item label="断言" required>
          <div class="w-full space-y-2">
            <div
              v-for="(item, index) in applicationRouteForm.predicates"
              :key="`application-p-${index}`"
              class="flex gap-2"
            >
              <el-select v-model="item.name" placeholder="断言" class="w-40">
                <el-option
                  v-for="name in predicateOptions"
                  :key="name"
                  :label="name"
                  :value="name"
                />
              </el-select>
              <el-input v-model="item.argsText" placeholder="Path：/api/**；其他：key=value" />
              <el-button
                link
                type="danger"
                icon="delete"
                @click="applicationRouteForm.predicates.splice(index, 1)"
              />
            </div>
            <el-button
              link
              type="primary"
              icon="plus"
              @click="applicationRouteForm.predicates.push(emptyDefinition())"
            >
              添加断言
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="过滤器">
          <div class="w-full space-y-2">
            <div
              v-for="(item, index) in applicationRouteForm.filters"
              :key="`application-f-${index}`"
              class="flex gap-2"
            >
              <el-select v-model="item.name" placeholder="过滤器" class="w-40">
                <el-option v-for="name in filterOptions" :key="name" :label="name" :value="name" />
              </el-select>
              <el-input v-model="item.argsText" placeholder="如 StripPrefix：parts=2" />
              <el-button
                link
                type="danger"
                icon="delete"
                @click="applicationRouteForm.filters.splice(index, 1)"
              />
            </div>
            <el-button
              link
              type="primary"
              icon="plus"
              @click="applicationRouteForm.filters.push(emptyDefinition())"
            >
              添加过滤器
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applicationRouteDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveApplicationRoute">
          保存草稿
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import GatewayApiRouteAPI, {
  mergeApplicationRouteViews,
} from "@/api/gateway-admin/gateway-api-route";
import GatewayServiceAPI from "@/api/gateway-admin/gateway-service";
import ResourceAPI from "@/api/system/resource";
import type {
  GatewayApiAsset,
  GatewayApiPublicationChange,
  GatewayApiPublication,
  GatewayApplicationRoute,
  GatewayApplicationRouteChange,
  GatewayEffectivePolicy,
  GatewayPolicyMode,
  GatewayPolicyType,
} from "@/types/api/gateway-api-route";
import type { GatewayServiceSummary } from "@/types/api/gateway-service";
import type { OptionItem } from "@/types/api";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  definitionText,
  emptyDefinition,
  filterOptions,
  parseArgs,
  predicateOptions,
  type EditableDefinition,
} from "@/views/system/gateway-route/route-definition";

defineOptions({ name: "GatewayApiRoutes" });

const activeTab = ref("apis");
const loading = ref(false);
const syncing = ref(false);
const saving = ref(false);
const publishing = ref(false);
const focusedPublicationRouteName = ref("");
const serviceId = ref("");
const services = ref<GatewayServiceSummary[]>([]);
const resourceOptions = ref<OptionItem[]>([]);
const apis = ref<GatewayApiAsset[]>([]);
const apiPagination = reactive({ page: 1, pageSize: 20, total: 0 });
const publications = ref<GatewayApiPublication[]>([]);
const applicationRoutes = ref<GatewayApplicationRoute[]>([]);

const publicationDialog = reactive<{
  visible: boolean;
  api?: GatewayApiAsset;
}>({ visible: false });
const publicationDetailDialog = reactive<{
  visible: boolean;
  data?: GatewayApiPublication;
}>({ visible: false });
const publicationForm = reactive<GatewayApiPublicationChange>({
  externalPath: "",
  upstreamPath: "",
  authMode: "AUTHENTICATED",
  resourceId: "",
});
const publicationStep = ref(0);
const pathMode = ref<"SIMPLE" | "ADVANCED">("SIMPLE");
const publicationFilters = ref<EditableDefinition[]>([]);
const apiFilterOptions = filterOptions.filter(
  (name) => name !== "Retry" && name !== "CircuitBreaker"
);
const policyItems: { type: GatewayPolicyType; label: string }[] = [
  { type: "RATE_LIMIT", label: "限流" },
  { type: "TIMEOUT", label: "超时" },
  { type: "CIRCUIT_BREAKER", label: "熔断" },
];
const effectivePolicies = reactive<Partial<Record<GatewayPolicyType, GatewayEffectivePolicy>>>({});
const policyForms = reactive({
  RATE_LIMIT: {
    mode: "INHERIT" as GatewayPolicyMode,
    lockVersion: undefined as number | undefined,
    config: { keyType: "IP", replenishRate: 20, burstCapacity: 40, requestedTokens: 1 },
  },
  TIMEOUT: {
    mode: "INHERIT" as GatewayPolicyMode,
    lockVersion: undefined as number | undefined,
    config: { connectTimeoutMs: 1000, responseTimeoutMs: 5000 },
  },
  CIRCUIT_BREAKER: {
    mode: "INHERIT" as GatewayPolicyMode,
    lockVersion: undefined as number | undefined,
    config: {
      failureRateThreshold: 50,
      slowCallRateThreshold: 100,
      slowCallDurationThresholdMs: 5000,
      minimumNumberOfCalls: 10,
      waitDurationInOpenStateMs: 5000,
      fallbackUri: "",
    },
  },
});
const applicationRouteDialog = reactive({ visible: false, editing: false, id: "" });
const applicationRouteDetailDialog = reactive<{
  visible: boolean;
  data?: GatewayApplicationRoute;
}>({ visible: false });
const applicationRouteForm = reactive<
  Omit<GatewayApplicationRouteChange, "predicates" | "filters"> & {
    predicates: EditableDefinition[];
    filters: EditableDefinition[];
  }
>({
  serviceId: "",
  routeName: "",
  externalPath: "",
  targetUri: "",
  httpMethod: "",
  rewritePath: "",
  routeOrder: 100,
  predicates: [emptyDefinition()],
  filters: [],
  lockVersion: undefined,
});

const publicationByApi = computed(
  () => new Map(publications.value.map((publication) => [publication.apiId, publication]))
);
const pendingDraftCount = computed(
  () =>
    publications.value.filter((publication) => publication.status === "DRAFT").length +
    applicationRoutes.value.filter((route) => route.status === "DRAFT").length
);

function authModeLabel(mode?: string) {
  return (
    { PUBLIC: "公开访问", AUTHENTICATED: "登录后访问", RESOURCE_REQUIRED: "资源授权" }[
      mode || ""
    ] ||
    mode ||
    "—"
  );
}

function openPublicationDetail(publication: GatewayApiPublication) {
  publicationDetailDialog.data = publication;
  publicationDetailDialog.visible = true;
}

async function loadApis() {
  const result = await GatewayApiRouteAPI.listApis({
    serviceId: serviceId.value.trim() || undefined,
    page: apiPagination.page,
    pageSize: apiPagination.pageSize,
  });
  apis.value = result.apis || [];
  apiPagination.total = result.total || 0;
  apiPagination.page = result.page || 1;
}

function handleApiPageSizeChange() {
  apiPagination.page = 1;
  void loadApis();
}

function handleApiSearch() {
  apiPagination.page = 1;
  void loadApis();
}

async function loadServices() {
  try {
    const result = await GatewayServiceAPI.list({ page: 1, pageSize: 500 });
    services.value = result.services || [];
  } catch {
    // 请求拦截器已提示错误；允许用户手工输入服务名继续操作。
  }
}

async function loadResourceOptions() {
  if (resourceOptions.value.length) return;
  try {
    resourceOptions.value = await ResourceAPI.getOptions();
  } catch {
    // 只有选择 RESOURCE_REQUIRED 时才需要资源选项。
  }
}

async function syncApis() {
  const targetService = serviceId.value.trim();
  if (!targetService) {
    ElMessage.warning("请先选择或输入服务名");
    return;
  }
  syncing.value = true;
  try {
    const result = await GatewayApiRouteAPI.syncApis(targetService);
    ElMessage.success(
      `同步完成：发现 ${result.discovered} 个，新增 ${result.created} 个，更新 ${result.updated} 个`
    );
    await loadAll();
  } finally {
    syncing.value = false;
  }
}

/** 通过发布中心将当前草稿编译并写入 Nacos，网关刷新后才会实际对外暴露。 */
async function publishDrafts() {
  if (pendingDraftCount.value === 0) {
    ElMessage.warning("当前没有待发布的 API 或应用级路由草稿");
    return false;
  }
  publishing.value = true;
  try {
    const currentConfig = await GatewayApiRouteAPI.getCurrentConfig();
    const candidate = await GatewayApiRouteAPI.validateRelease(currentConfig.version);
    try {
      await ElMessageBox.confirm(
        `${focusedPublicationRouteName.value ? `路由“${focusedPublicationRouteName.value}”已包含在本次候选中。` : ""}当前发布机制会统一发布全部待生效草稿：${candidate.apiRouteCount} 个 API、${candidate.applicationRouteCount} 个应用级路由。发布后立即进入网关运行时配置。`,
        "确认发布到网关",
        { type: "warning", confirmButtonText: "发布", cancelButtonText: "取消" }
      );
    } catch {
      return false;
    }
    const result = await GatewayApiRouteAPI.publishRelease(candidate.baseVersion);
    if (result.status === "SUCCEEDED") {
      ElMessage.success(`发布成功，配置版本：${result.targetVersion}`);
    } else {
      ElMessage.warning(`发布已完成但状态为 ${result.status}，请到发布中心查看实例生效情况`);
    }
    await loadAll();
    return true;
  } finally {
    publishing.value = false;
    focusedPublicationRouteName.value = "";
  }
}

async function openPublicationDialog(api: GatewayApiAsset) {
  const current = publicationByApi.value.get(api.id);
  publicationDialog.api = api;
  publicationDialog.visible = true;
  publicationStep.value = 0;
  publicationForm.externalPath = current?.externalPath || api.upstreamPath;
  publicationForm.upstreamPath = current?.upstreamPath || api.upstreamPath;
  publicationForm.authMode =
    (current?.authMode as GatewayApiPublicationChange["authMode"]) || "AUTHENTICATED";
  publicationForm.resourceId = "";
  publicationFilters.value = (current?.filters || []).map((item) => ({
    name: item.name,
    argsText: definitionText(item),
  }));
  pathMode.value = publicationFilters.value.length ? "ADVANCED" : "SIMPLE";
  if (publicationForm.authMode === "RESOURCE_REQUIRED") void loadResourceOptions();
  publicationForm.lockVersion = current?.lockVersion;
  const [localPolicies, ...resolved] = await Promise.all([
    GatewayApiRouteAPI.listApiPolicies(api.id),
    ...policyItems.map((item) =>
      GatewayApiRouteAPI.getEffectivePolicy(item.type, api.serviceId, api.id)
    ),
  ]);
  policyItems.forEach((item, index) => {
    effectivePolicies[item.type] = resolved[index];
    const local = localPolicies.find((policy) => policy.policyType === item.type);
    policyForms[item.type].mode = local?.mode || "INHERIT";
    policyForms[item.type].lockVersion = local?.lockVersion;
    if (
      local?.mode === "ENABLED" &&
      resolved[index]?.sourceScope === "API" &&
      resolved[index]?.effectiveConfig
    ) {
      Object.assign(policyForms[item.type].config, resolved[index].effectiveConfig);
    }
  });
}

watch(pathMode, (mode) => {
  if (mode === "ADVANCED" && publicationFilters.value.length === 0 && publicationDialog.api) {
    publicationFilters.value.push({
      name: "SetPath",
      argsText: `template=${publicationDialog.api.upstreamPath}`,
    });
  }
});

function handleAuthModeChange(mode: string) {
  if (mode === "RESOURCE_REQUIRED") void loadResourceOptions();
}

function nextPublicationStep() {
  if (publicationStep.value === 0 && !publicationForm.externalPath.trim()) {
    ElMessage.warning("对外路径不能为空");
    return;
  }
  if (
    publicationStep.value === 0 &&
    pathMode.value === "ADVANCED" &&
    publicationFilters.value.some((item) => !item.name || !item.argsText.trim())
  ) {
    ElMessage.warning("请完整填写或删除空的高级过滤器");
    return;
  }
  if (
    publicationStep.value === 2 &&
    publicationForm.authMode === "RESOURCE_REQUIRED" &&
    !publicationForm.resourceId
  ) {
    ElMessage.warning("请选择组织资源");
    return;
  }
  publicationStep.value++;
}

function effectivePolicyText(type: GatewayPolicyType) {
  const policy = effectivePolicies[type];
  if (!policy || policy.effectiveMode === "DISABLED") return "未启用（当前继承链没有启用该策略）";
  const source = { API: "API", APPLICATION: "应用", GLOBAL: "全局" }[
    policy.sourceScope || "GLOBAL"
  ];
  return `${policyConfigText(type, policy.effectiveConfig || {})}（来源：${source}）`;
}

function policyConfigText(type: GatewayPolicyType, config: Record<string, any>) {
  if (type === "RATE_LIMIT") {
    const keyNames: Record<string, string> = {
      IP: "IP",
      USER: "用户",
      OAUTH_CLIENT: "OAuth 客户端",
      API: "API",
    };
    return `按${keyNames[config.keyType] || config.keyType}，每秒 ${config.replenishRate} 个令牌，突发容量 ${config.burstCapacity}，单次消耗 ${config.requestedTokens}`;
  }
  if (type === "TIMEOUT") {
    return `连接超时 ${config.connectTimeoutMs} ms，响应超时 ${config.responseTimeoutMs} ms`;
  }
  const fallback = config.fallbackUri ? `，降级地址 ${config.fallbackUri}` : "，未配置降级地址";
  return `失败率 ${config.failureRateThreshold}%，慢调用率 ${config.slowCallRateThreshold}%，慢调用判定 ${config.slowCallDurationThresholdMs} ms，最少 ${config.minimumNumberOfCalls} 次调用，熔断等待 ${config.waitDurationInOpenStateMs} ms${fallback}`;
}

function policyModeText(mode: GatewayPolicyMode) {
  return { INHERIT: "继承默认", ENABLED: "API 覆盖", DISABLED: "API 禁用" }[mode];
}

function policyModeTagType(mode: GatewayPolicyMode) {
  return mode === "ENABLED" ? "warning" : mode === "DISABLED" ? "danger" : "info";
}

function selectedPolicyText(type: GatewayPolicyType) {
  const form = policyForms[type];
  if (form.mode === "INHERIT") return effectivePolicyText(type);
  if (form.mode === "DISABLED") return "该 API 明确不启用此策略";
  return policyConfigText(type, form.config);
}

const automaticPathDescription = computed(() => {
  const method = publicationDialog.api?.httpMethod || "请求";
  const externalPath = publicationForm.externalPath || "对外路径";
  const upstreamPath = publicationDialog.api?.upstreamPath || "OpenAPI 原始路径";
  if (externalPath === upstreamPath) {
    return `${method} ${externalPath} 将原样转发到后端服务，无需生成额外路径过滤器。`;
  }
  return `调用方请求 ${method} ${externalPath} 时，网关自动将路径转换为 ${upstreamPath}，再转发到 ${publicationDialog.api?.serviceId || "后端服务"}。用户无需手工配置 SetPath。`;
});

const authModeText = computed(
  () =>
    ({ PUBLIC: "公开访问", AUTHENTICATED: "登录后访问", RESOURCE_REQUIRED: "需要资源授权" })[
      publicationForm.authMode
    ]
);
const selectedResourceText = computed(() => {
  if (publicationForm.authMode !== "RESOURCE_REQUIRED") return "不需要关联资源";
  return (
    resourceOptions.value.find((option) => option.value === publicationForm.resourceId)?.label ||
    publicationForm.resourceId ||
    "未选择"
  );
});

async function savePolicies(apiId: string) {
  await Promise.all(
    policyItems.map((item) => {
      const form = policyForms[item.type];
      const data: any = { mode: form.mode, lockVersion: form.lockVersion };
      if (form.mode === "ENABLED") {
        if (item.type === "RATE_LIMIT") data.rateLimit = form.config;
        if (item.type === "TIMEOUT") data.timeout = form.config;
        if (item.type === "CIRCUIT_BREAKER") data.circuitBreaker = form.config;
      }
      return GatewayApiRouteAPI.saveApiPolicy(apiId, item.type, data);
    })
  );
}

async function savePublication() {
  const api = publicationDialog.api;
  if (!api || !publicationForm.externalPath.trim()) {
    ElMessage.warning("外部路径不能为空");
    return;
  }
  saving.value = true;
  try {
    await GatewayApiRouteAPI.savePublication(api.id, {
      ...publicationForm,
      externalPath: publicationForm.externalPath.trim(),
      upstreamPath: pathMode.value === "SIMPLE" ? api.upstreamPath : undefined,
      filters:
        pathMode.value === "ADVANCED"
          ? publicationFilters.value.map((item) => ({
              name: item.name,
              args: parseArgs(item.name, item.argsText),
            }))
          : [],
      resourceId:
        publicationForm.authMode === "RESOURCE_REQUIRED" ? publicationForm.resourceId : undefined,
    });
    await savePolicies(api.id);
    ElMessage.success("API 发布草稿已保存");
    publicationDialog.visible = false;
    await loadAll();
  } finally {
    saving.value = false;
  }
}

function openApplicationRouteDialog(route?: GatewayApplicationRoute) {
  applicationRouteDialog.visible = true;
  applicationRouteDialog.editing = Boolean(route);
  applicationRouteDialog.id = route?.id || "";
  applicationRouteForm.serviceId = route?.serviceId || serviceId.value.trim();
  applicationRouteForm.routeName = route?.routeName || "";
  applicationRouteForm.externalPath = route?.externalPath || "";
  applicationRouteForm.targetUri = route?.targetUri || "";
  applicationRouteForm.httpMethod = route?.httpMethod || "";
  applicationRouteForm.rewritePath = route?.rewritePath || "";
  applicationRouteForm.routeOrder = route?.routeOrder ?? 100;
  applicationRouteForm.predicates = (route?.predicates || []).map((item) => ({
    name: item.name,
    argsText: definitionText(item),
  }));
  if (!applicationRouteForm.predicates.length) {
    applicationRouteForm.predicates = [{ name: "Path", argsText: route?.externalPath || "" }];
  }
  applicationRouteForm.filters = (route?.filters || []).map((item) => ({
    name: item.name,
    argsText: definitionText(item),
  }));
}

function openApplicationRouteDetail(route: GatewayApplicationRoute) {
  applicationRouteDetailDialog.data = route;
  applicationRouteDetailDialog.visible = true;
}

function editApplicationRouteFromDetail() {
  const route = applicationRouteDetailDialog.data;
  if (!route || route.runtimeOnly) return;
  applicationRouteDetailDialog.visible = false;
  openApplicationRouteDialog(route);
}

async function publishApplicationRoute(route: GatewayApplicationRoute) {
  focusedPublicationRouteName.value = route.routeName;
  if (await publishDrafts()) applicationRouteDetailDialog.visible = false;
}

async function saveApplicationRoute() {
  const pathDefinition = applicationRouteForm.predicates.find((item) => item.name === "Path");
  const required = [
    applicationRouteForm.serviceId,
    applicationRouteForm.routeName,
    applicationRouteForm.targetUri,
    pathDefinition?.argsText || "",
  ];
  if (required.some((value) => !value.trim())) {
    ElMessage.warning("服务名、路由名称、目标 URI 和 Path 断言不能为空");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...applicationRouteForm,
      serviceId: applicationRouteForm.serviceId.trim(),
      routeName: applicationRouteForm.routeName.trim(),
      externalPath: pathDefinition!.argsText.trim(),
      targetUri: applicationRouteForm.targetUri.trim(),
      httpMethod:
        applicationRouteForm.predicates.find((item) => item.name === "Method")?.argsText ||
        undefined,
      rewritePath: undefined,
      routeOrder: applicationRouteForm.routeOrder,
      predicates: applicationRouteForm.predicates.map((item) => ({
        name: item.name,
        args: parseArgs(item.name, item.argsText),
      })),
      filters: applicationRouteForm.filters.map((item) => ({
        name: item.name,
        args: parseArgs(item.name, item.argsText),
      })),
    };
    if (applicationRouteDialog.editing) {
      await GatewayApiRouteAPI.updateApplicationRoute(applicationRouteDialog.id, {
        ...payload,
        lockVersion: applicationRouteForm.lockVersion,
      });
    } else {
      await GatewayApiRouteAPI.createApplicationRoute(payload);
    }
    ElMessage.success(applicationRouteDialog.editing ? "应用路由草稿已更新" : "应用路由草稿已创建");
    applicationRouteDialog.visible = false;
    await loadAll();
  } finally {
    saving.value = false;
  }
}

async function loadAll() {
  loading.value = true;
  try {
    const [, loadedPublications, loadedApplicationRoutes, runtimeConfig] = await Promise.all([
      loadApis(),
      GatewayApiRouteAPI.listPublications(),
      GatewayApiRouteAPI.listApplicationRoutes(),
      GatewayApiRouteAPI.getCurrentConfig(),
    ]);
    publications.value = loadedPublications;
    applicationRoutes.value = mergeApplicationRouteViews(loadedApplicationRoutes, runtimeConfig);
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);
onMounted(loadServices);
</script>

<style scoped>
:deep(.api-publication-dialog .el-dialog__body) {
  max-height: 76vh;
  overflow-y: auto;
}

.policy-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.policy-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.policy-field label {
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.policy-field :deep(.el-select),
.policy-field :deep(.el-input-number) {
  width: 100%;
}
</style>
