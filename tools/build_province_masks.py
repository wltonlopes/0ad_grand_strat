import json
from PIL import Image, ImageDraw
import os
import math

WORLD_WIDTH = 4096
WORLD_HEIGHT = 2048

MASK_SIZE = 1024

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

GEOJSON_FILE = os.path.join(
    BASE_DIR,
    "provinces.geojson"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "output"
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

with open(
    GEOJSON_FILE,
    "r",
    encoding="utf-8"
) as f:
    geo = json.load(f)

# --------------------------------------------------
# Descobrir limites globais
# --------------------------------------------------

minX = float("inf")
maxX = float("-inf")
minY = float("inf")
maxY = float("-inf")

for feature in geo["features"]:

    polygon = feature["geometry"]["coordinates"][0]

    for x, y in polygon:

        minX = min(minX, x)
        maxX = max(maxX, x)

        minY = min(minY, y)
        maxY = max(maxY, y)

# --------------------------------------------------
# Conversão GeoJSON -> mundo 4096x2048
# --------------------------------------------------

def world_to_pixel(x, y):

    px = (
        (x - minX)
        /
        (maxX - minX)
    ) * WORLD_WIDTH

    py = WORLD_HEIGHT - (
        (y - minY)
        /
        (maxY - minY)
    ) * WORLD_HEIGHT

    return px, py

# --------------------------------------------------
# Gerar PNGs
# --------------------------------------------------

for feature in geo["features"]:

    code = feature["properties"]["code"]

    world_polygon = [
        world_to_pixel(x, y)
        for x, y in feature["geometry"]["coordinates"][0]
    ]

    min_px = min(p[0] for p in world_polygon)
    max_px = max(p[0] for p in world_polygon)

    min_py = min(p[1] for p in world_polygon)
    max_py = max(p[1] for p in world_polygon)

    center_x = sum(p[0] for p in world_polygon) / len(world_polygon)
    center_y = sum(p[1] for p in world_polygon) / len(world_polygon)

    feature["properties"]["centerpoint"] = [
        int(round(center_x)),
        int(round(center_y))
    ]

    bbox_w = max_px - min_px
    bbox_h = max_py - min_py

    if bbox_w <= 0 or bbox_h <= 0:
        continue

    # --------------------------------------
    # posição do sprite no mundo
    # --------------------------------------

    feature["properties"]["position"] = {
        "x": int(round(min_px)),
        "y": int(round(min_py))
    }

    feature["properties"]["bbox"] = {
        "w": int(round(bbox_w)),
        "h": int(round(bbox_h))
    }

    # --------------------------------------
    # desenhar dentro do PNG
    # --------------------------------------

    local_polygon = []

    for px, py in world_polygon:

        lx = px - min_px
        ly = py - min_py

        local_polygon.append(
            (
                lx,
                ly
            )
        )

    image = Image.new(
        "RGBA",
        (
            MASK_SIZE,
            MASK_SIZE
        ),
        (
            0,
            0,
            0,
            0
        )
    )

    draw = ImageDraw.Draw(image)

    draw.polygon(
        local_polygon,
        fill=(
            255,
            255,
            255,
            255
        )
    )

    image.save(
        os.path.join(
            OUTPUT_DIR,
            code + ".png"
        )
    )

    print(
        f"{code} "
        f"position=({int(min_px)}, {int(min_py)}) "
        f"bbox=({int(bbox_w)}x{int(bbox_h)})"
    )

# --------------------------------------------------
# Salvar GeoJSON
# --------------------------------------------------

with open(
    GEOJSON_FILE,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        geo,
        f,
        ensure_ascii=False,
        indent=2
    )

print()
print("Done.")