import os
import shutil
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')


@router.post('/upload')
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail='Only CSV files are accepted.')

    os.makedirs(DATA_DIR, exist_ok=True)
    dest = os.path.join(DATA_DIR, 'cs-training.csv')

    with open(dest, 'wb') as f:
        shutil.copyfileobj(file.file, f)

    try:
        df = pd.read_csv(dest, index_col=0, nrows=5)
        preview = df.head(5).to_dict(orient='records')
        columns = list(df.columns)
        return {
            'status': 'success',
            'filename': file.filename,
            'columns': columns,
            'preview': preview
        }
    except Exception as e:
        raise HTTPException(status_code=422, detail=f'Could not parse CSV: {e}')
