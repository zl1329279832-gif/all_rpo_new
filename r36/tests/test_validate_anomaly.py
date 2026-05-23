import pandas as pd
from datetime import datetime
import os
import numpy as np
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SAMPLE_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sample_data')

orders = pd.read_csv(os.path.join(SAMPLE_DATA_DIR, 'anomaly', 'orders.csv'), dtype=object, keep_default_na=False)
refunds = pd.read_csv(os.path.join(SAMPLE_DATA_DIR, 'anomaly', 'refunds.csv'), dtype=object, keep_default_na=False)

numeric_cols = ['total_amount', 'discount_amount', 'pay_amount']
for col in numeric_cols:
    orders[col] = pd.to_numeric(orders[col], errors='coerce')

def is_empty(x):
    if x is None:
        return True
    if isinstance(x, float) and np.isnan(x):
        return True
    if isinstance(x, str) and x.strip() == '':
        return True
    return False

print('=== 异常数据验证 ===')
print()

all_dups = orders[orders.duplicated('order_id', keep=False)]
unique_dup_ids = all_dups['order_id'].unique()
print(f'1. 重复主键(order_id): {len(unique_dup_ids)} 个重复ID, 涉及 {len(all_dups)} 条记录')
if len(unique_dup_ids) > 0:
    print(f'   重复的order_id: {unique_dup_ids.tolist()}')

neg_amount = orders[orders['total_amount'] < 0]
print(f'\n2. 负数金额(total_amount): {len(neg_amount)} 个')
if len(neg_amount) > 0:
    neg_vals = neg_amount['total_amount'].tolist()
    print(f'   金额值: {neg_vals}')

p99 = orders['total_amount'].quantile(0.99)
threshold = p99 * 3
large_amount = orders[orders['total_amount'] > threshold]
print(f'\n3. 异常大值金额(>99分位×3={threshold:.2f}): {len(large_amount)} 个')
if len(large_amount) > 0:
    large_vals = large_amount['total_amount'].tolist()
    print(f'   金额值: {large_vals}')

def is_valid_date(s):
    try:
        if pd.isna(s):
            return True
        datetime.strptime(str(s), '%Y-%m-%d %H:%M:%S')
        return True
    except:
        return False

invalid_dates = orders[~orders['order_datetime'].apply(is_valid_date)]
print(f'\n4. 无效日期(order_datetime): {len(invalid_dates)} 个')
if len(invalid_dates) > 0:
    inv_dates = invalid_dates['order_datetime'].tolist()
    print(f'   日期值: {inv_dates}')

invalid_store = orders[orders['store_id'].isin(['S999', 'S998'])]
invalid_member = orders[orders['member_id'].isin(['M9999', 'M9998'])]
print(f'\n5. 不存在的外键:')
inv_store_ids = invalid_store['store_id'].unique().tolist()
inv_member_ids = invalid_member['member_id'].unique().tolist()
print(f'   无效store_id: {len(invalid_store)} 个, 值: {inv_store_ids}')
print(f'   无效member_id: {len(invalid_member)} 个, 值: {inv_member_ids}')

valid_order_ids = set(orders['order_id'].dropna())
invalid_refunds = refunds[~refunds['order_id'].isin(valid_order_ids)]
print(f'\n6. 不存在的退款订单号: {len(invalid_refunds)} 个')
if len(invalid_refunds) > 0:
    inv_refund_ids = invalid_refunds['order_id'].tolist()
    print(f'   订单号: {inv_refund_ids}')

orders_for_missing = orders.drop(columns=['remarks'])
total_cells = len(orders_for_missing) * len(orders_for_missing.columns)

missing_cells = orders_for_missing.map(is_empty).sum().sum()
missing_pct = (missing_cells / total_cells) * 100
print(f'\n7. 缺失值统计(不含remarks字段):')
print(f'   总单元格数: {total_cells}')
print(f'   缺失单元格数: {missing_cells}')
print(f'   缺失比例: {missing_pct:.1f}%')
print()
print('各字段缺失数:')
for col in orders.columns:
    if col == 'remarks':
        continue
    missing = orders[col].map(is_empty).sum()
    if missing > 0:
        print(f'   {col}: {missing}')

print()
print('=' * 50)
print('验证结果总结:')
all_passed = True
if len(unique_dup_ids) >= 3:
    print('  [PASS] 重复主键: >=3 个')
else:
    print(f'  [FAIL] 重复主键: {len(unique_dup_ids)} 个 (需要>=3)')
    all_passed = False

if len(neg_amount) >= 5:
    print('  [PASS] 负数金额: >=5 个')
else:
    print(f'  [FAIL] 负数金额: {len(neg_amount)} 个 (需要>=5)')
    all_passed = False

if len(large_amount) >= 3:
    print('  [PASS] 异常大值: >=3 个')
else:
    print(f'  [FAIL] 异常大值: {len(large_amount)} 个 (需要>=3)')
    all_passed = False

if len(invalid_dates) >= 2:
    print('  [PASS] 无效日期: >=2 个')
else:
    print(f'  [FAIL] 无效日期: {len(invalid_dates)} 个 (需要>=2)')
    all_passed = False

if len(invalid_store) >= 2 and len(invalid_member) >= 2:
    print('  [PASS] 无效外键: store>=2, member>=2')
else:
    print(f'  [FAIL] 无效外键: store={len(invalid_store)}, member={len(invalid_member)} (需要各>=2)')
    all_passed = False

if len(invalid_refunds) >= 3:
    print('  [PASS] 无效退款订单号: >=3 个')
else:
    print(f'  [FAIL] 无效退款订单号: {len(invalid_refunds)} 个 (需要>=3)')
    all_passed = False

if 8 <= missing_pct <= 12:
    print(f'  [PASS] 缺失值比例: {missing_pct:.1f}% (在8%-12%范围内)')
else:
    print(f'  [FAIL] 缺失值比例: {missing_pct:.1f}% (需要在8%-12%范围内)')
    all_passed = False

print('=' * 50)
if all_passed:
    print('所有验证通过！')
    sys.exit(0)
else:
    print('部分验证失败，请检查！')
    sys.exit(1)
