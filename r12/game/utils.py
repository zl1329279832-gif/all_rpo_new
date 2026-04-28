import os
import json
import math
from .constants import DATA_DIR, DEFAULT_SETTINGS, DEFAULT_RANKINGS, SETTINGS_FILE, RANKINGS_FILE

def ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def load_json_file(filepath, default_data):
    ensure_data_dir()
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return default_data
    return default_data

def save_json_file(filepath, data):
    ensure_data_dir()
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except IOError:
        return False

def load_settings():
    return load_json_file(SETTINGS_FILE, DEFAULT_SETTINGS)

def save_settings(settings):
    return save_json_file(SETTINGS_FILE, settings)

def load_rankings():
    return load_json_file(RANKINGS_FILE, DEFAULT_RANKINGS)

def save_rankings(rankings):
    return save_json_file(RANKINGS_FILE, rankings)

def check_collision(rect1, rect2):
    return rect1.colliderect(rect2)

def check_circle_collision(center1, radius1, center2, radius2):
    dx = center1[0] - center2[0]
    dy = center1[1] - center2[1]
    distance = math.sqrt(dx * dx + dy * dy)
    return distance < radius1 + radius2

def get_angle_to_target(start_pos, target_pos):
    dx = target_pos[0] - start_pos[0]
    dy = target_pos[1] - start_pos[1]
    return math.atan2(dy, dx)

def get_velocity_from_angle(angle, speed):
    vx = math.cos(angle) * speed
    vy = math.sin(angle) * speed
    return vx, vy

def clamp(value, min_value, max_value):
    return max(min_value, min(max_value, value))

def lerp(start, end, t):
    return start + (end - start) * t

def ease_in_out(t):
    return t * t * (3 - 2 * t)
