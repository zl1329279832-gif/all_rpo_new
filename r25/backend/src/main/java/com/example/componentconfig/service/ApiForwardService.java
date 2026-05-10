package com.example.componentconfig.service;

import com.example.componentconfig.entity.RequestHistory;

import java.util.Map;

public interface ApiForwardService {
    ForwardResult forward(String url, String method, Map<String, String> headers, Map<String, Object> params, Object body, String componentId, String componentName);
    RequestHistory saveHistory(RequestHistory history);

    class ForwardResult {
        private int status;
        private String statusText;
        private Object data;
        private Map<String, String> headers;
        private long duration;
        private String requestId;
        private String error;

        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }
        public String getStatusText() { return statusText; }
        public void setStatusText(String statusText) { this.statusText = statusText; }
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
        public Map<String, String> getHeaders() { return headers; }
        public void setHeaders(Map<String, String> headers) { this.headers = headers; }
        public long getDuration() { return duration; }
        public void setDuration(long duration) { this.duration = duration; }
        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}
