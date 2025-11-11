from datetime import datetime, timedelta

def get_current_month_range():
    now = datetime.utcnow()
    start = datetime(now.year, now.month, 1)
    if now.month == 12:
        end = datetime(now.year + 1, 1, 1)
    else:
        end = datetime(now.year, now.month + 1, 1)
    return start, end

def get_current_week_range():
    now = datetime.utcnow()
    start = now - timedelta(days=now.weekday())  # ponedeljak
    end = start + timedelta(days=7)
    return start, end
