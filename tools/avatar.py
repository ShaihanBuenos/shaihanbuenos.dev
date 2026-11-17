"""Draws the pixel art avatar of the site (a caricature, 48 x 48 pixels).

Usage: python avatar.py output.png [scale]
The drawing is made of simple shapes on a grid of 48 x 48 and enlarged
without smoothing. To change it, edit the shapes below. Needs Pillow.
"""
import sys
from PIL import Image, ImageDraw

BACKGROUND = (24, 62, 201)  # sapphire
INK = (20, 22, 27)
HAIR = (20, 22, 27)
SHINE = (58, 64, 80)        # highlight on the hair and on the jacket
SKIN = (240, 200, 178)
SKIN_2 = (224, 152, 118)    # half shadow
SKIN_3 = (190, 96, 52)      # shadow
MOUTH = (156, 61, 18)
SHEET = (251, 250, 248)
COLLAR = (196, 194, 190)
COPPER = (214, 92, 36)

im = Image.new("RGB", (48, 48), BACKGROUND)
d = ImageDraw.Draw(im)
P = lambda pts, c: d.polygon(pts, fill=c)
E = lambda box, c: d.ellipse(box, fill=c)
R = lambda box, c: d.rectangle(box, fill=c)
L = lambda pts, c: d.line(pts, fill=c)
px = lambda pts, c: [im.putpixel(p, c) for p in pts]

# jacket and shoulders
P([(0, 47), (0, 41), (6, 36), (16, 33), (32, 33), (42, 36), (47, 41), (47, 47)], INK)
L([(6, 37), (15, 34)], SHINE); L([(33, 34), (42, 37)], SHINE)
# neck
R((20, 29, 29, 36), SKIN_3)
# open shirt, no tie
P([(19, 33), (31, 33), (28, 47), (22, 47)], SHEET)
P([(22, 33), (28, 33), (25, 39)], SKIN_2)
L([(21, 34), (24, 41)], COLLAR); L([(29, 34), (26, 41)], COLLAR); L([(25, 42), (25, 47)], COLLAR)
# lapels
L([(18, 34), (22, 47)], SHINE); L([(32, 34), (28, 47)], SHINE)
R((37, 41, 41, 42), COPPER)   # pocket square

# ear (on the viewer's left)
E((10, 17, 15, 25), SKIN_2); px([(12, 20), (12, 21), (13, 22)], SKIN_3)
# head, turned slightly to the right
E((13, 7, 37, 35), SKIN)
P([(13, 14), (17, 14), (16, 24), (18, 31), (14, 26)], SKIN_2)   # shadow of the cheek
# hair: short sides and a tall quiff
P([(12, 19), (12, 11), (16, 7), (18, 10), (15, 13), (14, 18)], HAIR)
P([(36, 19), (37, 11), (33, 7), (31, 10), (35, 14)], HAIR)
P([(13, 12), (14, 5), (18, 2), (24, 0), (31, 1), (36, 4), (38, 9), (35, 12), (30, 9), (23, 10), (17, 13)], HAIR)
px([(17, 1), (21, 0), (27, -0), (33, 1), (15, 3), (37, 6)], HAIR)
for x0, y0 in [(19, 4), (23, 3), (27, 3), (31, 4)]:
    L([(x0, y0 + 3), (x0 + 2, y0)], SHINE)
# thick eyebrows
R((18, 16, 23, 17), INK); px([(17, 17)], INK)
R((28, 16, 34, 17), INK); px([(35, 17)], INK)
# eyes, looking to the side
R((19, 19, 22, 20), SHEET); R((21, 19, 22, 20), INK)
R((29, 19, 32, 20), SHEET); R((31, 19, 32, 20), INK)
px([(19, 21), (20, 21), (29, 21), (30, 21)], SKIN_2)
# nose
L([(27, 19), (27, 24)], SKIN_2); R((26, 24, 29, 25), SKIN_2); px([(26, 26), (29, 26)], SKIN_3)
# full beard
P([(13, 23), (16, 25), (19, 27), (32, 27), (35, 25), (37, 22), (37, 28), (34, 34), (29, 37), (23, 37), (17, 34), (14, 29)], HAIR)
R((20, 27, 31, 28), HAIR)                        # mustache
R((23, 29, 28, 29), MOUTH); R((24, 30, 27, 30), SKIN_2)
px([(16, 28), (18, 31), (20, 33), (33, 31), (31, 33), (24, 35), (27, 35), (35, 27)], SHINE)

scale = int(sys.argv[2]) if len(sys.argv) > 2 else 6
im.resize((48 * scale, 48 * scale), Image.NEAREST).save(sys.argv[1], optimize=True)
