from __future__ import annotations

import argparse
import math
from collections import deque
from pathlib import Path

from PIL import Image


SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove border-connected backgrounds from building image assets and save transparent cleaned PNG copies."
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="Image files or directories containing supported image files.",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory where cleaned PNG copies will be written.",
    )
    parser.add_argument(
        "--tolerance",
        type=float,
        default=48,
        help="RGB distance tolerance for matching background pixels.",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=14,
        help="Padding added around the cropped non-transparent sprite.",
    )
    parser.add_argument(
        "--keep-largest-component",
        action="store_true",
        help="After background removal, keep only the largest connected visible component.",
    )
    return parser.parse_args()


def collect_input_files(raw_inputs: list[str]) -> list[Path]:
    files: list[Path] = []
    seen: set[Path] = set()

    for raw_input in raw_inputs:
        path = Path(raw_input)
        if path.is_dir():
            for child in sorted(path.iterdir()):
                if child.suffix.lower() in SUPPORTED_EXTENSIONS and child.is_file() and "-clean" not in child.stem:
                    resolved = child.resolve()
                    if resolved not in seen:
                        files.append(child)
                        seen.add(resolved)
            continue

        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            resolved = path.resolve()
            if resolved not in seen:
                files.append(path)
                seen.add(resolved)

    return files


def average_patch(image: Image.Image, left: int, top: int, right: int, bottom: int) -> tuple[float, float, float]:
    total_r = 0
    total_g = 0
    total_b = 0
    count = 0

    for y in range(top, bottom):
        for x in range(left, right):
            red, green, blue, _alpha = image.getpixel((x, y))
            total_r += red
            total_g += green
            total_b += blue
            count += 1

    if count == 0:
        return (255.0, 255.0, 255.0)

    return (total_r / count, total_g / count, total_b / count)


def sample_background_colors(image: Image.Image) -> list[tuple[float, float, float]]:
    width, height = image.size
    sample_size = max(3, min(width, height) // 32)

    return [
        average_patch(image, 0, 0, sample_size, sample_size),
        average_patch(image, width - sample_size, 0, width, sample_size),
        average_patch(image, 0, height - sample_size, sample_size, height),
        average_patch(image, width - sample_size, height - sample_size, width, height),
    ]


def color_distance(pixel: tuple[int, int, int, int], background: tuple[float, float, float]) -> float:
    red, green, blue, _alpha = pixel
    return math.sqrt(
        (red - background[0]) ** 2
        + (green - background[1]) ** 2
        + (blue - background[2]) ** 2
    )


def matches_background(pixel: tuple[int, int, int, int], backgrounds: list[tuple[float, float, float]], tolerance: float) -> bool:
    if pixel[3] == 0:
        return True
    return min(color_distance(pixel, background) for background in backgrounds) <= tolerance


def build_background_mask(image: Image.Image, tolerance: float) -> list[list[bool]]:
    width, height = image.size
    backgrounds = sample_background_colors(image)
    visited = [[False for _x in range(width)] for _y in range(height)]
    mask = [[False for _x in range(width)] for _y in range(height)]
    queue: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if visited[y][x]:
            return
        visited[y][x] = True
        if matches_background(image.getpixel((x, y)), backgrounds, tolerance):
            mask[y][x] = True
            queue.append((x, y))

    for x in range(width):
        try_seed(x, 0)
        try_seed(x, height - 1)

    for y in range(height):
        try_seed(0, y)
        try_seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if next_x < 0 or next_x >= width or next_y < 0 or next_y >= height:
                continue
            if visited[next_y][next_x]:
                continue
            visited[next_y][next_x] = True
            if matches_background(image.getpixel((next_x, next_y)), backgrounds, tolerance):
                mask[next_y][next_x] = True
                queue.append((next_x, next_y))

    return mask


def crop_visible_bounds(image: Image.Image, padding: int) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def keep_largest_visible_component(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    width, height = image.size
    visited = [[False for _x in range(width)] for _y in range(height)]
    largest_component: set[tuple[int, int]] = set()

    for start_y in range(height):
        for start_x in range(width):
            if visited[start_y][start_x] or alpha.getpixel((start_x, start_y)) == 0:
                continue

            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            visited[start_y][start_x] = True
            component: set[tuple[int, int]] = set()

            while queue:
                x, y = queue.popleft()
                component.add((x, y))
                for next_x, next_y in (
                    (x - 1, y),
                    (x + 1, y),
                    (x, y - 1),
                    (x, y + 1),
                ):
                    if next_x < 0 or next_x >= width or next_y < 0 or next_y >= height:
                        continue
                    if visited[next_y][next_x] or alpha.getpixel((next_x, next_y)) == 0:
                        continue
                    visited[next_y][next_x] = True
                    queue.append((next_x, next_y))

            if len(component) > len(largest_component):
                largest_component = component

    if not largest_component:
        return image

    filtered_image = image.copy()
    for y in range(height):
        for x in range(width):
            if (x, y) in largest_component:
                continue
            red, green, blue, _alpha = filtered_image.getpixel((x, y))
            filtered_image.putpixel((x, y), (red, green, blue, 0))

    return filtered_image


def clean_image(
    source_path: Path,
    output_dir: Path,
    tolerance: float,
    padding: int,
    keep_largest_component: bool,
) -> tuple[Path, tuple[int, int], tuple[int, int]]:
    source_image = Image.open(source_path).convert("RGBA")
    cleaned_image = source_image.copy()
    mask = build_background_mask(cleaned_image, tolerance)

    for y in range(cleaned_image.height):
        for x in range(cleaned_image.width):
            if mask[y][x]:
                red, green, blue, _alpha = cleaned_image.getpixel((x, y))
                cleaned_image.putpixel((x, y), (red, green, blue, 0))

    if keep_largest_component:
        cleaned_image = keep_largest_visible_component(cleaned_image)

    cropped_image = crop_visible_bounds(cleaned_image, padding)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{source_path.stem}-clean.png"
    cropped_image.save(output_path)
    return output_path, source_image.size, cropped_image.size


def main() -> int:
    args = parse_args()
    input_files = collect_input_files(args.inputs)
    output_dir = Path(args.output_dir)

    if not input_files:
        raise SystemExit("No PNG files found in the provided inputs.")

    for source_path in input_files:
        output_path, source_size, cleaned_size = clean_image(
            source_path,
            output_dir,
            args.tolerance,
            args.padding,
            args.keep_largest_component,
        )
        print(f"{source_path} -> {output_path} | {source_size[0]}x{source_size[1]} -> {cleaned_size[0]}x{cleaned_size[1]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
