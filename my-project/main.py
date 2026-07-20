"""
데이터 수집 미니 파이프라인 - 진입점(main)

프로그램 설명:
    Open-Meteo(서울 3일 시간별 기온·강수확률), countries.dev(한국 국가정보),
    ip-api.com(IP 기반 위치정보) 세 개의 외부 API를 asyncio.gather()로
    동시에 수집한 뒤, Pydantic v2 모델로 타입·범위를 검증하고,
    검증을 통과한 데이터만 CSV / Parquet 두 형식으로 저장하면서
    각 형식의 읽기·쓰기 소요 시간을 측정해 비교한다.

실행 방법:
    venv 활성화 후 `python main.py`

변경 내역:
    - 2026-07-20: 최초 작성. 비동기 수집(fetch) -> 스키마 검증(models) ->
      저장/성능비교(storage) 3단계 파이프라인 구현.
    - 2026-07-20: 성능 최적화를 위해 pandas -> Polars로 교체.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

import polars as pl

from pipeline.fetch import collect_raw, parse_country, parse_ip, parse_weather
from pipeline.storage import save_and_compare

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# 검증 완료된 데이터(csv/parquet)가 저장될 디렉터리
DATA_DIR = Path(__file__).parent / "data"


async def run() -> None:
    """전체 파이프라인 실행: 동시 수집 -> 스키마 검증 -> 저장 -> 성능 비교 출력."""
    # 1) 3개 API를 asyncio.gather()로 동시에 호출 (fetch.py 내부에서 처리)
    weather_raw, country_raw, ip_raw = await collect_raw()

    # 2) 원본 JSON에서 필요한 필드만 추출해 Pydantic 모델로 검증
    #    (타입/범위 오류가 있으면 여기서 예외 처리됨 -> fetch.py 참고)
    weather_records = parse_weather(weather_raw)
    country = parse_country(country_raw)
    ip_info = parse_ip(ip_raw)

    print(f"weather: {len(weather_records)} hourly rows validated")
    print(f"country: {country.name} (pop {country.population:,})")
    print(f"ip: {ip_info.query} -> {ip_info.city}, {ip_info.country}")

    # 3) 검증된 모델을 DataFrame으로 변환 (weather는 여러 행, country/ip는 단일 행)
    datasets = {
        "weather": pl.DataFrame([r.model_dump() for r in weather_records]),
        "country": pl.DataFrame([country.model_dump(mode="json")]),
        "ip": pl.DataFrame([ip_info.model_dump(mode="json")]),
    }

    # 4) 데이터셋별로 CSV/Parquet 저장 및 읽기/쓰기 시간 측정 결과 출력
    print("\n--- CSV vs Parquet performance (seconds) ---")
    for name, df in datasets.items():
        timings = save_and_compare(df, name, DATA_DIR)
        print(f"{name}: {timings}")


if __name__ == "__main__":
    asyncio.run(run())
