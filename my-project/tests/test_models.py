"""
스키마 검증 테스트

프로그램 설명:
    pipeline.models의 3개 Pydantic 모델(WeatherRecord, CountryInfo, IPInfo)에
    대해 "정상 데이터는 통과, 타입/범위를 벗어난 데이터는 ValidationError"
    패턴을 모델별로 검증한다.

변경 내역:
    - 2026-07-20: 최초 작성. 모델당 정상 1건 + 이상값 1~2건 총 8개 테스트.
    - 2026-07-20: `python tests/test_models.py`로 직접 실행해도 pytest가
      구동되도록 __main__ 블록 추가 (기존에는 pytest 명령으로만 실행 가능했음).
"""

import pytest
from pydantic import ValidationError

from pipeline.models import CountryInfo, IPInfo, WeatherRecord

# --- WeatherRecord: 강수확률(0~100)과 기온 타입 검증 ---


def test_weather_record_accepts_valid_data():
    record = WeatherRecord(
        time="2026-07-20T00:00", temperature_2m=28.5, precipitation_probability=40
    )
    assert record.temperature_2m == 28.5
    assert record.precipitation_probability == 40


def test_weather_record_rejects_out_of_range_probability():
    # 강수확률은 0~100(%) 범위를 벗어나면 안 됨
    with pytest.raises(ValidationError):
        WeatherRecord(time="2026-07-20T00:00", temperature_2m=28.5, precipitation_probability=140)


def test_weather_record_rejects_non_numeric_temperature():
    # 기온 필드에 숫자가 아닌 문자열이 들어오면 타입 오류로 거부돼야 함
    with pytest.raises(ValidationError):
        WeatherRecord(
            time="2026-07-20T00:00", temperature_2m="hot", precipitation_probability=40
        )


# --- CountryInfo: 인구수 등 음수가 될 수 없는 값 검증 ---


def test_country_info_accepts_valid_data():
    country = CountryInfo(
        name="Korea (Republic of)",
        alpha2_code="KR",
        alpha3_code="KOR",
        capital="Seoul",
        region="Asia",
        subregion="Eastern Asia",
        population=51_780_579,
        area=100_210,
    )
    assert country.alpha3_code == "KOR"


def test_country_info_rejects_negative_population():
    with pytest.raises(ValidationError):
        CountryInfo(
            name="Korea (Republic of)",
            alpha2_code="KR",
            alpha3_code="KOR",
            capital="Seoul",
            region="Asia",
            subregion="Eastern Asia",
            population=-1,
            area=100_210,
        )


# --- IPInfo: IP 형식과 위도 범위 검증 ---


def test_ip_info_accepts_valid_data():
    ip_info = IPInfo(
        query="8.8.8.8",
        country="United States",
        region_name="Virginia",
        city="Ashburn",
        lat=39.03,
        lon=-77.5,
        isp="Google LLC",
    )
    assert str(ip_info.query) == "8.8.8.8"


def test_ip_info_rejects_invalid_ip_address():
    # query 필드는 IPvAnyAddress 타입이므로 IP 형식이 아니면 거부돼야 함
    with pytest.raises(ValidationError):
        IPInfo(
            query="not-an-ip",
            country="United States",
            region_name="Virginia",
            city="Ashburn",
            lat=39.03,
            lon=-77.5,
            isp="Google LLC",
        )


def test_ip_info_rejects_latitude_out_of_range():
    # 위도는 -90~90 범위를 벗어나면 안 됨
    with pytest.raises(ValidationError):
        IPInfo(
            query="8.8.8.8",
            country="United States",
            region_name="Virginia",
            city="Ashburn",
            lat=999,
            lon=-77.5,
            isp="Google LLC",
        )


if __name__ == "__main__":
    # `pytest tests/test_models.py`가 아니라 `python tests/test_models.py`로
    # 직접 실행한 경우에도 이 파일의 테스트만 구동되도록 함
    raise SystemExit(pytest.main([__file__, "-v"]))
