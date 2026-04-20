import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import train, predict, analytics, upload

app = FastAPI(title='BankLoan AI API', version='1.0.0')

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


@app.on_event('startup')
async def startup():
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    if not os.path.exists(os.path.join(models_dir, 'lgbm_model.pkl')):
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'cs-training.csv')
        if os.path.exists(data_path):
            print('Auto-training models on startup...')
            from services.trainer import ModelTrainer
            try:
                ModelTrainer().train()
                print('Models trained successfully.')
            except Exception as e:
                print(f'Auto-training failed: {e}')
        else:
            print('No dataset found. Upload cs-training.csv or use POST /api/upload.')


@app.get('/')
def root():
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
