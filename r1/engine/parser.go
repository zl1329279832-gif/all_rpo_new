package engine

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
)

type RuleEngine struct{}

func NewRuleEngine() *RuleEngine {
	return &RuleEngine{}
}

type Condition struct {
	Field    string
	Operator string
	Value    interface{}
}

type ExpressionNode interface {
	Evaluate(data map[string]interface{}) bool
}

type AndNode struct {
	Left  ExpressionNode
	Right ExpressionNode
}

func (n *AndNode) Evaluate(data map[string]interface{}) bool {
	return n.Left.Evaluate(data) && n.Right.Evaluate(data)
}

type OrNode struct {
	Left  ExpressionNode
	Right ExpressionNode
}

func (n *OrNode) Evaluate(data map[string]interface{}) bool {
	return n.Left.Evaluate(data) || n.Right.Evaluate(data)
}

type ConditionNode struct {
	Condition Condition
}

func (n *ConditionNode) Evaluate(data map[string]interface{}) bool {
	actualValue, exists := data[n.Condition.Field]
	if !exists {
		return false
	}
	return compare(actualValue, n.Condition.Operator, n.Condition.Value)
}

func compare(actual interface{}, operator string, expected interface{}) bool {
	actualFloat, ok1 := toFloat64(actual)
	expectedFloat, ok2 := toFloat64(expected)
	if ok1 && ok2 {
		switch operator {
		case ">":
			return actualFloat > expectedFloat
		case ">=":
			return actualFloat >= expectedFloat
		case "<":
			return actualFloat < expectedFloat
		case "<=":
			return actualFloat <= expectedFloat
		case "==":
			return actualFloat == expectedFloat
		case "!=":
			return actualFloat != expectedFloat
		}
	}
	actualStr := fmt.Sprintf("%v", actual)
	expectedStr := fmt.Sprintf("%v", expected)
	switch operator {
	case "==":
		return actualStr == expectedStr
	case "!=":
		return actualStr != expectedStr
	case ">":
		return actualStr > expectedStr
	case ">=":
		return actualStr >= expectedStr
	case "<":
		return actualStr < expectedStr
	case "<=":
		return actualStr <= expectedStr
	default:
		return false
	}
}

func toFloat64(v interface{}) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case float32:
		return float64(val), true
	case int:
		return float64(val), true
	case int64:
		return float64(val), true
	case int32:
		return float64(val), true
	case string:
		f, err := strconv.ParseFloat(val, 64)
		return f, err == nil
	default:
		return 0, false
	}
}

func (e *RuleEngine) Evaluate(expression string, data map[string]interface{}) (bool, error) {
	ast, err := e.Parse(expression)
	if err != nil {
		return false, err
	}
	return ast.Evaluate(data), nil
}

func (e *RuleEngine) Parse(expression string) (ExpressionNode, error) {
	expression = strings.TrimSpace(expression)
	return parseOr(expression)
}

func parseOr(expr string) (ExpressionNode, error) {
	parts := splitByTopLevel(expr, "OR")
	if len(parts) == 1 {
		return parseAnd(parts[0])
	}
	var node ExpressionNode
	var err error
	for i, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		child, err := parseAnd(part)
		if err != nil {
			return nil, err
		}
		if i == 0 {
			node = child
		} else {
			node = &OrNode{Left: node, Right: child}
		}
	}
	return node, err
}

func parseAnd(expr string) (ExpressionNode, error) {
	parts := splitByTopLevel(expr, "AND")
	if len(parts) == 1 {
		return parseCondition(parts[0])
	}
	var node ExpressionNode
	var err error
	for i, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		child, err := parseCondition(part)
		if err != nil {
			return nil, err
		}
		if i == 0 {
			node = child
		} else {
			node = &AndNode{Left: node, Right: child}
		}
	}
	return node, err
}

func parseCondition(expr string) (ExpressionNode, error) {
	expr = strings.TrimSpace(expr)
	if strings.HasPrefix(expr, "(") && strings.HasSuffix(expr, ")") {
		return parseOr(expr[1 : len(expr)-1])
	}
	operators := []string{">=", "<=", "==", "!=", ">", "<"}
	for _, op := range operators {
		idx := strings.Index(expr, op)
		if idx != -1 {
			field := strings.TrimSpace(expr[:idx])
			valueStr := strings.TrimSpace(expr[idx+len(op):])
			value, err := parseValue(valueStr)
			if err != nil {
				return nil, err
			}
			return &ConditionNode{
				Condition: Condition{
					Field:    field,
					Operator: op,
					Value:    value,
				},
			}, nil
		}
	}
	return nil, fmt.Errorf("invalid condition: %s", expr)
}

func parseValue(valueStr string) (interface{}, error) {
	valueStr = strings.TrimSpace(valueStr)
	if (strings.HasPrefix(valueStr, "\"") && strings.HasSuffix(valueStr, "\"")) ||
		(strings.HasPrefix(valueStr, "'") && strings.HasSuffix(valueStr, "'")) {
		return valueStr[1 : len(valueStr)-1], nil
	}
	if f, err := strconv.ParseFloat(valueStr, 64); err == nil {
		return f, nil
	}
	if b, err := strconv.ParseBool(valueStr); err == nil {
		return b, nil
	}
	return valueStr, nil
}

func splitByTopLevel(expr string, sep string) []string {
	var result []string
	var current strings.Builder
	parenCount := 0
	sepLen := len(sep)
	for i := 0; i < len(expr); {
		if expr[i] == '(' {
			parenCount++
			current.WriteByte(expr[i])
			i++
		} else if expr[i] == ')' {
			parenCount--
			current.WriteByte(expr[i])
			i++
		} else if parenCount == 0 && i+sepLen <= len(expr) && strings.EqualFold(expr[i:i+sepLen], sep) {
			result = append(result, current.String())
			current.Reset()
			i += sepLen
		} else {
			current.WriteByte(expr[i])
			i++
		}
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}

func (e *RuleEngine) EvaluateWithJSON(expression string, jsonData []byte) (bool, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(jsonData, &data); err != nil {
		return false, err
	}
	return e.Evaluate(expression, data)
}

func (e *RuleEngine) EvaluateRules(expressions []string, data map[string]interface{}) ([]bool, error) {
	results := make([]bool, len(expressions))
	var errs []error
	for i, expr := range expressions {
		res, err := e.Evaluate(expr, data)
		if err != nil {
			errs = append(errs, err)
		}
		results[i] = res
	}
	if len(errs) > 0 {
		return results, fmt.Errorf("multiple errors: %v", errs)
	}
	return results, nil
}
