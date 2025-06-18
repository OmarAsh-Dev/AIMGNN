from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torchaudio
from audiocraft.models.musicgen import MusicGen
from audiocraft.data.audio import audio_write
from io import BytesIO
import os
import time
import logging
from typing import Optional
import subprocess

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Attempt to install ffmpeg on startup
try:
    logger.info("Installing ffmpeg (if needed)...")
    subprocess.run(
        ['sudo', 'apt', 'install', 'ffmpeg', '-y'], 
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
except subprocess.CalledProcessError as e:
    logger.error(f"Failed to install ffmpeg: {e.stderr.decode()}")
except Exception as e:
    logger.error(f"Unexpected error during ffmpeg installation: {str(e)}")

# Initialize FastAPI app
app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize both models
device = "cuda"
checkpoint = torch.load("lightning_logs/version_7/checkpoints/epoch=0-step=1490.ckpt")
state_dict = checkpoint["state_dict"]
model_large = MusicGen.get_pretrained('facebook/musicgen-stereo-large')
model_large.lm.load_state_dict(state_dict,strict=False)
model_large.lm.float()
model_large.lm.eval()
model_melody = MusicGen.get_pretrained('facebook/musicgen-melody')

# Global variable to store parameters
current_params = None

# Ensure the tmp directory exists
os.makedirs("tmp", exist_ok=True)

class GenerationParams(BaseModel):
    use_sampling: Optional[bool] = True
    top_k: Optional[int] = 250
    top_p: Optional[float] = 0
    temperature: Optional[float] = 1
    cfg_coef: Optional[float] = 3
    cfg_coef_beta: Optional[float] = None
    two_step_cfg: Optional[bool] = False
    extend_stride: Optional[float] = 18

class PredictRequest(BaseModel):
    prompt: str
    duration: int = 60
    params: Optional[GenerationParams] = None
    
class InterpolationRequest(BaseModel):
    prompt: str
    file_path: str
    duration: int = 60
    params: Optional[GenerationParams] = None

@app.post("/set-params")
async def set_params(params: GenerationParams):
    """Endpoint to set global generation parameters"""
    global current_params
    current_params = params
    logger.info(f"New parameters set: {current_params.model_dump()}")
    return {"message": "Parameters updated successfully", "params": current_params.model_dump()}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    """Upload endpoint remains unchanged"""
    try:
        file_path = os.path.join("tmp", f"uploaded_{time.time()}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(await file.read())
        logger.info(f"File saved to {file_path}")
        return {"file_path": file_path}
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file.")

@app.post("/predict")
async def predict(request: PredictRequest):
    """Predict endpoint using musicgen-large"""
    try:
        params = request.params or current_params or GenerationParams()
        
        logger.info(f"Generating with musicgen-large, duration: {request.duration}s, params: {params.model_dump()}")

        model_large.set_generation_params(
            duration=request.duration,
            **params.model_dump()
        )

        wav = model_large.generate([request.prompt])

        output_path = os.path.join("tmp", f"output_{time.time()}")
        for one_wav in wav:
            audio_write(
                output_path,
                one_wav.cpu(),
                model_large.sample_rate,
                strategy="loudness",
                loudness_compressor=True
            )

        wav_file_path = output_path + ".wav"
        with open(wav_file_path, "rb") as f:
            audio_data = f.read()
        os.remove(wav_file_path)

        return StreamingResponse(BytesIO(audio_data), media_type="audio/wav")
    
    except Exception as e:
        logger.error(f"Error in /predict: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interpolation")
async def interpolation(request: InterpolationRequest):
    """Interpolation endpoint using musicgen-melody"""
    try:
        params = request.params or current_params or GenerationParams()
        
        logger.info(f"Interpolation with musicgen-melody, duration: {request.duration}s, params: {params.model_dump()}")

        model_melody.set_generation_params(
            duration=request.duration,
            **params.model_dump()
        )

        melody, sr = torchaudio.load(request.file_path)
        os.remove(request.file_path)

        wav = model_melody.generate_with_chroma([request.prompt], melody, sr)

        output_path = os.path.join("tmp", f"output_{time.time()}")
        for one_wav in wav:
            audio_write(
                output_path,
                one_wav.cpu(),
                model_melody.sample_rate,
                strategy="loudness",
                loudness_compressor=True
            )

        wav_file_path = output_path + ".wav"
        with open(wav_file_path, "rb") as f:
            data = f.read()
        os.remove(wav_file_path)

        return Response(content=data, media_type="audio/wav")
    
    except Exception as e:
        logger.error(f"Error in /interpolation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)