"""火山地质结构三维可视化 - Streamlit 交互式界面"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

import numpy as np
import pyvista as pv
try:
    from pyvista.plotting.plotter import Plotter as _Plotter
    pv.Plotter = _Plotter
except (ImportError, AttributeError):
    pass
from io import BytesIO
import tempfile

import streamlit as st
import streamlit.components.v1 as stc
import panel as pn

from volcano_vis import (
    VolcanoDataGenerator,
    VolcanoParameters,
    MeshBuilder,
    MaterialMapper,
    VolcanoClipper,
    VolcanoAnimator,
    LegendManager,
    ResultExporter,
    AnimationConfig,
    ExportConfig,
)


st.set_page_config(
    page_title="火山地质结构三维可视化",
    page_icon="🌋",
    layout="wide",
    initial_sidebar_state="expanded",
)


@st.cache_resource
def get_or_create_data(params):
    generator = VolcanoDataGenerator(params)
    dataset = generator.generate_all()
    mesh_builder = MeshBuilder(dataset)
    meshes = mesh_builder.build_all()
    material_mapper = MaterialMapper(dataset)
    return dataset, meshes, material_mapper, generator


def show_plotter(plotter, height=600):
    try:
        vtk_pane = pn.pane.VTK(plotter.ren_win, width=900, height=height)
        html_path = os.path.join(tempfile.gettempdir(), f"volcano_3d_{id(plotter)}.html")
        vtk_pane.save(html_path)
        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        try:
            os.unlink(html_path)
        except OSError:
            pass
        stc.html(html_content, height=height + 20, scrolling=False)
    except Exception:
        try:
            img = plotter.screenshot(return_img=True, window_size=(1200, height))
            st.image(img, width=None)
        except Exception as e2:
            st.warning(f"3D rendering failed: {e2}")


def render_external_view(dataset, meshes, material_mapper, scalar_field, show_lava, show_magma, show_faults, show_layers):
    plotter = pv.Plotter(window_size=(1200, 800))
    plotter.set_background("white")

    cmap_map = {
        "elevation": "terrain",
        "rock_type": "viridis",
        "temperature": "hot",
        "vegetation": "YlGn",
        "lava_thickness": "OrRd",
        "hazard_level": "RdYlGn_r",
    }

    plotter.add_mesh(
        meshes.surface_mesh,
        scalars=scalar_field,
        cmap=cmap_map.get(scalar_field, "terrain"),
        show_scalar_bar=True,
        scalar_bar_args={"title": scalar_field, "n_labels": 5},
        opacity=1.0,
    )

    if show_lava:
        for lava_flow in meshes.lava_flow_meshes:
            plotter.add_mesh(
                lava_flow,
                color=(0.95, 0.25, 0.0),
                opacity=0.9,
                line_width=4,
            )

    if show_magma:
        if meshes.magma_chamber_mesh is not None:
            plotter.add_mesh(
                meshes.magma_chamber_mesh,
                color=(1.0, 0.2, 0.0),
                opacity=0.4,
                style="wireframe",
            )
        if meshes.magma_conduit_mesh is not None:
            plotter.add_mesh(
                meshes.magma_conduit_mesh,
                color=(1.0, 0.3, 0.0),
                opacity=0.7,
            )

    if show_faults:
        for fault in meshes.fault_meshes:
            plotter.add_mesh(
                fault,
                color=(0.3, 0.3, 0.35),
                opacity=0.3,
                style="wireframe",
            )

    if show_layers:
        for layer in meshes.rock_layer_meshes:
            try:
                color = (
                    layer.point_data["color_r"][0],
                    layer.point_data["color_g"][0],
                    layer.point_data["color_b"][0],
                )
            except (KeyError, IndexError):
                color = (0.6, 0.4, 0.2)
            plotter.add_mesh(
                layer,
                color=color,
                opacity=0.15,
            )

    plotter.camera_position = [
        (3000, 3000, 1500),
        (0, 0, 400),
        (0, 0, 1),
    ]

    try:
        plotter.add_axes(
            x_color="red",
            y_color="green",
            z_color="blue",
            line_width=2,
        )
    except TypeError:
        plotter.add_axes()

    return plotter


def render_cross_section_view(dataset, meshes, material_mapper, clip_angle, show_magma, show_faults, show_layers):
    plotter = pv.Plotter(window_size=(1200, 800))
    plotter.set_background("white")

    normal = np.array([np.cos(clip_angle), np.sin(clip_angle), 0.0])
    origin = np.array([0.0, 0.0, 0.0])

    try:
        clip_surface = meshes.volume_mesh.slice(normal=normal, origin=origin)
        if clip_surface is not None and clip_surface.n_points > 0:
            plotter.add_mesh(
                clip_surface,
                scalars="temperature" if "temperature" in clip_surface.array_names else "rock_type",
                cmap="inferno" if "temperature" in clip_surface.array_names else "viridis",
                show_scalar_bar=True,
                scalar_bar_args={"title": "剖面温度" if "temperature" in clip_surface.array_names else "岩石类型"},
                opacity=1.0,
                show_edges=True,
                edge_color=(0.3, 0.3, 0.3),
                line_width=1,
            )
    except Exception:
        clip_surface = None

    half_surface = meshes.surface_mesh.clip(normal=normal, origin=origin, invert=False)
    if half_surface is not None and half_surface.n_points > 0:
        plotter.add_mesh(
            half_surface,
            scalars="elevation",
            cmap="terrain",
            opacity=0.5,
            show_scalar_bar=False,
        )

    if show_layers:
        for layer in meshes.rock_layer_meshes:
            try:
                clipped = layer.clip(normal=normal, origin=origin, invert=False)
                if clipped is not None and clipped.n_points > 0:
                    try:
                        color = (
                            layer.point_data["color_r"][0],
                            layer.point_data["color_g"][0],
                            layer.point_data["color_b"][0],
                        )
                    except (KeyError, IndexError):
                        color = (0.6, 0.4, 0.2)
                    plotter.add_mesh(
                        clipped,
                        color=color,
                        opacity=0.6,
                        line_width=3,
                    )
            except Exception:
                pass

    if show_magma:
        if meshes.magma_conduit_mesh is not None:
            try:
                clipped = meshes.magma_conduit_mesh.clip(normal=normal, origin=origin, invert=False)
                if clipped is not None and clipped.n_points > 0:
                    plotter.add_mesh(clipped, color=(1.0, 0.2, 0.0), opacity=0.9)
            except Exception:
                pass
        if meshes.magma_chamber_mesh is not None:
            try:
                clipped = meshes.magma_chamber_mesh.clip(normal=normal, origin=origin, invert=False)
                if clipped is not None and clipped.n_points > 0:
                    plotter.add_mesh(clipped, color=(1.0, 0.15, 0.0), opacity=0.7)
            except Exception:
                pass

    if show_faults:
        for fault in meshes.fault_meshes:
            try:
                clipped = fault.clip(normal=normal, origin=origin, invert=False)
                if clipped is not None and clipped.n_points > 0:
                    plotter.add_mesh(clipped, color=(0.2, 0.2, 0.25), opacity=0.8, line_width=2)
            except Exception:
                pass

    plotter.camera_position = [
        (5000 * np.cos(clip_angle + np.pi / 2),
         5000 * np.sin(clip_angle + np.pi / 2),
         1000),
        (0, 0, -500),
        (0, 0, 1),
    ]

    try:
        plotter.add_axes(x_color="red", y_color="green", z_color="blue", line_width=2)
    except TypeError:
        plotter.add_axes()

    return plotter


def render_hazard_view(dataset, meshes, material_mapper, show_lava):
    plotter = pv.Plotter(window_size=(1200, 800))
    plotter.set_background("white")

    plotter.add_mesh(
        meshes.surface_mesh,
        scalars="hazard_level",
        cmap="RdYlGn_r",
        clim=[0, 3],
        show_scalar_bar=True,
        scalar_bar_args={
            "title": "危险等级",
            "n_labels": 4,
        },
        opacity=0.9,
    )

    if show_lava:
        for lava_flow in meshes.lava_flow_meshes:
            plotter.add_mesh(
                lava_flow,
                color=(0.95, 0.2, 0.0),
                opacity=0.95,
                line_width=5,
            )

    plotter.camera_position = [
        (0, -4000, 2000),
        (0, 0, 400),
        (0, 0, 1),
    ]

    try:
        plotter.add_axes(x_color="red", y_color="green", z_color="blue", line_width=2)
    except TypeError:
        plotter.add_axes()

    return plotter


def render_temperature_view(dataset, meshes, material_mapper, show_magma):
    plotter = pv.Plotter(window_size=(1200, 800))
    plotter.set_background("white")

    plotter.add_mesh(
        meshes.surface_mesh,
        scalars="temperature",
        cmap="hot",
        show_scalar_bar=True,
        scalar_bar_args={"title": "地表温度 (deg C)"},
        opacity=0.8,
    )

    if show_magma:
        if meshes.magma_chamber_mesh is not None:
            plotter.add_mesh(
                meshes.magma_chamber_mesh,
                color=(1.0, 0.1, 0.0),
                opacity=0.5,
            )
        if meshes.magma_conduit_mesh is not None:
            plotter.add_mesh(
                meshes.magma_conduit_mesh,
                color=(1.0, 0.2, 0.0),
                opacity=0.8,
            )

    plotter.camera_position = [
        (3000, 3000, 1500),
        (0, 0, -500),
        (0, 0, 1),
    ]

    try:
        plotter.add_axes(x_color="red", y_color="green", z_color="blue", line_width=2)
    except TypeError:
        plotter.add_axes()

    return plotter


def main():
    with st.sidebar:
        st.title("🌋 火山地质结构三维可视化")
        selected = st.radio(
            "视图选择",
            ["外部视图", "剖面视图", "危险区域", "热力分布", "参数设置", "数据导出", "图例说明"],
            index=0,
            label_visibility="collapsed",
        )

        st.markdown("---")

        st.subheader("动态参数")

        magma_pressure = st.slider(
            "岩浆压力",
            min_value=0.1,
            max_value=1.0,
            value=0.7,
            step=0.05,
            help="控制岩浆房压力和温度",
        )

        eruption_intensity = st.slider(
            "喷发强度",
            min_value=0.1,
            max_value=1.0,
            value=0.6,
            step=0.05,
            help="控制熔岩流动速度和危险区域范围",
        )

        time_progress = st.slider(
            "时间进度",
            min_value=0.0,
            max_value=1.0,
            value=0.3,
            step=0.05,
            help="控制喷发过程的时间阶段",
        )

        lava_viscosity = st.slider(
            "熔岩粘度",
            min_value=0.1,
            max_value=1.0,
            value=0.5,
            step=0.05,
            help="控制熔岩流动路径的复杂度",
        )

        st.markdown("---")

        st.subheader("显示选项")

        show_lava = st.checkbox("显示熔岩流", value=True)
        show_magma = st.checkbox("显示岩浆系统", value=True)
        show_faults = st.checkbox("显示断裂带", value=False)
        show_layers = st.checkbox("显示岩层", value=False)

    params = VolcanoParameters(
        magma_pressure=magma_pressure,
        eruption_intensity=eruption_intensity,
        time_progress=time_progress,
        lava_viscosity=lava_viscosity,
    )

    dataset, meshes, material_mapper, generator = get_or_create_data(params)

    if selected == "外部视图":
        st.header("🌋 外部地形视图")
        st.markdown("展示火山的外部地形、熔岩流路径和地表特征。**拖动鼠标旋转，滚轮缩放**")

        col1, col2 = st.columns([3, 1])

        with col2:
            st.subheader("显示设置")
            scalar_field = st.selectbox(
                "颜色映射字段",
                ["elevation", "rock_type", "temperature", "vegetation", "lava_thickness", "hazard_level"],
                format_func=lambda x: {
                    "elevation": "地形高程",
                    "rock_type": "岩石类型",
                    "temperature": "地表温度",
                    "vegetation": "植被覆盖",
                    "lava_thickness": "熔岩厚度",
                    "hazard_level": "危险等级",
                }[x],
            )

            st.info(
                """
                **操作提示:**
                - 旋转查看: 拖动鼠标
                - 缩放: 滚轮
                - 平移: 右键拖动
                """
            )

        with col1:
            with st.spinner("正在渲染3D视图..."):
                plotter = render_external_view(
                    dataset, meshes, material_mapper,
                    scalar_field, show_lava, show_magma, show_faults, show_layers
                )
                show_plotter(plotter, height=650)

    elif selected == "剖面视图":
        st.header("📐 剖面视图")
        st.markdown("展示火山的内部结构，包括岩层、岩浆通道和断裂带。**拖动鼠标旋转，滚轮缩放**")

        col1, col2 = st.columns([3, 1])

        with col2:
            st.subheader("剖面设置")
            clip_angle_deg = st.slider(
                "剖面角度",
                min_value=0,
                max_value=180,
                value=0,
                step=5,
                help="绕Z轴旋转的剖面角度",
            )
            clip_angle = np.radians(clip_angle_deg)

            st.info(
                """
                **剖面显示:**
                - 切面温度/岩石分布
                - 半透明地表地形
                - 岩层界面
                - 岩浆通道
                - 断裂带
                """
            )

        with col1:
            with st.spinner("正在渲染剖面视图..."):
                plotter = render_cross_section_view(
                    dataset, meshes, material_mapper,
                    clip_angle, show_magma, show_faults, show_layers
                )
                show_plotter(plotter, height=650)

    elif selected == "危险区域":
        st.header("⚠️ 危险区域分析")
        st.markdown("根据喷发强度和熔岩流路径评估危险区域分布。**拖动鼠标旋转，滚轮缩放**")

        col1, col2 = st.columns([3, 1])

        with col2:
            st.subheader("危险等级")
            st.markdown(
                """
                <div style='padding: 10px; background: rgba(0, 255, 0, 0.2); border-radius: 5px; margin: 5px 0;'>
                    <b>🟢 安全区</b><br>
                    无火山活动影响
                </div>
                <div style='padding: 10px; background: rgba(255, 255, 0, 0.2); border-radius: 5px; margin: 5px 0;'>
                    <b>🟡 警戒区</b><br>
                    需关注火山动态
                </div>
                <div style='padding: 10px; background: rgba(255, 165, 0, 0.2); border-radius: 5px; margin: 5px 0;'>
                    <b>🟠 危险区</b><br>
                    可能受熔岩流影响
                </div>
                <div style='padding: 10px; background: rgba(255, 0, 0, 0.2); border-radius: 5px; margin: 5px 0;'>
                    <b>🔴 极危险区</b><br>
                    需立即撤离
                </div>
                """,
                unsafe_allow_html=True,
            )

            hazard = dataset.hazard_zone
            total = hazard.size
            stats = {}
            for level, name in enumerate(["安全区", "警戒区", "危险区", "极危险区"]):
                pct = np.sum(hazard == level) / total * 100
                stats[name] = pct

            st.subheader("区域统计")
            for name, pct in stats.items():
                st.metric(name, f"{pct:.1f}%")

        with col1:
            with st.spinner("正在渲染危险区域..."):
                plotter = render_hazard_view(dataset, meshes, material_mapper, show_lava)
                show_plotter(plotter, height=650)

    elif selected == "热力分布":
        st.header("🌡️ 热力分布")
        st.markdown("展示火山的温度场分布，包括地温梯度和岩浆热异常。**拖动鼠标旋转，滚轮缩放**")

        col1, col2 = st.columns([3, 1])

        with col2:
            st.subheader("温度信息")

            surface_temp = dataset.surface_temperature
            volume_temp = dataset.volume_temperature

            st.metric("地表最高温度", f"{surface_temp.max():.0f} °C")
            st.metric("地下最高温度", f"{volume_temp.max():.0f} °C")
            st.metric("平均地表温度", f"{surface_temp.mean():.1f} °C")

            st.info(
                """
                **热力来源:**
                1. 岩浆房 (深部热源)
                2. 岩浆通道 (热传导)
                3. 熔岩流 (地表热源)
                4. 断裂带 (热液活动)
                """
            )

        with col1:
            with st.spinner("正在渲染热力分布..."):
                plotter = render_temperature_view(dataset, meshes, material_mapper, show_magma)
                show_plotter(plotter, height=650)

    elif selected == "参数设置":
        st.header("⚙️ 参数设置")
        st.markdown("配置火山的形态和结构参数")

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("火山形态参数")
            volcano_height = st.number_input("火山高度 (m)", 200, 2000, 800, 50)
            volcano_base_radius = st.number_input("基座半径 (m)", 500, 3000, 1500, 100)
            crater_radius = st.number_input("火山口半径 (m)", 50, 800, 300, 50)
            crater_depth = st.number_input("火山口深度 (m)", 20, 400, 150, 20)

            st.subheader("岩浆系统参数")
            magma_chamber_depth = st.number_input("岩浆房深度 (m)", -3000, -500, -1500, 100)
            magma_chamber_radius = st.number_input("岩浆房半径 (m)", 100, 800, 400, 50)
            conduit_radius = st.number_input("岩浆通道半径 (m)", 20, 200, 80, 10)

        with col2:
            st.subheader("分辨率参数")
            surface_resolution = st.slider("地表分辨率", 50, 300, 150, 10)
            volume_resolution = st.slider("体分辨率", 30, 100, 60, 5)

            st.subheader("结构参数")
            num_lava_flows = st.slider("熔岩流数量", 1, 10, 5, 1)
            num_fault_zones = st.slider("断裂带数量", 0, 6, 3, 1)
            num_rock_layers = st.slider("岩层数量", 2, 8, 5, 1)

            seed = st.number_input("随机种子", 0, 99999, 42, 1)

        if st.button("应用参数并重新生成", type="primary"):
            new_params = VolcanoParameters(
                volcano_height=volcano_height,
                volcano_base_radius=volcano_base_radius,
                crater_radius=crater_radius,
                crater_depth=crater_depth,
                magma_chamber_depth=magma_chamber_depth,
                magma_chamber_radius=magma_chamber_radius,
                conduit_radius=conduit_radius,
                surface_resolution=surface_resolution,
                volume_resolution=volume_resolution,
                num_lava_flows=num_lava_flows,
                num_fault_zones=num_fault_zones,
                num_rock_layers=num_rock_layers,
                magma_pressure=magma_pressure,
                eruption_intensity=eruption_intensity,
                time_progress=time_progress,
                lava_viscosity=lava_viscosity,
                seed=seed,
            )
            st.cache_resource.clear()
            st.success("参数已更新，正在重新生成数据...")
            st.rerun()

    elif selected == "数据导出":
        st.header("📤 数据导出")
        st.markdown("导出可视化结果和原始数据")

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("图像导出")

            image_format = st.selectbox("图像格式", ["png", "jpg", "jpeg"], index=0)
            image_width = st.number_input("图像宽度 (px)", 800, 3840, 1920, 100)
            image_height = st.number_input("图像高度 (px)", 600, 2160, 1080, 100)

            if st.button("📸 导出当前视图"):
                export_config = ExportConfig(
                    image_format=image_format,
                    image_width=image_width,
                    image_height=image_height,
                )
                exporter = ResultExporter(config=export_config)

                plotter = render_external_view(
                    dataset, meshes, material_mapper,
                    "elevation", show_lava, show_magma, show_faults, show_layers
                )
                filepath = exporter.export_image(plotter, "volcano_external_view")
                st.success(f"图像已导出: {filepath}")

        with col2:
            st.subheader("网格和数据导出")

            mesh_format = st.selectbox("网格格式", ["vtk", "vtp", "vtu", "stl", "ply"], index=0)
            data_format = st.selectbox("数据格式", ["npz", "npy"], index=0)

            if st.button("🔲 导出所有网格"):
                export_config = ExportConfig(mesh_format=mesh_format)
                exporter = ResultExporter(config=export_config)
                mesh_files = exporter.export_all_meshes(
                    meshes.get_all_meshes(), prefix="volcano_"
                )
                st.success(f"已导出 {len(mesh_files)} 个网格文件")

            if st.button("📊 导出数值数据"):
                export_config = ExportConfig(data_format=data_format)
                exporter = ResultExporter(config=export_config)

                data_to_export = {
                    "surface_elevation": dataset.surface_elevation,
                    "surface_temperature": dataset.surface_temperature,
                    "surface_rock_type": dataset.surface_rock_type,
                    "surface_vegetation": dataset.surface_vegetation,
                    "hazard_zone": dataset.hazard_zone,
                    "lava_thickness": dataset.lava_thickness,
                    "volume_temperature": dataset.volume_temperature,
                    "volume_rock_type": dataset.volume_rock_type,
                }

                filepath = exporter.export_data(data_to_export, "volcano_dataset")
                st.success(f"数据已导出: {filepath}")

    elif selected == "图例说明":
        st.header("📖 图例说明")
        st.markdown("了解火山各部分的含义和颜色编码")

        legend_manager = LegendManager(dataset, material_mapper)

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("岩石类型图例")
            try:
                rock_legend = legend_manager.get_rock_type_legend()
                for item in rock_legend:
                    color_hex = f"#{int(item.color[0]*255):02x}{int(item.color[1]*255):02x}{int(item.color[2]*255):02x}"
                    desc = getattr(item, 'description', '')
                    st.markdown(
                        f"""
                        <div style='display: flex; align-items: center; margin: 5px 0;'>
                            <div style='width: 30px; height: 30px; background: {color_hex}; border-radius: 5px; margin-right: 10px; border: 1px solid #ccc;'></div>
                            <div><b>{item.label}</b>{'<br><span style="color: #666; font-size: 0.9em;">' + desc + '</span>' if desc else ''}</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
            except Exception:
                st.info("岩石类型图例不可用")

            st.subheader("地质构造图例")
            try:
                struct_legend = legend_manager.get_structural_legend()
                for item in struct_legend:
                    color_hex = f"#{int(item.color[0]*255):02x}{int(item.color[1]*255):02x}{int(item.color[2]*255):02x}"
                    desc = getattr(item, 'description', '')
                    st.markdown(
                        f"""
                        <div style='display: flex; align-items: center; margin: 5px 0;'>
                            <div style='width: 30px; height: 30px; background: {color_hex}; border-radius: 5px; margin-right: 10px; border: 1px solid #ccc;'></div>
                            <div><b>{item.label}</b>{'<br><span style="color: #666; font-size: 0.9em;">' + desc + '</span>' if desc else ''}</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
            except Exception:
                st.info("地质构造图例不可用")

        with col2:
            st.subheader("地下岩石图例")
            try:
                volume_legend = legend_manager.get_volume_rock_legend()
                for item in volume_legend:
                    color_hex = f"#{int(item.color[0]*255):02x}{int(item.color[1]*255):02x}{int(item.color[2]*255):02x}"
                    desc = getattr(item, 'description', '')
                    st.markdown(
                        f"""
                        <div style='display: flex; align-items: center; margin: 5px 0;'>
                            <div style='width: 30px; height: 30px; background: {color_hex}; border-radius: 5px; margin-right: 10px; border: 1px solid #ccc;'></div>
                            <div><b>{item.label}</b>{'<br><span style="color: #666; font-size: 0.9em;">' + desc + '</span>' if desc else ''}</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
            except Exception:
                st.info("地下岩石图例不可用")

            st.subheader("危险等级图例")
            try:
                hazard_legend = legend_manager.get_hazard_legend()
                for item in hazard_legend:
                    color_hex = f"#{int(item.color[0]*255):02x}{int(item.color[1]*255):02x}{int(item.color[2]*255):02x}"
                    desc = getattr(item, 'description', '')
                    st.markdown(
                        f"""
                        <div style='display: flex; align-items: center; margin: 5px 0;'>
                            <div style='width: 30px; height: 30px; background: {color_hex}; border-radius: 5px; margin-right: 10px; border: 1px solid #ccc;'></div>
                            <div><b>{item.label}</b>{'<br><span style="color: #666; font-size: 0.9em;">' + desc + '</span>' if desc else ''}</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
            except Exception:
                st.info("危险等级图例不可用")

        st.markdown("---")

        st.subheader("喷发阶段说明")
        stages = [
            ("喷发前 (0-20%)", "岩浆压力逐渐积累，地表开始出现地热异常"),
            ("喷发开始 (20-40%)", "岩浆突破地表，喷发强度迅速增加"),
            ("主喷发期 (40-70%)", "喷发强度达到峰值，大量熔岩流出"),
            ("喷发减弱 (70-90%)", "岩浆压力下降，喷发活动逐渐减弱"),
            ("喷发后 (90-100%)", "喷发活动停止，残留熔岩缓慢冷却"),
        ]

        for stage_name, stage_desc in stages:
            with st.expander(stage_name):
                st.write(stage_desc)


if __name__ == "__main__":
    main()
