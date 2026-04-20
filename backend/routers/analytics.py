import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')


def _load_metrics():
    path = os.path.join(MODELS_DIR, 'metrics.json')
    if not os.path.exists(path):
        raise HTTPException(status_code=503, detail='Models not trained yet.')
    with open(path) as f:
        return json.load(f)


@router.get('/analytics/model-performance')
async def model_performance():
    m = _load_metrics()
    return {
        'train_auc':      m.get('train_auc'),
        'test_auc':       m.get('test_auc'),
        'gini':           m.get('gini'),
        'ks_statistic':   m.get('ks_statistic'),
        'precision':      m.get('precision'),
        'recall':         m.get('recall'),
        'f1':             m.get('f1'),
        'confusion_matrix': m.get('confusion_matrix')
    }


@router.get('/analytics/feature-importance')
async def feature_importance():
    m = _load_metrics()
    fi = m.get('feature_importances', {})
    sorted_fi = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:10]
    return [{'feature': k, 'importance': v} for k, v in sorted_fi]


@router.get('/analytics/approval-distribution')
async def approval_distribution():
    log_path = os.path.join(MODELS_DIR, 'predictions_log.json')
    if not os.path.exists(log_path):
        return {'approved_pct': 0, 'rejected_pct': 0, 'review_pct': 0, 'total': 0}

    with open(log_path) as f:
        log = json.load(f)

    recent = log[-100:]
    total = len(recent)
    if total == 0:
        return {'approved_pct': 0, 'rejected_pct': 0, 'review_pct': 0, 'total': 0}

    approved = sum(1 for r in recent if r['decision'] == 'APPROVE')
    rejected = sum(1 for r in recent if r['decision'] == 'REJECT')
    review   = sum(1 for r in recent if r['decision'] == 'MANUAL_REVIEW')

    return {
        'approved_pct': round(approved / total * 100, 1),
        'rejected_pct': round(rejected / total * 100, 1),
        'review_pct':   round(review   / total * 100, 1),
        'total': total
    }


@router.get('/analytics/fairness')
async def fairness():
    log_path = os.path.join(MODELS_DIR, 'predictions_log.json')
    if not os.path.exists(log_path):
        raise HTTPException(status_code=404, detail='No predictions logged yet.')

    with open(log_path) as f:
        log = json.load(f)

    age_groups = {
        '18-25': {'approve': 0, 'total': 0},
        '26-35': {'approve': 0, 'total': 0},
        '36-50': {'approve': 0, 'total': 0},
        '51-65': {'approve': 0, 'total': 0},
        '65+':   {'approve': 0, 'total': 0},
    }

    for entry in log:
        age = entry.get('age')
        if age is None:
            continue
        if age <= 25:   group = '18-25'
        elif age <= 35: group = '26-35'
        elif age <= 50: group = '36-50'
        elif age <= 65: group = '51-65'
        else:           group = '65+'

        age_groups[group]['total'] += 1
        if entry['decision'] == 'APPROVE':
            age_groups[group]['approve'] += 1

    result = []
    for grp, counts in age_groups.items():
        rate = (counts['approve'] / counts['total'] * 100) if counts['total'] > 0 else 0
        result.append({'age_group': grp, 'approval_rate': round(rate, 1), 'count': counts['total']})

    return result
