"""火山地质结构三维可视化 - 命令行主程序"""

from __future__ import annotations

import argparse
import sys
import os
import yaml
import numpy as np
import pyvista as pv
try:
    from pyvista.plotting.plotter import Plotter as _Plotter
    pv.Plotter = _Plotter
except (ImportError, AttributeError):
    pass
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

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


def load_config(config_path: str) -> VolcanoParameters:
    """加载YAML配置文件"""
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    return VolcanoParameters(**config)


def run_visualization(
    params: VolcanoParameters,
    view_mode: str = "external",
    scalar_field: str = "elevation",
    show_lava: bool = True,
    show_magma: bool = True,
    show_faults: bool = True,
    show_layers: bool = True,
    clip_angle: float = 0.0,
    output_dir: str = "exports",
):
    """运行可视化"""

    print("正在生成火山数据...")
    generator = VolcanoDataGenerator(params)
    dataset = generator.generate_all()
    print(f"数据生成完成 - 地表分辨率: {dataset.surface_grid[0].shape}")

    print("正在构建网格...")
    mesh_builder = MeshBuilder(dataset)
    meshes = mesh_builder.build_all()
    print(f"网格构建完成 - {len(meshes.get_all_meshes())} 个网格")

    material_mapper = MaterialMapper(dataset)
    legend_manager = LegendManager(dataset, material_mapper)
    clipper = VolcanoClipper(dataset, meshes, material_mapper)

    plotter = pv.Plotter(window_size=(1600, 900))
    plotter.set_background("white")

    if view_mode == "external":
        render_external_view(
            plotter,
            meshes,
            material_mapper,
            scalar_field,
            show_lava,
            show_magma,
            show_faults,
            show_layers,
        )
    elif view_mode == "cross_section":
        render_cross_section_view(
            plotter,
            clipper,
            meshes,
            material_mapper,
            clip_angle,
            show_magma,
            show_faults,
            show_layers,
        )
    elif view_mode == "orthogonal":
        render_orthogonal_views(
            plotter,
            clipper,
            meshes,
            material_mapper,
        )
    elif view_mode == "hazard":
        render_hazard_view(
            plotter,
            meshes,
            material_mapper,
            show_lava,
        )
    elif view_mode == "temperature":
        render_temperature_view(
            plotter,
            meshes,
            material_mapper,
            show_magma,
        )
    else:
        print(f"未知视图模式: {view_mode}，使用默认外部视图")
        render_external_view(
            plotter,
            meshes,
            material_mapper,
            scalar_field,
            show_lava,
            show_magma,
            show_faults,
            show_layers,
        )

    legend_manager.add_axes(plotter)
    legend_manager.add_scale_bar(plotter, length=500)

    view_titles = {
        "external": "外部地形视图",
        "cross_section": "剖面视图",
        "orthogonal": "正交切片视图",
        "hazard": "危险区域视图",
        "temperature": "热力分布视图",
    }

    subtitle = f"岩浆压力: {params.magma_pressure:.2f} | 喷发强度: {params.eruption_intensity:.2f} | 时间: {params.time_progress:.2f}"
    legend_manager.add_title(
        plotter,
        f"火山地质结构三维可视化 - {view_titles.get(view_mode, view_mode)}",
        subtitle=subtitle,
        font_size=14,
    )

    print("正在显示3D视图...")
    print("  操作说明:")
    print("    - 鼠标左键: 旋转")
    print("    - 鼠标滚轮: 缩放")
    print("    - 鼠标右键: 平移")
    print("    - Q: 退出")

    plotter.show()

    exporter = ResultExporter(ExportConfig(output_dir=output_dir))
    screenshot_path = exporter.export_image(
        plotter,
        f"volcano_{view_mode}_t{params.time_progress:.2f}",
    )
    print(f"截图已保存到: {screenshot_path}")


