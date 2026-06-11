import json
from PIL import Image, ImageDraw
import os

print("Current directory:", os.getcwd())
print("Script directory:", os.path.dirname(os.path.abspath(__file__)))

WIDTH = 4096
HEIGHT = 2048

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

GEOJSON_FILE = os.path.join(
    BASE_DIR,
    "provinces.geojson"
)

with open(GEOJSON_FILE, "r", encoding="utf-8") as f:
    geo = json.load(f)

os.makedirs("output", exist_ok=True)

# descobrir limites do mapa
minX = float("inf")
maxX = float("-inf")
minY = float("inf")
maxY = float("-inf")

for feature in geo["features"]:
    coords = feature["geometry"]["coordinates"][0]

    for x, y in coords:
        minX = min(minX, x)
        maxX = max(maxX, x)
        minY = min(minY, y)
        maxY = max(maxY, y)

def convert(x, y):
    px = int((x - minX) / (maxX - minX) * WIDTH)

    py = int(
        HEIGHT -
        ((y - minY) / (maxY - minY) * HEIGHT)
    )

    return px, py

for feature in geo["features"]:

    code = feature["properties"]["code"]

    image = Image.new(
        "L",
        (WIDTH, HEIGHT),
        0
    )

    draw = ImageDraw.Draw(image)

    polygon = [
        convert(x, y)
        for x, y in feature["geometry"]["coordinates"][0]
    ]

    draw.polygon(
        polygon,
        fill=255
    )

    image.save(
        f"output/{code}.png"
    )

    print("Generated:", code)