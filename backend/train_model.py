"""
CyberSphere ML Phishing URL Classifier Trainer
─────────────────────────────────────────────
Trains a Logistic Regression model on phishing URL lexical features.
Downsamples the 500k dataset to 30k rows to complete training quickly (<10s).
Saves the serialized model to 'routers/phishing_model.pkl'.
"""

import os
import re
import pickle
import pandas as pd
import numpy as np
from urllib.parse import urlparse
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler

CSV_PATH = r"C:\Users\Gaurav Kumar\Desktop\archive\phishing_site_urls.csv"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "routers", "phishing_model.pkl")

# URL Shortener domains list
SHORTENERS = {"bit.ly", "tinyurl.com", "goo.gl", "t.co", "is.gd", "buff.ly", "adf.ly", "ow.ly"}

# Keywords often found in phishing links
SECURITY_KEYWORDS = {"login", "verify", "secure", "bank", "webscr", "update", "paypal", "signin", "account"}

def extract_features(url: str) -> list:
    """Extracts 10 lexical features from a URL for model input."""
    # Ensure scheme exists for urlparse
    parsed_url = url
    if not url.startswith(("http://", "https://")):
        parsed_url = "http://" + url
    
    try:
        parsed = urlparse(parsed_url)
        host = parsed.netloc
        path = parsed.path
    except Exception:
        host = ""
        path = ""

    # 1. URL length
    url_len = len(url)
    
    # 2. Number of dots
    num_dots = url.count(".")
    
    # 3. Number of hyphens
    num_hyphens = url.count("-")
    
    # 4. Number of slashes
    num_slashes = url.count("/")
    
    # 5. Number of question marks
    num_questions = url.count("?")

    # 6. Has IP address as host
    has_ip = 1 if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", host) else 0

    # 7. Has security sensitive keywords
    has_keyword = 1 if any(kw in url.lower() for kw in SECURITY_KEYWORDS) else 0

    # 8. Is URL shortener domain
    is_shortened = 1 if host.lower() in SHORTENERS else 0

    # 9. Digit count
    num_digits = sum(c.isdigit() for c in url)

    # 10. Subdomain count
    subdomains = host.split(".")
    num_subdomains = max(0, len(subdomains) - 2) if len(subdomains) > 2 else 0

    return [
        url_len,
        num_dots,
        num_hyphens,
        num_slashes,
        num_questions,
        has_ip,
        has_keyword,
        is_shortened,
        num_digits,
        num_subdomains
    ]

def train():
    if not os.path.exists(CSV_PATH):
        print(f"Error: Phishing dataset not found at expected path: {CSV_PATH}")
        return

    print("Loading Kaggle phishing dataset...")
    df = pd.read_csv(CSV_PATH)
    
    print(f"Dataset loaded. Total rows: {len(df)}")
    print(df['Label'].value_counts())

    # Map labels: 'bad' (phishing) -> 1, 'good' (benign) -> 0
    df['target'] = df['Label'].map({'bad': 1, 'good': 0})
    
    # Downsample to speed up training while preserving balance
    df_bad = df[df['target'] == 1]
    df_good = df[df['target'] == 0]
    
    sample_size = min(15000, len(df_bad), len(df_good))
    print(f"Downsampling dataset to {sample_size * 2} rows ({sample_size} phishing / {sample_size} benign) for fast training...")
    
    df_sampled = pd.concat([
        df_bad.sample(n=sample_size, random_state=42),
        df_good.sample(n=sample_size, random_state=42)
    ]).sample(frac=1, random_state=42) # Shuffle

    print("Extracting features from URLs (this may take 5-10 seconds)...")
    X_list = []
    for url in df_sampled['URL']:
        X_list.append(extract_features(str(url)))
        
    X = np.array(X_list)
    y = df_sampled['target'].values

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train RandomForestClassifier model
    print("Training classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nTraining Complete. Model Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Save model and scaler
    print(f"Saving serialized model to: {MODEL_PATH}")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({
            "model": model,
            "scaler": scaler
        }, f)
    print("Model trained and saved successfully.")

if __name__ == "__main__":
    train()
