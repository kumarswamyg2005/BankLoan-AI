import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException

router = APIRouter()

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
_trained_at: datetime | None = None


@router.post('/train')
async def train_model():
    global _trained_at
    try:
        try:
            from services.trainer import ModelTrainer
            from services.predictor import reset_predictor_cache
        except ModuleNotFoundError:
            from backend.services.trainer import ModelTrainer
            from backend.services.predictor import reset_predictor_cache
        metrics = ModelTrainer().train()
        reset_predictor_cache()
        _trained_at = datetime.utcnow()
        return {'status': 'success', 'metrics': metrics, 'trained_at': _trained_at.isoformat()}
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail='cs-training.csv not found. Place it in backend/data/ folder.'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/train/status')
async def train_status():
    is_trained = os.path.exists(os.path.join(MODELS_DIR, 'lgbm_model.pkl'))
    metrics = None
    if is_trained:
        metrics_path = os.path.join(MODELS_DIR, 'metrics.json')
        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                metrics = json.load(f)
    return {
        'is_trained': is_trained,
        'trained_at': _trained_at.isoformat() if _trained_at else None,
        'metrics': metrics
    }
