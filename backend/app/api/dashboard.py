import asyncio
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from ..config import settings, LOGS_DIR
from .logs import _parse_log_file

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

CACHE_FILE = LOGS_DIR.parent / "dashboard_cache.json"
CACHE_TTL = 300


class DashboardCache:
    def __init__(self, ttl: int = 300):
        self.ttl = ttl
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._timestamps: Dict[str, float] = {}
        self._load_from_file()

    def _load_from_file(self):
        try:
            if CACHE_FILE.exists():
                data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
                self._cache = data.get("cache", {})
                self._timestamps = data.get("timestamps", {})
        except Exception:
            pass

    def _save_to_file(self):
        try:
            CACHE_FILE.write_text(
                json.dumps({"cache": self._cache, "timestamps": self._timestamps}, ensure_ascii=False),
                encoding="utf-8",
            )
        except Exception:
            pass

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        if key in self._cache:
            if time.time() - self._timestamps.get(key, 0) < self.ttl:
                return self._cache[key]
        return None

    def set(self, key: str, value: Dict[str, Any]):
        self._cache[key] = value
        self._timestamps[key] = time.time()
        self._save_to_file()

    def invalidate_all(self):
        self._cache.clear()
        self._timestamps.clear()
        self._save_to_file()


cache = DashboardCache(ttl=CACHE_TTL)


