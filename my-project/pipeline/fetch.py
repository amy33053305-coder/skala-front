"""
비동기 수집 모듈 (httpx + asyncio)

프로그램 설명:
    3개 API(Open-Meteo, countries.dev, ip-api.com)를 asyncio.gather()로
    동시에 호출해 원본 JSON을 가져오고(collect_raw), 각 API 응답에서
    필요한 필드만 뽑아 pipeline.models의 Pydantic 모델로 검증한다
    (parse_weather / parse_country / parse_ip). 3개 요청을 동시에 보내므로
    전체 대기 시간은 셋 중 가장 느린 요청 하나에 수렴한다(순차 합산이 아님).

변경 내역:
    - 2026-07-20: 최초 작성. 동시 수집(collect_raw) + API별 파싱/검증 함수 구현.
"""

from __future__ import annotations

import asyncio
import logging

import httpx
from pydantic import ValidationError

from pipeline.models import CountryInfo, IPInfo, WeatherRecord

logger = logging.getLogger(__name__)

# 서울 좌표, 3일치 시간별 예보
OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=37.5665&longitude=126.9780"
    "&hourly=temperature_2m,precipitation_probability"
    "&forecast_days=3&timezone=Asia/Seoul"
)
COUNTRY_URL = "https://countries.dev/alpha/KOR"
IP_URL = "http://ip-api.com/json/8.8.8.8"

REQUEST_TIMEOUT = 10.0


async def fetch_json(client: httpx.AsyncClient, url: str) -> dict:
    """단일 GET 요청을 보내고 JSON을 반환. HTTP 오류 상태코드면 예외 발생."""
    response = await client.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.json()


async def collect_raw() -> tuple[dict, dict, dict]:
    """날씨/국가정보/IP위치 3개 API를 asyncio.gather()로 동시에 호출."""
    async with httpx.AsyncClient() as client:
        weather_raw, country_raw, ip_raw = await asyncio.gather(
            fetch_json(client, OPEN_METEO_URL),
            fetch_json(client, COUNTRY_URL),
            fetch_json(client, IP_URL),
        )
    return weather_raw, country_raw, ip_raw


def parse_weather(raw: dict) -> list[WeatherRecord]:
    """Open-Meteo 시간별 배열을 검증된 WeatherRecord 리스트로 변환.

    한 시간대 데이터에 타입/범위 오류가 있어도 전체를 중단하지 않고
    해당 행만 건너뛰고 경고 로그를 남긴다(나머지 약 71개 행은 계속 사용).
    """
    hourly = raw["hourly"]
    records: list[WeatherRecord] = []
    # 세 배열(time, temperature_2m, precipitation_probability)을 같은 인덱스로 순회
    for time, temperature, precipitation in zip(
        hourly["time"], hourly["temperature_2m"], hourly["precipitation_probability"], strict=True
    ):
        try:
            records.append(
                WeatherRecord(
                    time=time,
                    temperature_2m=temperature,
                    precipitation_probability=precipitation,
                )
            )
        except ValidationError as exc:
            # 개별 행 검증 실패 -> 전체 파이프라인은 계속 진행
            logger.warning("Skipping invalid weather row at %s: %s", time, exc)
    return records


def parse_country(raw: dict) -> CountryInfo:
    """countries.dev 응답을 CountryInfo로 검증. 실패 시 원인을 담아 재발생."""
    try:
        return CountryInfo(
            name=raw["name"],
            alpha2_code=raw["alpha2Code"],
            alpha3_code=raw["alpha3Code"],
            capital=raw["capital"],
            region=raw["region"],
            subregion=raw["subregion"],
            population=raw["population"],
            area=raw["area"],
        )
    except ValidationError as exc:
        # 국가 정보는 단일 레코드이므로 검증 실패 시 곧바로 예외를 올려 상위에서 인지하게 함
        raise ValueError(f"Invalid country payload from {COUNTRY_URL}: {exc}") from exc


def parse_ip(raw: dict) -> IPInfo:
    """ip-api.com 응답을 IPInfo로 검증. 실패 시 원인을 담아 재발생."""
    try:
        return IPInfo(
            query=raw["query"],
            country=raw["country"],
            region_name=raw["regionName"],
            city=raw["city"],
            lat=raw["lat"],
            lon=raw["lon"],
            isp=raw["isp"],
        )
    except ValidationError as exc:
        raise ValueError(f"Invalid IP payload from {IP_URL}: {exc}") from exc
