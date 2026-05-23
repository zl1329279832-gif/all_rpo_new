import streamlit as st
import pandas as pd
from core import get_filter_options, filter_by_multiple_dimensions
from datetime import datetime


def render_sidebar_filters(merged_df, cleaned_data):
    filter_options = get_filter_options(merged_df, cleaned_data)
    
    st.sidebar.markdown("### 🔍 筛选条件")
    
    if "filters_initialized" not in st.session_state:
        st.session_state.filters_initialized = True
        st.session_state.date_range = None
        st.session_state.selected_cities = filter_options["cities"]
        st.session_state.selected_areas = filter_options["areas"]
        st.session_state.selected_stores = [s["store_id"] for s in filter_options["stores"]]
        st.session_state.selected_member_levels = filter_options["member_levels"]
        st.session_state.selected_categories = filter_options["categories"]
        st.session_state.selected_promotions = [p["promotion_id"] for p in filter_options["promotions"]]
    
    if "order_time" in merged_df.columns:
        min_date = merged_df["order_time"].min().date()
        max_date = merged_df["order_time"].max().date()
        if st.session_state.date_range is None:
            st.session_state.date_range = (min_date, max_date)
        
        date_range = st.sidebar.date_input(
            "选择日期范围",
            value=st.session_state.date_range,
            min_value=min_date,
            max_value=max_date,
            key="sidebar_date_range",
        )
        st.session_state.date_range = date_range
    else:
        date_range = None
    
    col1, col2 = st.sidebar.columns(2)
    with col1:
        if st.button("📋 全选", key="select_all", use_container_width=True):
            st.session_state.selected_cities = filter_options["cities"]
            st.session_state.selected_areas = filter_options["areas"]
            st.session_state.selected_stores = [s["store_id"] for s in filter_options["stores"]]
            st.session_state.selected_member_levels = filter_options["member_levels"]
            st.session_state.selected_categories = filter_options["categories"]
            st.session_state.selected_promotions = [p["promotion_id"] for p in filter_options["promotions"]]
    with col2:
        if st.button("❌ 取消全选", key="deselect_all", use_container_width=True):
            st.session_state.selected_cities = []
            st.session_state.selected_areas = []
            st.session_state.selected_stores = []
            st.session_state.selected_member_levels = []
            st.session_state.selected_categories = []
            st.session_state.selected_promotions = []
    
    if filter_options["cities"]:
        st.sidebar.markdown("#### 🌆 城市")
        selected_cities = st.sidebar.multiselect(
            "选择城市",
            options=filter_options["cities"],
            default=st.session_state.selected_cities,
            key="sidebar_cities",
        )
        st.session_state.selected_cities = selected_cities
    
    if filter_options["areas"]:
        st.sidebar.markdown("#### 📍 区域")
        selected_areas = st.sidebar.multiselect(
            "选择区域",
            options=filter_options["areas"],
            default=st.session_state.selected_areas,
            key="sidebar_areas",
        )
        st.session_state.selected_areas = selected_areas
    
    if filter_options["stores"]:
        st.sidebar.markdown("#### 🏪 门店")
        store_options = {s["store_name"]: s["store_id"] for s in filter_options["stores"]}
        default_store_names = [
            s["store_name"] for s in filter_options["stores"]
            if s["store_id"] in st.session_state.selected_stores
        ]
        selected_store_names = st.sidebar.multiselect(
            "选择门店",
            options=list(store_options.keys()),
            default=default_store_names,
            key="sidebar_stores",
        )
        st.session_state.selected_stores = [store_options[name] for name in selected_store_names]
    
    if filter_options["member_levels"]:
        st.sidebar.markdown("#### 👤 会员等级")
        selected_member_levels = st.sidebar.multiselect(
            "选择会员等级",
            options=filter_options["member_levels"],
            default=st.session_state.selected_member_levels,
            key="sidebar_member_levels",
        )
        st.session_state.selected_member_levels = selected_member_levels
    
    if filter_options["categories"]:
        st.sidebar.markdown("#### 🍽️ 菜品分类")
        selected_categories = st.sidebar.multiselect(
            "选择菜品分类",
            options=filter_options["categories"],
            default=st.session_state.selected_categories,
            key="sidebar_categories",
        )
        st.session_state.selected_categories = selected_categories
    
    if filter_options["promotions"]:
        st.sidebar.markdown("#### 🎁 活动")
        promo_options = {p["promotion_name"]: p["promotion_id"] for p in filter_options["promotions"]}
        default_promo_names = [
            p["promotion_name"] for p in filter_options["promotions"]
            if p["promotion_id"] in st.session_state.selected_promotions
        ]
        selected_promo_names = st.sidebar.multiselect(
            "选择活动",
            options=list(promo_options.keys()),
            default=default_promo_names,
            key="sidebar_promotions",
        )
        st.session_state.selected_promotions = [promo_options[name] for name in selected_promo_names]
    
    st.sidebar.markdown("---")
    
    if st.sidebar.button("🔄 重置筛选", key="reset_filters", use_container_width=True):
        st.session_state.filters_initialized = False
        st.rerun()
    
    start_date = None
    end_date = None
    if date_range and len(date_range) == 2:
        start_date = date_range[0]
        end_date = date_range[1]
    
    filter_dict = {
        "start_date": start_date,
        "end_date": end_date,
        "cities": st.session_state.selected_cities,
        "areas": st.session_state.selected_areas,
        "store_ids": st.session_state.selected_stores,
        "member_levels": st.session_state.selected_member_levels,
        "categories": st.session_state.selected_categories,
        "promotion_ids": st.session_state.selected_promotions,
    }
    
    filtered_df = filter_by_multiple_dimensions(
        merged_df,
        start_date=start_date,
        end_date=end_date,
        cities=st.session_state.selected_cities if st.session_state.selected_cities else None,
        areas=st.session_state.selected_areas if st.session_state.selected_areas else None,
        store_ids=st.session_state.selected_stores if st.session_state.selected_stores else None,
        member_levels=st.session_state.selected_member_levels if st.session_state.selected_member_levels else None,
        categories=st.session_state.selected_categories if st.session_state.selected_categories else None,
        promotion_ids=st.session_state.selected_promotions if st.session_state.selected_promotions else None,
    )
    
    st.sidebar.markdown("### 📋 当前筛选条件")
    filter_summary = []
    if start_date and end_date:
        filter_summary.append(f"📅 {start_date} ~ {end_date}")
    if st.session_state.selected_cities:
        filter_summary.append(f"🌆 {len(st.session_state.selected_cities)} 个城市")
    if st.session_state.selected_areas:
        filter_summary.append(f"📍 {len(st.session_state.selected_areas)} 个区域")
    if st.session_state.selected_stores:
        filter_summary.append(f"🏪 {len(st.session_state.selected_stores)} 家门店")
    if st.session_state.selected_member_levels:
        filter_summary.append(f"👤 {len(st.session_state.selected_member_levels)} 个会员等级")
    if st.session_state.selected_categories:
        filter_summary.append(f"🍽️ {len(st.session_state.selected_categories)} 个分类")
    if st.session_state.selected_promotions:
        filter_summary.append(f"🎁 {len(st.session_state.selected_promotions)} 个活动")
    
    if filter_summary:
        for item in filter_summary:
            st.sidebar.markdown(f"- {item}")
    else:
        st.sidebar.markdown("⚠️ 未选择任何筛选条件")
    
    return filtered_df, filter_dict