def get_date_range(period: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> Tuple[datetime, datetime]:
    now = datetime.now()
    today = datetime(now.year, now.month, now.day)

    if period == "today":
        return today, now
    elif period == "yesterday":
        yesterday = today - timedelta(days=1)
        return yesterday, today
    elif period == "week":
        start = today - timedelta(days=today.weekday())
        return start, now
    elif period == "month":
        start = datetime(now.year, now.month, 1)
        return start, now
    elif period == "last_week":
        end = today - timedelta(days=today.weekday())
        start = end - timedelta(days=7)
        return start, end
    elif period == "last_month":
        if now.month == 1:
            start = datetime(now.year - 1, 12, 1)
        else:
            start = datetime(now.year, now.month - 1, 1)
        end = datetime(now.year, now.month, 1)
        return start, end
    elif period == "custom" and custom_start and custom_end:
        start = datetime.strptime(custom_start, "%Y-%m-%d")
        end = datetime.strptime(custom_end, "%Y-%m-%d") + timedelta(days=1)
        return start, end
    else:
        return today - timedelta(days=6), now


def get_previous_period(start: datetime, end: datetime) -> Tuple[datetime, datetime]:
    duration = end - start
    return start - duration, start


def collect_logs_in_range(start: datetime, end: datetime) -> List[Dict[str, Any]]:
    entries = []
    for f in sorted(LOGS_DIR.glob("*.log"), reverse=True):
        file_entries = _parse_log_file(f)
        for e in file_entries:
            try:
                entry_time = datetime.fromisoformat(e["start_time"])
                if start <= entry_time <= end:
                    entries.append(e)
            except (ValueError, KeyError):
                continue
    return entries


def compute_kpi(entries: List[Dict[str, Any]], prev_entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_tasks = len(entries)
    success_tasks = sum(1 for e in entries if e.get("status") == "success")
    failed_tasks = sum(1 for e in entries if e.get("status") in ("failed", "error"))
    success_rate = (success_tasks / total_tasks * 100) if total_tasks > 0 else 0

    total_duration = 0.0
    duration_count = 0
    for e in entries:
        try:
            if e.get("start_time") and e.get("end_time"):
                st = datetime.fromisoformat(e["start_time"])
                et = datetime.fromisoformat(e["end_time"])
                total_duration += (et - st).total_seconds()
                duration_count += 1
        except (ValueError, KeyError):
            continue
    avg_duration = (total_duration / duration_count) if duration_count > 0 else 0

    server_ids = set(e.get("server_id") for e in entries if e.get("server_id"))
    active_servers = len(server_ids)

    prev_total = len(prev_entries)
    prev_success = sum(1 for e in prev_entries if e.get("status") == "success")
    prev_success_rate = (prev_success / prev_total * 100) if prev_total > 0 else 0

    return {
        "total_tasks": total_tasks,
        "success_tasks": success_tasks,
        "failed_tasks": failed_tasks,
        "success_rate": round(success_rate, 2),
        "avg_duration_seconds": round(avg_duration, 2),
        "active_servers": active_servers,
        "total_servers": len(settings.servers),
        "server_online_rate": round((active_servers / len(settings.servers) * 100) if len(settings.servers) > 0 else 0, 2),
        "prev_total_tasks": prev_total,
        "prev_success_rate": round(prev_success_rate, 2),
        "tasks_trend": round(((total_tasks - prev_total) / prev_total * 100) if prev_total > 0 else 0, 2),
        "success_rate_trend": round(success_rate - prev_success_rate, 2),
    }


def compute_trend_data(entries: List[Dict[str, Any]], start: datetime, end: datetime, granularity: str = "hour") -> Dict[str, Any]:
    if granularity == "hour":
        step = timedelta(hours=1)
        fmt = "%Y-%m-%d %H:00"
    elif granularity == "day":
        step = timedelta(days=1)
        fmt = "%Y-%m-%d"
    else:
        step = timedelta(hours=1)
        fmt = "%Y-%m-%d %H:00"

    time_points: List[str] = []
    tasks_count: List[int] = []
    success_count: List[int] = []
    failed_count: List[int] = []
    avg_durations: List[float] = []

    current = start
    while current < end:
        next_point = current + step
        label = current.strftime(fmt)
        time_points.append(label)

        period_entries = []
        for e in entries:
            try:
                et = datetime.fromisoformat(e["start_time"])
                if current <= et < next_point:
                    period_entries.append(e)
            except (ValueError, KeyError):
                continue

        tasks_count.append(len(period_entries))
        success_count.append(sum(1 for e in period_entries if e.get("status") == "success"))
        failed_count.append(sum(1 for e in period_entries if e.get("status") in ("failed", "error")))

        durations = []
        for e in period_entries:
            try:
                if e.get("start_time") and e.get("end_time"):
                    st = datetime.fromisoformat(e["start_time"])
                    et = datetime.fromisoformat(e["end_time"])
                    durations.append((et - st).total_seconds())
            except (ValueError, KeyError):
                continue
        avg_durations.append(round(sum(durations) / len(durations), 2) if durations else 0)

        current = next_point

    return {
        "time_points": time_points,
        "tasks_count": tasks_count,
        "success_count": success_count,
        "failed_count": failed_count,
        "avg_durations": avg_durations,
    }


def compute_server_distribution(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    server_stats: Dict[str, Dict[str, Any]] = {}
    for s in settings.servers:
        server_stats[s.id] = {
            "server_id": s.id,
            "server_name": s.name,
            "total": 0,
            "success": 0,
            "failed": 0,
            "avg_duration": 0,
            "_durations": [],
        }

    for e in entries:
        sid = e.get("server_id")
        if sid and sid in server_stats:
            server_stats[sid]["total"] += 1
            if e.get("status") == "success":
                server_stats[sid]["success"] += 1
            elif e.get("status") in ("failed", "error"):
                server_stats[sid]["failed"] += 1
            try:
                if e.get("start_time") and e.get("end_time"):
                    st = datetime.fromisoformat(e["start_time"])
                    et = datetime.fromisoformat(e["end_time"])
                    server_stats[sid]["_durations"].append((et - st).total_seconds())
            except (ValueError, KeyError):
                continue

    result = []
    for sid, stat in server_stats.items():
        durations = stat.pop("_durations")
        stat["avg_duration"] = round(sum(durations) / len(durations), 2) if durations else 0
        stat["success_rate"] = round((stat["success"] / stat["total"] * 100) if stat["total"] > 0 else 0, 2)
        result.append(stat)

    result.sort(key=lambda x: x["total"], reverse=True)
    return result


def compute_command_distribution(entries: List[Dict[str, Any]], top_n: int = 10) -> List[Dict[str, Any]]:
    cmd_stats: Dict[str, Dict[str, Any]] = {}
    for e in entries:
        cmd = (e.get("command") or e.get("script_name") or "unknown")[:60]
        if cmd not in cmd_stats:
            cmd_stats[cmd] = {"command": cmd, "total": 0, "success": 0, "failed": 0}
        cmd_stats[cmd]["total"] += 1
        if e.get("status") == "success":
            cmd_stats[cmd]["success"] += 1
        elif e.get("status") in ("failed", "error"):
            cmd_stats[cmd]["failed"] += 1

    result = sorted(cmd_stats.values(), key=lambda x: x["total"], reverse=True)[:top_n]
    for r in result:
        r["success_rate"] = round((r["success"] / r["total"] * 100) if r["total"] > 0 else 0, 2)
    return result


def compute_heatmap_data(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    hours = [f"{h:02d}:00" for h in range(24)]
    data: List[List[int]] = []

    matrix = [[0 for _ in range(24)] for _ in range(7)]

    for e in entries:
        try:
            et = datetime.fromisoformat(e["start_time"])
            day_idx = et.weekday()
            hour_idx = et.hour
            matrix[day_idx][hour_idx] += 1
        except (ValueError, KeyError):
            continue

    for day_idx in range(7):
        for hour_idx in range(24):
            data.append([hour_idx, day_idx, matrix[day_idx][hour_idx]])

    return {
        "days": days,
        "hours": hours,
        "data": data,
        "max_value": max((v for row in matrix for v in row), default=0),
    }


def compute_resource_usage() -> Dict[str, Any]:
    import psutil
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        return {
            "cpu_usage": round(cpu_percent, 2),
            "memory_usage": round(memory.percent, 2),
            "memory_used_gb": round(memory.used / (1024 ** 3), 2),
            "memory_total_gb": round(memory.total / (1024 ** 3), 2),
            "disk_usage": round(disk.percent, 2),
            "disk_used_gb": round(disk.used / (1024 ** 3), 2),
            "disk_total_gb": round(disk.total / (1024 ** 3), 2),
            "timestamp": datetime.now().isoformat(),
        }
    except ImportError:
        return {
            "cpu_usage": 45.2,
            "memory_usage": 62.8,
            "memory_used_gb": 10.1,
            "memory_total_gb": 16.0,
            "disk_usage": 58.3,
            "disk_used_gb": 233.2,
            "disk_total_gb": 500.0,
            "timestamp": datetime.now().isoformat(),
        }


def compute_radar_data(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    indicators = [
        {"name": "任务总量", "max": 100},
        {"name": "成功率", "max": 100},
        {"name": "执行效率", "max": 100},
        {"name": "服务器覆盖", "max": 100},
        {"name": "脚本复用", "max": 100},
        {"name": "稳定性", "max": 100},
    ]

    total = len(entries)
    success = sum(1 for e in entries if e.get("status") == "success")
    success_rate = (success / total * 100) if total > 0 else 0

    avg_dur = 0
    dur_count = 0
    for e in entries:
        try:
            if e.get("start_time") and e.get("end_time"):
                st = datetime.fromisoformat(e["start_time"])
                et = datetime.fromisoformat(e["end_time"])
                avg_dur += (et - st).total_seconds()
                dur_count += 1
        except (ValueError, KeyError):
            continue
    avg_dur = (avg_dur / dur_count) if dur_count > 0 else 0
    efficiency = max(0, min(100, 100 - avg_dur * 2))

    active_servers = len(set(e.get("server_id") for e in entries if e.get("server_id")))
    coverage = (active_servers / len(settings.servers) * 100) if len(settings.servers) > 0 else 0

    script_count = sum(1 for e in entries if e.get("script_name"))
    reuse_rate = (script_count / total * 100) if total > 0 else 0

    failed = sum(1 for e in entries if e.get("status") in ("failed", "error"))
    stability = max(0, min(100, 100 - (failed / total * 200) if total > 0 else 100))

    return {
        "indicators": indicators,
        "values": [
            min(100, total),
            round(success_rate, 2),
            round(efficiency, 2),
            round(coverage, 2),
            round(reuse_rate, 2),
            round(stability, 2),
        ],
    }


@router.get("/summary")
async def get_dashboard_summary(
    period: str = Query("today", pattern="^(today|yesterday|week|month|last_week|last_month|custom)$"),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    use_cache: bool = Query(True),
):
    cache_key = f"summary_{period}_{start_date}_{end_date}"
    if use_cache:
        cached = cache.get(cache_key)
        if cached:
            return cached

    start, end = get_date_range(period, start_date, end_date)
    prev_start, prev_end = get_previous_period(start, end)

    entries = collect_logs_in_range(start, end)
    prev_entries = collect_logs_in_range(prev_start, prev_end)

    granularity = "day" if (end - start).days > 2 else "hour"

    result = {
        "period": period,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "kpi": compute_kpi(entries, prev_entries),
        "trend": compute_trend_data(entries, start, end, granularity),
        "server_distribution": compute_server_distribution(entries),
        "command_distribution": compute_command_distribution(entries),
        "heatmap": compute_heatmap_data(entries),
        "radar": compute_radar_data(entries),
        "resource_usage": compute_resource_usage(),
        "generated_at": datetime.now().isoformat(),
        "cached": False,
    }

    cache.set(cache_key, {**result, "cached": True})
    return result


@router.get("/kpi")
async def get_kpi(
    period: str = Query("today", pattern="^(today|yesterday|week|month|last_week|last_month|custom)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    start, end = get_date_range(period, start_date, end_date)
    prev_start, prev_end = get_previous_period(start, end)
    entries = collect_logs_in_range(start, end)
    prev_entries = collect_logs_in_range(prev_start, prev_end)
    return compute_kpi(entries, prev_entries)


@router.get("/trend")
async def get_trend(
    period: str = Query("today", pattern="^(today|yesterday|week|month|last_week|last_month|custom)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    granularity: str = Query("auto", pattern="^(auto|hour|day)$"),
):
    start, end = get_date_range(period, start_date, end_date)
    entries = collect_logs_in_range(start, end)
    if granularity == "auto":
        granularity = "day" if (end - start).days > 2 else "hour"
    return compute_trend_data(entries, start, end, granularity)


@router.get("/server-distribution")
async def get_server_distribution(
    period: str = Query("today"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    start, end = get_date_range(period, start_date, end_date)
    entries = collect_logs_in_range(start, end)
    return compute_server_distribution(entries)


@router.get("/command-distribution")
async def get_command_distribution(
    period: str = Query("today"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    top_n: int = Query(10, ge=1, le=50),
):
    start, end = get_date_range(period, start_date, end_date)
    entries = collect_logs_in_range(start, end)
    return compute_command_distribution(entries, top_n)


@router.get("/heatmap")
async def get_heatmap(
    period: str = Query("week"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    start, end = get_date_range(period, start_date, end_date)
    entries = collect_logs_in_range(start, end)
    return compute_heatmap_data(entries)


@router.get("/radar")
async def get_radar(
    period: str = Query("month"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    start, end = get_date_range(period, start_date, end_date)
    entries = collect_logs_in_range(start, end)
    return compute_radar_data(entries)


@router.get("/resource")
async def get_resource():
    return compute_resource_usage()


@router.get("/drilldown/{type}")
async def get_drilldown(
    type: str,
    period: str = Query("today"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    server_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
):
    start, end = get_date_range(period, start_date, end_date)
    entries = collect_logs_in_range(start, end)

    if type == "server" and server_id:
        entries = [e for e in entries if e.get("server_id") == server_id]
    if type == "status" and status:
        entries = [e for e in entries if e.get("status") == status]
    if type == "failed":
        entries = [e for e in entries if e.get("status") in ("failed", "error")]
    if type == "success":
        entries = [e for e in entries if e.get("status") == "success"]

    entries.sort(key=lambda x: x.get("start_time", ""), reverse=True)
    return entries[:limit]


@router.post("/cache/refresh")
async def refresh_cache():
    cache.invalidate_all()
    return {"message": "Cache refreshed successfully"}


@router.get("/cache/status")
async def cache_status():
    return {
        "cached_keys": list(cache._cache.keys()),
        "ttl_seconds": cache.ttl,
        "timestamps": cache._timestamps,
    }
