# VBF-0 用户验收指南 (User Visual Acceptance Guide)

**目标：** 放置真实法咪莉角色图像，完成 Avatar Lab 视觉验收  
**Status:** 代码已完成（190/190 测试通过），待用户图像资源 + 浏览器验证

---

## 快速启动 (Quick Start)

### 1️⃣ 准备法咪莉主图像

需要一张法咪莉校长的高清肖像，**建议规格：**
- 尺寸：256×256 像素或更高（宽高比灵活）
- 格式：PNG、JPEG 或 WebP
- 色彩空间：sRGB
- 文件大小：≤500KB（加载性能）

**存放路径：**
```
d:\Family\50_开发_dev\products\famili-principal\apps\avatar-lab\public\famili\famili-master-candidate.png
```

### 2️⃣ 创建目录

如果目录不存在，创建：
```bash
mkdir -p d:\Family\50_开发_dev\products\famili-principal\apps\avatar-lab\public\famili
```

### 3️⃣ 放置图像文件

将 `famili-master-candidate.png` 复制到上面的目录。

### 4️⃣ 启动开发服务器

```bash
cd d:\Family\50_开发_dev\products\famili-principal\apps\avatar-lab
npm run dev
```

**预期输出：**
```
  VITE v... ready in XXX ms

  ➜  Local:   http://localhost:4173/
  ➜  press h to show help
```

### 5️⃣ 打开浏览器

导航至：
```
http://localhost:4173/
```

---

## 预期初始屏幕

打开后应看到：

