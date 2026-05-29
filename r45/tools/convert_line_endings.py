import os

files_to_convert = [
    "docker-entrypoint.sh",
    "docker-deploy.sh"
]

for f in files_to_convert:
    if os.path.exists(f):
        with open(f, 'rb') as file:
            content = file.read()
        content = content.replace(b'\r\n', b'\n')
        with open(f, 'wb') as file:
            file.write(content)
        print(f"已转换 {f} 为 LF 行尾符")
    else:
        print(f"文件不存在: {f}")
