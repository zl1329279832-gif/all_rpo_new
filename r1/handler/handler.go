package handler

import (
	"net/http"
	"r1/service"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *service.Service
}

func NewHandler(svc *service.Service) *Handler {
	return &Handler{service: svc}
}

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func (h *Handler) CreateRule(c *gin.Context) {
	var req service.CreateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	rule, err := h.service.CreateRule(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: rule})
}

func (h *Handler) UpdateRule(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req service.UpdateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	rule, err := h.service.UpdateRule(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: rule})
}

func (h *Handler) GetRule(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	rule, err := h.service.GetRule(id)
	if err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "rule not found"})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: rule})
}

func (h *Handler) ListRules(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	rules, total, err := h.service.ListRules(offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: map[string]interface{}{
		"items": rules,
		"total": total,
	}})
}

func (h *Handler) ListRuleVersions(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	versions, err := h.service.ListRuleVersions(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: versions})
}

func (h *Handler) CreateSample(c *gin.Context) {
	var req service.CreateSampleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	sample, err := h.service.CreateSample(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: sample})
}

func (h *Handler) BatchCreateSamples(c *gin.Context) {
	var req service.BatchCreateSamplesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	if err := h.service.BatchCreateSamples(&req); err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success"})
}

func (h *Handler) GetSample(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	sample, err := h.service.GetSample(id)
	if err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "sample not found"})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: sample})
}

func (h *Handler) ListSamples(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	samples, total, err := h.service.ListSamples(offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: map[string]interface{}{
		"items": samples,
		"total": total,
	}})
}

func (h *Handler) CreateBacktestTask(c *gin.Context) {
	var req service.CreateBacktestTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	task, err := h.service.CreateBacktestTask(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: task})
}

func (h *Handler) RunBacktest(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.service.RunBacktest(id); err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "backtest started"})
}

func (h *Handler) GetBacktestTask(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	task, err := h.service.GetBacktestTask(id)
	if err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "task not found"})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: task})
}

func (h *Handler) ListBacktestTasks(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	tasks, total, err := h.service.ListBacktestTasks(offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: map[string]interface{}{
		"items": tasks,
		"total": total,
	}})
}

func (h *Handler) GetBacktestResults(c *gin.Context) {
	taskID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	results, total, err := h.service.GetBacktestResults(taskID, offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: map[string]interface{}{
		"items": results,
		"total": total,
	}})
}

func (h *Handler) GetHitDetails(c *gin.Context) {
	taskID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	details, err := h.service.GetHitDetails(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: details})
}

func (h *Handler) TestRule(c *gin.Context) {
	var req struct {
		Expression string                 `json:"expression"`
		Data       map[string]interface{} `json:"data"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	result, err := h.service.TestRule(req.Expression, req.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 200, Message: "success", Data: map[string]interface{}{
		"hit": result,
	}})
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, Response{Code: 200, Message: "ok"})
}
