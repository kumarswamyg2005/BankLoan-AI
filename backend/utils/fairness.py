import pandas as pd


def approval_rate_by_age_group(df: pd.DataFrame, target_col: str, age_col: str) -> dict:
    bins = [0, 25, 35, 50, 65, 200]
    labels = ['18-25', '26-35', '36-50', '51-65', '65+']
    df = df.copy()
    df['_age_group'] = pd.cut(df[age_col], bins=bins, labels=labels)
    grouped = df.groupby('_age_group')[target_col].mean()
    return {str(k): round(float(v), 4) for k, v in grouped.items()}
