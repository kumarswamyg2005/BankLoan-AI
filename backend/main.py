import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

try:
    from routers import train, predict, analytics, upload
except ModuleNotFoundError:
    from backend.routers import train, predict, analytics, upload

app = FastAPI(title='BankLoan AI API', version='1.0.0')

FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
)
FRONTEND_INDEX_FILE = os.path.join(FRONTEND_DIST_DIR, 'index.html')

_origins = os.getenv('ALLOWED_ORIGINS')
if _origins:
    allowed_origins = [o.strip() for o in _origins.split(',') if o.strip()]
else:
    allowed_origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(train.router,     prefix='/api')
app.include_router(predict.router,   prefix='/api')
app.include_router(analytics.router, prefix='/api')
app.include_router(upload.router,    prefix='/api')


def _frontend_ready() -> bool:
    return os.path.isfile(FRONTEND_INDEX_FILE)


def _reserved_path(path: str) -> bool:
    if path in ('health', 'openapi.json'):
        return True
    for prefix in ('api', 'docs', 'redoc'):
        if path == prefix or path.startswith(f'{prefix}/'):
            return True
    return False


@app.on_event('startup')
async def startup():
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    if not os.path.exists(os.path.join(models_dir, 'lgbm_model.pkl')):
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'cs-training.csv')
        if os.path.exists(data_path):
            print('Auto-training models on startup...')
            try:
                from services.trainer import ModelTrainer
            except ModuleNotFoundError:
                from backend.services.trainer import ModelTrainer
            try:
                ModelTrainer().train()
                print('Models trained successfully.')
            except Exception as e:
                print(f'Auto-training failed: {e}')
        else:
            print('No dataset found. Upload cs-training.csv or use POST /api/upload.')


@app.get('/')
def root():
    if _frontend_ready():
        return FileResponse(FRONTEND_INDEX_FILE)
    return {'message': 'BankLoan AI API is running', 'docs': '/docs'}


@app.get('/health')
def health():
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    model_ready = all([
        os.path.exists(os.path.join(models_dir, 'ensemble_model.pkl')),
        os.path.exists(os.path.join(models_dir, 'lgbm_model.pkl')),
        os.path.exists(os.path.join(models_dir, 'preprocessor.pkl')),
    ])
    return {
        'status': 'ok' if model_ready else 'degraded',
        'model_ready': model_ready,
    }


@app.get('/{full_path:path}')
def serve_frontend(full_path: str):
    if _reserved_path(full_path):
        raise HTTPException(status_code=404, detail='Not Found')

    if not _frontend_ready():
        raise HTTPException(status_code=404, detail='Frontend build not found.')

    candidate = os.path.normpath(os.path.join(FRONTEND_DIST_DIR, full_path))
    if not candidate.startswith(FRONTEND_DIST_DIR):
        raise HTTPException(status_code=400, detail='Invalid path')

    if full_path and os.path.isfile(candidate):
        return FileResponse(candidate)

    return FileResponse(FRONTEND_INDEX_FILE)
