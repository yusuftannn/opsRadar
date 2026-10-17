from fastapi.testclient import TestClient
from main import app
from engine import Engine, demo_data
import pytest

client=TestClient(app)
def test_dashboard_and_demo():
    assert client.post('/api/demo').status_code==200
    body=client.get('/api/dashboard').json()
    assert len(body['orders'])==40
    assert body['metrics']['train_rows']==640
    assert all(0<=x['risk']<=1 for x in body['orders'])
def test_upload_and_training():
    assert client.post('/api/train',files={'file':('data.csv',demo_data().to_csv(index=False),'text/csv')}).status_code==200
    assert client.get('/api/dashboard').json()['orders']==[]
    assert client.post('/api/brief').json()['source']=='fallback'
    result=client.post('/api/orders',files={'file':('orders.csv',demo_data(10).drop(columns='delayed').to_csv(index=False),'text/csv')})
    assert result.json()['count']==10
    assert client.post('/api/explain/missing').status_code==404
def test_bad_data_preserves_model():
    e=Engine(); old=e.model
    bad=demo_data(); bad.loc[0,'workload']=2
    with pytest.raises(ValueError): e.fit(bad,'bad')
    assert e.model is old
    assert client.post('/api/orders',files={'file':('bad.csv','x\n1','text/csv')}).status_code==422
def test_no_target_leakage():
    e=Engine(); frame=demo_data(10)
    original=e.predict(frame); frame['delayed']=1-frame.delayed
    assert original==e.predict(frame)
def test_ollama_fallback(monkeypatch):
    monkeypatch.setenv('OLLAMA_URL','http://127.0.0.1:1')
    client.post('/api/demo')
    order=client.get('/api/dashboard').json()['orders'][0]
    assert client.post('/api/explain/'+order['order_id']).json()['source']=='fallback'
    english=client.post('/api/explain/'+order['order_id'],params={'lang':'en'}).json()
    assert english['source']=='fallback'
    assert 'Ollama is unavailable' in english['text']
def test_portfolio_brief_fallback(monkeypatch):
    monkeypatch.setenv('OLLAMA_URL','http://127.0.0.1:1')
    client.post('/api/demo')
    turkish=client.post('/api/brief').json()
    english=client.post('/api/brief',params={'lang':'en'}).json()
    assert turkish['source']=='fallback'
    assert '40 açık siparişin' in turkish['text']
    assert english['source']=='fallback'
    assert '40 open orders' in english['text']
    assert 'Tedarikçi' not in english['text']
