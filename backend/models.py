from pydantic import BaseModel
from typing import List, Optional

class Point(BaseModel):
    id: int
    lat: float
    lng: float
    available: bool

class Driver(Point):
    pass

class SearchResult(BaseModel):
    driver: Driver
    distance: float

class SearchResponse(BaseModel):
    results: List[SearchResult]
    kd_time_ms: float
    brute_time_ms: float

class RangeResponse(BaseModel):
    count: int
    results: List[SearchResult]
    kd_time_ms: float
    brute_time_ms: float

class PartitionLine(BaseModel):
    axis: int
    value: float
    min_val_other: float
    max_val_other: float
