import os
import random
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import cloudinary.uploader
import requests

router = APIRouter()

POLLINATIONS_API_KEY = os.getenv("POLLINATIONS_API_KEY")

@router.post('/avatar')
async def generate_avatar(
    prompt: str = Form(...),
    file: UploadFile | None = File(None)
):
    """Generate a 3D-style avatar using Pollinations and optional reference image.

    - uploads the provided file to Cloudinary under `virtual_wardrobe/avatar_images`
    - calls Pollinations with model=klein, width/height 2048 and a random seed
    - returns the Cloudinary URL of the generated avatar
    """
    API_KEY = POLLINATIONS_API_KEY
    MODEL = "qwen-image"
    WIDTH = 2048
    HEIGHT = 2048

    # upload reference image if provided
    reference_url = None
    if file is not None:
        try:
            content = await file.read()
            upload_result = cloudinary.uploader.upload(
                content,
                folder="virtual_wardrobe/avatar_images",
                resource_type="image"
            )
            reference_url = upload_result.get("secure_url")
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"failed to upload reference image: {exc}")

    # build prompt
    quality_prefix = (
        "\n    complete masterpiece, best quality, ultra high resolution, photorealistic,\n    8K, extremely detailed, sharp focus, professional lighting, cinematic,\n hyperrealistic\n modify the image into 3d style cartoon form  "
    )
    final_prompt = f"{quality_prefix} {prompt}"

    seed = random.randint(1, 100000)
    try:
        encoded = quote(final_prompt, safe="")
        url = f"https://gen.pollinations.ai/image/{encoded}"
        params = {
            "model": MODEL,
            "width": WIDTH,
            "height": HEIGHT,
            "seed": seed,
        }
        if reference_url:
            params["image"] = reference_url

        headers = {}
        if API_KEY:
            headers["Authorization"] = f"Bearer {API_KEY}"

        resp = requests.get(url, params=params, headers=headers, timeout=60, stream=True)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {str(exc)}")

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text or "Pollinations error")

    # upload resulting image to Cloudinary as well so the frontend can simply display it
    try:
        # read binary content
        image_bytes = resp.content
        generated_upload = cloudinary.uploader.upload(
            image_bytes,
            folder="virtual_wardrobe/avatar_images",
            resource_type="image"
        )
        result_url = generated_upload.get("secure_url")
    except Exception as exc:
        # fall back to returning the Pollinations URL if upload fails
        result_url = resp.url

    return {"image_url": result_url, "status": resp.status_code}
