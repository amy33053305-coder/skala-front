"""
저장 및 성능 비교 모듈 (Polars)

프로그램 설명:
    검증을 통과한 DataFrame을 CSV와 Parquet 두 형식으로 각각 저장하고,
    저장한 파일을 다시 읽어 들여 정상적으로 저장됐는지 확인함과 동시에
    쓰기/읽기에 걸린 시간(초)을 측정해 두 형식의 성능을 비교한다.
    데이터 처리 성능 최적화를 위해 pandas 대신 Rust 기반의 Polars를 사용한다
    (자체 네이티브 Parquet 엔진을 내장하고 있어 별도 pyarrow 의존성이 불필요).

변경 내역:
    - 2026-07-20: 최초 작성. save_and_compare() 함수로 CSV/Parquet
      쓰기·읽기 4가지 지표를 한 번에 측정하도록 구현. (pandas 기반)
    - 2026-07-20: 성능 최적화를 위해 pandas -> Polars로 교체.
"""

from __future__ import annotations

import time
from pathlib import Path

import polars as pl


def save_and_compare(df: pl.DataFrame, name: str, out_dir: Path) -> dict[str, float]:
    """df를 CSV/Parquet로 저장 후 다시 읽어, 각 단계 소요 시간(초)을 딕셔너리로 반환.

    쓰기만 측정하지 않고 다시 읽어보는 이유: 파일이 실제로 유효한
    형식으로 저장됐는지까지 함께 검증하기 위함.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / f"{name}.csv"
    parquet_path = out_dir / f"{name}.parquet"

    timings: dict[str, float] = {}

    # CSV 쓰기
    start = time.perf_counter()
    df.write_csv(csv_path)
    timings["csv_write_s"] = time.perf_counter() - start

    # Parquet 쓰기
    start = time.perf_counter()
    df.write_parquet(parquet_path)
    timings["parquet_write_s"] = time.perf_counter() - start

    # CSV 읽기
    start = time.perf_counter()
    pl.read_csv(csv_path)
    timings["csv_read_s"] = time.perf_counter() - start

    # Parquet 읽기
    start = time.perf_counter()
    pl.read_parquet(parquet_path)
    timings["parquet_read_s"] = time.perf_counter() - start

    return timings
