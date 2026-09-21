"""Fails the build if data/*.json points at an image that isn't in the repo."""
import json, pathlib, sys

site = json.load(open("data/site.json", encoding="utf-8"))
projects = json.load(open("data/projects.json", encoding="utf-8"))

paths = [site["images"]["about"]["src"], site["site"]["ogImage"]]
paths += [p["image"]["src"] for p in projects["projects"] if p.get("image", {}).get("src")]

missing = [p for p in paths if p and not pathlib.Path(p).exists()]
if missing:
    print("missing image files:")
    for m in missing:
        print("  " + m)
    sys.exit(1)
print("ok  all referenced images exist")
