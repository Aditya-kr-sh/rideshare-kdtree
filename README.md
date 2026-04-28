# 🚕 Proximity Search for Ride-Sharing using K-D Tree

**[🔴 Live Demo: rideshare-kdtree.vercel.app](https://rideshare-kdtree.vercel.app/)**

A high-performance, full-stack web application designed to simulate and benchmark real-time spatial queries for ride-sharing platforms (like Uber or Lyft) across the Delhi NCR region.

## 🌟 Overview
In modern ride-sharing, querying millions of drivers to find the closest one to a rider using "Brute Force" ($O(N)$) is computationally impossible at scale. This project demonstrates how implementing a **2D K-D (K-Dimensional) Tree** reduces the spatial search time complexity to $O(\log N)$.

This application generates **100,000 live driver coordinates** across the Delhi NCR region and benchmarks the KD-Tree against a Brute Force algorithm in real-time. It also connects to a live open-source routing engine to demonstrate the difference between Euclidean "Air" Distance and true "Road" Distance.

## 🚀 Key Features
* **Custom KD-Tree Implementation:** Built entirely from scratch in Python (no external spatial libraries). Supports $K$-Nearest Neighbor (KNN) searches and Radius-based Range searches.
* **Live OSRM Routing:** Integrates with the Open Source Routing Machine (OSRM) to calculate true driving ETA and draws the exact road route for the absolute closest driver.
* **Driver Availability Simulation:** Randomly assigns "Busy/Available" flags to 100,000 drivers. The algorithm instantly ignores busy drivers, even if they are physically closer.
* **Visual Geometric Partitions:** An educational feature that draws the mathematical splitting planes (bounding boxes) on the map, showing exactly how the KD-Tree divides the city to prune search areas.
* **Real-time Performance Benchmarking:** A live Chart.js dashboard comparing the milliseconds taken by the KD-Tree vs. Brute Force. (Usually 30x to 60x faster!).

## 🛠️ Tech Stack
* **Frontend:** React.js, Vite, React-Leaflet (Interactive Maps), Chart.js
* **Backend:** Python, FastAPI, Uvicorn
* **Data Structures:** 2D K-D Tree, Max-Heaps
* **External APIs:** OSRM (Open Source Routing Machine)

## 💻 How to Run Locally

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Start the Frontend
Open a new terminal window.
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## 🎓 Educational Note
This repository was designed as an advanced data-structures university project to practically demonstrate space-partitioning trees, coordinate systems, and API integrations in a real-world software architecture.
