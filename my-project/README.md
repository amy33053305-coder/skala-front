# 데이터 수집 미니 파이프라인

Open-Meteo(서울 3일 시간별 기온·강수확률), countries.dev(한국 국가정보),
ip-api.com(IP 위치정보) 3개 API를 `asyncio.gather()`로 동시 수집하고,
Pydantic v2로 스키마를 검증한 뒤 CSV/Parquet(Polars)로 저장하며 성능을 비교한다.

## 실행 방법

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## 테스트 및 코드 스타일 검사 결과

```
$ pytest -q
........                                                        [100%]
8 passed in 0.04s

$ ruff check .
All checks passed!
```

- pytest: `tests/test_models.py`에서 `WeatherRecord` / `CountryInfo` / `IPInfo` 3개
  모델의 정상값·이상값(범위 초과, 타입 오류) 케이스 총 8건 검증 — 전체 통과
- ruff: 스타일/린트 오류 0건