```
┌─────────────────────────────────────────────┐
│  法咪莉校长 · Avatar Lab                     │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │        [Real Famili Image Here]        │  │
│  │      or "加载法咪莉..." (loading)      │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  状态: 连接中…                              │
│  实时字幕(听中): —                          │
│  最终转写: —                                │
│                                              │
│  ┌─ MM6 VISUAL QA (DEV-ONLY) ─┐           │
│  │ [Gaze: USER] [Gaze: THINKING]          │
│  │ [Expr: LISTENING] [Expr: THINKING]     │
│  │ [Expr: CALM_SERIOUS]                   │
│  │ [Trigger: BLINK] [Gesture: NOD]        │
│  │ [Activity: SPEAKING]                   │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**关键检查：**
- ✅ 看到真实法咪莉图像（不是圆形占位符）
- ✅ 红色 QA 控制面板可见
- ✅ 按钮可点击

---

## 视觉验收流程 (6-Point Checklist)

### 准备工作

打开浏览器开发者工具（F12），查看控制台，确保无错误。

### 测试阶段 A：USER 凝视

1. **点击** `[Gaze: USER]` 按钮
2. **观察** Canvas 中法咪莉的眼睛/瞳孔
3. **检查清单：**
   - [ ] 瞳孔居中（直视效果）
   - [ ] 眼睛自然，不是呆滞/冰冷感
   - [ ] 瞳孔大小适中（不过大，不过小）
   - [ ] 左右眼瞳孔方向一致（无斜眼）

### 测试阶段 B：USER → THINKING 过渡

1. **点击** `[Gaze: USER]` 建立基准
2. **立即点击** `[Gaze: THINKING]`
3. **观察** 200ms 内的平滑过渡
4. **检查清单：**
   - [ ] 瞳孔逐渐向下偏移（不是跳跃）
   - [ ] 过渡流畅自然
   - [ ] 两只眼睛一起运动
   - [ ] 没有视觉弹簧/弹回效果

### 测试阶段 C：THINKING 凝视稳定

1. **点击** `[Gaze: THINKING]`
2. **等待** 2 秒钟
3. **观察** 最终位置
4. **检查清单：**
   - [ ] 瞳孔明显向下
   - [ ] 偏移量适中（显眼但不极端）
   - [ ] 不是看鼻子、不是翻白眼
   - [ ] 看起来像"思考/深思"状态

### 测试阶段 D：THINKING → USER 重新连接

1. **点击** `[Gaze: THINKING]` 建立基准
2. **等待** 1 秒
3. **点击** `[Gaze: USER]`
4. **观察** 平滑返回
5. **检查清单：**
   - [ ] 瞳孔逐渐回归中心（不是突然弹回）
   - [ ] 过程连续，没有卡顿
   - [ ] 最终恢复正常眼神接触
   - [ ] 自然、不怪异

### 测试阶段 E：USER + 眨眼

1. **点击** `[Gaze: USER]`
2. **等待** 0.5 秒
3. **点击** `[Trigger: BLINK]`
4. **观察** 120ms 眨眼周期
5. **检查清单：**
   - [ ] 眼睛平滑闭合和睁开
   - ⚠️ **关键：瞳孔不浮动/不弹出**
   - [ ] 眨眼后瞳孔返回 USER 位置
   - [ ] 没有视觉伪影

### 测试阶段 F：THINKING + 眨眼

1. **点击** `[Gaze: THINKING]`
2. **等待** 0.5 秒
3. **点击** `[Trigger: BLINK]`
4. **观察** THINKING 偏移下的眨眼
5. **检查清单：**
   - [ ] 眼睛在向下偏移状态闭合
   - [ ] 瞳孔保持在眼睛范围内（不溢出）
   - [ ] 没有视觉伪影

### 测试阶段 G：CALM_SERIOUS + USER (几何测试)

1. **点击** `[Expr: CALM_SERIOUS]` （眼睛极窄）
2. **点击** `[Gaze: USER]`
3. **观察** 窄眼表达下的渲染
4. **检查清单：**
   - [ ] 瞳孔仍然可见
   - [ ] 瞳孔不显得过大（相对窄眼）
   - [ ] 没有视觉裁剪或溢出
   - [ ] 比例平衡

### 测试阶段 H：CALM_SERIOUS + THINKING (几何测试)

1. **点击** `[Expr: CALM_SERIOUS]`
2. **点击** `[Gaze: THINKING]`
3. **观察** 窄眼中的最大偏移
4. **检查清单：**
   - [ ] 瞳孔保持在窄眼内（安全边界）
   - [ ] 偏移明显但安全
   - [ ] 没有溢出

### 测试阶段 I：说话 + USER 凝视

1. **点击** `[Activity: SPEAKING]`
2. **点击** `[Gaze: USER]`
3. **观察** 嘴部 + 凝视同时
4. **检查清单：**
   - [ ] 嘴部活动时瞳孔稳定
   - [ ] 凝视不因说话而改变
   - [ ] 眼睛保持 USER 位置
   - [ ] 说话 + 凝视自然共存

### 测试阶段 J：点头 + USER 凝视

1. **点击** `[Gaze: USER]`
2. **点击** `[Gesture: NOD]`
3. **观察** 400ms 点头周期
4. **检查清单：**
   - [ ] 头部点动，瞳孔保持 USER 凝视
   - [ ] 眼睛和点头不冲突
   - [ ] 自然的组合运动

---

## 最终验收检查清单

完成阶段 A-J 后，回答这 6 个问题：

```
[ ] 1. USER 凝视看起来自然，不像呆滞/冰冷
      （瞳孔大小适中，眼神接触自然）

[ ] 2. THINKING 凝视精致低调
      （不夸张，不看鼻子，显得深思）

[ ] 3. USER ↔ THINKING 过渡平滑
      （无突然跳跃，无弹簧效果，像真实眼球运动）

[ ] 4. 眨眼时瞳孔不浮动/不弹出
      （瞳孔保持安全，无视觉伪影）

[ ] 5. CALM_SERIOUS 窄眼不显示过大瞳孔
      （瞳孔几何安全，比例得当）

[ ] 6. 新瞳孔与法咪莉视觉形象自然融合
      （不显卡通，不显廉价，整体协调）
