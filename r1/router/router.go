package router

import (
	"r1/handler"

	"github.com/gin-gonic/gin"
)

func SetupRouter(h *handler.Handler) *gin.Engine {
	r := gin.Default()
	r.GET("/health", h.Health)
	api := r.Group("/api/v1")
	{
		rules := api.Group("/rules")
		{
			rules.POST("", h.CreateRule)
			rules.GET("", h.ListRules)
			rules.GET("/:id", h.GetRule)
			rules.PUT("/:id", h.UpdateRule)
			rules.GET("/:id/versions", h.ListRuleVersions)
		}
		samples := api.Group("/samples")
		{
			samples.POST("", h.CreateSample)
			samples.POST("/batch", h.BatchCreateSamples)
			samples.GET("", h.ListSamples)
			samples.GET("/:id", h.GetSample)
		}
		tasks := api.Group("/backtests")
		{
			tasks.POST("", h.CreateBacktestTask)
			tasks.GET("", h.ListBacktestTasks)
			tasks.GET("/:id", h.GetBacktestTask)
			tasks.POST("/:id/run", h.RunBacktest)
			tasks.GET("/:id/results", h.GetBacktestResults)
			tasks.GET("/:id/details", h.GetHitDetails)
		}
		api.POST("/test", h.TestRule)
	}
	return r
}
