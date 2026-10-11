import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score, brier_score_loss

FEATURES = ['quantity', 'supplier_delay_rate', 'workload', 'distance_km', 'promised_days']

def demo_data(n=800, seed=42):
    r = np.random.default_rng(seed)
    df = pd.DataFrame({'order_id': [f'ORD-{i+1000}' for i in range(n)], 'order_date': pd.date_range('2024-01-01', periods=n).strftime('%Y-%m-%d'), 'quantity': r.integers(1, 100, n), 'supplier_delay_rate': r.uniform(.02,.65,n).round(3), 'workload': r.uniform(.1,1,n).round(3), 'distance_km': r.integers(10,1500,n), 'promised_days': r.integers(1,8,n)})
    z = -2.5 + 3*df.supplier_delay_rate + 2*df.workload + .009*df.quantity + .0005*df.distance_km - .35*df.promised_days
    df['delayed'] = (r.random(n) < 1/(1+np.exp(-z))).astype(int)
    return df

def validate(df, training=False):
    required = ['order_id', 'order_date'] + FEATURES + (['delayed'] if training else [])
    missing = set(required)-set(df.columns)
    if missing: raise ValueError('Eksik sütunlar: '+', '.join(sorted(missing)))
    if len(df)==0 or len(df)>50000: raise ValueError('1–50.000 satır gereklidir.')
    df = df.copy()
    if df[required].isna().any().any(): raise ValueError('Gerekli alanlar boş olamaz.')
    if df.order_id.astype(str).str.len().gt(100).any() or df.order_id.duplicated().any(): raise ValueError('Sipariş kimlikleri benzersiz ve en fazla 100 karakter olmalı.')
    df['order_date'] = pd.to_datetime(df.order_date, errors='raise', utc=True)
    for f in FEATURES:
        df[f] = pd.to_numeric(df[f], errors='raise')
        if not np.isfinite(df[f]).all() or (df[f]<0).any(): raise ValueError(f'{f}: sonlu, negatif olmayan sayı gerekli.')
    if ((df.supplier_delay_rate>1)|(df.workload>1)).any(): raise ValueError('supplier_delay_rate ve workload 0–1 arasında olmalı.')
    if (df.promised_days<=0).any() or (df.quantity<=0).any(): raise ValueError('quantity ve promised_days sıfırdan büyük olmalı.')
    if training:
        df['delayed'] = pd.to_numeric(df.delayed, errors='raise')
        if not df.delayed.isin([0,1]).all(): raise ValueError('delayed yalnızca 0 veya 1 olmalı.')
    return df

class Engine:
    def __init__(self): self.fit(demo_data(), 'sentetik demo')
    def fit(self, frame, source):
        df = validate(frame, True).sort_values('order_date')
        if len(df)<100: raise ValueError('Eğitim için en az 100 tamamlanmış sipariş gerekli.')
        boundary = df.iloc[int(len(df)*.8)].order_date
        train, test = df[df.order_date<boundary], df[df.order_date>=boundary]
        if len(train)<50 or len(test)<20 or train.delayed.nunique()!=2 or test.delayed.nunique()!=2:
            raise ValueError('Tarih bazlı %80/%20 ayrımında yeterli veri ve her iki sınıf gerekli.')
        model = RandomForestClassifier(n_estimators=160, max_depth=7, min_samples_leaf=8, random_state=42, n_jobs=1)
        model.fit(train[FEATURES], train.delayed)
        p = model.predict_proba(test[FEATURES])[:,1]
        metrics = {'accuracy': accuracy_score(test.delayed,p>=.5), 'precision': precision_score(test.delayed,p>=.5,zero_division=0), 'recall': recall_score(test.delayed,p>=.5,zero_division=0), 'roc_auc': roc_auc_score(test.delayed,p), 'brier': brier_score_loss(test.delayed,p), 'baseline_accuracy': float(max(test.delayed.mean(),1-test.delayed.mean())), 'train_rows':len(train), 'test_rows':len(test), 'source':source, 'threshold':.5, 'importance': dict(zip(FEATURES,model.feature_importances_.tolist()))}
        # Publish only after all validation and fitting succeeds; evaluation model remains train-only.
        self.model, self.metrics = model, metrics
        self.orders = self.predict(demo_data(40,123).drop(columns='delayed')) if source=='sentetik demo' else []
        return metrics
    def predict(self, frame):
        df = validate(frame)
        probabilities = self.model.predict_proba(df[FEATURES])[:,1]
        rows=[]
        for (_,row),p in zip(df.iterrows(),probabilities):
            clues=[]
            if row.supplier_delay_rate>=.35: clues.append('Tedarikçinin geçmiş gecikme oranı yüksek.')
            if row.workload>=.75: clues.append('Sipariş anındaki operasyon iş yükü yüksek.')
            if row.promised_days<=2: clues.append('Taahhüt edilen teslim süresi kısa.')
            if row.distance_km>=900: clues.append('Teslimat mesafesi uzun.')
            if not clues: clues=['Bu sipariş için belirlenen eşiklerde belirgin bir operasyon sinyali yok.']
            item={f:float(row[f]) for f in FEATURES}
            item.update(order_id=str(row.order_id),order_date=row.order_date.strftime('%Y-%m-%d'),risk=round(float(p),4),level='Yüksek' if p>=.65 else 'Orta' if p>=.35 else 'Düşük',signals=clues)
            rows.append(item)
        return sorted(rows,key=lambda x:x['risk'],reverse=True)
