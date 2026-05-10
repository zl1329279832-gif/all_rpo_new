# 服务器资源监控 Agent

这是一个跨平台的服务器资源监控采集程序，用于采集服务器的 CPU、内存、磁盘、网络等指标并上报到监控系统。

## 功能特性

- 跨平台支持：Windows / Linux / macOS
- 自动采集：CPU使用率、内存使用率、磁盘使用率、网络带宽
- 自动上报：每 30 秒（可配置）上报一次指标
- 自动注册：首次上报时自动在监控系统中注册服务器
- 日志记录：支持控制台输出和文件日志

## 环境要求

- Python 3.7+
- pip（Python 包管理器）

## 快速开始

### 1. 安装依赖

```bash
cd agent
pip install -r requirements.txt
```

### 2. 配置

编辑 `config.json` 文件：

```json
{
  "server_url": "http://your-monitor-server:8080",
  "report_interval": 30,
  "log_file": "agent.log",
  "verbose": true
}
```

配置项说明：
- `server_url`: 监控系统后端地址
- `report_interval`: 上报间隔（秒），默认 30 秒
- `log_file`: 日志文件路径
- `verbose`: 是否输出到控制台

### 3. 运行

使用 V2 版本（推荐）：

```bash
python monitor_agent_v2.py
```

或指定配置文件：

```bash
python monitor_agent_v2.py /path/to/config.json
```

## 采集的指标

| 指标 | 说明 | 单位 |
|------|------|------|
| cpuUsage | CPU 使用率 | % |
| memoryUsage | 内存使用率 | % |
| memoryUsedGb | 已用内存 | GB |
| diskUsage | 磁盘使用率 | % |
| diskUsedGb | 已用磁盘 | GB |
| networkInMbps | 入站网络带宽 | Mbps |
| networkOutMbps | 出站网络带宽 | Mbps |

## 自动注册机制

当 Agent 首次向监控系统上报数据时，系统会：

1. 根据上报的 IP 地址查找已存在的服务器
2. 如果服务器不存在，自动创建新服务器记录
3. 使用主机名作为服务器名称
4. 自动更新服务器的系统信息（OS 版本、CPU 核心数、内存总量等）

## 告警触发

告警规则由监控系统后端管理，当采集的指标满足以下条件时会自动触发告警：

| 规则 | 阈值 | 级别 |
|------|------|------|
| CPU 使用率 | > 80% | 警告 |
| 内存使用率 | > 85% | 错误 |
| 磁盘使用率 | > 90% | 严重 |

## 后台运行

### Linux / macOS

创建 systemd 服务文件 `/etc/systemd/system/monitor-agent.service`：

```ini
[Unit]
Description=Server Monitor Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/monitor-agent
ExecStart=/usr/bin/python3 /opt/monitor-agent/monitor_agent_v2.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable monitor-agent
sudo systemctl start monitor-agent
sudo systemctl status monitor-agent
```

### Windows

使用任务计划程序或 NSSM：

```powershell
# 安装为 Windows 服务（使用 NSSM）
nssm install MonitorAgent
```

或者使用 PowerShell 创建计划任务。

## 故障排查

### 无法连接到服务器

```
[ERROR] 无法连接到服务器: http://localhost:8080
```

检查：
- 监控系统后端是否已启动
- `config.json` 中的 `server_url` 是否正确
- 网络连接是否正常

### 模块导入错误

```
ModuleNotFoundError: No module named 'psutil'
```

解决：
```bash
pip install -r requirements.txt
```

### 权限问题（Linux）

确保运行 Agent 的用户有权限读取系统信息，建议使用 root 或具有 sudo 权限的用户运行。

## 开发说明

目录结构：
```
agent/
├── monitor_agent.py      # 简单版（单文件）
├── monitor_agent_v2.py   # 增强版（推荐）
├── requirements.txt      # Python 依赖
├── config.json           # 配置文件
└── README_AGENT.md       # 本文档
```

## License

MIT License
