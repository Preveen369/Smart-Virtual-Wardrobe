from fastapi import APIRouter, UploadFile, File
from fastapi.staticfiles import StaticFiles
from gradio_client import Client, handle_file
import shutil
import os
from dotenv import load_dotenv

# load environment variables from .env if present
load_dotenv()

router = APIRouter()

# ensure the output directory exists; this path is relative to the backend working dir
# both mp4 previews and glb files will land here
OUTPUT_DIR = "avatars_3D"
# ensure the output directory exists; this path is relative to the backend working dir
os.makedirs(OUTPUT_DIR, exist_ok=True)

# client pointing at the TRELLIS multiple3D space
# HF_TOKEN = os.getenv("HF_TOKEN")
# if HF_TOKEN:
#     # gradio_client reads HF_TOKEN from environment when making requests
#     os.environ["HF_TOKEN"] = HF_TOKEN
client = Client("dkatz2391/Cavargas-TRELLIS-Multiple3D")

@router.post("/generate-3d")
async def generate_3d(
    file: UploadFile = File(...),
    include_glb: bool = True,              # set to False when only video is desired
):
    # write uploaded image into the avatars output directory as a temp file
    image_path = os.path.join(OUTPUT_DIR, f"temp_{file.filename}")

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # start session
    try:
        client.predict(api_name="/start_session")
    except Exception as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"session start failed: {exc}")

    # (optional) preprocess images if you want to cache results or inspect them.
    # we don't actually need its output to call /image_to_3d, so the value is
    # ignored. keeping the call mainly for completeness; you may remove it.
    try:
        _ = client.predict(
            images=[{"image": handle_file(image_path)}],
            api_name="/preprocess_images"
        )
    except Exception as exc:
        # log and continue; preprocessing failure shouldn't block generation
        print(f"preprocess warning: {exc}")

    # generate 3D (returns mp4 preview path or list)
    # use multiimages parameter with a list of dicts containing ImageData
    multi_input = [{"image": handle_file(image_path)}]
    try:
        video = client.predict(
            multiimages=multi_input,
            seed=0,
            ss_guidance_strength=7.5,
            ss_sampling_steps=12,
            slat_guidance_strength=3,
            slat_sampling_steps=12,
            multiimage_algo="stochastic",
            api_name="/image_to_3d"
        )
    except Exception as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"3D generation failed: {exc}")

    # extract GLB only if requested
    glb_url = None
    if include_glb:
        try:
            glb = client.predict(
                mesh_simplify=0.95,
                texture_size=1024,
                api_name="/extract_glb"
            )
        except Exception as exc:
            print(f"GLB extraction failed: {exc}")
            glb = None

    # generic copier: if `src` refers to a local file path (string or
    # dict containing a path) then copy it into OUTPUT_DIR and return the
    # public /avatars URL.  If copying fails or the value isn't a path, return
    # the original `src` so the frontend can still display it.
    def _copy_file(src):
        # debug log so we see what the model actually returned
        print("_copy_file received:", repr(src))
        # unwrap lists/tuples
        if isinstance(src, (list, tuple)) and src:
            return _copy_file(src[0])
        # handle dict cases
        if isinstance(src, dict):
            # if data bytes/base64 present, write them to a temp file
            if 'data' in src and isinstance(src['data'], (bytes, str)):
                # treat as raw file content
                fname = src.get('name', 'output')
                tmp_path = os.path.join(OUTPUT_DIR, fname)
                try:
                    mode = 'wb' if isinstance(src['data'], (bytes, bytearray)) else 'w'
                    with open(tmp_path, mode) as f:
                        f.write(src['data'])
                    return f"/avatars_3D/{os.path.basename(tmp_path)}"
                except Exception:
                    pass
            # otherwise try common path keys, including video or GLB paths
            src = src.get('path') or src.get('video') or src.get('glb') or src.get('mesh') or src.get('name') or src.get('file') or src
        # if we now have a usable path-like
        if isinstance(src, (str, bytes, os.PathLike)):
            try:
                dest = os.path.join(OUTPUT_DIR, os.path.basename(src))
                shutil.copy(src, dest)
                return f"/avatars_3D/{os.path.basename(dest)}"
            except Exception:
                return src
        # fallback: return whatever it was
        return src

    # copy video preview(s) if they are writable paths; otherwise keep the
    # original structure
    if isinstance(video, (list, tuple)):
        video_preview = [_copy_file(v) for v in video]
    else:
        video_preview = _copy_file(video)

    # if we generated a GLB, handle it now
    if include_glb and glb is not None:
        glb_path = glb[0] if isinstance(glb, (list, tuple)) else glb
        glb_url = _copy_file(glb_path)

    try:
        os.remove(image_path)
    except OSError:
        pass

    return {
        "video_preview": video_preview,
        "glb_url": glb_url
    }


