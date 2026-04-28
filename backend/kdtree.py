import heapq
from brute_force import distance

class KDNode:
    def __init__(self, point, left=None, right=None, axis=0):
        self.point = point
        self.left = left
        self.right = right
        self.axis = axis

class KDTree:
    def __init__(self, points):
        self.root = self._build_tree(points, 0)
        
    def _build_tree(self, points, depth):
        if not points:
            return None
            
        axis = depth % 2
        
        points.sort(key=lambda p: p['lat'] if axis == 0 else p['lng'])
        mid = len(points) // 2
        
        node = KDNode(point=points[mid], axis=axis)
        
        node.left = self._build_tree(points[:mid], depth + 1)
        node.right = self._build_tree(points[mid + 1:], depth + 1)
        
        return node
        
    def get_partitions(self, max_depth, bounds):
        partitions = []
        
        def traverse(node, depth, min_lat, max_lat, min_lng, max_lng):
            if not node or depth > max_depth:
                return
                
            axis = node.axis
            point = node.point
            
            if axis == 0: 
                partitions.append({
                    "axis": 0,
                    "value": point['lat'],
                    "min_val_other": min_lng,
                    "max_val_other": max_lng
                })
                traverse(node.left, depth + 1, min_lat, point['lat'], min_lng, max_lng)
                traverse(node.right, depth + 1, point['lat'], max_lat, min_lng, max_lng)
            else: 
                partitions.append({
                    "axis": 1,
                    "value": point['lng'],
                    "min_val_other": min_lat,
                    "max_val_other": max_lat
                })
                traverse(node.left, depth + 1, min_lat, max_lat, min_lng, point['lng'])
                traverse(node.right, depth + 1, min_lat, max_lat, point['lng'], max_lng)
                
        traverse(self.root, 0, bounds['min_lat'], bounds['max_lat'], bounds['min_lng'], bounds['max_lng'])
        return partitions

    def knn_search(self, target, k):
        best_k = []
        
        def search(node):
            if not node:
                return
                
            dist = distance(node.point, target)
            
            if node.point['available']:
                if len(best_k) < k:
                    heapq.heappush(best_k, (-dist, node.point['id'], node.point))
                elif dist < -best_k[0][0]:
                    heapq.heappushpop(best_k, (-dist, node.point['id'], node.point))
                
            axis = node.axis
            target_val = target['lat'] if axis == 0 else target['lng']
            node_val = node.point['lat'] if axis == 0 else node.point['lng']
            
            diff = target_val - node_val
            
            first = node.left if diff < 0 else node.right
            second = node.right if diff < 0 else node.left
            
            search(first)
            
            if len(best_k) < k or abs(diff) < -best_k[0][0]:
                search(second)
                
        search(self.root)
        
        results = []
        while best_k:
            dist_neg, _id, point = heapq.heappop(best_k)
            results.append({"driver": point, "distance": -dist_neg})
        results.reverse()
        return results

    def range_search(self, target, radius):
        results = []
        
        def search(node):
            if not node:
                return
                
            dist = distance(node.point, target)
            if dist <= radius and node.point['available']:
                results.append({"driver": node.point, "distance": dist})
                
            axis = node.axis
            target_val = target['lat'] if axis == 0 else target['lng']
            node_val = node.point['lat'] if axis == 0 else node.point['lng']
            
            diff = target_val - node_val
            
            if diff < 0:
                search(node.left)
                if abs(diff) <= radius:
                    search(node.right)
            else:
                search(node.right)
                if abs(diff) <= radius:
                    search(node.left)
                    
        search(self.root)
        results.sort(key=lambda x: x["distance"])
        return results
