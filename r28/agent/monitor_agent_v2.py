import psutil
import socket
import requests
import json
import time
import platform
import os
import sys
from datetime import datetime
from pathlib import Path


class MonitorAgent:
    def __init__(self, config_file=None):
        self.config = self.load_config(config_file)
        self.server_url = self.config.get("server_url", "http://localhost:8080")
        self.report_interval = self.config.get("report_interval", 30)
        self.log_file = self.config.get("log_file", "agent.log")
        self.verbose = self.config.get("verbose", True)
        self.running = False
        
    def load_config(self, config_file):
        default_config = {
            "server_url": "http://localhost:8080",
            "report_interval": 30,
            "log_file": "agent.log",
            "verbose": True
        }
        
        if config_file:
            config_path = Path(config_file)
        else:
            script_dir = Path(__file__).parent
            config_path = script_dir / "config.json"
        
        if config_path.exists():
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                self.log(f"读取配置文件失败: {e}, 使用默认配置", "ERROR")
        
        return default_config
    
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] [{level}] {message}"
        
        if self.verbose:
            print(log_line)
        
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_line + "\n")
        except Exception:
            pass
    
    def get_ip_address(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            try:
                return socket.gethostbyname(socket.gethostname())
            except Exception:
                return "127.0.0.1"
    
    def get_system_info(self):
        info = {
            "hostname": socket.gethostname(),
            "osType": platform.system(),
            "osVersion": platform.version(),
            "cpuCores": psutil.cpu_count(logical=True),
            "totalMemoryGb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
            "totalDiskGb": round(psutil.disk_usage(self.get_root_path()).total / (1024 ** 3), 2)
        }
        return info
    
    def get_root_path(self):
        if platform.system() == "Windows":
            return "C:\\"
        return "/"
    
    def get_metrics(self):
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            memory_used_gb = round(memory.used / (1024 ** 3), 2)
            
            disk = psutil.disk_usage(self.get_root_path())
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
        except Exception as e:
            self.log(f"采集指标失败: {e}", "ERROR")
            return None
    
    def report_metrics(self, system_info, metrics):
        if not metrics:
            return False
        
        url = f"{self.server_url}/api/metrics/report"
        
        payload = {
            "ipAddress": self.get_ip_address(),
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
                result = response.json()
                if result.get("success", True):
                    self.log(
                        f"上报成功 - CPU: {metrics['cpuUsage']}%, "
                        f"内存: {metrics['memoryUsage']}%, "
                        f"磁盘: {metrics['diskUsage']}%"
                    )
                    return True
                else:
                    self.log(f"上报失败: {result.get('message', '未知错误')}", "ERROR")
            else:
                self.log(f"上报失败 - HTTP {response.status_code}: {response.text}", "ERROR")
        except requests.exceptions.ConnectionError:
            self.log(f"无法连接到服务器: {self.server_url}", "ERROR")
        except requests.exceptions.Timeout:
            self.log("请求超时", "ERROR")
        except Exception as e:
            self.log(f"上报异常: {e}", "ERROR")
        
        return False
    
    def start(self):
        self.running = True
        
        self.log("=" * 60)
        self.log("服务器资源监控 Agent 启动")
        self.log("=" * 60)
        
        system_info = self.get_system_info()
        self.log(f"主机名: {system_info['hostname']}")
        self.log(f"IP地址: {self.get_ip_address()}")
        self.log(f"操作系统: {system_info['osType']} {system_info['osVersion']}")
        self.log(f"CPU核心: {system_info['cpuCores']}")
        self.log(f"总内存: {system_info['totalMemoryGb']} GB")
        self.log(f"总磁盘: {system_info['totalDiskGb']} GB")
        self.log(f"上报地址: {self.server_url}")
        self.log(f"上报间隔: {self.report_interval} 秒")
        self.log("=" * 60)
        self.log("开始监控... (按 Ctrl+C 停止)")
        
        while self.running:
            try:
                metrics = self.get_metrics()
                self.report_metrics(system_info, metrics)
                
                wait_time = self.report_interval - 2
                for _ in range(wait_time):
                    if not self.running:
                        break
                    time.sleep(1)
                    
            except KeyboardInterrupt:
                self.log("\n收到停止信号，正在退出...")
                self.running = False
                break
            except Exception as e:
                self.log(f"发生异常: {e}", "ERROR")
                time.sleep(5)
        
        self.log("Agent 已停止")
    
    def stop(self):
        self.running = False


def main():
    config_file = None
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    
    agent = MonitorAgent(config_file)
    
    try:
        agent.start()
    except KeyboardInterrupt:
        agent.stop()
    except Exception as e:
        print(f"启动失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
