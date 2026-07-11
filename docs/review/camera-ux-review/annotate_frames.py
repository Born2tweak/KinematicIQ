from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

out = Path(__file__).parent
font_sm = None
for fp in [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\segoeui.ttf"]:
    try:
        font_sm = ImageFont.truetype(fp, 16)
        break
    except OSError:
        pass
if font_sm is None:
    font_sm = ImageFont.load_default()


def annotate(src_name: str, dst_name: str, callouts: list[dict]) -> None:
    img = Image.open(out / src_name).convert("RGBA")
    draw = ImageDraw.Draw(img)
    w, h = img.size

    for c in callouts:
        x, y = c["xy"]
        text = c["text"]
        color = c.get("color", (255, 80, 80, 255))
        bbox = draw.textbbox((0, 0), text, font=font_sm)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        pad = 8
        box = [x, y, x + tw + pad * 2, y + th + pad * 2]
        draw.rounded_rectangle(box, radius=8, fill=(0, 0, 0, 200), outline=color, width=3)
        draw.text((x + pad, y + pad), text, fill=(255, 255, 255, 255), font=font_sm)
        if "point" in c:
            px, py = c["point"]
            draw.ellipse([px - 6, py - 6, px + 6, py + 6], fill=color)
            draw.line([box[0] + tw // 2, box[3], px, py], fill=color, width=2)

    img.convert("RGB").save(out / dst_name, quality=92)
    print("wrote", dst_name)


annotate(
    "v2_5s_analyst-flow.png",
    "annotated-01-waiting-hierarchy.png",
    [
        {"xy": (24, 110), "text": "Status chip sits under global nav — not immersive", "point": (200, 88)},
        {"xy": (24, 185), "text": "Kinect-style text only; no body template", "point": (260, 300)},
        {"xy": (900, 110), "text": "Rep counter: clear secondary focal point", "point": (1050, 170)},
        {"xy": (24, 520), "text": "Amber glow border = sole spatial feedback", "point": (640, 400)},
        {"xy": (850, 620), "text": "Analyst affordance always exposed", "point": (1120, 680)},
    ],
)

annotate(
    "v1_15s_initial-flow.png",
    "annotated-02-analyst-clutter.png",
    [
        {"xy": (20, 100), "text": "Debug panel dominates left 40% of stage", "point": (30, 350)},
        {"xy": (860, 100), "text": "3D panel blocks subject + rep count", "point": (1000, 280)},
        {"xy": (860, 200), "text": "Skeleton reads MediaPipe demo", "point": (640, 400)},
        {"xy": (20, 250), "text": "Gate FAIL visible — normal users never see why", "point": (200, 500)},
    ],
)

annotate(
    "v2_120s_analyst-flow.png",
    "annotated-03-trust-desync.png",
    [
        {"xy": (20, 95), "text": "REPS(state) vs REPS(disp) can desync in DBG", "point": (120, 420)},
        {"xy": (20, 170), "text": "MISSED reason hidden from normal users", "point": (120, 560)},
        {"xy": (860, 95), "text": "Depth Z: not validated — honest but erodes trust", "point": (1000, 360)},
        {"xy": (860, 170), "text": "Unlabeled sparkline — hip Y? depth?", "point": (1000, 430)},
        {"xy": (20, 245), "text": "FEET STABLE FAIL while reps counted", "point": (120, 700)},
    ],
)

annotate(
    "v1_30s_initial-flow.png",
    "annotated-04-active-normal-clean.png",
    [
        {"xy": (24, 110), "text": "ACTIVE normal mode: no DBG/3D clutter", "point": (200, 200)},
        {"xy": (900, 110), "text": "Live reps prominent", "point": (1050, 200)},
        {"xy": (24, 190), "text": "Auto-finish copy is clear", "point": (280, 260)},
        {"xy": (860, 200), "text": "Skeleton still on in normal mode", "point": (640, 400)},
        {"xy": (420, 620), "text": "Disclaimer hidden during ACTIVE set", "point": (640, 680)},
    ],
)

annotate(
    "v2_45s_analyst-flow.png",
    "annotated-05-3d-expanded-takeover.png",
    [
        {"xy": (20, 90), "text": "Expanded 3D occludes entire capture stage", "point": (640, 400)},
        {"xy": (20, 165), "text": "DBG panel still readable but cramped", "point": (30, 350)},
        {"xy": (900, 90), "text": "Rep counter competes with expanded panel", "point": (1050, 150)},
        {"xy": (900, 165), "text": "Collapse is only exit — easy to get stuck", "point": (1000, 80)},
    ],
)

annotate(
    "v2_30s_analyst-flow.png",
    "annotated-06-setup-3d-default.png",
    [
        {"xy": (860, 90), "text": "3D duplicates 2D skeleton at small size", "point": (1000, 300)},
        {"xy": (860, 165), "text": "Angle labels illegible at default size", "point": (980, 320)},
        {"xy": (24, 90), "text": "WAITING guidance while Analyst tools on", "point": (200, 250)},
        {"xy": (24, 520), "text": "Yellow border during setup is good", "point": (500, 400)},
    ],
)
