# ============================================================
# 后端项目 Dockerfile (Windows 容器)
# Spring Boot 3 + JDK 17
# 多阶段构建：构建阶段 + 运行阶段
# ============================================================

# ============================================================
# 第一阶段：构建阶段 - 使用 Maven 镜像打包项目
# ============================================================
FROM mcr.microsoft.com/windows/servercore:ltsc2022 AS build-env

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV JAVA_VERSION=17.0.19
ENV MAVEN_VERSION=3.9.9
ENV JAVA_HOME=C:\jdk-17
ENV MAVEN_HOME=C:\maven
ENV PATH=${PATH};C:\jdk-17\bin;C:\maven\bin

# 下载并安装 JDK 17
RUN powershell -Command `
    $ProgressPreference = 'SilentlyContinue'; `
    Write-Host "Downloading JDK 17..."; `
    Invoke-WebRequest -Uri "https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_windows-x64_bin.zip" -OutFile "jdk.zip"; `
    Write-Host "Extracting JDK 17..."; `
    Expand-Archive -Path "jdk.zip" -DestinationPath "C:\"; `
    Rename-Item -Path "C:\jdk-17.0.2" -NewName "jdk-17"; `
    Remove-Item "jdk.zip"

# 下载并安装 Maven
RUN powershell -Command `
    $ProgressPreference = 'SilentlyContinue'; `
    Write-Host "Downloading Maven..."; `
    Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip" -OutFile "maven.zip"; `
    Write-Host "Extracting Maven..."; `
    Expand-Archive -Path "maven.zip" -DestinationPath "C:\"; `
    Rename-Item -Path "C:\apache-maven-3.9.9" -NewName "maven"; `
    Remove-Item "maven.zip"

# 复制 pom.xml
COPY pom.xml ./

# 下载 Maven 依赖（利用 Docker 缓存）
RUN powershell -Command `
    $env:JAVA_HOME = 'C:\jdk-17'; `
    $env:PATH = "C:\jdk-17\bin;C:\maven\bin;${env:PATH}"; `
    Write-Host "Downloading Maven dependencies..."; `
    mvn dependency:go-offline -B

# 复制所有源代码
COPY . .

# 打包项目
RUN powershell -Command `
    $env:JAVA_HOME = 'C:\jdk-17'; `
    $env:PATH = "C:\jdk-17\bin;C:\maven\bin;${env:PATH}"; `
    Write-Host "Building project..."; `
    mvn clean package -DskipTests

# ============================================================
# 第二阶段：运行阶段 - 使用 JDK 运行时镜像
# ============================================================
FROM mcr.microsoft.com/windows/servercore:ltsc2022

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV JAVA_HOME=C:\jdk-17
ENV PATH=${PATH};C:\jdk-17\bin

# 下载并安装 JDK 17（运行时）
RUN powershell -Command `
    $ProgressPreference = 'SilentlyContinue'; `
    Write-Host "Downloading JRE 17..."; `
    Invoke-WebRequest -Uri "https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_windows-x64_bin.zip" -OutFile "jdk.zip"; `
    Write-Host "Extracting JRE 17..."; `
    Expand-Archive -Path "jdk.zip" -DestinationPath "C:\"; `
    Rename-Item -Path "C:\jdk-17.0.2" -NewName "jdk-17"; `
    Remove-Item "jdk.zip"

# 从构建阶段复制打包好的 jar 文件
COPY --from=build-env /app/target/*.jar app.jar

# 暴露端口
EXPOSE 8080

# 设置 JVM 参数（可选，可在运行时覆盖）
ENV JAVA_OPTS="-Xms256m -Xmx512m"

# 启动 Spring Boot 应用
ENTRYPOINT ["powershell", "-Command", "java $env:JAVA_OPTS -jar app.jar"]