def render_external_view(
    plotter: pv.Plotter,
    meshes,
    material_mapper: MaterialMapper,
    scalar_field: str,
    show_lava: bool,
    show_magma: bool,
    show_faults: bool,
    show_layers: bool,
):
    """渲染外部视图"""

    colormap = material_mapper.get_surface_colormap(scalar_field)

    plotter.add_mesh(
        meshes.surface_mesh,
        scalars=scalar_field,
        cmap="terrain" if scalar_field == "elevation" else "viridis",
        show_scalar_bar=True,
        scalar_bar_args={"title": colormap.name, "n_labels": 5},
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
        for i, fault in enumerate(meshes.fault_meshes):
            plotter.add_mesh(
                fault,
                color=(0.3, 0.3, 0.35),
                opacity=0.3,
                style="wireframe",
            )

    if show_layers:
        for layer in meshes.rock_layer_meshes:
            color = (
                layer.point_data["color_r"][0],
                layer.point_data["color_g"][0],
                layer.point_data["color_b"][0],
            )
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


def render_cross_section_view(
    plotter: pv.Plotter,
    clipper: VolcanoClipper,
    meshes,
    material_mapper: MaterialMapper,
    clip_angle: float,
    show_magma: bool,
    show_faults: bool,
    show_layers: bool,
):
    """渲染剖面视图"""

    clip_result = clipper.clip_through_center(angle=clip_angle, invert=False)

    if clip_result.clipped_mesh is not None:
        if isinstance(clip_result.clipped_mesh, pv.MultiBlock):
            for i in range(clip_result.clipped_mesh.n_blocks):
                block = clip_result.clipped_mesh[i]
                if block is not None and block.n_points > 0:
                    if "elevation" in block.array_names:
                        plotter.add_mesh(
                            block,
                            scalars="elevation",
                            cmap="terrain",
                            opacity=0.8,
                        )
        else:
            plotter.add_mesh(
                clip_result.clipped_mesh,
                scalars="elevation",
                cmap="terrain",
                opacity=0.8,
            )

    if clip_result.clip_surface is not None:
        plotter.add_mesh(
            clip_result.clip_surface,
            scalars="rock_type",
            cmap="viridis",
            show_scalar_bar=True,
            scalar_bar_args={"title": "岩石类型", "n_labels": 6},
            opacity=0.9,
            show_edges=True,
            edge_color=(0.2, 0.2, 0.2),
        )

    if show_layers:
        for layer in meshes.rock_layer_meshes:
            clipped = layer.clip(
                normal=clip_result.normal,
                origin=clip_result.origin,
                invert=False,
            )
            if clipped.n_points > 0:
                color = (
                    layer.point_data["color_r"][0],
                    layer.point_data["color_g"][0],
                    layer.point_data["color_b"][0],
                )
                plotter.add_mesh(
                    clipped,
                    color=color,
                    opacity=0.6,
                    line_width=3,
                )

    if show_magma:
        if meshes.magma_conduit_mesh is not None:
            clipped = meshes.magma_conduit_mesh.clip(
                normal=clip_result.normal,
                origin=clip_result.origin,
                invert=False,
            )
            if clipped.n_points > 0:
                plotter.add_mesh(
                    clipped,
                    color=(1.0, 0.2, 0.0),
                    opacity=0.9,
                )
        if meshes.magma_chamber_mesh is not None:
            clipped = meshes.magma_chamber_mesh.clip(
                normal=clip_result.normal,
                origin=clip_result.origin,
                invert=False,
            )
            if clipped.n_points > 0:
                plotter.add_mesh(
                    clipped,
                    color=(1.0, 0.15, 0.0),
                    opacity=0.7,
                )

    if show_faults:
        for fault in meshes.fault_meshes:
            clipped = fault.clip(
                normal=clip_result.normal,
                origin=clip_result.origin,
                invert=False,
            )
            if clipped.n_points > 0:
                plotter.add_mesh(
                    clipped,
                    color=(0.2, 0.2, 0.25),
                    opacity=0.8,
                    line_width=2,
                )

    plotter.camera_position = [
        (5000 * np.cos(clip_angle + np.pi / 2),
         5000 * np.sin(clip_angle + np.pi / 2),
         1000),
        (0, 0, -500),
        (0, 0, 1),
    ]


def render_orthogonal_views(
    plotter: pv.Plotter,
    clipper: VolcanoClipper,
    meshes,
    material_mapper: MaterialMapper,
):
    """渲染正交切片视图"""

    slices = clipper.get_orthogonal_slices(x=0, y=0, z=-1000)

    if slices["x"] is not None:
        plotter.add_mesh(
            slices["x"],
            scalars="temperature",
            cmap="hot",
            opacity=0.8,
            show_scalar_bar=True,
            scalar_bar_args={"title": "温度 (°C)"},
        )

    if slices["y"] is not None:
        plotter.add_mesh(
            slices["y"],
            scalars="rock_type",
            cmap="viridis",
            opacity=0.7,
        )

    if slices["z"] is not None:
        plotter.add_mesh(
            slices["z"],
            scalars="density",
            cmap="plasma",
            opacity=0.6,
        )

    if meshes.magma_conduit_mesh is not None:
        plotter.add_mesh(
            meshes.magma_conduit_mesh,
            color=(1.0, 0.2, 0.0),
            opacity=0.8,
        )

    plotter.add_mesh(
        meshes.surface_mesh,
        scalars="elevation",
        cmap="terrain",
        opacity=0.3,
    )

    plotter.camera_position = [
        (3000, 3000, 2000),
        (0, 0, -500),
        (0, 0, 1),
    ]


def render_hazard_view(
    plotter: pv.Plotter,
    meshes,
    material_mapper: MaterialMapper,
    show_lava: bool,
):
    """渲染危险区域视图"""

    hazard_colors = np.array([
        [0.2, 0.8, 0.2],
        [1.0, 1.0, 0.0],
        [1.0, 0.5, 0.0],
        [1.0, 0.0, 0.0],
    ])

    plotter.add_mesh(
        meshes.hazard_zone_mesh,
        scalars="hazard_level",
        cmap=hazard_colors,
        show_scalar_bar=True,
        scalar_bar_args={
            "title": "危险等级",
            "n_labels": 4,
            "categorical": True,
            "annotations": {0: "安全", 1: "警戒", 2: "危险", 3: "极危"},
        },
        opacity=0.6,
    )

    plotter.add_mesh(
        meshes.surface_mesh,
        scalars="elevation",
        cmap="terrain",
        opacity=0.4,
    )

    if show_lava:
        for lava_flow in meshes.lava_flow_meshes:
            plotter.add_mesh(
                lava_flow,
                color=(0.95, 0.2, 0.0),
                opacity=0.95,
                line_width=5,
            )

    legend_manager = LegendManager(None, material_mapper)
    if hasattr(legend_manager, 'dataset'):
        pass

    plotter.camera_position = [
        (0, -4000, 2000),
        (0, 0, 400),
        (0, 0, 1),
    ]


def render_temperature_view(
    plotter: pv.Plotter,
    meshes,
    material_mapper: MaterialMapper,
    show_magma: bool,
):
    """渲染热力分布视图"""

    temp_colormap = material_mapper.get_volume_colormap("temperature")

    contour_result = VolcanoClipper(
        None, meshes, material_mapper
    ).extract_contours(
        scalar_field="temperature",
        values=[100, 300, 500, 700, 900],
    )

    for i, contour in enumerate(contour_result.contours):
        opacity = 0.2 + 0.15 * i
        plotter.add_mesh(
            contour,
            color=contour.point_data["RGB"][0] if "RGB" in contour.array_names else "red",
            opacity=opacity,
        )

    plotter.add_mesh(
        meshes.surface_mesh,
        scalars="temperature",
        cmap="hot",
        show_scalar_bar=True,
        scalar_bar_args={"title": "地表温度 (°C)"},
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


def run_animation(
    params: VolcanoParameters,
    num_frames: int = 50,
    fps: int = 15,
    output_dir: str = "exports",
):
    """运行动画生成"""

    print(f"生成动画: {num_frames} 帧, {fps} FPS")

    generator = VolcanoDataGenerator(params)
    animator = VolcanoAnimator(generator, params)

    camera_path, focal_path = animator.create_eruption_camera_path(num_frames)

    config = AnimationConfig(
        num_frames=num_frames,
        fps=fps,
        start_time=0.0,
        end_time=1.0,
        camera_path=camera_path,
        camera_focal_path=focal_path,
    )

    frames = animator.generate_all_frames(
        config,
        progress_callback=lambda i, n: print(f"  生成帧 {i}/{n} (时间: {frames[i-1].time:.2f})") if i > 0 else None,
    )

    def render_frame(frame, plotter):
        plotter.set_background("white")

        plotter.add_mesh(
            frame.meshes.surface_mesh,
            scalars="elevation",
            cmap="terrain",
            show_scalar_bar=False,
        )

        for lava_flow in frame.meshes.lava_flow_meshes:
            plotter.add_mesh(
                lava_flow,
                color=(0.95, 0.2, 0.0),
                opacity=0.9,
            )

        if frame.meshes.magma_conduit_mesh is not None:
            plotter.add_mesh(
                frame.meshes.magma_conduit_mesh,
                color=(1.0, 0.2, 0.0),
                opacity=0.8,
            )

        if frame.meshes.magma_chamber_mesh is not None:
            plotter.add_mesh(
                frame.meshes.magma_chamber_mesh,
                color=(1.0, 0.15, 0.0),
                opacity=0.4,
            )

        particles = animator.generate_eruption_particles(frame, num_particles=300)
        if particles.n_points > 0:
            plotter.add_mesh(
                particles,
                color=(1.0, 0.8, 0.0),
                point_size=particles.point_data["size"],
                opacity=0.8,
                render_points_as_spheres=True,
            )

        plotter.add_text(
            f"时间: {frame.time:.2f} | 强度: {frame.dataset.params.eruption_intensity:.2f}",
            position="lower_right",
            font_size=12,
            color="black",
        )

    print("渲染动画...")
    exporter = ResultExporter(ExportConfig(output_dir=output_dir))
    animation_path = exporter.export_animation(
        frames,
        "volcano_eruption",
        render_frame,
        progress_callback=lambda i, n: print(f"  渲染帧 {i}/{n}"),
    )

    print(f"动画已生成: {animation_path}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="火山地质结构三维可视化",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--config", "-c",
        type=str,
        default="config/default_params.yaml",
        help="参数配置文件路径 (默认: config/default_params.yaml)",
    )

    parser.add_argument(
        "--mode", "-m",
        type=str,
        default="external",
        choices=["external", "cross_section", "orthogonal", "hazard", "temperature", "animation"],
        help="可视化模式: external(外部视图), cross_section(剖面视图), orthogonal(正交切片), hazard(危险区域), temperature(热力分布), animation(动画生成) (默认: external)",
    )

    parser.add_argument(
        "--scalar", "-s",
        type=str,
        default="elevation",
        choices=["elevation", "rock_type", "temperature", "vegetation", "lava_thickness", "hazard_level"],
        help="地表标量场 (默认: elevation)",
    )

    parser.add_argument(
        "--magma-pressure",
        type=float,
        default=None,
        help="岩浆压力 (0.1-1.0)",
    )

    parser.add_argument(
        "--eruption-intensity",
        type=float,
        default=None,
        help="喷发强度 (0.1-1.0)",
    )

    parser.add_argument(
        "--time-progress",
        type=float,
        default=None,
        help="时间进度 (0.0-1.0)",
    )

    parser.add_argument(
        "--clip-angle",
        type=float,
        default=0.0,
        help="剖面角度(度) (默认: 0)",
    )

    parser.add_argument(
        "--num-frames",
        type=int,
        default=50,
        help="动画帧数 (默认: 50)",
    )

    parser.add_argument(
        "--fps",
        type=int,
        default=15,
        help="动画帧率 (默认: 15)",
    )

    parser.add_argument(
        "--output-dir", "-o",
        type=str,
        default="exports",
        help="输出目录 (默认: exports)",
    )

    parser.add_argument(
        "--no-lava",
        action="store_true",
        help="不显示熔岩流",
    )

    parser.add_argument(
        "--no-magma",
        action="store_true",
        help="不显示岩浆系统",
    )

    parser.add_argument(
        "--no-faults",
        action="store_true",
        help="不显示断裂带",
    )

    parser.add_argument(
        "--no-layers",
        action="store_true",
        help="不显示岩层",
    )

    args = parser.parse_args()

    print("=" * 60)
    print("火山地质结构三维可视化系统")
    print("=" * 60)
    print()

    print(f"加载配置: {args.config}")
    try:
        params = load_config(args.config)
    except Exception as e:
        print(f"警告: 无法加载配置文件 {args.config}: {e}")
        print("使用默认参数")
        params = VolcanoParameters()

    if args.magma_pressure is not None:
        params.magma_pressure = np.clip(args.magma_pressure, 0.1, 1.0)
    if args.eruption_intensity is not None:
        params.eruption_intensity = np.clip(args.eruption_intensity, 0.1, 1.0)
    if args.time_progress is not None:
        params.time_progress = np.clip(args.time_progress, 0.0, 1.0)

    print()
    print("当前参数:")
    print(f"  火山高度: {params.volcano_height} m")
    print(f"  火山口半径: {params.crater_radius} m")
    print(f"  岩浆压力: {params.magma_pressure:.2f}")
    print(f"  喷发强度: {params.eruption_intensity:.2f}")
    print(f"  时间进度: {params.time_progress:.2f}")
    print()

    clip_angle_rad = np.radians(args.clip_angle)

    if args.mode == "animation":
        run_animation(
            params,
            num_frames=args.num_frames,
            fps=args.fps,
            output_dir=args.output_dir,
        )
    else:
        run_visualization(
            params,
            view_mode=args.mode,
            scalar_field=args.scalar,
            show_lava=not args.no_lava,
            show_magma=not args.no_magma,
            show_faults=not args.no_faults,
            show_layers=not args.no_layers,
            clip_angle=clip_angle_rad,
            output_dir=args.output_dir,
        )

    print("\n完成!")


if __name__ == "__main__":
    main()
