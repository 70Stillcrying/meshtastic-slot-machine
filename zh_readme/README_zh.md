# Meshtastic 抽奖系统

一个基于 Meshtastic 网络的实时抽奖系统，支持自动检测网络中的设备并进行公平抽奖
![](https://pic1.imgdb.cn/item/684a46f058cb8da5c84691c0.jpg)

## 🌟 功能特性

- **自动参与** - 通过在 Meshtastic 网络中发送指定暗号，自动加入抽奖池。
- **多等级奖项** - 支持配置多个奖项等级和对应的中奖人数。
- **实时状态同步** - 前端可通过 HTTP API 获取参与者名单、抽奖状态和结果。
- **公平抽奖** - 后端采用随机算法，确保每位参与者拥有平等的获奖机会。
- **用户识别** - 自动获取并显示参与者的 Meshtastic 用户名。
- **状态重置** - 可通过 API 随时清空参与者并重置系统，方便开始新的抽奖活动。

## 🛠 技术栈与架构

### 前端
- **Next.js 15** - React 全栈框架
- **TypeScript** - 强类型 JavaScript
- **Tailwind CSS** & **shadcn/ui** - 用于快速构建现代化 UI
- **Lucide React** - 图标库

### 后端
- **Python 3.8+**
- **Flask** & **Flask-CORS** - 提供轻量级的 HTTP API 服务
- **Meshtastic Python API** - 用于与 Meshtastic 硬件设备通信

#### 后端核心架构解析

为了确保 Web 服务（API）的响应性和 Meshtastic 消息监听的持续性，后端采用了多线程架构：

1.  **主线程 (Flask App)**:
    * 运行 Flask Web 服务器，负责接收和处理来自前端的 HTTP 请求（如查询状态、触发抽奖、重置系统）。这是与用户界面交互的主要通道。

2.  **Meshtastic 监听线程 (`meshtastic_thread`)**:
    * 在程序启动时，会创建一个独立的后台守护线程 (`daemon=True`)。
    * 此线程专门负责通过串口 (`SerialInterface`) 连接 Meshtastic 设备并持续监听网络消息。
    * 使用 `pubsub` 库，通过订阅 `meshtastic.receive` 事件，将收到的所有网络数据包交由 `on_meshtastic_receive` 回调函数处理。
    * **这种设计将耗时的 I/O 操作（等待 LoRa 消息）与主线程分离，避免了 Web 服务的阻塞，确保 API 能够随时快速响应。**

3.  **抽奖执行线程**:
    * 当管理员通过 API 触发抽奖时，会**再创建一个临时的后台线程**来执行 `run_lottery` 函数。
    * 这可以防止抽奖过程（包含洗牌、延时等操作）阻塞 API 路由，使得前端可以立即收到“抽奖已开始”的响应，提供流畅的用户体验。

#### Meshtastic 接口交互逻辑

后端的 Meshtastic 交互是完全事件驱动的：

-   **连接与订阅**: 程序启动时，监听线程尝试连接设备，并订阅两类核心事件：
    -   `meshtastic.connection`: 用于监控与设备的连接状态（成功或断开），并在控制台打印日志。
    -   `meshtastic.receive`: **这是最重要的事件**，每当从 Meshtastic 网络收到一个数据包时，该事件就会被触发。

-   **消息处理 (`on_meshtastic_receive` 函数)**:
    -   **抽奖参与**: 函数会检查收到的数据包是否为文本消息 (`TEXT_MESSAGE_APP`)。如果是，它会进一步检查消息内容是否包含预设的关键字 (`LOTTERY_KEYWORD`，默认为 "我要抽奖")。若包含，则将发送者的 ID 添加到 `lottery_participants` 集合中，完成抽奖登记。
    -   **用户信息更新**: 函数还会监听节点信息包 (`NODEINFO_APP`)。当收到这类包时，它会解析出用户的 ID 和长名称（longName），并更新到 `node_info_map` 字典中。这样，在显示参与者和中奖者时，就能展示用户设置的名称，而不是一串机器 ID。

## 📦 安装和运行

### 环境要求
- Node.js 18+
- Python 3.8+
- 已连接到电脑的 Meshtastic 设备

### 1. 克隆项目
```bash
git clone <repository-url>
cd meshtastic-lottery
```

### 2. 安装后端依赖
```bash
pip install flask flask-cors meshtastic
```

### 3. 安装前端依赖
```bash
npm install
```

### 4. 启动后端服务器
> **注意**: 请确保您的文件名与命令匹配，根据您提供的代码，文件名为 `background_server.py`。

```bash
python background_server.py
```
后端服务器将在 `http://127.0.0.1:5000` 启动。

### 5. 启动前端开发服务器
```bash
npm run dev
```
前端应用将在 `http://localhost:3000` 启动。

## 📡 API 文档

### GET `/status`
获取系统当前完整状态，用于前端轮询刷新。

**响应示例：**
```json
{
  "status": "running",
  "participants": [
    {
      "id": "!a1b2c3d4",
      "name": "张三"
    },
    {
      "id": "!e5f6g7h8",
      "name": "李四"
    }
  ],
  "participantCount": 2,
  "keyword": "我要抽奖",
  "prizes": {
    "一等奖": 1,
    "二等奖": 3,
    "三等奖": 5
  },
  "inProgress": false,
  "results": {
      "一等奖": [{"id": "!a1b2c3d4", "name": "张三"}]
  },
  "lastUpdate": 1672531200.123
}
```

### POST `/trigger-draw`
触发抽奖。抽奖过程将在后台线程中运行。

**请求体：** (空)

**成功响应：**
```json
{
  "message": "抽奖已开始"
}
```

**失败响应 (示例)：**
```json
{
  "error": "没有参与者"
}
```

### POST `/reset`
重置系统状态，清空所有参与者、抽奖结果，并终止正在进行的抽奖。

**请求体：** (空)

**响应示例：**
```json
{
  "message": "抽奖状态已重置"
}
```
## 运行时效果展示
![](https://pic1.imgdb.cn/item/684a4a7758cb8da5c8469492.png)

## 🤝 贡献指南

欢迎参与项目贡献！

1. Fork 本项目
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request


## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Meshtastic](https://meshtastic.org/) - 开源 LoRa 网状网络项目
- [Next.js](https://nextjs.org/) - React 全栈框架
- [shadcn/ui](https://ui.shadcn.com/) - 优秀的 UI 组件库

## 📞 支持

如果你遇到问题或有建议，请：

1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue
3. 联系项目维护者

---

**注意：** 本项目仅供学习和娱乐使用，请确保在使用过程中遵守当地法律法规。