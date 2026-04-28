import random

DELHI_MIN_LAT = 27.80
DELHI_MAX_LAT = 29.30
DELHI_MIN_LNG = 76.20
DELHI_MAX_LNG = 78.00

def generate_drivers(num_points=100000):
    drivers = []
    for i in range(num_points):
        drivers.append({
            "id": i + 1,
            "lat": random.uniform(DELHI_MIN_LAT, DELHI_MAX_LAT),
            "lng": random.uniform(DELHI_MIN_LNG, DELHI_MAX_LNG),
            "available": random.random() < 0.7
        })
    return drivers
    
def move_drivers(drivers, max_offset=0.001):
    for d in drivers:
        d['lat'] += random.uniform(-max_offset, max_offset)
        d['lat'] = max(DELHI_MIN_LAT, min(DELHI_MAX_LAT, d['lat']))
        
        d['lng'] += random.uniform(-max_offset, max_offset)
        d['lng'] = max(DELHI_MIN_LNG, min(DELHI_MAX_LNG, d['lng']))
