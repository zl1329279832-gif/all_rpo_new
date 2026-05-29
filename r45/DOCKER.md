# Docker 部署说明

## 前置要求

1. 已安装 Docker 和 Docker Compose
2. 已安装 X 服务器（用于显示 GUI）：
   - **Linux**: 无需额外安装，系统自带 X11
   - **Windows**: 安装 [VcXsrv](https://sourceforge.net/projects/vcxsrv/) 或 [Xming](https://sourceforge.net/projects/xming/)
   - **macOS**: 安装 [XQuartz](https://www.xquartz.org/)

---

## 方式一：使用 Docker Compose（推荐）

### 1. Linux 部署

```bash
# 允许 Docker 访问 X 服务器
xhost +local:root

# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

### 2. Windows 部署（使用 VcXsrv）

1. **启动 VcXsrv**：
   - 运行 XLaunch
   - 选择 "Multiple windows"
   - Display number 设置为 0
   - 勾选 "Disable access control"

2. **设置环境变量并启动**：

```powershell
# PowerShell
$env:DISPLAY = "host.docker.internal:0.0"
docker compose up -d
docker compose logs -f
```

### 3. macOS 部署（使用 XQuartz）

1. 启动 XQuartz
2. 在 XQuartz 偏好设置中勾选 "Allow connections from network clients"
3. 重启 XQuartz
4. 在终端执行：

```bash
xhost +localhost
export DISPLAY=host.docker.internal:0
docker compose up -d
docker compose logs -f
```

---

## 方式二：使用 Docker 命令直接运行

### 构建镜像

```bash
docker build -t studio-order-system .
```

### Linux 运行

```bash
xhost +local:root

docker run -it --rm \
  --name studio-order-system \
  --network host \
  --privileged \
  -e DISPLAY=$DISPLAY \
  -e QT_X11_NO_MITSHM=1 \
  -v /tmp/.X11-unix:/tmp/.X11-unix:rw \
  -v $XAUTHORITY:/root/.Xauthority:ro \
  -v $(pwd)/studio.db:/app/studio.db \
  -v $(pwd)/thumbnails:/app/thumbnails \
  -v $(pwd)/exports:/app/exports \
  -v $(pwd)/backups:/app/backups \
  -v $(pwd)/logs:/app/logs \
  --device /dev/dri \
  studio-order-system
```

### Windows PowerShell 运行

```powershell
$env:DISPLAY = "host.docker.internal:0.0"

docker run -it --rm `
  --name studio-order-system `
  -e DISPLAY=$env:DISPLAY `
  -e QT_X11_NO_MITSHM=1 `
  -v /tmp/.X11-unix:/tmp/.X11-unix:rw `
  -v "$(pwd)/studio.db:/app/studio.db" `
  -v "$(pwd)/thumbnails:/app/thumbnails" `
  -v "$(pwd)/exports:/app/exports" `
  -v "$(pwd)/backups:/app/backups" `
  -v "$(pwd)/logs:/app/logs" `
  studio-order-system
```

---

## 无界面模式（仅数据查询）

如果不需要 GUI，可以直接查询数据：

```bash
docker compose --profile headless up headless-demo
```

或者使用 docker run：

```bash
docker run -it --rm \
  -e QT_QPA_PLATFORM=offscreen \
  -v $(pwd)/studio.db:/app/studio.db \
  studio-order-system \
  python -c "
import sys
sys.path.insert(0, '/app')
from database.db_manager import DatabaseManager
from services.order_service import OrderService
db = DatabaseManager()
svc = OrderService(db)
orders = svc.get_all_orders()
print(f'总订单数: {len(orders)}')
for o in orders[:5]:
    print(f'  {o.get(\"order_no\")}: {o.get(\"customer_name\")} - {o.get(\"order_status\")}')
db.close()
"
```

---

## 数据持久化

以下目录通过 volume 挂载到宿主机，确保数据持久化：

| 容器路径 | 宿主机路径 | 说明 |
|---------|-----------|------|
| `/app/studio.db` | `./studio.db` | SQLite 数据库文件 |
| `/app/thumbnails` | `./thumbnails` | 缩略图缓存 |
| `/app/exports` | `./exports` | 导出的交付清单 |
| `/app/backups` | `./backups` | 数据库备份 |
| `/app/logs` | `./logs` | 应用日志 |

---

## 常见问题

### 1. GUI 无法显示

**Linux**:
```bash
# 检查 DISPLAY 变量
echo $DISPLAY

# 重新授权 X 服务器
xhost +local:root
```

**Windows**:
- 确保 VcXsrv 正在运行
- 确认 "Disable access control" 已勾选
- 防火墙允许 VcXsrv 访问网络

**macOS**:
```bash
# 在 XQuartz 中执行
xhost +localhost
```

### 2. 中文字体显示乱码

镜像已安装文泉驿微米黑和正黑体，若仍有乱码：
```bash
# 进入容器检查字体
docker exec -it studio-order-system fc-list :lang=zh
```

### 3. 容器启动后立即退出

检查 DISPLAY 环境变量是否正确设置，以及 X 服务器是否正常运行。

### 4. 权限问题

```bash
# 确保数据目录权限正确
chmod -R 777 thumbnails exports backups logs
```

### 5. 重建镜像

```bash
# 清理旧镜像
docker compose down --rmi all

# 重新构建
docker compose build --no-cache

# 启动
docker compose up -d
```

---

## 快速命令

```bash
# 构建并启动
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止
docker compose stop

# 停止并移除容器
docker compose down

# 进入容器
docker exec -it studio-order-system bash

# 只初始化数据不启动 GUI
docker run -it --rm \
  -v $(pwd)/studio.db:/app/studio.db \
  studio-order-system python demo/seed_data.py
```
