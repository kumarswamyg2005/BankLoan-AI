import os
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')


class OODDetector:
    def __init__(self):
        X_train = joblib.load(os.path.join(MODELS_DIR, 'X_train_reference.pkl'))
        self.scaler = StandardScaler().fit(X_train)
        self.X_scaled = self.scaler.transform(X_train)
        self.mean = self.X_scaled.mean(axis=0)
        cov = np.cov(self.X_scaled.T)
        self.inv_cov = np.linalg.pinv(cov)
        self.knn = NearestNeighbors(n_neighbors=5)
        self.knn.fit(self.X_scaled)

        # Learn OOD cutoffs from training-reference distribution instead of
        # relying on fixed hard-coded thresholds that may be too strict.
        diff = self.X_scaled - self.mean
        mahal_sq = np.einsum('ij,jk,ik->i', diff, self.inv_cov, diff)
        train_mahal = np.sqrt(np.clip(mahal_sq, 0, None))

        nn_k = min(6, len(self.X_scaled))
        distances, _ = self.knn.kneighbors(self.X_scaled, n_neighbors=nn_k)
        if nn_k > 1:
            # exclude the self-match distance (always 0)
            train_knn = distances[:, 1:].mean(axis=1)
        else:
            train_knn = distances[:, 0]

        self.high_mahal_threshold = min(
            max(float(np.quantile(train_mahal, 0.95)), 2.5),
            3.5
        )
        self.medium_mahal_threshold = min(
            max(float(np.quantile(train_mahal, 0.995)), self.high_mahal_threshold + 0.2),
            5.0
        )
        self.high_knn_threshold = min(
            max(float(np.quantile(train_knn, 0.95)), 1.0),
            1.5
        )
        self.medium_knn_threshold = min(
            max(float(np.quantile(train_knn, 0.995)), self.high_knn_threshold + 0.2),
            2.5
        )

    def get_similarity_score(self, new_customer_array: np.ndarray) -> dict:
        if isinstance(new_customer_array, np.ndarray):
            arr = new_customer_array
            if arr.ndim == 1:
                arr = arr.reshape(1, -1)
            new_scaled = self.scaler.transform(arr)
        else:
            new_scaled = self.scaler.transform(new_customer_array)

        diff = new_scaled - self.mean
        mahal = float(np.sqrt(diff @ self.inv_cov @ diff.T)[0][0])

        distances, _ = self.knn.kneighbors(new_scaled)
        knn_dist = float(distances.mean())

        if mahal <= self.high_mahal_threshold and knn_dist <= self.high_knn_threshold:
            label = "High"
            multiplier = 1.0
            is_ood = False
        elif mahal <= self.medium_mahal_threshold and knn_dist <= self.medium_knn_threshold:
            label = "Medium"
            multiplier = 0.8
            is_ood = False
        else:
            label = "Low"
            multiplier = 0.5
            is_ood = True

        return {
            "similarity_label": label,
            "mahalanobis_distance": round(mahal, 2),
            "knn_distance": round(knn_dist, 2),
            "is_ood": is_ood,
            "confidence_multiplier": multiplier
        }
