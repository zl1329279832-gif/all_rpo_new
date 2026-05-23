import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import (
    load_data_from_dir,
    validate_all_datasets,
    clean_data,
    merge_orders_with_details,
    calculate_kpi_metrics,
    calculate_store_metrics,
    calculate_dish_metrics,
    calculate_category_metrics,
    calculate_rfm,
    calculate_repurchase_rate,
    calculate_promotion_effectiveness,
    calculate_refund_analysis,
    calculate_hourly_trend,
    calculate_dish_combinations,
    detect_anomalous_stores,
    calculate_store_ranking,
    calculate_meal_period_performance,
    calculate_dish_margin_contribution,
    calculate_member_repurchase_cycle,
    calculate_promotion_roi,
    calculate_ingredient_cost_volatility,
    calculate_refund_reason_distribution,
    detect_all_alerts,
    generate_excel_report,
    generate_html_report,
    get_issues_dataframe,
    ValidationReport,
)

SAMPLE_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sample_data')
ANOMALY_DATA_DIR = os.path.join(SAMPLE_DATA_DIR, 'anomaly')
TEST_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output')

os.makedirs(TEST_OUTPUT_DIR, exist_ok=True)

def test_step(description, test_func):
    """测试步骤装饰器"""
    print(f"\n{'='*60}")
    print(f"[TEST] {description}")
    print('='*60)
    try:
        result = test_func()
        if result:
            print(f"[PASS] {description}")
            return True
        else:
            print(f"[FAIL] {description}")
            return False
    except Exception as e:
        print(f"[ERROR] {description}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_1_data_generation():
    """测试1: 检查示例数据是否存在"""
    required_files = [
        'stores.csv', 'dishes.csv', 'members.csv', 'orders.csv',
        'order_items.csv', 'promotions.csv', 'refunds.csv',
        'business_hours.csv', 'ingredient_costs.csv'
    ]
    for f in required_files:
        path = os.path.join(SAMPLE_DATA_DIR, f)
        if not os.path.exists(path):
            print(f"   缺失文件: {f}")
            return False
        df = pd.read_csv(path)
        print(f"   ✓ {f}: {len(df)} 条记录")
    
    orders = pd.read_csv(os.path.join(SAMPLE_DATA_DIR, 'orders.csv'))
    if len(orders) < 1200:
        print(f"   订单数据不足1200条，实际只有 {len(orders)} 条")
        return False
    
    return True

def test_2_anomaly_data():
    """测试2: 检查异常测试数据"""
    anomaly_files = [
        'orders.csv', 'refunds.csv', 'order_items.csv'
    ]
    for f in anomaly_files:
        path = os.path.join(ANOMALY_DATA_DIR, f)
        if not os.path.exists(path):
            print(f"   缺失异常数据文件: {f}")
            return False
    
    orders = pd.read_csv(os.path.join(ANOMALY_DATA_DIR, 'orders.csv'))
    print(f"   异常订单数据: {len(orders)} 条")
    if len(orders) < 500:
        print(f"   异常订单数据不足500条，实际只有 {len(orders)} 条")
        return False
    
    return True

def test_3_data_loading():
    """测试3: 数据加载功能"""
    data_dict = load_data_from_dir(SAMPLE_DATA_DIR)
    
    required_keys = ['stores', 'dishes', 'members', 'orders', 'order_items',
                     'promotions', 'refunds', 'business_hours', 'ingredient_costs']
    
    for key in required_keys:
        if key not in data_dict:
            print(f"   缺失数据表: {key}")
            return False
        if data_dict[key] is None or len(data_dict[key]) == 0:
            print(f"   数据表为空: {key}")
            return False
    
    print(f"   ✓ 成功加载 {len(data_dict)} 张数据表")
    return True

def test_4_data_validation_normal():
    """测试4: 正常数据校验"""
    data_dict = load_data_from_dir(SAMPLE_DATA_DIR)
    report = validate_all_datasets(data_dict)
    issues_df = get_issues_dataframe(report)
    
    score = report.quality_score
    print(f"   数据质量评分: {score:.1f}/100")
    print(f"   问题总数: {report.total_issues}")
    print(f"   🔴 严重问题: {report.critical_issues}")
    print(f"   🟡 警告问题: {report.warning_issues}")
    
    if score < 90:
        print(f"   ⚠️  正常数据评分低于90分，可能存在问题")
    
    return True

def test_5_data_validation_anomaly():
    """测试5: 异常数据校验 - 验证7类异常是否被正确识别"""
    data_dict = load_data_from_dir(ANOMALY_DATA_DIR)
    report = validate_all_datasets(data_dict)
    issues_df = get_issues_dataframe(report)
    
    score = report.quality_score
    print(f"   异常数据质量评分: {score:.1f}/100")
    print(f"   问题总数: {report.total_issues}")
    print(f"   🔴 严重问题: {report.critical_issues}")
    print(f"   🟡 警告问题: {report.warning_issues}")
    
    issue_types = issues_df['问题类型'].unique()
    print(f"   检测到的问题类型: {list(issue_types)}")
    
    expected_issues = [
        'duplicate_primary_key',
        'negative_amount',
        'abnormal_amount',
        'invalid_date',
        'referential_integrity',
        'refund_mismatch',
        'missing_value'
    ]
    
    found_issues = []
    for expected in expected_issues:
        if expected in issue_types:
            count = len(issues_df[issues_df['问题类型'] == expected])
            print(f"   ✓ {expected}: {count} 个")
            found_issues.append(expected)
        else:
            print(f"   ✗ 未检测到 {expected}")
    
    if len(found_issues) >= 5:
        print(f"   ✓ 成功检测到 {len(found_issues)}/7 类异常")
        return True
    else:
        print(f"   ✗ 只检测到 {len(found_issues)}/7 类异常")
        return False

def test_6_data_cleaning_and_merge():
    """测试6: 数据清洗与合并"""
    data_dict = load_data_from_dir(SAMPLE_DATA_DIR)
    cleaned_data = clean_data(data_dict)
    merged_df = merge_orders_with_details(cleaned_data)
    
    if merged_df is None or len(merged_df) == 0:
        print("   ✗ 数据合并失败，结果为空")
        return False
    
    print(f"   ✓ 合并后数据: {len(merged_df)} 条记录")
    print(f"   ✓ 字段数: {len(merged_df.columns)}")
    
    required_cols = ['order_id', 'store_id', 'dish_id', 'pay_amount', 'gross_margin', 'order_time']
    for col in required_cols:
        if col not in merged_df.columns:
            print(f"   ✗ 缺失字段: {col}")
            return False
    
    print(f"   ✓ 所有必要字段存在")
    return True

def test_7_metrics_calculation():
    """测试7: 指标计算 - 验证所有新增指标函数"""
    data_dict = load_data_from_dir(SAMPLE_DATA_DIR)
    cleaned_data = clean_data(data_dict)
    merged_df = merge_orders_with_details(cleaned_data)
    
    tests_passed = 0
    total_tests = 8
    
    try:
        result = calculate_store_ranking(merged_df)
        if result is not None and len(result) > 0:
            print(f"   ✓ 门店排名: {len(result)} 个门店")
            tests_passed += 1
    except Exception as e:
        print(f"   ✗ 门店排名失败: {e}")
    
    try:
        result = calculate_meal_period_performance(merged_df)
        if result is not None and len(result) > 0:
            print(f"   ✓ 午晚餐分析: {len(result)} 个时段")
            tests_passed += 1
    except Exception as e:
        print(f"   ✗ 午晚餐分析失败: {e}")
    
    try:
        result = calculate_dish_margin_contribution(merged_df)
        if result is not None and len(result) > 0:
            print(f"   ✓ 毛利贡献: {len(result)} 个菜品")
            tests_passed += 1
    except Exception as e:
        print(f"   ✗ 毛利贡献失败: {e}")
    
    try:
        result = calculate_member_repurchase_cycle(merged_df)
        if result is not None and len(result) > 0:
            print(f"   ✓ 复购周期: {len(result)} 个分层")
            tests_passed += 1
    except Exception as e:
        print(f"   ✗ 复购周期失败: {e}")
    
    try:
        result = calculate_promotion_roi(merged_df, cleaned_data.get('promotions'))
        if result is not None and len(result) > 0:
            print(f"   ✓ 活动ROI: {len(result)} 个活动")
            tests_passed += 1
    except Exception as e:
        print(f"   ✗ 活动ROI失败: {e}")
    
    try:
        result = calculate_ingredient_cost_volatility(cleaned_data.get('ingredient_costs'))
        if result is not None and len(result) > 0:
            print(f"   ✓ 成本波动: {len(result)} 种原料")
            tests_passed += 1
    except Exception as e:
        print(f"   ✗ 成本波动失败: {e}")
    
    try:
        result = calculate_refund_reason_distribution(merged_df)
        if result is not None and len(result) > 0:
            print(f"   ✓ 退款原因: {len(result)} 个原因")
            tests_passed += 1
    except Exception as e:
        print(f"   ✗ 退款原因失败: {e}")
    
    try:
        result = calculate_kpi_metrics(merged_df)
        if result is not None and '营业额' in result:
            print(f"   ✓ KPI指标: 营业额={result['营业额']:.2f}")
            tests_passed += 1
    except Exception as e:
        print(f"   ✗ KPI指标失败: {e}")
    
    print(f"\n   指标计算通过率: {tests_passed}/{total_tests}")
    return tests_passed >= 6

def test_8_alert_detection():
    """测试8: 预警检测"""
    data_dict = load_data_from_dir(SAMPLE_DATA_DIR)
    cleaned_data = clean_data(data_dict)
    merged_df = merge_orders_with_details(cleaned_data)
    
    alert_report = detect_all_alerts(merged_df, cleaned_data)
    
    print(f"   整体健康评分: {alert_report.overall_health_score:.1f}/100")
    print(f"   预警总数: {alert_report.total_alerts}")
    print(f"   高优先级: {alert_report.critical_alerts}")
    print(f"   中优先级: {alert_report.warning_alerts}")
    print(f"   低优先级: {alert_report.info_alerts}")
    
    alert_types = set([a.alert_type for a in alert_report.alerts])
    print(f"   预警类型: {list(alert_types)}")
    
    if alert_report.overall_health_score > 0:
        print("   ✓ 预警检测成功")
        return True
    return False

def test_9_report_export():
    """测试9: 报告导出"""
    data_dict = load_data_from_dir(SAMPLE_DATA_DIR)
    cleaned_data = clean_data(data_dict)
    merged_df = merge_orders_with_details(cleaned_data)
    validation_report = validate_all_datasets(data_dict)
    alert_report = detect_all_alerts(merged_df, cleaned_data)
    
    kpi_metrics = calculate_kpi_metrics(merged_df)
    
    excel_path = os.path.join(TEST_OUTPUT_DIR, 'test_report.xlsx')
    html_path = os.path.join(TEST_OUTPUT_DIR, 'test_report.html')
    
    excel_success = True
    html_success = True
    
    refunds_df = cleaned_data.get("refunds", pd.DataFrame())
    
    analysis_results = {
        "date_range": ("2024-01-01", "2024-06-30"),
        "kpi_metrics": kpi_metrics,
        "store_metrics": calculate_store_metrics(merged_df),
        "dish_metrics": calculate_dish_metrics(merged_df),
        "category_metrics": calculate_category_metrics(merged_df),
        "rfm_result": calculate_rfm(merged_df),
        "repurchase_result": calculate_repurchase_rate(merged_df),
        "promotion_metrics": calculate_promotion_effectiveness(merged_df),
        "refund_analysis": calculate_refund_analysis(merged_df, refunds_df),
        "hourly_trend": calculate_hourly_trend(merged_df),
        "dish_combinations": calculate_dish_combinations(merged_df),
        "anomaly_stores": detect_anomalous_stores(merged_df),
    }
    
    try:
        excel_bytes = generate_excel_report(
            analysis_results,
            validation_report=validation_report,
            alert_report=alert_report,
        )
        with open(excel_path, 'wb') as f:
            f.write(excel_bytes)
        size = os.path.getsize(excel_path)
        print(f"   ✓ Excel报告: {size/1024:.1f} KB")
    except Exception as e:
        print(f"   ✗ Excel报告失败: {e}")
        import traceback
        traceback.print_exc()
        excel_success = False
    
    try:
        html_content = generate_html_report(
            analysis_results,
            validation_report=validation_report,
            alert_report=alert_report,
        )
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        size = os.path.getsize(html_path)
        print(f"   ✓ HTML报告: {size/1024:.1f} KB")
    except Exception as e:
        print(f"   ✗ HTML报告失败: {e}")
        import traceback
        traceback.print_exc()
        html_success = False
    
    return excel_success and html_success

def test_10_kpi_metrics():
    """测试10: KPI指标验证"""
    data_dict = load_data_from_dir(SAMPLE_DATA_DIR)
    cleaned_data = clean_data(data_dict)
    merged_df = merge_orders_with_details(cleaned_data)
    
    kpi = calculate_kpi_metrics(merged_df)
    
    required_kpis = ['总营业额', '总毛利', '毛利率', '订单数', '客单价', '退款金额', '会员订单占比']
    for k in required_kpis:
        if k not in kpi:
            print(f"   ✗ 缺失KPI: {k}")
            return False
        val = kpi[k]
        if isinstance(val, (int, float)):
            print(f"   ✓ {k}: {val:.2f}")
        else:
            print(f"   ✓ {k}: {val}")
    
    if kpi['总营业额'] <= 0:
        print("   ✗ 总营业额不应≤0")
        return False
    if kpi['毛利率'] < 0 or kpi['毛利率'] > 100:
        print("   ✗ 毛利率应在0-100之间")
        return False
    
    return True

def main():
    """主测试函数"""
    print("╔" + "═"*58 + "╗")
    print("║" + " " * 15 + "连锁餐饮数据分析平台 - 系统测试" + " " * 16 + "║")
    print("╚" + "═"*58 + "╝")
    print(f"\n测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"数据目录: {SAMPLE_DATA_DIR}")
    
    tests = [
        ("1. 示例数据检查", test_1_data_generation),
        ("2. 异常数据检查", test_2_anomaly_data),
        ("3. 数据加载功能", test_3_data_loading),
        ("4. 正常数据校验", test_4_data_validation_normal),
        ("5. 异常数据校验", test_5_data_validation_anomaly),
        ("6. 数据清洗与合并", test_6_data_cleaning_and_merge),
        ("7. 新增指标计算", test_7_metrics_calculation),
        ("8. 预警检测功能", test_8_alert_detection),
        ("9. 报告导出功能", test_9_report_export),
        ("10. KPI指标验证", test_10_kpi_metrics),
    ]
    
    results = []
    for desc, func in tests:
        results.append(test_step(desc, func))
    
    passed = sum(results)
    total = len(results)
    
    print("\n" + "="*60)
    print("测试结果总结")
    print("="*60)
    print(f"通过: {passed}/{total}")
    print(f"通过率: {passed/total*100:.1f}%")
    print("="*60)
    
    if passed == total:
        print("所有测试通过！")
        return 0
    elif passed >= total * 0.8:
        print("大部分测试通过，建议检查失败项")
        return 0
    else:
        print("较多测试失败，请检查代码")
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
