import os
import io
import pandas as pd
from typing import Dict, List, Optional, Any
from config.schemas import REQUIRED_FILES


def detect_file_type(filename: str) -> Optional[str]:
    for file_type in REQUIRED_FILES:
        if file_type in filename.lower():
            return file_type
    return None


def load_csv_file(file_obj: Any, filename: str) -> Optional[pd.DataFrame]:
    try:
        if hasattr(file_obj, "read"):
            content = file_obj.read()
            if isinstance(content, bytes):
                content = content.decode("utf-8")
            return pd.read_csv(io.StringIO(content))
        else:
            return pd.read_csv(file_obj)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return None


def load_csv_files(uploaded_files: List[Any]) -> Dict[str, pd.DataFrame]:
    data_dict: Dict[str, pd.DataFrame] = {}
    for uploaded_file in uploaded_files:
        filename = uploaded_file.name
        file_type = detect_file_type(filename)
        if file_type:
            df = load_csv_file(uploaded_file, filename)
            if df is not None:
                data_dict[file_type] = df
    return data_dict


def load_sample_data(data_dir: str = "sample_data") -> Dict[str, pd.DataFrame]:
    data_dict: Dict[str, pd.DataFrame] = {}
    if not os.path.exists(data_dir):
        return data_dict
    for file_type in REQUIRED_FILES:
        filepath = os.path.join(data_dir, f"{file_type}.csv")
        if os.path.exists(filepath):
            df = pd.read_csv(filepath)
            data_dict[file_type] = df
    return data_dict


def load_data_from_dir(data_dir: str) -> Dict[str, pd.DataFrame]:
    data_dict: Dict[str, pd.DataFrame] = {}
    if not os.path.exists(data_dir):
        return data_dict
    for filename in os.listdir(data_dir):
        if filename.endswith(".csv"):
            filepath = os.path.join(data_dir, filename)
            file_type = detect_file_type(filename)
            if file_type:
                df = pd.read_csv(filepath)
                data_dict[file_type] = df
    return data_dict


def get_data_summary(data_dict: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    summary = []
    for name, df in data_dict.items():
        summary.append({
            "数据表": name,
            "行数": len(df),
            "列数": len(df.columns),
            "字段": ", ".join(df.columns.tolist()),
            "缺失值数量": df.isnull().sum().sum(),
        })
    return pd.DataFrame(summary)
