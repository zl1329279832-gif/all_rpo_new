import psutil
import socket
import requests
import json
import time
import platform
from datetime import datetime

SERVER_URL = "http://localhost:8080"
REPORT_INTERVAL = 30


def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_system_info():
    info = {
        "hostname": socket.gethostname(),
        "osType": platform.system(),
        "osVersion": platform.version(),
        "cpuCores": psutil.cpu_count(logical=True),
        "totalMemoryGb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
        "totalDiskGb": round(psutil.disk_usage('/').total / (1024 ** 3), 2)
    }
    return info


def get_metrics():
    cpu_percent = psutil.cpu_percent(interval=1)
    
    memory = psutil.virtual_memory()
    memory_usage = memory.percent
    memory_used_gb = round(memory.used / (1024 ** 3), 2)
    
    disk = psutil.disk_usage('/')
    disk_usage = disk.percent
    disk_used_gb = round(disk.used / (1024 ** 3), 2)
    
    net_io_start = psutil.net_io_counters()
    time.sleep(1)
    net_io_end = psutil.net_io_counters()
    
    bytes_sent = net_io_end.bytes_sent - net_io_start.bytes_sent
    bytes_recv = net_io_end.bytes_recv - net_io_start.bytes_recv
    
    network_out_mbps = round((bytes_sent * 8) / (1024 * 1024), 2)
    network_in_mbps = round((bytes_recv * 8) / (1024 * 1024), 2)
    
    return {
        "cpuUsage": round(cpu_percent, 2),
        "memoryUsage": round(memory_usage, 2),
        "memoryUsedGb": memory_used_gb,
        "diskUsage": round(disk_usage, 2),
        "diskUsedGb": disk_used_gb,
        "networkInMbps": network_in_mbps,
        "networkOutMbps": network_out_mbps
    }


def report_metrics(server_url, system_info, metrics):
    url = f"{server_url}/api/metrics/report"
    
    payload = {
        "ipAddress": get_ip_address(),
        "hostname": system_info["hostname"],
        "osType": system_info["osType"],
        "osVersion": system_info["osVersion"],
        "cpuCores": system_info["cpuCores"],
        "totalMemoryGb": system_info["totalMemoryGb"],
        "totalDiskGb": system_info["totalDiskGb"],
        "cpuUsage": metrics["cpuUsage"],
        "memoryUsage": metrics["memoryUsage"],
        "memoryUsedGb": metrics["memoryUsedGb"],
        "diskUsage": metrics["diskUsage"],
        "diskUsedGb": metrics["diskUsedGb"],
        "networkInMbps": metrics["networkInMbps"],
        "networkOutMbps": metrics["networkOutMbps"],
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print(f"[{datetime.now()}] 上报成功 - CPU: {metrics['cpuUsage']}%, 内存: {metrics['memoryUsage']}%, 磁盘: {metrics['diskUsage']}%")
        else:
            print(f"[{datetime.now()}] 上报失败 - HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[{datetime.now()}] 上报异常: {e}")


def main():
    print("=" * 50)
    print("服务器资源监控 Agent")
    print("=" * 50)
    
    system_info = get_system_info()
    print(f"主机名: {system_info['hostname']}")
    print(f"操作系统: {system_info['osType']} {system_info['osVersion']}")
    print(f"CPU核心: {system_info['cpuCores']}")
    print(f"总内存: {system_info['totalMemoryGb']} GB")
    print(f"总磁盘: {system_info['totalDiskGb']} GB")
    print(f"上报地址: {SERVER_URL}")
    print(f"上报间隔: {REPORT_INTERVAL} 秒")
    print("=" * 50)
    print("开始监控... (按 Ctrl+C 停止)")
    print()
    
    while True:
        try:
            metrics = get_metrics()
            report_metrics(SERVER_URL, system_info, metrics)
            
            for _ in range(REPORT_INTERVAL - 2):
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n监控已停止")
            break
        except Exception as e:
            print(f"[{datetime.now()}] 发生异常: {e}")
            time.sleep(5)


if __name__ == "__main__":
    main()
