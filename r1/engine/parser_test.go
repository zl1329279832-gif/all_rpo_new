package engine

import (
	"testing"
)

func TestNewRuleEngine(t *testing.T) {
	engine := NewRuleEngine()
	if engine == nil {
		t.Fatal("NewRuleEngine() returned nil")
	}
}

func TestSimpleComparisons(t *testing.T) {
	engine := NewRuleEngine()
	tests := []struct {
		name     string
		expr     string
		data     map[string]interface{}
		expected bool
	}{
		{
			name: "amount > 1000 - true",
			expr: "amount > 1000",
			data: map[string]interface{}{"amount": 1500},
			expected: true,
		},
		{
			name: "amount > 1000 - false",
			expr: "amount > 1000",
			data: map[string]interface{}{"amount": 500},
			expected: false,
		},
		{
			name: "userLevel == \"new\" - true",
			expr: "userLevel == \"new\"",
			data: map[string]interface{}{"userLevel": "new"},
			expected: true,
		},
		{
			name: "userLevel == \"new\" - false",
			expr: "userLevel == \"new\"",
			data: map[string]interface{}{"userLevel": "vip"},
			expected: false,
		},
		{
			name: "ipRiskScore >= 80 - true",
			expr: "ipRiskScore >= 80",
			data: map[string]interface{}{"ipRiskScore": 85},
			expected: true,
		},
		{
			name: "ipRiskScore >= 80 - equal",
			expr: "ipRiskScore >= 80",
			data: map[string]interface{}{"ipRiskScore": 80},
			expected: true,
		},
		{
			name: "amount <= 5000 - true",
			expr: "amount <= 5000",
			data: map[string]interface{}{"amount": 3000},
			expected: true,
		},
		{
			name: "userLevel != \"blocked\" - true",
			expr: "userLevel != \"blocked\"",
			data: map[string]interface{}{"userLevel": "normal"},
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := engine.Evaluate(tt.expr, tt.data)
			if err != nil {
				t.Fatalf("Evaluate() error = %v", err)
			}
			if result != tt.expected {
				t.Errorf("Evaluate() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestAndLogic(t *testing.T) {
	engine := NewRuleEngine()
	tests := []struct {
		name     string
		expr     string
		data     map[string]interface{}
		expected bool
	}{
		{
			name: "both conditions true",
			expr: "amount > 1000 AND userLevel == \"new\"",
			data: map[string]interface{}{"amount": 1500, "userLevel": "new"},
			expected: true,
		},
		{
			name: "first false, second true",
			expr: "amount > 1000 AND userLevel == \"new\"",
			data: map[string]interface{}{"amount": 500, "userLevel": "new"},
			expected: false,
		},
		{
			name: "first true, second false",
			expr: "amount > 1000 AND userLevel == \"new\"",
			data: map[string]interface{}{"amount": 1500, "userLevel": "vip"},
			expected: false,
		},
		{
			name: "both conditions false",
			expr: "amount > 1000 AND userLevel == \"new\"",
			data: map[string]interface{}{"amount": 500, "userLevel": "vip"},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := engine.Evaluate(tt.expr, tt.data)
			if err != nil {
				t.Fatalf("Evaluate() error = %v", err)
			}
			if result != tt.expected {
				t.Errorf("Evaluate() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestOrLogic(t *testing.T) {
	engine := NewRuleEngine()
	tests := []struct {
		name     string
		expr     string
		data     map[string]interface{}
		expected bool
	}{
		{
			name: "both conditions true",
			expr: "amount > 1000 OR ipRiskScore >= 80",
			data: map[string]interface{}{"amount": 1500, "ipRiskScore": 85},
			expected: true,
		},
		{
			name: "first true, second false",
			expr: "amount > 1000 OR ipRiskScore >= 80",
			data: map[string]interface{}{"amount": 1500, "ipRiskScore": 50},
			expected: true,
		},
		{
			name: "first false, second true",
			expr: "amount > 1000 OR ipRiskScore >= 80",
			data: map[string]interface{}{"amount": 500, "ipRiskScore": 85},
			expected: true,
		},
		{
			name: "both conditions false",
			expr: "amount > 1000 OR ipRiskScore >= 80",
			data: map[string]interface{}{"amount": 500, "ipRiskScore": 50},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := engine.Evaluate(tt.expr, tt.data)
			if err != nil {
				t.Fatalf("Evaluate() error = %v", err)
			}
			if result != tt.expected {
				t.Errorf("Evaluate() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestParentheses(t *testing.T) {
	engine := NewRuleEngine()
	tests := []struct {
		name     string
		expr     string
		data     map[string]interface{}
		expected bool
	}{
		{
			name: "complex expression 1",
			expr: "(amount > 1000 AND userLevel == \"new\") OR ipRiskScore >= 90",
			data: map[string]interface{}{"amount": 1500, "userLevel": "new", "ipRiskScore": 80},
			expected: true,
		},
		{
			name: "complex expression 2",
			expr: "(amount > 1000 AND userLevel == \"new\") OR ipRiskScore >= 90",
			data: map[string]interface{}{"amount": 500, "userLevel": "vip", "ipRiskScore": 95},
			expected: true,
		},
		{
			name: "complex expression 3",
			expr: "(amount > 1000 AND userLevel == \"new\") OR ipRiskScore >= 90",
			data: map[string]interface{}{"amount": 500, "userLevel": "vip", "ipRiskScore": 80},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := engine.Evaluate(tt.expr, tt.data)
			if err != nil {
				t.Fatalf("Evaluate() error = %v", err)
			}
			if result != tt.expected {
				t.Errorf("Evaluate() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestFieldNotFound(t *testing.T) {
	engine := NewRuleEngine()
	result, err := engine.Evaluate("amount > 1000", map[string]interface{}{"other": 1500})
	if err != nil {
		t.Fatalf("Evaluate() unexpected error = %v", err)
	}
	if result != false {
		t.Errorf("Evaluate() with missing field should return false, got %v", result)
	}
}
