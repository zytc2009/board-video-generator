# Board Video Generator 中文说明

这是一个本地命令行工具，用来把简单的板书脚本渲染成白板风格的 MP4 视频。

当前版本是 MVP，核心流程是：

```text
板书 Markdown 脚本 -> 分镜计划 -> Puppeteer 截帧 -> FFmpeg 编码 -> MP4
```

## 环境要求

- Node.js 22 或更新版本
- FFmpeg 已安装，并且可以在命令行中直接运行 `ffmpeg`

当前测试环境下 Node.js 20 也可以跑通测试和 demo，但项目文档目标版本仍然是 Node.js 22+。

## 安装依赖

在项目目录中执行：

```sh
npm install
```

项目会安装 Puppeteer，并下载/使用 Chromium 进行逐帧截图。

## 渲染示例视频

在项目目录中执行：

```sh
npm run render -- examples/demo.board.md
```

生成的视频文件位于：

```text
dist/demo.mp4
```

渲染过程中会生成中间帧：

```text
.frames/demo/
```

这些中间帧是临时输出，已经被 `.gitignore` 忽略。

## 脚本格式

板书脚本是 Markdown 文件，使用 `::指令 参数` 和结束标记 `::` 描述每个板书动作。

示例：

```md
# Newton's Second Law

::write duration=1.2 x=120 y=120
Newton's Second Law
::

::formula duration=1.0 x=160 y=260
F = ma
::

::arrow duration=0.8 from=260,300 to=500,300
::

::box duration=0.8 x=140 y=230 width=460 height=130
::
```

## 支持的指令

`write`：逐步显示一段手写风格文字。

```md
::write duration=1.2 x=120 y=120
Text to write
::
```

`formula`：逐步显示公式文本。当前 MVP 使用普通文本渲染公式，后续可以接入 KaTeX。

```md
::formula duration=1.0 x=160 y=260
F = ma
::
```

`arrow`：绘制一条 SVG 线段。

```md
::arrow duration=0.8 from=260,300 to=500,300
::
```

`box`：绘制一个 SVG 矩形框。

```md
::box duration=0.8 x=140 y=230 width=460 height=130
::
```

`clear`：已在解析器中预留，后续用于清屏/换页。

## 参数说明

通用参数：

- `duration`：动作持续时间，单位是秒，必须大于 0。
- `x` / `y`：元素左上角或起点位置，单位是像素。

`arrow` 参数：

- `from=x,y`：箭头起点。
- `to=x,y`：箭头终点。

`box` 参数：

- `width`：矩形宽度，必须大于 0。
- `height`：矩形高度，必须大于 0。

## 自定义输出路径

可以使用 `--out` 指定输出文件：

```sh
npm run render -- examples/demo.board.md --out dist/my-video.mp4
```

## 旁白音频

CLI 已预留 `--voice` 参数，可以把音频混入视频：

```sh
npm run render -- examples/demo.board.md --voice examples/voice.wav --out dist/demo-with-voice.mp4
```

音频文件需要已经存在。当前项目没有内置 TTS。

## 常用验证命令

运行测试：

```sh
npm test -- --test-reporter=spec
```

运行语法检查：

```sh
npm run check
```

检查 FFmpeg：

```sh
ffmpeg -version
```

## 排障

如果提示找不到 FFmpeg，先确认：

```sh
ffmpeg -version
```

如果命令不存在，需要安装 FFmpeg，并把它加入系统 `PATH`。

如果 Puppeteer 或 Chromium 启动失败，可以重新安装依赖：

```sh
npm install
```

如果渲染失败，可以先确认脚本格式是否完整：

- 每个 `::write` / `::formula` / `::arrow` / `::box` 都需要结束标记 `::`。
- `duration` 必须大于 0。
- `box` 的 `width` 和 `height` 必须大于 0。
- `arrow` 的 `from` 和 `to` 必须是 `x,y` 格式。

## 当前限制

- 暂无图形界面。
- 暂无内置 TTS。
- 公式暂未接入 KaTeX。
- 文字动画是宽度 reveal，不是真实笔迹路径。
- 当前只实现单场景顺序时间轴。

后续可以继续扩展为：多场景、中文字体配置、KaTeX 公式、真实手写路径、旁白自动生成、字幕和 Web 编辑器。
