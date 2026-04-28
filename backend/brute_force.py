import math

def distance(p1, p2):
    return math.sqrt((p1['lat'] - p2['lat'])**2 + (p1['lng'] - p2['lng'])**2)

def knn_brute_force(points, target, k):
    distances = []
    for p in points:
        if p['available']:
            dist = distance(p, target)
            distances.append((dist, p))
        
    distances.sort(key=lambda x: x[0])
    return [{"driver": p, "distance": d} for d, p in distances[:k]]

def range_brute_force(points, target, radius):
    results = []
    for p in points:
        if p['available']:
            dist = distance(p, target)
            if dist <= radius:
                results.append({"driver": p, "distance": dist})
    return results