```

---

## 故障排除

### 问题：看不到图像，只是加载文本

**原因 1：** 文件路径不正确

**解决：**
- 确认文件路径：`public/famili/famili-master-candidate.png`
- 重启开发服务器（Ctrl+C，然后 `npm run dev`）

**原因 2：** 图像资源不存在

**解决：**
- 验证 `/public/famili/` 目录存在
- 验证 `famili-master-candidate.png` 在目录中
- 浏览器 F12 → Network → 搜索 "famili-master" → 检查 404 或加载成功

### 问题：看到红色错误 "FAMILI_ASSET_LOAD_FAILED"

**原因：** 图像加载失败

**解决：**
- 检查文件格式（必须是 PNG/JPEG/WebP）
- 检查文件大小（≤500KB）
- 尝试转换为 PNG：`convert input.jpg -format PNG famili-master-candidate.png`
- 查看浏览器控制台错误信息

### 问题：按钮不响应（凝视不变）

**原因：** 可能的 WebSocket 连接问题（但不影响基础渲染）

**解决：**
- 刷新页面（F5）
- 检查后端是否运行（如果需要）
- 打开浏览器控制台查看错误

### 问题：所有检查都通过，但我对某个方面不满意

**微调选项：**

**瞳孔过大？**
- 编辑 `src/avatar2DRenderer.ts` 第 348 行
- 改 `headR * 0.04` 为 `headR * 0.03`
- 重启服务器

**凝视偏移过极端？**
- 编辑 `src/gazeRuntime.ts` 第 30 行
- 改 `y: 0.4` 为 `y: 0.25` 或 `y: 0.3`
- 重启服务器

**背景颜色太亮？**
- 编辑 `src/familiLayered2DRenderer.ts` 第 180 行
- 改 `'#f6f4ff'` 为其他颜色
- 重启服务器

---

## 完成确认

所有 6 项检查都通过后，**请回复：**

```
VBF-0 VISUAL ACCEPTANCE: PASS

✅ 1. USER 凝视自然
✅ 2. THINKING 凝视精致
✅ 3. 过渡平滑
✅ 4. 瞳孔安全（无浮动）
✅ 5. 几何安全（CALM_SERIOUS）
✅ 6. 视觉融合自然

准备进入 VBF-1（动态层）
```

---

## 技术细节（可选阅读）

### 为什么是 VBF-0？

- **V** = Visual（视觉）
- **B** = Body（身体）
- **F** = Foundation（基础）
- **0** = 最小可行版本（不含动画，仅基础角色）

### VBF-0 vs VBF-1

| 功能 | VBF-0 | VBF-1 |
|------|-------|-------|
| 基础角色图像 | ✅ | ✅ |
| 凝视瞳孔移动 | ✅ (已有) | 待整合 |
| 表情层 | ❌ | ✅ |
| 眨眼动画 | ❌ | ✅ |
| 说话嘴型 | ❌ | ✅ |
| 手势点头 | ❌ | ✅ |

### 架构

```
Browser Load
  ↓
DOMContentLoaded
  ↓
initializeRenderer() [NEW]
  ├─ FamiliLayered2DRenderer [NEW]
  │  ├─ Preload master image
  │  ├─ If ready: ctx.drawImage()
  │  ├─ If loading: "加载法咪莉…"
  │  └─ If failed: "FAMILI_ASSET_LOAD_FAILED"
  │
  └─ RenderOrchestrator (MM1-MM6)
     └─ Avatar2DRenderer (pupils from MM6)

Parallel:
  WebSocket.open()
    → PerformanceFrame events
    → MM2-MM6 runtime
    (visual effects deferred to VBF-1)
```

**关键点：** 无需 WebSocket 连接即可显示真实角色。

---

## 联系

遇到问题或有建议？

- 检查开发者控制台（F12）是否有错误
- 查看 `VBF-0_REAL_FAMILI_VERTICAL_SLICE_REPORT.md` 获取技术细节
- 验证所有测试通过：`npm test` → 190/190 ✅

---

**准备好了吗？打开 http://localhost:4173/ 并开始验收吧！**

