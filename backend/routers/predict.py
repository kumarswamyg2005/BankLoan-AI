import os
import json
import tempfile
from threading import Lock
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
PREDICTIONS_LOG = os.path.join(MODELS_DIR, 'predictions_log.json')
_PREDICTION_LOG_LOCK = Lock()


class CustomerInput(BaseModel):
    age: int = Field(..., ge=18, le=100)
    MonthlyIncome: float = Field(..., gt=0)
    DebtRatio: float = Field(..., ge=0, le=1)
    RevolvingUtilizationOfUnsecuredLines: float = Field(..., ge=0, le=1)
    NumberOfOpenCreditLinesAndLoans: int = Field(..., ge=0, le=40)
    NumberOfDependents: int = Field(..., ge=0, le=20)
    NumberRealEstateLoansOrLines: int = Field(..., ge=0, le=10)
    NumberOfTime30_59DaysPastDueNotWorse: int = Field(..., ge=0, le=20)
    NumberOfTime60_89DaysPastDueNotWorse: int = Field(..., ge=0, le=20)
    NumberOfTimes90DaysLate: int = Field(..., ge=0, le=20)


def _log_prediction(result: dict, customer: dict):
    os.makedirs(MODELS_DIR, exist_ok=True)
    with _PREDICTION_LOG_LOCK:
        log = []
        if os.path.exists(PREDICTIONS_LOG):
            with open(PREDICTIONS_LOG) as f:
                try:
                    log = json.load(f)
                except json.JSONDecodeError:
                    log = []

        log.append({
            'decision': result['decision'],
            'risk_score': result['risk_score'],
            'age': customer.get('age'),
            'timestamp': datetime.utcnow().isoformat()
        })
        log = log[-500:]

        with tempfile.NamedTemporaryFile('w', dir=MODELS_DIR, delete=False) as tmp:
            json.dump(log, tmp)
            temp_name = tmp.name
        os.replace(temp_name, PREDICTIONS_LOG)


@router.post('/predict')
async def predict_loan(customer: CustomerInput, track: bool = Query(True)):
    if not os.path.exists(os.path.join(MODELS_DIR, 'ensemble_model.pkl')):
        raise HTTPException(
            status_code=503,
            detail='Models not trained yet. Call POST /api/train first.'
        )
    try:
        from services.predictor import get_predictor
        customer_data = customer.model_dump()
        result = get_predictor().predict(customer_data)
        if track:
            _log_prediction(result, customer_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
