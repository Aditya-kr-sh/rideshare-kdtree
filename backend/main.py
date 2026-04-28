from fastapi import FastAPI, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
import time

from data_generator import generate_drivers, move_drivers, DELHI_MIN_LAT, DELHI_MAX_LAT, DELHI_MIN_LNG, DELHI_MAX_LNG
from kdtree import KDTree
from brute_force import knn_brute_force, range_brute_force
from models import SearchResponse, RangeResponse, PartitionLine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NUM_POINTS = 100000
drivers = []
kd_tree = None

@app.on_event("startup")
def startup_event():
    global drivers, kd_tree
    drivers = generate_drivers(NUM_POINTS)
    kd_tree = KDTree(drivers.copy())

@app.get("/api/search")
def search_knn(k: int = Query(5, ge=1), lat: float = Query(...), lng: float = Query(...)):
    target = {"lat": lat, "lng": lng}
    
    start = time.perf_counter()
    kd_results = kd_tree.knn_search(target, k)
    kd_time = (time.perf_counter() - start) * 1000
    
    start = time.perf_counter()
    knn_brute_force(drivers, target, k)
    brute_time = (time.perf_counter() - start) * 1000
    
    return {
        "results": kd_results,
        "kd_time_ms": kd_time,
        "brute_time_ms": brute_time
    }

@app.get("/api/range")
def search_range(radius: float = Query(0.01), lat: float = Query(...), lng: float = Query(...)):
    target = {"lat": lat, "lng": lng}
    
    start = time.perf_counter()
    kd_results = kd_tree.range_search(target, radius)
    kd_time = (time.perf_counter() - start) * 1000
    
    start = time.perf_counter()
    range_brute_force(drivers, target, radius)
    brute_time = (time.perf_counter() - start) * 1000
    
    return {
        "count": len(kd_results),
        "results": kd_results[:100],
        "kd_time_ms": kd_time,
        "brute_time_ms": brute_time
    }

@app.get("/api/partitions")
def get_partitions(max_depth: int = Query(7)):
    bounds = {
        "min_lat": DELHI_MIN_LAT,
        "max_lat": DELHI_MAX_LAT,
        "min_lng": DELHI_MIN_LNG,
        "max_lng": DELHI_MAX_LNG
    }
    partitions = kd_tree.get_partitions(max_depth, bounds)
    return {"partitions": partitions}

@app.post("/api/simulate")
def simulate_movement(background_tasks: BackgroundTasks):
    global kd_tree, drivers
    move_drivers(drivers, max_offset=0.002)
    kd_tree = KDTree(drivers.copy())
    return {"status": "success"}

@app.get("/api/stats")
def get_stats():
    return {
        "total_drivers": len(drivers),
        "region": {
            "min_lat": DELHI_MIN_LAT,
            "max_lat": DELHI_MAX_LAT,
            "min_lng": DELHI_MIN_LNG,
            "max_lng": DELHI_MAX_LNG
        }
    }
