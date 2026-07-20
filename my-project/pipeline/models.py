"""
스키마 검증 모듈 (Pydantic v2)

프로그램 설명:
    3개 API 응답 원본 JSON에서 실제로 사용하는 필드만 뽑아 Pydantic v2
    모델로 정의한다. 타입이 맞지 않거나(Field 범위를 벗어나면) 값이
    비정상이면 모델 생성 시점에 ValidationError가 발생해 이후 단계로
    잘못된 데이터가 전달되지 않도록 막는다.

변경 내역:
    - 2026-07-20: 최초 작성. WeatherRecord / CountryInfo / IPInfo 3종 모델 정의.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, IPvAnyAddress


class WeatherRecord(BaseModel):
    """Open-Meteo 시간별 서울 날씨 관측값 1건."""

    time: datetime
    # 기온: 서울 기준 현실적으로 나올 수 없는 극단값을 걸러내기 위한 범위
    temperature_2m: float = Field(ge=-50.0, le=60.0)
    # 강수확률: API 정의상 0~100(%) 범위여야 함
    precipitation_probability: int = Field(ge=0, le=100)


class CountryInfo(BaseModel):
    """countries.dev의 대한민국 국가 정보."""

    name: str
    alpha2_code: str = Field(min_length=2, max_length=2)
    alpha3_code: str = Field(min_length=3, max_length=3)
    capital: str
    region: str
    subregion: str
    population: int = Field(ge=0)
    area: float = Field(ge=0)


class IPInfo(BaseModel):
    """ip-api.com의 IP 기반 위치 정보."""

    # IPv4/IPv6 형식 자체를 Pydantic이 검증해줌
    query: IPvAnyAddress
    country: str
    region_name: str
    city: str
    lat: float = Field(ge=-90.0, le=90.0)
    lon: float = Field(ge=-180.0, le=180.0)
    isp: str
